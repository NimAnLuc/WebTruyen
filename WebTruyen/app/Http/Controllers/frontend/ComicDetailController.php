<?php

namespace App\Http\Controllers\frontend;

use App\Http\Controllers\Controller;
use App\Models\Bookmarks;
use App\Models\ComicGenre;
use App\Models\Comics;
use App\Models\Genres;
use App\Models\Chapters;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;


class ComicDetailController extends Controller
{
    public function comicDetail(Request $request, $slug)
    {
        try {
            // Dữ liệu comic detail được cache theo slug
            $comic = Cache::remember("comic_detail_{$slug}", 60 * 5, function () use ($slug) {
                return Comics::where('comics.status', 1)
                    ->where('comics.slug', $slug)
                    ->leftJoin('teams', 'comics.team_id', '=', 'teams.id')
                    ->select(
                        'comics.id',
                        'comics.title',
                        'comics.cover_image',
                        'comics.views',
                        'comics.slug',
                        'comics.description',
                        'comics.author_name',
                        'comics.comic_status',
                        'comics.team_id',
                        'teams.name as team_name',
                        DB::raw('(
                        SELECT COUNT(*) 
                        FROM bookmarks 
                        WHERE bookmarks.comic_id = comics.id 
                        AND bookmarks.status = 1
                    ) AS bookmark_count')
                    )
                    ->with(['genres:id,name'])
                    ->first();
            });

            if (!$comic) {
                return response()->json([
                    'status' => false,
                    'message' => "Không tìm thấy truyện với slug: $slug",
                    'comic' => null,
                    'chapters' => [],
                ], 404);
            }

            // Danh sách chapter cũng nên được cache!
            $chapters = Cache::remember("chapters_{$comic->id}", 60 * 5, function () use ($comic) {
                return DB::table('chapters')
                    ->where('comic_id', $comic->id)
                    ->where('status', 1)
                    ->select(
                        'id',
                        'chapter_number',
                        'slug',
                        'view_count',
                        DB::raw('created_at AS created_at')
                    )
                    ->orderByDesc('chapter_number')
                    ->get()
                    ->map(function ($chapter) {
                        $chapter->chapter_number = fmod($chapter->chapter_number, 1) === 0
                            ? (int) $chapter->chapter_number
                            : (float) $chapter->chapter_number;

                        if ($chapter->created_at) {
                            $chapter->created_at = \Carbon\Carbon::parse($chapter->created_at)->diffForHumans();
                        }

                        return $chapter;
                    });
            });

            return response()->json([
                'status' => true,
                'message' => 'Lấy chi tiết truyện và danh sách chương thành công',
                'comic' => $comic,
                'chapters' => $chapters,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi lấy chi tiết truyện: ' . $e->getMessage(),
                'comic' => null,
                'chapters' => [],
            ], 500);
        }
    }
    // 🟢 Thêm bookmark
    public function addBookmark(Request $request, $comic_id)
    {
        $userId = Auth::id();

        // Kiểm tra đã tồn tại chưa
        $existing = Bookmarks::where('user_id', $userId)
            ->where('comic_id', $comic_id)
            ->first();

        if ($existing) {
            return response()->json([
                'status' => false,
                'message' => 'Bookmark đã tồn tại',
                'bookmark' => null
            ]);
        }

        $bookmark = Bookmarks::create([
            'user_id' => $userId,
            'comic_id' => $comic_id,
            'status' => 1,
            'created_by' => $userId
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Thêm bookmark thành công',
            'bookmark' => $bookmark->load(['user', 'comic'])
        ]);
    }

    // 🔴 Xoá bookmark
    public function removeBookmark($comic_id)
    {
        $userId = Auth::id();

        $bookmark = Bookmarks::where('user_id', $userId)
            ->where('comic_id', $comic_id)
            ->first();

        if (!$bookmark) {
            return response()->json([
                'status' => false,
                'message' => 'Bookmark không tồn tại',
            ]);
        }

        $bookmark->delete();

        return response()->json([
            'status' => true,
            'message' => 'Xoá bookmark thành công',
        ]);
    }

    // 🟡 Lấy danh sách bookmark của user
    public function listBookmarks()
    {
        $userId = Auth::id();
        $cacheKey = "bookmark:user:{$userId}";

        // Nếu có trong Redis thì dùng luôn
        if (Cache::has($cacheKey)) {
            $bookmarks = Cache::get($cacheKey);
        } else {
            // Lấy từ DB
            $bookmarks = Bookmarks::where('user_id', $userId)
                ->with('comic')
                ->orderByDesc('created_at')
                ->get();

            // Lưu vào Redis trong 10 phút (600 giây)
            Cache::put($cacheKey, $bookmarks, 600);
        }

        return response()->json([
            'status' => true,
            'bookmarks' => $bookmarks
        ]);
    }
}
