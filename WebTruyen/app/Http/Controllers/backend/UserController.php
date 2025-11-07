<?php

namespace App\Http\Controllers\backend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Cloudinary\Cloudinary;

class UserController extends Controller
{
    protected function makeCloudinaryClient(): Cloudinary
    {
        return new Cloudinary([
            'cloud' => [
                'cloud_name' => config('services.cloudinary.cloud_name'),
                'api_key'    => config('services.cloudinary.api_key'),
                'api_secret' => config('services.cloudinary.api_secret'),
            ],
        ]);
    }


    protected function extractCloudinaryPublicId(string $url): ?string
    {
        if (empty($url)) {
            Log::debug('❌ extractCloudinaryPublicId: URL trống.');
            return null;
        }

        $path = parse_url($url, PHP_URL_PATH);
        if (!$path) {
            Log::debug("❌ extractCloudinaryPublicId: Không thể parse path từ URL={$url}");
            return null;
        }

        // Tìm vị trí '/upload/'
        $pos = strpos($path, '/upload/');
        if ($pos === false) {
            Log::debug("❌ extractCloudinaryPublicId: Không thấy '/upload/' trong URL={$url}");
            return null;
        }

        // Lấy phần sau '/upload/'
        $relative = substr($path, $pos + strlen('/upload/'));
        // ví dụ: v1761748278/comics/prqqliykqilelkosxeyw.webp

        $parts = explode('/', $relative);

        // Nếu có version kiểu 'v123456' thì bỏ qua
        if (isset($parts[0]) && preg_match('/^v\d+$/', $parts[0])) {
            array_shift($parts);
        }

        // Gộp lại thành public_id (bao gồm folder)
        $publicIdWithExt = implode('/', $parts);

        // Bỏ phần mở rộng (jpg, webp, png, ...)
        $publicId = preg_replace('/\.(jpe?g|png|gif|webp|bmp|tiff)$/i', '', $publicIdWithExt);

        // Loại bỏ ký tự dư
        $publicId = trim($publicId, '/');

        Log::debug("✅ extractCloudinaryPublicId: URL={$url} → public_id={$publicId}");

        return $publicId ?: null;
    }
    public function index(Request $request)
    {
        $limit = $request->input('limit'); // Lấy limit, không set giá trị mặc định
        $query = User::where('status', '!=', 0)
            ->orderBy('created_at', 'DESC')
            ->select('id', 'name', 'email', 'role', 'image_url', 'status');
        // Nếu người dùng có role 'team', chỉ lấy người dùng trong bảng team_join với team_id tương ứng
        $user = Auth::user();
        if ($user && $user->role === 'team' && $request->attributes->has('team_id')) {
            $teamId = $request->attributes->get('team_id');
            $query->whereIn('id', function ($subQuery) use ($teamId) {
                $subQuery->select('user_id')
                    ->from('team_join')
                    ->where('team_id', $teamId);
            });
        }

        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',

        ];

        if ($limit) {
            // Có limit, thực hiện phân trang
            $users = $query->paginate($limit);
            $result['users'] = $users->items();
            $result['pagination'] = [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ];
        } else {
            // Không có limit, lấy toàn bộ dữ liệu
            $users = $query->get();
            $result['users'] = $users;
            $result['pagination'] = null; // Không trả về pagination
        }

