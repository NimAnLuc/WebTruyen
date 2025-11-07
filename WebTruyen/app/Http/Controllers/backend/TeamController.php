<?php

namespace App\Http\Controllers\backend;

use App\Http\Controllers\Controller;
use App\Models\TeamMembers;
use Illuminate\Http\Request;
use App\Models\Teams;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Cloudinary\Cloudinary;


class TeamController extends Controller
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
        $limit = $request->input('limit');
        $query = Teams::where('status', '!=', 0)
            ->orderBy('created_at', 'DESC')
            ->select('id', 'name', 'slug', 'description', 'logo', 'leader_id', 'status')
            ->with('leader');

        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
        ];

        if ($limit) {
            // Có limit, thực hiện phân trang
            $teams = $query->paginate($limit);
            $result['teams'] = $teams->items();
            $result['pagination'] = [
                'current_page' => $teams->currentPage(),
                'last_page' => $teams->lastPage(),
                'per_page' => $teams->perPage(),
                'total' => $teams->total(),
            ];
        } else {
            // Không có limit, lấy toàn bộ dữ liệu
            $teams = $query->get();
            $result['teams'] = $teams;
            $result['pagination'] = null; // Không trả về pagination
        }

        return response()->json($result);
    }

    public function trash()
    {
        // Không thay đổi
        $teams = Teams::where('status', '=', 0)
            ->orderBy('created_at', 'DESC')
            ->select('id', 'name', 'slug', 'description', 'logo', 'leader_id', 'status')
            ->with('leader')
            ->get();
        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
            'teams' => $teams
        ];
        return response()->json($result);
    }

    public function show($id)
    {
        // Không thay đổi
        $team = Teams::find($id);
        if ($team == null) {
            $result = [
                'status' => false,
                'message' => 'Không tìm thấy dữ liệu',
                'teams' => null
            ];
        } else {
            $result = [
                'status' => true,
                'message' => 'Tải dữ liệu thành công',
                'teams' => $team->load('leader')
            ];
        }
        return response()->json($result);
    }

    public function store(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255|unique:teams,name' . (isset($id) ? ',' . $id : ''),
            'description' => 'nullable|string',
            'leader_id' => 'required|exists:users,id',
            'status' => 'required|in:0,1,2',
        ];

        // Nếu có upload file logo → thêm rule ảnh
        if ($request->hasFile('logo')) {
            $rules['logo'] = 'image|mimes:jpeg,png,jpg,gif,webp|max:5120';
        }

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'team' => null
            ], 422);
        }

        try {
            DB::beginTransaction();

            $team = new Teams();
            $team->name = $request->name;
            $team->slug = Str::slug($request->name);
            $team->description = $request->description;
            $team->leader_id = $request->leader_id;
            $team->status = $request->status;
            $team->created_by = Auth::id() ?: 1;
            $team->created_at = now();

            $uploadedUrl = null;
            $cloudinary = null;

            // ✅ Nếu frontend gửi sẵn link (Cloudinary URL)
            if ($request->has('logo') && is_string($request->logo) && !empty($request->logo)) {
                $team->logo = $request->logo;
                $uploadedUrl = $request->logo;
            }
            // ✅ Nếu frontend gửi file → backend upload
            elseif ($request->hasFile('logo')) {
                $cloudinary = $this->makeCloudinaryClient();
                $upload = $cloudinary->uploadApi()->upload(
                    $request->file('logo')->getRealPath(),
                    ['folder' => 'teams', 'resource_type' => 'image']
                );
                $uploadedUrl = $upload['secure_url'];
                $team->logo = $uploadedUrl;
            }
            if (!$team->save()) {
                throw new \Exception('Không thể lưu team');
            }


            // 🔹 Tạo leader trong TeamMembers
            $teamMember = new TeamMembers();
            $teamMember->team_id = $team->id;
            $teamMember->user_id = $request->leader_id;
            $teamMember->role = 'leader';
            $teamMember->status = 1;
            $teamMember->created_by = Auth::id() ?: 1;
            $teamMember->created_at = now();
            $teamMember->save();

            DB::commit();

            Log::info("✅ Đã tạo team thành công: {$team->name}");

            return response()->json([
                'status' => true,
                'message' => 'Tạo team và leader thành công',
                'team' => $team->load('leader'),
                'teammember' => $teamMember
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            // ✅ Rollback ảnh Cloudinary nếu đã upload
            if ($uploadedUrl && isset($cloudinary)) {
                try {
                    $publicId = $this->extractCloudinaryPublicId($uploadedUrl);
                    if ($publicId) {
                        $cloudinary->uploadApi()->destroy($publicId, ['invalidate' => true]);
                        Log::info("🧹 Rollback: Xóa ảnh Cloudinary vì tạo team thất bại ({$publicId})");
                    }
                } catch (\Exception $ex) {
                    Log::warning("⚠️ Không thể rollback ảnh Cloudinary: " . $ex->getMessage());
                }
            }


            Log::error('🔥 Lỗi khi tạo team: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi tạo team: ' . $e->getMessage(),
            ], 500);
        }
    }


    public function update(Request $request, $id)
    {
        $team = Teams::find($id);
        if (!$team) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy team',
                'team' => null
            ], 404);
        }
        $rules = [
            'name' => 'required|string|max:255|unique:teams,name' . (isset($id) ? ',' . $id : ''),
            'description' => 'nullable|string',
            'leader_id' => 'required|exists:users,id',
            'status' => 'required|in:0,1,2',
        ];

        // Nếu có upload file logo → thêm rule ảnh
        if ($request->hasFile('logo')) {
            $rules['logo'] = 'image|mimes:jpeg,png,jpg,gif,webp|max:5120';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'team' => null
            ], 422);
        }

        $cloudinary = $this->makeCloudinaryClient();
        $oldLogo = $team->logo;
        $newLogo = null;


        try {
            // Cập nhật dữ liệu cơ bản
            $team->name = $request->name;
            $team->slug = Str::slug($request->name);
            $team->description = $request->description;
            $team->leader_id = $request->leader_id;
            $team->status = $request->status;
            $team->updated_by = Auth::id() ?: 1;
            $team->updated_at = now();


            // ✅ Trường hợp 1: frontend gửi URL
            if ($request->has('logo') && is_string($request->logo) && !empty($request->logo)) {
                $newLogo = $request->logo;
                $team->logo = $newLogo;
            }
            // ✅ Trường hợp 2: frontend gửi file
            elseif ($request->hasFile('logo')) {
                $upload = $cloudinary->uploadApi()->upload(
                    $request->file('logo')->getRealPath(),
                    ['folder' => 'teams', 'resource_type' => 'image']
                );
                $newLogo = $upload['secure_url'];
                $team->logo = $newLogo;
            }
            // ✅ Trường hợp 3: không gửi gì → giữ nguyên
            else {
                $team->logo = $oldLogo;
            }


            if ($team->save()) {
                // ✅ Xóa logo cũ nếu có logo mới khác
                if ($newLogo && $oldLogo && $newLogo !== $oldLogo) {
                    try {
                        $oldPublicId = $this->extractCloudinaryPublicId($oldLogo);
                        if ($oldPublicId) {
                            $cloudinary->uploadApi()->destroy($oldPublicId, ['invalidate' => true]);
                            Log::info("🧹 Đã xóa logo cũ Cloudinary: {$oldPublicId}");
                        }
                    } catch (\Exception $e) {
                        Log::warning("⚠️ Không thể xóa logo cũ: " . $e->getMessage());
                    }
                }

                return response()->json([
                    'status' => true,
                    'message' => 'Cập nhật thành công',
                    'team' => $team->load('leader'),
                ], 200);
            }

            // ❌ Nếu lưu DB thất bại → rollback ảnh mới
            if ($newLogo) {
                $newPublicId = $this->extractCloudinaryPublicId($newLogo);
                if ($newPublicId) {
                    $cloudinary->uploadApi()->destroy($newPublicId, ['invalidate' => true]);
                    Log::warning("🧹 Rollback: Xóa logo mới Cloudinary do lưu DB thất bại.");
                }
            }

            return response()->json([
                'status' => false,
                'message' => 'Không thể cập nhật team',
            ], 500);
        } catch (\Exception $e) {
            // ❌ Rollback logo mới nếu có
            if ($newLogo) {
                try {
                    $newPublicId = $this->extractCloudinaryPublicId($newLogo);
                    if ($newPublicId) {
                        $cloudinary->uploadApi()->destroy($newPublicId, ['invalidate' => true]);
                        Log::info("🧹 Rollback: Xóa logo mới Cloudinary sau lỗi cập nhật.");
                    }
                } catch (\Exception $ex) {
                    Log::warning("⚠️ Không thể rollback logo mới: {$newLogo}");
                }
            }

            Log::error('🔥 Lỗi khi cập nhật team: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi cập nhật team: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function status($id)
    {
        // Không thay đổi
        $team = Teams::find($id);
        if ($team == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'team' => null
            ]);
        }

        $team->status = ($team->status == 1) ? 2 : 1;
        $team->updated_by = Auth::id() ?: 1;
        $team->updated_at = now();

        if ($team->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'team' => $team->load('leader')
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'team' => null
            ]);
        }
    }

    public function delete($id)
    {
        // Không thay đổi
        $team = Teams::find($id);
        if ($team == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'team' => null
            ]);
        }

        $team->status = 0;
        $team->updated_by = Auth::id() ?: 1;
        $team->updated_at = now();

        if ($team->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'team' => $team->load('leader')
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'team' => null
            ]);
        }
    }

    public function restore($id)
    {
        // Không thay đổi
        $team = Teams::find($id);
        if ($team == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'team' => null
            ]);
        }

        $team->status = 2;
        $team->updated_by = Auth::id() ?: 1;
        $team->updated_at = now();

        if ($team->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'team' => $team->load('leader')
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'team' => null
            ]);
        }
    }

    public function destroy($id)
    {
        $team = Teams::find($id);
        if (!$team) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin đội nhóm',
                'team' => null
            ], 404);
        }

        $oldImage = $team->logo;
        $publicId = null;

        if ($oldImage && str_contains($oldImage, 'res.cloudinary.com')) {
            $publicId = $this->extractCloudinaryPublicId($oldImage);
        }

        try {
            if ($publicId) {
                $cloudinary = $this->makeCloudinaryClient();
                $result = $cloudinary->uploadApi()->destroy($publicId, ['invalidate' => true]);

                if (!isset($result['result']) || $result['result'] !== 'ok') {
                    Log::warning("❌ Xóa ảnh Cloudinary thất bại cho team id={$team->id}: " . json_encode($result));
                }
            } elseif ($oldImage && File::exists(public_path($oldImage))) {
                File::delete(public_path($oldImage));
            }

            $team->delete();

            return response()->json([
                'status' => true,
                'message' => 'Xóa team thành công',
                'team' => $team
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Lỗi khi xóa team hoặc ảnh Cloudinary: ' . $e->getMessage(), [
                'team_id' => $id,
                'image_url' => $oldImage,
                'exception' => $e,
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi xóa: ' . $e->getMessage(),
                'team' => null
            ], 500);
        }
    }
}
