<?php


namespace App\Http\Controllers\backend;

use App\Http\Controllers\Controller;
use App\Models\ComicGenre;
use Illuminate\Http\Request;
use App\Models\Comics;
use App\Models\Genres;
use App\Models\TeamMembers;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use App\Services\ImageUploadService;
use Cloudinary\Cloudinary;

class ComicController extends Controller
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
        $query = Comics::where('comics.status', '!=', 0)
            ->orderBy('comics.created_at', 'DESC')
            ->select(
                'comics.id',
                'comics.title',
                'comics.team_id',
                'comics.comic_status',
                'comics.cover_image',
                'comics.views',
                'comics.status',
                'teams.name as team_name'
            )
            ->leftJoin('teams', 'comics.team_id', '=', 'teams.id');

        // Lọc theo team_id cho người dùng team
        if ($request->attributes->has('team_id')) {
            $query->where('team_id', $request->attributes->get('team_id'));
        }
        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
        ];

        if ($limit) {
            // Có limit, thực hiện phân trang
            $comics = $query->paginate($limit);
            $result['comics'] = $comics->items();
            $result['pagination'] = [
                'current_page' => $comics->currentPage(),
                'last_page' => $comics->lastPage(),
                'per_page' => $comics->perPage(),
                'total' => $comics->total(),
            ];
        } else {
            // Không có limit, lấy toàn bộ dữ liệu
            $comics = $query->get();
            $result['comics'] = $comics;
            $result['pagination'] = null; // Không trả về pagination
        }

        return response()->json($result);
    }

    public function trash(Request $request)
    {
        $query = Comics::where('comics.status', '=', 0)
            ->orderBy('comics.created_at', 'DESC')
            ->select(
                'comics.id',
                'comics.title',
                'comics.team_id',
                'comics.comic_status',
                'comics.cover_image',
                'comics.views',
                'comics.status',
                'teams.name as team_name'
            )
            ->leftJoin('teams', 'comics.team_id', '=', 'teams.id');

        // Lọc theo team_id cho người dùng team
        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $comics = $query->get();
        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
            'comics' => $comics
        ];
        return response()->json($result);
    }

    public function show(Request $request, $id)
    {
        $query = Comics::query()
            ->where('comics.id', $id)
            ->select(
                'comics.*',
                'teams.name as team_name',
                'creator.name as creator_name',
                'updater.name as updater_name'
            )
            ->leftJoin('teams', 'comics.team_id', '=', 'teams.id')
            ->leftJoin('users as creator', 'comics.created_by', '=', 'creator.id')
            ->leftJoin('users as updater', 'comics.updated_by', '=', 'updater.id');

        // Lọc theo team_id cho người dùng team
        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $comic = $query->first();

        if ($comic == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy dữ liệu hoặc bạn không có quyền truy cập',
                'comics' => null
            ], 404);
        }

        // Load quan hệ genres
        $comic->load('genres');
        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
            'comics' => array_merge($comic->toArray(), [
                'genre_ids' => $comic->genres->pluck('id')->toArray()
            ])
        ];
        return response()->json($result);
    }
    public function store(Request $request)
    {
        // Xử lý genre_ids: Chuyển chuỗi thành mảng nếu cần
        $input = $request->all();
        if (isset($input['genre_ids']) && is_string($input['genre_ids'])) {
            $input['genre_ids'] = array_map('intval', array_filter(explode(',', $input['genre_ids'])));
        } elseif (!isset($input['genre_ids']) || $input['genre_ids'] === null) {
            $input['genre_ids'] = [];
        }

        // Kiểm tra role user và gán team_id
        $user = Auth::user();
        if ($user && $user->role === 'team') {
            // User là team: gán trực tiếp từ attributes, bỏ qua POST
            if ($request->attributes->has('team_id')) {
                $input['team_id'] = $request->attributes->get('team_id');
            } else {
                return response()->json([
                    'status' => false,
                    'message' => 'Người dùng team phải có team_id hợp lệ.',
                    'comic' => null
                ], 422);
            }
        } else {
            // Không phải team (ví dụ: admin): sử dụng từ POST hoặc null
            $input['team_id'] = $input['team_id'] ?? null;
        }

        // ✅ Xây rule trước
        $rules = [
            'title' => 'required|string|max:255|unique:comics,title',
            'description' => 'nullable|string',
            'author_name' => 'nullable|string|max:255',
            'team_id' => 'nullable|exists:teams,id',
            'comic_status' => 'required|in:ongoing,completed,hiatus',
            'status' => 'required|in:0,1,2',
            'genre_ids' => 'nullable|array',
            'genre_ids.*' => 'exists:genres,id',
            'slug' => 'nullable|string|max:255|unique:comics,slug',
        ];

        // ✅ Nếu có upload file thì mới check thêm ảnh
        if ($request->hasFile('cover_image')) {
            $rules['cover_image'] = 'image|mimes:jpeg,png,jpg,gif,webp|max:5120';
        }

        $validator = Validator::make($input, $rules);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'comic' => null
            ], 422);
        }
        $uploadedCloudinaryId = null; // để rollback nếu lỗi
        try {
            $comic = new Comics();
            $comic->title = $input['title'];
            $comic->slug = $input['slug'] ?? Str::slug($input['title']);
            $comic->description = $input['description'];
            $comic->author_name = $input['author_name'];
            $comic->cover_image = $input['cover_image'];
            $comic->team_id = $input['team_id'];
            $comic->comic_status = $input['comic_status'];
            $comic->status = $input['status'];
            $comic->views = 0;
            $comic->created_by = Auth::id() ?: 1;
            $comic->created_at = now();

            // Xử lý cover_image
            // if ($request->hasFile('cover_image')) {
            //     $image = $request->file('cover_image');
            //     $ext = strtolower($image->getClientOriginalExtension());
            //     $imageName = date('YmdHis') . '_' . uniqid() . '.webp';
            //     $destinationPath = storage_path('app/public/comics');

            //     if (!file_exists($destinationPath)) {
            //         mkdir($destinationPath, 0755, true);
            //     }

            //     $sourceImage = null;
            //     if ($ext == 'jpeg' || $ext == 'jpg') {
            //         $sourceImage = imagecreatefromjpeg($image->getRealPath());
            //     } elseif ($ext == 'png') {
            //         $sourceImage = imagecreatefrompng($image->getRealPath());
            //     } elseif ($ext == 'gif') {
            //         $sourceImage = imagecreatefromgif($image->getRealPath());
            //     } elseif ($ext == 'webp') {
            //         $sourceImage = imagecreatefromwebp($image->getRealPath());
            //     }

            //     if ($sourceImage) {
            //         $width = imagesx($sourceImage);
            //         $height = imagesy($sourceImage);
            //         $trueColorImage = imagecreatetruecolor($width, $height);
            //         // Bảo toàn độ trong suốt cho PNG và GIF
            //         if ($ext == 'png' || $ext == 'gif') {
            //             imagealphablending($trueColorImage, false);
            //             imagesavealpha($trueColorImage, true);
            //             $transparent = imagecolorallocatealpha($trueColorImage, 0, 0, 0, 127);
            //             imagefill($trueColorImage, 0, 0, $transparent);
            //         }
            //         imagecopy($trueColorImage, $sourceImage, 0, 0, 0, 0, $width, $height);
            //         imagedestroy($sourceImage);
            //         imagewebp($trueColorImage, $destinationPath . '/' . $imageName, 80);
            //         imagedestroy($trueColorImage);
            //         $comic->cover_image = '/storage/comics/' . $imageName;
            //     } else {
            //         return response()->json([
            //             'status' => false,
            //             'message' => 'Định dạng ảnh không được hỗ trợ',
            //             'comic' => null
            //         ], 400);
            //     }
            // }
            // ✅ Upload lên Cloudinary nếu có file
            // ✅ Upload Cloudinary (hoặc dùng URL có sẵn)
            if ($request->hasFile('cover_image')) {
                $file = $request->file('cover_image');
                $cloudinary = $this->makeCloudinaryClient();

                $upload = $cloudinary->uploadApi()->upload(
                    $file->getRealPath(),
                    ['folder' => 'comics', 'resource_type' => 'image', 'format' => 'webp']
                );

                $comic->cover_image = $upload['secure_url'];
                $uploadedCloudinaryId = $upload['public_id']; // giữ để rollback nếu lỗi
            } elseif (isset($input['cover_image'])) {
                $comic->cover_image = $input['cover_image'];
            }

            // ✅ Lưu vào DB
            if ($comic->save()) {
                $comic->genres()->sync($input['genre_ids'] ?? []);
                return response()->json([
                    'status' => true,
                    'message' => 'Thêm thành công',
                    'comic' => $comic->load(['team', 'genres'])
                ], 201);
            } else {
                // Nếu lưu thất bại → rollback ảnh Cloudinary
                if ($uploadedCloudinaryId) {
                    $cloudinary->uploadApi()->destroy($uploadedCloudinaryId);
                }
                return response()->json([
                    'status' => false,
                    'message' => 'Không thể thêm comic',
                    'comic' => null
                ], 500);
            }
        } catch (\Exception $e) {
            // ✅ Rollback Cloudinary nếu đã upload
            if ($uploadedCloudinaryId) {
                try {
                    $cloudinary = $this->makeCloudinaryClient();
                    $cloudinary->uploadApi()->destroy($uploadedCloudinaryId);
                    Log::info("🧹 Đã rollback ảnh Cloudinary sau lỗi: {$uploadedCloudinaryId}");
                } catch (\Exception $cloudEx) {
                    Log::warning("⚠️ Rollback Cloudinary thất bại: " . $cloudEx->getMessage());
                }
            }

            Log::error('❌ Lỗi khi tạo comic: ' . $e->getMessage(), ['exception' => $e]);

            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi tạo comic: ' . $e->getMessage(),
                'comic' => null
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $query = Comics::query()->where('id', $id);

        // Nếu là team, chỉ được cập nhật comic thuộc team mình
        if ($request->attributes->has('team_id')) {
            $query->where('team_id', $request->attributes->get('team_id'));
        }

        $comic = $query->first();
        if (!$comic) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy comic',
                'comic' => null
            ], 404);
        }

        $input = $request->all();

        // Xử lý genre_ids
        if (isset($input['genre_ids']) && is_string($input['genre_ids'])) {
            $input['genre_ids'] = array_map('intval', array_filter(explode(',', $input['genre_ids'])));
        } elseif (!isset($input['genre_ids']) || $input['genre_ids'] === null) {
            $input['genre_ids'] = [];
        }

        // Lấy team_id từ attribute hoặc giữ nguyên
        $input['team_id'] = $request->attributes->get('team_id', $comic->team_id);

        $rules = [
            'title' => 'required|string|max:255|unique:comics,title,' . $id,
            'description' => 'nullable|string',
            'author_name' => 'nullable|string|max:255',
            'team_id' => 'nullable|exists:teams,id',
            'comic_status' => 'required|in:ongoing,completed,hiatus',
            'status' => 'required|in:0,1,2',
            'genre_ids' => 'nullable|array',
            'genre_ids.*' => 'exists:genres,id',
            'views' => 'nullable|integer|min:0',
            'slug' => 'nullable|string|max:255|unique:comics,slug,' . $id,
        ];

        // ✅ Nếu có file ảnh thì thêm rule ảnh
        if ($request->hasFile('cover_image')) {
            $rules['cover_image'] = 'image|mimes:jpeg,png,jpg,gif,webp|max:5120';
        }

        // Tạo validator
        $validator = Validator::make($input, $rules);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'comic' => null
            ], 422);
        }

        $cloudinary = $this->makeCloudinaryClient();
        $oldImage = $comic->cover_image;
        $newUploadUrl = null; // dùng để rollback nếu lỗi

        try {
            // Gán dữ liệu mới
            $comic->fill([
                'title' => $input['title'],
                'slug' => $input['slug'] ?? Str::slug($input['title']),
                'description' => $input['description'],
                'author_name' => $input['author_name'],
                'team_id' => $input['team_id'],
                'comic_status' => $input['comic_status'],
                'status' => $input['status'],
                'views' => $input['views'] ?? $comic->views,
                'updated_by' => Auth::id() ?: 1,
                'updated_at' => now(),
            ]);

            // ✅ Nếu frontend đã upload sẵn và gửi URL → chỉ cần lưu
            if ($request->has('cover_image') && is_string($request->cover_image) && !empty($request->cover_image)) {
                $newUploadUrl = $request->cover_image;
                $comic->cover_image = $newUploadUrl;
            }
            // ✅ Nếu frontend chưa upload, mà gửi file → upload ở backend
            elseif ($request->hasFile('cover_image')) {
                try {
                    $upload = $cloudinary->uploadApi()->upload(
                        $request->file('cover_image')->getRealPath(),
                        [
                            'folder' => 'comics',
                            'resource_type' => 'image',
                            'format' => 'webp'
                        ]
                    );
                    $newUploadUrl = $upload['secure_url'];
                    $comic->cover_image = $newUploadUrl;
                } catch (\Exception $e) {
                    Log::error("🔥 Lỗi khi upload Cloudinary: " . $e->getMessage());
                    return response()->json([
                        'status' => false,
                        'message' => 'Lỗi upload ảnh lên Cloudinary.'
                    ], 500);
                }
            }

            // ✅ Lưu DB
            if ($comic->save()) {
                $comic->genres()->sync($input['genre_ids']);

                // Nếu có ảnh mới thì xóa ảnh cũ
                if ($newUploadUrl && $oldImage) {
                    $publicId = $this->extractCloudinaryPublicId($oldImage);
                    if ($publicId) {
                        $cloudinary->uploadApi()->destroy($publicId, ['invalidate' => true]);
                        Log::info("🧹 Đã xóa ảnh cũ Cloudinary: {$publicId}");
                    }
                }

                return response()->json([
                    'status' => true,
                    'message' => 'Cập nhật thành công',
                    'comic' => $comic->load(['team', 'genres'])
                ], 200);
            } else {
                // Nếu lưu thất bại và có upload mới → rollback ảnh
                if ($newUploadUrl) {
                    $publicId = $this->extractCloudinaryPublicId($newUploadUrl);
                    if ($publicId) {
                        $cloudinary->uploadApi()->destroy($publicId, ['invalidate' => true]);
                        Log::warning("❌ Rollback ảnh mới vì lưu DB thất bại: {$publicId}");
                    }
                }

                return response()->json([
                    'status' => false,
                    'message' => 'Không thể cập nhật comic'
                ], 500);
            }
        } catch (\Exception $e) {
            // Nếu có upload mới nhưng lỗi -> rollback
            if ($newUploadUrl) {
                $publicId = $this->extractCloudinaryPublicId($newUploadUrl);
                if ($publicId) {
                    $cloudinary->uploadApi()->destroy($publicId, ['invalidate' => true]);
                    Log::warning("❌ Rollback ảnh mới vì lỗi exception: {$publicId}");
                }
            }

            Log::error('Lỗi khi cập nhật comic: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi cập nhật comic: ' . $e->getMessage(),
                'comic' => null
            ], 500);
        }
    }


    public function status(Request $request, $id)
    {
        $query = Comics::query()->where('id', $id);

        // Lọc theo team_id cho người dùng team
        if ($request->attributes->has('team_id')) {
            $query->where('team_id', $request->attributes->get('team_id'));
        }

        $comic = $query->first();
        if ($comic == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'comic' => null
            ]);
        }

        $comic->status = ($comic->status == 1) ? 2 : 1;
        $comic->updated_by = Auth::id() ?: 1;
        $comic->updated_at = now();

        if ($comic->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'comic' => $comic
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'comic' => null
            ]);
        }
    }

    public function delete(Request $request, $id)
    {
        $query = Comics::query()->where('id', $id);

        // Lọc theo team_id cho người dùng team
        if ($request->attributes->has('team_id')) {
            $query->where('team_id', $request->attributes->get('team_id'));
        }

        $comic = $query->first();
        if ($comic == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'comic' => null
            ]);
        }
        // Kiểm tra quyền leader
        $user = Auth::user();
        if ($user->role !== 'admin') {
            $isLeader = TeamMembers::where('team_id', $comic->team_id)
                ->where('user_id', $user->id)
                ->where('role', 'leader')
                ->exists();
            if (!$isLeader) {
                return response()->json([
                    'status' => false,
                    'message' => 'Chỉ leader mới có quyền xóa thành viên',
                    'comic' => null
                ]);
            }
        }
        $comic->status = 0;
        $comic->updated_by = Auth::id() ?: 1;
        $comic->updated_at = now();

        if ($comic->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'comic' => $comic
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'comic' => null
            ]);
        }
    }
    public function restore(Request $request, $id)
    {
        $query = Comics::query()->where('id', $id);

        // Lọc theo team_id cho người dùng team
        if ($request->attributes->has('team_id')) {
            $query->where('team_id', $request->attributes->get('team_id'));
        }

        $comic = $query->first();
        if ($comic == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'comic' => null
            ]);
        }

        $comic->status = 2;
        $comic->updated_by = Auth::id() ?: 1;
        $comic->updated_at = now();

        if ($comic->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'comic' => $comic
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'comic' => null
            ]);
        }
    }


    public function destroy(Request $request, $id)
    {
        $query = Comics::query()->where('id', $id);

        if ($request->attributes->has('team_id')) {
            $query->where('team_id', $request->attributes->get('team_id'));
        }

        $comic = $query->first();
        if (!$comic) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'comic' => null
            ], 404);
        }


        $publicId =  null;

        // Nếu chưa có, thử trích từ URL
        if (!$publicId && $comic->cover_image) {
            $publicId = $this->extractCloudinaryPublicId($comic->cover_image);
        }

        try {
            if ($publicId) {
                $cloudinary = $this->makeCloudinaryClient();
                $result = $cloudinary->uploadApi()->destroy($publicId);



                // ✅ Check kết quả từ Cloudinary
                if (!isset($result['result']) || $result['result'] !== 'ok') {
                    Log::warning("❌ Xóa ảnh Cloudinary thất bại cho comic id={$comic->id}: " . json_encode($result));

                    return response()->json([
                        'status' => false,
                        'message' => 'Không thể xóa ảnh trên Cloudinary. Dữ liệu vẫn được giữ lại.',
                        'comic' => $comic
                    ], 500);
                }
            } else {
                Log::info("⚠️ Không có public_id cho comic id={$comic->id}, bỏ qua xóa Cloudinary.");
            }

            // Xóa record trong DB
            $comic->delete();

            return response()->json([
                'status' => true,
                'message' => 'Xóa thành công',
                'comic' => $comic
            ], 200);
        } catch (\Exception $e) {
            Log::error('Lỗi khi xóa comic hoặc ảnh Cloudinary: ' . $e->getMessage(), [
                'comic_id' => $comic->id,
                'public_id' => $publicId ?? null,
                'exception' => $e,
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi xóa: ' . $e->getMessage(),
                'comic' => null
            ], 500);
        }
    }
}