        return response()->json($result);
    }

    public function trash()
    {
        $users = User::where('status', '=', 0)
            ->orderBy('created_at', 'DESC')
            ->select('id', 'name', 'email', 'role', 'image_url', 'status')
            ->get();
        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
            'users' => $users
        ];
        return response()->json($result);
    }

    public function show($id)
    {
        $user = User::find($id);
        if ($user == null) {
            $result = [
                'status' => false,
                'message' => 'Không tìm thấy dữ liệu',
                'users' => null
            ];
        } else {
            $result = [
                'status' => true,
                'message' => 'Tải dữ liệu thành công',
                'users' => $user
            ];
        }
        return response()->json($result);
    }

    public function store(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email' . (isset($id) ? ',' . $id : ''),
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,user,team',
            'status' => 'required|in:0,1,2',
        ];

        // ✅ Nếu có file ảnh thì kiểm tra định dạng
        if ($request->hasFile('image_url')) {
            $rules['image_url'] = 'image|mimes:jpeg,png,jpg,gif,webp|max:5120';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'user' => null
            ], 422);
        }

        $cloudinary = null;
        $uploadedUrl = null;

        try {
            $user = new User();
            $user->name = $request->name;
            $user->email = $request->email;
            $user->password = Hash::make($request->password);
            $user->role = $request->role;
            $user->status = $request->status;
            $user->created_by = Auth::id() ?: 1;
            $user->created_at = now();

            // ✅ Upload Cloudinary nếu có ảnh
            if ($request->hasFile('image_url')) {
                $cloudinary = $this->makeCloudinaryClient();
                $upload = $cloudinary->uploadApi()->upload(
                    $request->file('image_url')->getRealPath(),
                    ['folder' => 'users', 'resource_type' => 'image', 'format' => 'webp']
                );
                $uploadedUrl = $upload['secure_url'];
                $user->image_url = $uploadedUrl;
            } elseif ($request->filled('image_url')) {
                $user->image_url = $request->input('image_url');
            }

            if ($user->save()) {
                return response()->json([
                    'status' => true,
                    'message' => 'Thêm user thành công',
                    'user' => $user
                ], 201);
            } else {
                // ❌ Rollback ảnh nếu lưu DB thất bại
                if ($uploadedUrl && $cloudinary) {
                    $publicId = $this->extractCloudinaryPublicId($uploadedUrl);
                    if ($publicId) {
                        $cloudinary->uploadApi()->destroy($publicId, ['invalidate' => true]);
                        Log::warning("🧹 Rollback ảnh user Cloudinary do lưu DB thất bại: {$publicId}");
                    }
                }

                return response()->json([
                    'status' => false,
                    'message' => 'Không thể thêm user',
                    'user' => null
                ], 500);
            }
        } catch (\Exception $e) {
            // ❌ Rollback nếu có upload
            if ($uploadedUrl && $cloudinary) {
                try {
                    $publicId = $this->extractCloudinaryPublicId($uploadedUrl);
                    if ($publicId) {
                        $cloudinary->uploadApi()->destroy($publicId, ['invalidate' => true]);
                        Log::info("🧹 Rollback ảnh Cloudinary do lỗi exception: {$publicId}");
                    }
                } catch (\Exception $ex) {
                    Log::warning("⚠️ Không thể rollback ảnh Cloudinary: " . $ex->getMessage());
                }
            }

            Log::error('🔥 Lỗi khi tạo user: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi tạo user: ' . $e->getMessage(),
                'user' => null
            ], 500);
        }
    }


    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy user',
                'user' => null
            ], 404);
        }


        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email' . (isset($id) ? ',' . $id : ''),
            'password' => 'nullable|string|min:6',
            'role' => 'required|in:admin,user,team',
            'status' => 'required|in:0,1,2',
        ];

        // ✅ Nếu có file ảnh thì kiểm tra định dạng
        if ($request->hasFile('image_url')) {
            $rules['image_url'] = 'image|mimes:jpeg,png,jpg,gif,webp|max:5120';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'user' => null
            ], 422);
        }

        $cloudinary = $this->makeCloudinaryClient();
        $oldImage = $user->image_url;
        $newImage = null;

        try {
            $user->name = $request->name;
            $user->email = $request->email;
            if ($request->filled('password')) {
                $user->password = Hash::make($request->password);
            }
            $user->role = $request->role;
            $user->status = $request->status;
            $user->updated_by = Auth::id() ?: 1;
            $user->updated_at = now();

            // ✅ Upload ảnh mới nếu có
            if ($request->hasFile('image_url')) {
                $upload = $cloudinary->uploadApi()->upload(
                    $request->file('image_url')->getRealPath(),
                    ['folder' => 'users', 'resource_type' => 'image', 'format' => 'webp']
                );
                $user->image_url = $upload['secure_url'];
                $newImage = $user->image_url;
            } elseif ($request->filled('image_url')) {
                $newImage = $request->input('image_url');
                $user->image_url = $request->input('image_url');
            }

            if ($user->save()) {
                // ✅ Xóa ảnh cũ nếu có upload mới

                if ($newImage && $oldImage) {
                    try {
                        $oldPublicId = $this->extractCloudinaryPublicId($oldImage);
                        Log::info("🧩 Public ID để xóa: {$oldPublicId}");
                        if ($oldPublicId) {
                            $cloudinary->uploadApi()->destroy($oldPublicId, ['invalidate' => true]);
                            Log::info("🧹 Đã xóa ảnh cũ Cloudinary user: {$oldPublicId}");
                        }
                    } catch (\Exception $e) {
                        Log::warning("⚠️ Không thể xóa ảnh cũ Cloudinary: " . $e->getMessage());
                    }
                }

                return response()->json([
                    'status' => true,
                    'message' => 'Cập nhật user thành công',
                    'user' => $user
                ], 200);
            } else {
                // ❌ Rollback ảnh mới
                if ($newImage) {
                    $newPublicId = $this->extractCloudinaryPublicId($newImage);
                    if ($newPublicId) {
                        $cloudinary->uploadApi()->destroy($newPublicId, ['invalidate' => true]);
                        Log::warning("🧹 Rollback ảnh user Cloudinary do lưu DB thất bại: {$newPublicId}");
                    }
                }

                return response()->json([
                    'status' => false,
                    'message' => 'Không thể cập nhật user',
                    'user' => null
                ], 500);
            }
        } catch (\Exception $e) {
            // ❌ Rollback nếu upload mới mà lỗi
            if ($newImage) {
                try {
                    $newPublicId = $this->extractCloudinaryPublicId($newImage);
                    if ($newPublicId) {
                        $cloudinary->uploadApi()->destroy($newPublicId, ['invalidate' => true]);
                        Log::info("🧹 Rollback ảnh Cloudinary sau lỗi cập nhật user: {$newPublicId}");
                    }
                } catch (\Exception $ex) {
                    Log::warning("⚠️ Không thể rollback ảnh mới Cloudinary: {$ex->getMessage()}");
                }
            }

            Log::error('🔥 Lỗi khi cập nhật user: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi cập nhật user: ' . $e->getMessage(),
                'user' => null
            ], 500);
        }
    }



    public function status($id)
    {
        $user = User::find($id);
        if ($user == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'user' => null
            ]);
        }
        // Kiểm tra nếu user hiện tại đang thay đổi status của chính mình
        if (Auth::id() == $id) {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi trạng thái của tài khoản hiện tại.',
                'user' => null
            ], 403);
        }

        $user->status = ($user->status == 1) ? 2 : 1;
        $user->updated_by = Auth::id() ?: 1;
        $user->updated_at = now();

        if ($user->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'user' => $user
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'user' => null
            ]);
        }
    }

    public function delete($id)
    {
        $user = User::find($id);
        if ($user == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'user' => null
            ]);
        }

        // Kiểm tra nếu user hiện tại đang xóa chính mình
        if (Auth::id() == $id) {
            return response()->json([
                'status' => false,
                'message' => 'Không thể xóa tài khoản hiện tại.',
                'user' => null
            ], 403);
        }
        $user->status = 0;
        $user->updated_by = Auth::id() ?: 1;
        $user->updated_at = now();

        if ($user->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'user' => $user
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'user' => null
            ]);
        }
    }

    public function restore($id)
    {
        $user = User::find($id);
        if ($user == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'user' => null
            ]);
        }

        $user->status = 2;
        $user->updated_by = Auth::id() ?: 1;
        $user->updated_at = now();

        if ($user->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'user' => $user
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'user' => null
            ]);
        }
    }

    public function destroy($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy người dùng',
                'user' => null
            ], 404);
        }

        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'status' => false,
                'message' => 'Bạn không có quyền xóa người dùng.',
                'user' => null
            ], 403);
        }

        if (Auth::id() == $id) {
            return response()->json([
                'status' => false,
                'message' => 'Không thể xóa tài khoản hiện tại.',
                'user' => null
            ], 403);
        }

        $oldImage = $user->image_url;
        $publicId = null;

        if ($oldImage && str_contains($oldImage, 'res.cloudinary.com')) {
            $publicId = $this->extractCloudinaryPublicId($oldImage);
        }

        try {
            if ($publicId) {
                $cloudinary = $this->makeCloudinaryClient();
                $result = $cloudinary->uploadApi()->destroy($publicId);

                if (!isset($result['result']) || $result['result'] !== 'ok') {
                    Log::warning("❌ Xóa ảnh Cloudinary thất bại cho user id={$user->id}: " . json_encode($result));
                }
            } elseif ($oldImage && File::exists(public_path($oldImage))) {
                File::delete(public_path($oldImage));
            }

            $user->delete();

            return response()->json([
                'status' => true,
                'message' => 'Xóa người dùng thành công',
                'user' => $user
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Lỗi khi xóa user hoặc ảnh Cloudinary: ' . $e->getMessage(), [
                'user_id' => $id,
                'image_url' => $oldImage,
                'exception' => $e,
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi xóa: ' . $e->getMessage(),
                'user' => null
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $request->validate([
            "email" => "required|email",
            "password" => "required"
        ]);

        // Tìm user theo email
        $user = User::where('email', $request->email)->first();

        if (!empty($user)) {
            // Kiểm tra status
            if ($user->status !== 1) {
                return response()->json([
                    "status" => false,
                    "message" => "Tài khoản của bạn đã bị khóa hoặc không hoạt động!"
                ]);
            }

            // Kiểm tra role
            if ($user->role !== 'admin' && $user->role !== 'team') {
                return response()->json([
                    "status" => false,
                    "message" => "Bạn không có quyền truy cập!"
                ]);
            }

            // Kiểm tra password
            if (Hash::check($request->password, $user->password)) {
                $token = $user->createToken("myToken")->plainTextToken;
                return response()->json([
                    "status" => true,
                    "message" => "Logged in successfully",
                    "token" => $token,
                    "user" => $user
                ]);
            } else {
                return response()->json([
                    "status" => false,
                    "message" => "Mật khẩu không đúng"
                ]);
            }
        } else {
            return response()->json([
                "status" => false,
                "message" => "Email không hợp lệ"
            ]);
        }
    }
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            "status" => true,
            "message" => "User logged out"
        ]);
    }
}
