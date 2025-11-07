<?php

namespace App\Http\Controllers\frontend;

use App\Http\Controllers\Controller;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Google\Client as GoogleClient;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Cloudinary\Cloudinary;


class UserLogController extends Controller
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
    public function loginuser(Request $request)
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

    public function customer_register(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
        ];

        // ✅ Nếu có file ảnh thì kiểm tra định dạng
        if ($request->hasFile('image')) {
            $rules['image'] = 'image|mimes:jpeg,png,jpg,gif,webp|max:5120';
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
            $user->role = 'user';
            $user->status = 1;
            $user->created_by = Auth::id() ?: 1;
            $user->created_at = now();

            // ✅ Upload Cloudinary nếu có ảnh
            if ($request->hasFile('image')) {
                $cloudinary = $this->makeCloudinaryClient();
                $upload = $cloudinary->uploadApi()->upload(
                    $request->file('image')->getRealPath(),
                    ['folder' => 'users', 'resource_type' => 'image']
                );
                $uploadedUrl = $upload['secure_url'];
                $user->image_url = $uploadedUrl;
            } elseif ($request->filled('image')) {
                $user->image_url = $request->input('image');
            }

            if ($user->save()) {
                return response()->json([
                    'status' => true,
                    'message' => 'Đăng ký tài khoản thành công',
                    'user' => $user
                ], 201);
            } else {
                // ❌ Rollback ảnh nếu lưu DB thất bại
                if ($uploadedUrl && $cloudinary) {
                    $publicId = $this->extractCloudinaryPublicId($uploadedUrl);
                    if ($publicId) {
                        $cloudinary->uploadApi()->destroy($publicId, ['invalidate' => true]);
                        Log::warning("🧹 Rollback ảnh Cloudinary do lưu user thất bại: {$publicId}");
                    }
                }

                return response()->json([
                    'status' => false,
                    'message' => 'Không thể tạo tài khoản',
                    'user' => null
                ], 500);
            }
        } catch (\Exception $e) {
            // ❌ Rollback nếu có upload mà lỗi
            if ($uploadedUrl && $cloudinary) {
                try {
                    $publicId = $this->extractCloudinaryPublicId($uploadedUrl);
                    if ($publicId) {
                        $cloudinary->uploadApi()->destroy($publicId, ['invalidate' => true]);
                        Log::info("🧹 Rollback Cloudinary do exception khi đăng ký user: {$publicId}");
                    }
                } catch (\Exception $ex) {
                    Log::warning("⚠️ Không thể rollback ảnh Cloudinary: " . $ex->getMessage());
                }
            }

            Log::error('🔥 Lỗi khi đăng ký user: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi đăng ký user: ' . $e->getMessage(),
                'user' => null
            ], 500);
        }
    }
    public function forgotPassword(Request $request)
    {
        // Xác thực đầu vào
        $request->validate([
            'email' => 'required|email'
        ]);

        // Tìm user theo email
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Email không tồn tại trong hệ thống.'
            ], 404);
        }

        // Kiểm tra trạng thái tài khoản
        if ($user->status !== 1) {
            return response()->json([
                'status' => false,
                'message' => 'Tài khoản của bạn đã bị khóa hoặc không hoạt động!'
            ], 403);
        }

        try {
            // Tạo token đặt lại mật khẩu
            $token = Str::random(60);

            // Lưu token vào bảng password_reset_tokens
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $request->email],
                [
                    'token' => Hash::make($token),
                    'created_at' => Carbon::now()
                ]
            );

            // Tạo URL đặt lại mật khẩu
            $resetUrl = env('FRONTEND_URL', 'http://localhost:3000') . '/reset-password?token=' . $token . '&email=' . urlencode($request->email);

            // Gửi email
            Mail::send('emails.reset_password', ['resetUrl' => $resetUrl, 'user' => $user], function ($message) use ($request) {
                $message->to($request->email)
                    ->subject('Yêu cầu đặt lại mật khẩu');
            });

            return response()->json([
                'status' => true,
                'message' => 'Email đặt lại mật khẩu đã được gửi!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.'
            ], 500);
        }
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8',
        ]);

        $reset = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$reset || !Hash::check($request->token, $reset->token)) {
            return response()->json([
                'status' => false,
                'message' => 'Token hoặc email không hợp lệ.'
            ], 400);
        }

        // Kiểm tra token có hết hạn không (60 phút)
        if (Carbon::parse($reset->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'status' => false,
                'message' => 'Token đã hết hạn. Vui lòng yêu cầu lại.'
            ], 400);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Email không tồn tại.'
            ], 404);
        }

        try {
            // Cập nhật mật khẩu
            $user->password = Hash::make($request->password);
            $user->save();

            // Xóa token sau khi sử dụng
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            return response()->json([
                'status' => true,
                'message' => 'Đặt lại mật khẩu thành công!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Có lỗi xảy ra. Vui lòng thử lại.'
            ], 500);
        }
    }

    public function getUserProfile(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Không tìm thấy người dùng hoặc chưa đăng nhập.'
                ], 401);
            }

            return response()->json([
                'status' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'image_url' => $user->image_url,
                    'created_at' => $user->created_at,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Không thể tải thông tin người dùng: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getFollowedComics(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Không tìm thấy người dùng hoặc chưa đăng nhập.'
                ], 401);
            }

            $cacheKey = "user:{$user->id}:followed_comics";

            if (Cache::has($cacheKey)) {
                return response()->json(Cache::get($cacheKey));
            }

            $followedComics = DB::table('bookmarks')
                ->join('comics', 'bookmarks.comic_id', '=', 'comics.id')
                ->where('bookmarks.user_id', $user->id)
                ->select(
                    'comics.id',
                    'comics.title',
                    'comics.slug',
                    'comics.cover_image',
                    'comics.comic_status',
                    'bookmarks.created_at as followed_at'
                )
                ->orderByDesc('bookmarks.created_at')
                ->get();

            $statusMap = [
                'ongoing' => 'Đang ra',
                'completed' => 'Hoàn thành',
                'hiatus' => 'Tạm dừng',
            ];

            $followedComics->transform(function ($comic) use ($statusMap) {
                $comic->comic_status_text = $statusMap[$comic->comic_status] ?? 'Không rõ';
                return $comic;
            });

            $data = [
                'status' => true,
                'followed_comics' => $followedComics
            ];

            Cache::put($cacheKey, $data, now()->addSeconds(60));

            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Không thể tải danh sách truyện theo dõi: ' . $e->getMessage()
            ], 500);
        }
    }


    public function getUserComments(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Không tìm thấy người dùng hoặc chưa đăng nhập.'
                ], 401);
            }

            $comments = DB::table('comments')
                ->join('comics', 'comments.comic_id', '=', 'comics.id')
                ->leftJoin('chapters', 'comments.chapter_id', '=', 'chapters.id')
                ->where('comments.user_id', $user->id)
                ->select(
                    'comments.id',
                    'comments.content',
                    'comments.created_at',
                    'comics.cover_image',
                    'comics.title as comic_title',
                    'comics.slug as comic_slug',
                    'chapters.title as chapter_title',
                    'chapters.id as chapter_id',
                    'chapters.slug as chapter_slug'
                )
                ->orderByDesc('comments.created_at')
                ->get();

            return response()->json([
                'status' => true,
                'comments' => $comments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Không thể tải danh sách bình luận: ' . $e->getMessage()
            ], 500);
        }
    }



    public function updateProfile(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Chưa đăng nhập.',
                'user' => null
            ], 401);
        }

        $rules = [
            'name' => 'required|string|max:255',
        ];

        // ✅ Nếu có file ảnh thì kiểm tra định dạng
        if ($request->hasFile('image')) {
            $rules['image'] = 'image|mimes:jpeg,png,jpg,gif,webp|max:5120';
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
            $user->updated_by = Auth::id() ?: $user->id;
            $user->updated_at = now();

            // ✅ Upload ảnh mới nếu có
            if ($request->hasFile('image')) {
                $upload = $cloudinary->uploadApi()->upload(
                    $request->file('image')->getRealPath(),
                    ['folder' => 'users', 'resource_type' => 'image', 'format' => 'webp']
                );
                $user->image_url = $upload['secure_url'];
                $newImage = $user->image_url;
            } elseif ($request->filled('image')) {
                $newImage = $request->input('image');
                $user->image_url = $request->input('image');
            }

            if ($user->save()) {
                // ✅ Xóa ảnh cũ nếu có upload mới
                if ($newImage && $oldImage) {
                    try {
                        $oldPublicId = $this->extractCloudinaryPublicId($oldImage);
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
                    'message' => 'Cập nhật hồ sơ thành công',
                    'user' => $user
                ], 200);
            } else {
                // ❌ Rollback ảnh mới nếu lưu DB thất bại
                if ($newImage) {
                    $newPublicId = $this->extractCloudinaryPublicId($newImage);
                    if ($newPublicId) {
                        $cloudinary->uploadApi()->destroy($newPublicId, ['invalidate' => true]);
                        Log::warning("🧹 Rollback ảnh Cloudinary do lưu DB thất bại: {$newPublicId}");
                    }
                }

                return response()->json([
                    'status' => false,
                    'message' => 'Không thể cập nhật hồ sơ',
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
                        Log::info("🧹 Rollback Cloudinary do exception updateProfile: {$newPublicId}");
                    }
                } catch (\Exception $ex) {
                    Log::warning("⚠️ Không thể rollback ảnh Cloudinary: " . $ex->getMessage());
                }
            }

            Log::error('🔥 Lỗi khi cập nhật hồ sơ: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi cập nhật hồ sơ: ' . $e->getMessage(),
                'user' => null
            ], 500);
        }
    }



    public function updateAccount(Request $request)
    {
        try {
            // Lấy người dùng đã xác thực
            /** @var \App\Models\User $user */
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Không tìm thấy người dùng hoặc chưa đăng nhập.'
                ], 401);
            }

            // Xác thực đầu vào
            $validator = Validator::make($request->all(), [
                'email' => 'required|email|max:255|unique:users,email,' . $user->id,
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => $validator->errors()->first()
                ], 422);
            }

            // Kiểm tra mật khẩu hiện tại
            if (empty($user->password) || !Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Mật khẩu hiện tại không đúng.'
                ], 422);
            }

            // Cập nhật email và mật khẩu
            $user->email = $request->email;
            $user->password = Hash::make($request->new_password);

            // Thử lưu người dùng
            if (!$user->save()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Không thể cập nhật tài khoản do lỗi lưu dữ liệu.'
                ], 500);
            }

            return response()->json([
                'status' => true,
                'message' => 'Cập nhật tài khoản thành công!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }


    public function handleGoogleCallback(Request $request)
    {
        $client = new GoogleClient(['client_id' => env('GOOGLE_CLIENT_ID')]);

        DB::beginTransaction(); // Bắt đầu transaction
        try {
            // Kiểm tra credential
            $credential = $request->input('credential');

            // Nếu credential là mảng, cố gắng lấy giá trị đúng
            if (is_array($credential)) {
                $credential = $credential['credential'] ?? null;
            }

            if (empty($credential) || !is_string($credential)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Credential không hợp lệ — phải là chuỗi JWT.'
                ], 400);
            }

            // Xác minh token
            $payload = $client->verifyIdToken($credential);
            if (!$payload) {
                return response()->json([
                    'status' => false,
                    'message' => 'Token Google không hợp lệ'
                ], 401);
            }
            // Xử lý user và tạo token
            $user = User::firstOrCreate(
                ['email' => $payload['email']],
                [
                    'name' => $payload['name'],
                    'password' => Hash::make(Str::random(24)),
                    'created_by' => 1,
                    'status' => 1
                ]
            );

            // Kiểm tra status
            if ($user->status !== 1) {
                return response()->json([
                    'status' => false,
                    'message' => 'Tài khoản của bạn đã bị khóa hoặc không hoạt động!'
                ], 403);
            }

            // Commit transaction
            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Đăng nhập bằng Google thành công!',
                'token' => $user->createToken('google-token')->plainTextToken,
                'user' => $user
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Đã xảy ra lỗi khi đăng nhập bằng Google: ' . $e->getMessage()
            ], 500);
        }
    }
}
