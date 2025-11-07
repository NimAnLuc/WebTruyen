<?php

namespace App\Http\Controllers\backend;

use App\Http\Controllers\Controller;
use App\Models\Chapters;
use App\Models\Comics;
use Illuminate\Http\Request;
use App\Models\Pages;
use App\Models\TeamMembers;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\File;
use Cloudinary\Cloudinary;
use Illuminate\Support\Facades\Log;

class PageController extends Controller
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
        $query = Pages::where('pages.status', '!=', 0)
            ->orderBy('pages.created_at', 'DESC')
            ->select('pages.id', 'pages.chapter_id', 'pages.page_number', 'pages.status')
            ->join('chapters', 'pages.chapter_id', '=', 'chapters.id')
            ->join('comics', 'chapters.comic_id', '=', 'comics.id');

        // Lọc theo team_id cho người dùng team
        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }
        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
        ];
        if ($limit) {
            // Có limit, thực hiện phân trang
            $pages = $query->paginate($limit);
            $result['pages'] = $pages->items();
            $result['pagination'] = [
                'current_page' => $pages->currentPage(),
                'last_page' => $pages->lastPage(),
                'per_page' => $pages->perPage(),
                'total' => $pages->total(),
            ];
        } else {
            // Không có limit, lấy toàn bộ dữ liệu
            $pages = $query->get();
            $result['pages'] = $pages;
            $result['pagination'] = null; // Không trả về pagination
        }

        return response()->json($result);
    }

    public function trash(Request $request)
    {
        $query = Pages::where('pages.status', '=', 0)
            ->orderBy('pages.created_at', 'DESC')
            ->select('pages.id', 'pages.chapter_id', 'pages.page_number', 'pages.image_url', 'pages.status')
            ->join('chapters', 'pages.chapter_id', '=', 'chapters.id')
            ->join('comics', 'chapters.comic_id', '=', 'comics.id');


        // Lọc theo team_id cho người dùng team
        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $pages = $query->get();
        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
            'pages' => $pages
        ];
        return response()->json($result);
    }

    public function show(Request $request, $id)
    {
        $query = Pages::where('pages.id', $id)
            ->join('chapters', 'pages.chapter_id', '=', 'chapters.id')
            ->join('comics', 'chapters.comic_id', '=', 'comics.id')
            ->leftJoin('users as creator', 'pages.created_by', '=', 'creator.id')
            ->leftJoin('users as updater', 'pages.updated_by', '=', 'updater.id')
            ->select(
                'pages.*',
                'chapters.comic_id',
                'comics.title as comic_title',
                'comics.team_id',
                'creator.name as creator_name',
                'updater.name as updater_name'
            );

        // Lọc theo team_id cho người dùng team
        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $page = $query->first();

        if ($page == null) {
            $result = [
                'status' => false,
                'message' => 'Không tìm thấy dữ liệu hoặc bạn không có quyền truy cập',
                'pages' => null
            ];
        } else {
            $result = [
                'status' => true,
                'message' => 'Tải dữ liệu thành công',
                'pages' => $page
            ];
        }

        return response()->json($result);
    }

    public function store(Request $request)
    {
        // ✅ Tạo rule cơ bản
        $rules = [
            'chapter_id' => 'required|exists:chapters,id',
            'page_number' => 'required|integer|min:1',
            'status' => 'required|in:1,2,0',
        ];

        // ✅ Nếu có file ảnh → thêm rule ảnh
        if ($request->hasFile('image_url')) {
            $rules['image_url'] = 'image|mimes:jpeg,png,jpg,gif,webp|max:5120';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'page' => null
            ]);
        }

        // Kiểm tra quyền chapter
        $chapter = Chapters::find($request->chapter_id);
        if (!$chapter) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy chương',
                'page' => null
            ]);
        }

        $comic = Comics::find($chapter->comic_id);
        if (!$comic || ($request->attributes->has('team_id') && $comic->team_id != $request->attributes->get('team_id'))) {
            return response()->json([
                'status' => false,
                'message' => 'Không có quyền thêm trang cho chương này',
                'page' => null
            ]);
        }

        // Tránh trùng page_number
        if (Pages::where('chapter_id', $request->chapter_id)
            ->where('page_number', $request->page_number)
            ->exists()
        ) {
            return response()->json([
                'status' => false,
                'message' => 'Số trang đã tồn tại cho chương này',
                'page' => null
            ]);
        }

        $page = new Pages();
        $page->chapter_id = $request->chapter_id;
        $page->page_number = $request->page_number;
        $page->status = $request->status;
        $page->created_by = Auth::id() ?: 1;
        $page->created_at = now();

        $cloudinary = $this->makeCloudinaryClient();
        $uploadedPublicId = null;

        try {
            // Xử lý ảnh
            if ($request->hasFile('image_url')) {
                $file = $request->file('image_url');
                $upload = $cloudinary->uploadApi()->upload(
                    $file->getRealPath(),
                    ['folder' => 'pages', 'resource_type' => 'image', 'format' => 'webp']
                );
                $page->image_url = $upload['secure_url'];
                $uploadedPublicId = $this->extractCloudinaryPublicId($upload['secure_url']);
            } elseif ($request->filled('image_url')) {
                $page->image_url = $request->input('image_url');
            }

            // Lưu DB
            if ($page->save()) {
                return response()->json([
                    'status' => true,
                    'message' => 'Thêm thành công',
                    'page' => $page->load('chapter')
                ]);
            } else {
                // Rollback ảnh nếu lưu thất bại
                if ($uploadedPublicId) {
                    $cloudinary->uploadApi()->destroy($uploadedPublicId, ['invalidate' => true]);
                    Log::warning("❌ Rollback Cloudinary ảnh mới: {$uploadedPublicId}");
                }
                return response()->json([
                    'status' => false,
                    'message' => 'Không thể thêm',
                    'page' => null
                ]);
            }
        } catch (\Exception $e) {
            // Rollback nếu lỗi exception
            if ($uploadedPublicId) {
                $cloudinary->uploadApi()->destroy($uploadedPublicId, ['invalidate' => true]);
                Log::warning("❌ Rollback Cloudinary do lỗi exception: {$uploadedPublicId}");
            }
            Log::error("🔥 Lỗi khi tạo page: " . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi tạo page: ' . $e->getMessage(),
                'page' => null
            ], 500);
        }
    }


    public function update(Request $request, $id)
    {
        $page = Pages::find($id);
        if (!$page) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'page' => null
            ]);
        }

        $chapter = Chapters::find($request->chapter_id);
        if (!$chapter) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy chương',
                'page' => null
            ]);
        }

        $comic = Comics::find($chapter->comic_id);
        if (!$comic || ($request->attributes->has('team_id') && $comic->team_id != $request->attributes->get('team_id'))) {
            return response()->json([
                'status' => false,
                'message' => 'Không có quyền cập nhật trang cho chương này',
                'page' => null
            ]);
        }

        // ✅ Tạo rule cơ bản
        $rules = [
            'chapter_id' => 'required|exists:chapters,id',
            'page_number' => 'required|integer|min:1',
            'status' => 'required|in:1,2,0',
        ];

        // ✅ Nếu có file ảnh → thêm rule ảnh
        if ($request->hasFile('image_url')) {
            $rules['image_url'] = 'image|mimes:jpeg,png,jpg,gif,webp|max:5120';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'page' => null
            ]);
        }


        // Kiểm tra trùng số trang
        if (Pages::where('chapter_id', $request->chapter_id)
            ->where('page_number', $request->page_number)
            ->where('id', '!=', $id)
            ->exists()
        ) {
            return response()->json([
                'status' => false,
                'message' => 'Số trang đã tồn tại cho chương này',
                'page' => null
            ]);
        }

        $cloudinary = $this->makeCloudinaryClient();
        $oldImage = $page->image_url;
        $newPublicId = null;

        try {
            // ✅ Trường hợp 1: Frontend gửi URL (đã upload Cloudinary sẵn)
            if ($request->has('image_url') && is_string($request->image_url) && !empty($request->image_url)) {
                $page->image_url = $request->image_url;
                $newPublicId = $this->extractCloudinaryPublicId($request->image_url);
            }
            // ✅ Trường hợp 2: Frontend gửi file, backend upload
            elseif ($request->hasFile('image_url')) {
                $upload = $cloudinary->uploadApi()->upload(
                    $request->file('image_url')->getRealPath(),
                    ['folder' => 'pages', 'resource_type' => 'image', 'format' => 'webp']
                );
                $page->image_url = $upload['secure_url'];
                $newPublicId = $this->extractCloudinaryPublicId($upload['secure_url']);
            }
            // ✅ Trường hợp 3: Không gửi gì → giữ nguyên ảnh cũ
            else {
                $page->image_url = $oldImage;
            }

            // Gán các thông tin khác
            $page->chapter_id = $request->chapter_id;
            $page->page_number = $request->page_number;
            $page->status = $request->status;
            $page->updated_by = Auth::id() ?: 1;
            $page->updated_at = now();

            if ($page->save()) {
                // Xóa ảnh cũ nếu có ảnh mới khác
                if ($newPublicId && $oldImage && $page->image_url !== $oldImage) {
                    $oldPublicId = $this->extractCloudinaryPublicId($oldImage);
                    if ($oldPublicId) {
                        try {
                            $cloudinary->uploadApi()->destroy($oldPublicId, ['invalidate' => true]);
                            Log::info("🧹 Đã xóa ảnh cũ Cloudinary: {$oldPublicId}");
                        } catch (\Exception $e) {
                            Log::warning("⚠️ Không thể xóa ảnh cũ Cloudinary: {$oldPublicId}");
                        }
                    }
                }

                return response()->json([
                    'status' => true,
                    'message' => 'Cập nhật thành công',
                    'page' => $page->load('chapter')
                ]);
            } else {
                // Rollback ảnh mới nếu lưu thất bại
                if ($newPublicId && $page->image_url !== $oldImage) {
                    $cloudinary->uploadApi()->destroy($newPublicId, ['invalidate' => true]);
                    Log::warning("❌ Rollback ảnh mới Cloudinary do lưu thất bại: {$newPublicId}");
                }

                return response()->json([
                    'status' => false,
                    'message' => 'Không thể cập nhật',
                    'page' => null
                ]);
            }
        } catch (\Exception $e) {
            // Rollback nếu exception
            if ($newPublicId) {
                $cloudinary->uploadApi()->destroy($newPublicId, ['invalidate' => true]);
                Log::warning("❌ Rollback Cloudinary do exception: {$newPublicId}");
            }

            Log::error('🔥 Lỗi khi cập nhật page: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi cập nhật page: ' . $e->getMessage(),
                'page' => null
            ], 500);
        }
    }

    public function status(Request $request, $id)
    {
        $query = Pages::where('pages.id', $id)
            ->join('chapters', 'pages.chapter_id', '=', 'chapters.id')
            ->join('comics', 'chapters.comic_id', '=', 'comics.id');

        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $page = $query->first();
        if ($page == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập',
                'page' => null
            ]);
        }

        // Lấy bản ghi page thực tế từ model Pages để cập nhật
        $pageToUpdate = Pages::find($id);
        if (!$pageToUpdate) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy trang',
                'page' => null
            ]);
        }

        $pageToUpdate->status = ($pageToUpdate->status == 1) ? 2 : 1;
        $pageToUpdate->updated_by = Auth::id() ?: 1;
        $pageToUpdate->updated_at = now();

        if ($pageToUpdate->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'page' => $pageToUpdate
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'page' => null
            ]);
        }
    }

    public function delete(Request $request, $id)
    {
        $query = Pages::where('pages.id', $id)
            ->join('chapters', 'pages.chapter_id', '=', 'chapters.id')
            ->join('comics', 'chapters.comic_id', '=', 'comics.id');

        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $page = $query->first();
        if ($page == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập',
                'page' => null
            ]);
        }
        // Kiểm tra quyền leader
        $user = Auth::user();
        if ($user->role !== 'admin') {
            $isLeader = TeamMembers::where('team_id',  $page->team_id)
                ->where('user_id', $user->id)
                ->where('role', 'leader')
                ->exists();
            if (!$isLeader) {
                return response()->json([
                    'status' => false,
                    'message' => 'Chỉ leader mới có quyền xóa trang',
                    'page' => null
                ]);
            }
        }
        // Lấy bản ghi page thực tế từ model Pages để cập nhật
        $pageToUpdate = Pages::find($id);
        if (!$pageToUpdate) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy trang',
                'page' => null
            ]);
        }

        $pageToUpdate->status = 0;
        $pageToUpdate->updated_by = Auth::id() ?: 1;
        $pageToUpdate->updated_at = now();

        if ($pageToUpdate->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'page' => $pageToUpdate
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'page' => null
            ]);
        }
    }

    public function restore(Request $request, $id)
    {
        $query = Pages::where('pages.id', $id)
            ->join('chapters', 'pages.chapter_id', '=', 'chapters.id')
            ->join('comics', 'chapters.comic_id', '=', 'comics.id');

        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $page = $query->first();
        if ($page == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập',
                'page' => null
            ]);
        }

        // Lấy bản ghi page thực tế từ model Pages để cập nhật
        $pageToUpdate = Pages::find($id);
        if (!$pageToUpdate) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy trang',
                'page' => null
            ]);
        }

        $pageToUpdate->status = 2;
        $pageToUpdate->updated_by = Auth::id() ?: 1;
        $pageToUpdate->updated_at = now();

        if ($pageToUpdate->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'page' => $pageToUpdate
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'page' => null
            ]);
        }
    }

    public function destroy(Request $request, $id)
    {
        $query = Pages::where('pages.id', $id)
            ->join('chapters', 'pages.chapter_id', '=', 'chapters.id')
            ->join('comics', 'chapters.comic_id', '=', 'comics.id');

        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $page = $query->first();
        if (!$page) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập',
                'page' => null
            ], 404);
        }

        $pageToDelete = Pages::find($id);
        if (!$pageToDelete) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy trang cần xóa',
                'page' => null
            ], 404);
        }

        $oldImage = $pageToDelete->image_url;
        $publicId = null;

        // ✅ Trích xuất publicId nếu là Cloudinary
        if ($oldImage && str_contains($oldImage, 'res.cloudinary.com')) {
            $publicId = $this->extractCloudinaryPublicId($oldImage);
        }

        try {
            if ($publicId) {
                $cloudinary = $this->makeCloudinaryClient();
                $result = $cloudinary->uploadApi()->destroy($publicId);

                if (!isset($result['result']) || $result['result'] !== 'ok') {
                    Log::warning("❌ Xóa ảnh Cloudinary thất bại cho page id={$pageToDelete->id}: " . json_encode($result));
                }
            } elseif ($oldImage && File::exists(public_path($oldImage))) {
                File::delete(public_path($oldImage));
            }

            if (!$pageToDelete->delete()) {
                if ($publicId) {
                    $cloudinary->uploadApi()->upload(
                        $oldImage,
                        ['folder' => 'pages', 'resource_type' => 'image', 'format' => 'webp']
                    );
                }
            }

            return response()->json([
                'status' => true,
                'message' => 'Xóa trang thành công',
                'page' => $pageToDelete
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Lỗi khi xóa page hoặc ảnh Cloudinary: ' . $e->getMessage(), [
                'page_id' => $id,
                'image_url' => $oldImage,
                'exception' => $e,
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi xóa: ' . $e->getMessage(),
                'page' => null
            ], 500);
        }
    }
}
