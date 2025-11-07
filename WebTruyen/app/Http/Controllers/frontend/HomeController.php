<?php

namespace App\Http\Controllers\frontend;

use App\Http\Controllers\Controller;
use App\Models\ComicGenre;
use App\Models\Comics;
use App\Models\Genres;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;


class HomeController extends Controller
{
    // 🟢 Trang chủ - danh sách truyện mới cập nhật
    public function index(Request $request)
    {
        $limit = $request->input('limit', 20); // fallback để tránh lỗi
        $page = $request->input('page', 1);

        $cacheKey = "home:comics:limit={$limit}:page={$page}";

        if (Cache::has($cacheKey)) {
            return response()->json(Cache::get($cacheKey));
        }


        // Lấy danh sách truyện đang hoạt động
        $query = Comics::where('comics.status', 1)
            ->select(
                'comics.id',
                'comics.title',
                'comics.cover_image',
                'comics.views',
                'comics.slug',
                DB::raw('(
                    SELECT COUNT(*) 
                    FROM bookmarks 
                    WHERE bookmarks.comic_id = comics.id 
                    AND bookmarks.status = 1
                ) AS bookmark_count'),
                DB::raw('(
                    SELECT COUNT(*) 
                    FROM comments 
                    WHERE comments.comic_id = comics.id 
                ) AS comment_count')
            )
            ->orderByDesc('comics.updated_at');

        $comics = $limit ? $query->paginate($limit) : $query->get();

        // Gắn thêm 3 chương mới nhất (status = 1)
        $comics->transform(function ($comic) {
            $chapters = DB::table('chapters')
                ->where('comic_id', $comic->id)
                ->where('status', 1)
                ->orderByDesc('chapter_number')
                ->limit(3)
                ->get(['id', 'slug', 'chapter_number', 'created_at'])
                ->map(function ($chapter) {
                    // ✅ Làm tròn số chương: 14.0 -> 14 | 14.5 -> 14.5
                    $chapter->chapter_number =
                        fmod($chapter->chapter_number, 1) === 0.0
                        ? intval($chapter->chapter_number)
                        : round($chapter->chapter_number, 1);

                    // ✅ Hiển thị ngày tương đối: "2 giờ trước", "3 ngày trước"
                    $chapter->created_at = Carbon::parse($chapter->created_at)->diffForHumans();

                    return $chapter;
                });

            $comic->chapters = $chapters;
            return $comic;
        });

        $response = [
            'comics' => $limit === 'all' ? $comics : $comics->items(),
            'pagination' => $limit === 'all' ? null : [
                'current_page' => $comics->currentPage(),
                'last_page' => $comics->lastPage(),
                'per_page' => $comics->perPage(),
                'total' => $comics->total(),
            ]
        ];
        Cache::put($cacheKey, $response, 600);

        return response()->json($response);
    }

    // 🟢 Truyện nổi bật (có chương mới trong 1 tuần)
    public function getFeaturedComics(Request $request)
    {
        $limit = $request->input('limit', 8);
        $cacheKey = "featured:limit={$limit}";

        if (Cache::has($cacheKey)) {
            return response()->json(Cache::get($cacheKey));
        }

        $query = Comics::where('comics.status', 1)
            ->select(
                'comics.id',
                'comics.title',
                'comics.cover_image',
                'comics.views',
                'comics.slug',
                // ✅ Lấy chapter mới nhất có status = 1
                DB::raw('MAX(CASE WHEN chapters.status = 1 THEN chapters.chapter_number END) as latest_chapter_number'),
                // ✅ Lấy ID chapter mới nhất
                DB::raw('(
                SELECT chapters.id
                FROM chapters
                WHERE chapters.comic_id = comics.id
                AND chapters.status = 1
                AND chapters.chapter_number = (
                    SELECT MAX(chapter_number)
                    FROM chapters
                    WHERE comic_id = comics.id
                    AND status = 1
                )
                LIMIT 1
            ) as latest_chapter_id'),
                // ✅ Lấy slug chapter mới nhất
                DB::raw('(
                    SELECT chapters.slug
                    FROM chapters
                    WHERE chapters.comic_id = comics.id
                    AND chapters.status = 1
                    AND chapters.chapter_number = (
                        SELECT MAX(chapter_number)
                        FROM chapters
                        WHERE comic_id = comics.id
                        AND status = 1
                    )
                    LIMIT 1
                ) as latest_chapter_slug'),
                DB::raw('(
                    SELECT chapters.created_at
                    FROM chapters
                    WHERE chapters.comic_id = comics.id
                    AND chapters.status = 1
                    AND chapters.chapter_number = (
                        SELECT MAX(chapter_number)
                        FROM chapters
                        WHERE comic_id = comics.id
                        AND status = 1
                    )
                    LIMIT 1
                ) as latest_chapter_created_at')
            )
            ->leftJoin('chapters', 'comics.id', '=', 'chapters.comic_id')
            ->whereNotNull('chapters.created_at')
            ->where('chapters.status', 1)
            ->where('chapters.created_at', '>=', Carbon::now()->subWeek())
            ->groupBy('comics.id', 'comics.title', 'comics.cover_image', 'comics.views', 'comics.slug')
            ->orderBy('comics.views', 'desc');

        $comics = $query->take($limit)->get();

        // ✅ Làm tròn & format created_at
        $comics->transform(function ($comic) {
            if ($comic->latest_chapter_number !== null) {
                $comic->latest_chapter_number =
                    fmod($comic->latest_chapter_number, 1) === 0.0
                    ? intval($comic->latest_chapter_number)
                    : round($comic->latest_chapter_number, 1);
            }
            if ($comic->latest_chapter_created_at) {
                $comic->latest_chapter_created_at = Carbon::parse($comic->latest_chapter_created_at)->diffForHumans();
            }
            return $comic;
        });

        $response = [
            'status' => true,
            'message' => "Tải $limit truyện nổi bật thành công",
            'comics' => $comics->toArray(),
            'pagination' => null
        ];


        Cache::put($cacheKey, $response, 600);

        return response()->json($response);
    }

    // 🟢 Top lượt xem
    public function TopViews(Request $request)
    {
        $limit = $request->input('limit', 10);
        $page = $request->input('page', 1);
        $cacheKey = "topviews:limit={$limit}:page={$page}";

        if (Cache::has($cacheKey)) {
            return response()->json(Cache::get($cacheKey));
        }

        $query = Comics::where('comics.status', 1)
            ->select(
                'comics.id',
                'comics.title',
                'comics.cover_image',
                'comics.views',
                'comics.slug',
                'chapters.chapter_number as latest_chapter_number',
                'chapters.created_at as latest_chapter_created_at'
            )
            ->leftJoin('chapters', function ($join) {
                $join->on('comics.id', '=', 'chapters.comic_id')
                    ->where('chapters.status', 1)
                    ->whereIn('chapters.chapter_number', function ($query) {
                        $query->select(DB::raw('MAX(chapter_number)'))
                            ->from('chapters')
                            ->where('status', 1)
                            ->whereColumn('comic_id', 'comics.id')
                            ->groupBy('comic_id');
                    });
            })
            ->orderBy('comics.views', 'desc');

        try {
            $comics = $query->paginate($limit, ['*'], 'page', $page);

            // ✅ Làm tròn & format ngày
            $comics->getCollection()->transform(function ($comic) {
                if ($comic->latest_chapter_number !== null) {
                    $comic->latest_chapter_number =
                        fmod($comic->latest_chapter_number, 1) === 0.0
                        ? intval($comic->latest_chapter_number)
                        : round($comic->latest_chapter_number, 1);
                }
                if ($comic->latest_chapter_created_at) {
                    $comic->latest_chapter_created_at = Carbon::parse($comic->latest_chapter_created_at)->diffForHumans();
                }
                return $comic;
            });

            $response = [
                'status' => true,
                'message' => 'Tải dữ liệu thành công',
                'comics' => $comics->items(),
                'pagination' => [
                    'current_page' => $comics->currentPage(),
                    'last_page' => $comics->lastPage(),
                    'per_page' => $comics->perPage(),
                    'total' => $comics->total(),
                ]
            ];

            Cache::put($cacheKey, $response, 600);

            return response()->json($response);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi lấy dữ liệu: ' . $e->getMessage(),
                'comics' => [],
                'pagination' => null,
            ], 500);
        }
    }

    // 🟢 Tìm kiếm truyện
    public function search(Request $request)
    {
        $keyword = $request->input('keyword', '');

        $query = Comics::where('comics.status', 1)
            ->select(
                'comics.id',
                'comics.title',
                'comics.cover_image',
                'comics.views',
                'comics.slug',
                DB::raw('MAX(CASE WHEN chapters.status = 1 THEN chapters.chapter_number END) as latest_chapter_number'),
                DB::raw('(
                    SELECT chapters.created_at
                    FROM chapters
                    WHERE chapters.comic_id = comics.id
                    AND chapters.status = 1
                    AND chapters.chapter_number = (
                        SELECT MAX(chapter_number)
                        FROM chapters
                        WHERE comic_id = comics.id
                        AND status = 1
                    )
                    LIMIT 1
                ) as latest_chapter_created_at')
            )
            ->leftJoin('chapters', 'comics.id', '=', 'chapters.comic_id')
            ->groupBy('comics.id', 'comics.title', 'comics.cover_image', 'comics.views', 'comics.slug');

        if (!empty($keyword)) {
            $query->where('comics.title', 'like', "%{$keyword}%");
        }

        try {
            $comics = $query->get();

            $comics->transform(function ($comic) {
                if ($comic->latest_chapter_number !== null) {
                    $comic->latest_chapter_number =
                        fmod($comic->latest_chapter_number, 1) === 0.0
                        ? intval($comic->latest_chapter_number)
                        : round($comic->latest_chapter_number, 1);
                }
                if ($comic->latest_chapter_created_at) {
                    $comic->latest_chapter_created_at = Carbon::parse($comic->latest_chapter_created_at)->diffForHumans();
                }
                return $comic;
            });

            return response()->json([
                'status' => true,
                'message' => empty($keyword) ? 'Tải tất cả truyện thành công' : "Tìm thấy truyện với từ khóa '$keyword'",
                'comics' => $comics,
                'pagination' => null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi tìm kiếm truyện: ' . $e->getMessage(),
                'comics' => [],
                'pagination' => null,
            ], 500);
        }
    }

    // 🟢 Danh sách thể loại
    public function listgenres(Request $request)
    {
        $limit = $request->input('limit');
        $cacheKey = "genres:list:limit={$limit}";

        if (Cache::has($cacheKey)) {
            return response()->json(Cache::get($cacheKey));
        }

        $query = Genres::where('status', 1)
            ->orderBy('name', 'asc')
            ->select('id', 'name', 'slug', 'description');

        $genres = $limit ? $query->take($limit)->get() : $query->get();

        $response = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
            'genres' => $genres,
        ];

        Cache::put($cacheKey, $response, 1800);

        return response()->json($response);
    }

    // 🟢 Danh sách thể loại ở footer
    public function listGenresFooter(Request $request)
    {
        try {
            $limit = (int) $request->input('limit', 5);
            $cacheKey = "genres:footer:limit={$limit}";

            if (Cache::has($cacheKey)) {
                return response()->json(Cache::get($cacheKey));
            }

            $genres = ComicGenre::select(
                'genres.id',
                'genres.name',
                'genres.slug',
                DB::raw('COUNT(comic_genre.comic_id) as comic_count')
            )
                ->join('genres', 'comic_genre.genre_id', '=', 'genres.id')
                ->join('comics', 'comic_genre.comic_id', '=', 'comics.id')
                ->where('genres.status', 1)
                ->where('comics.status', 1)
                ->groupBy('genres.id', 'genres.name', 'genres.slug')
                ->orderByDesc('comic_count')
                ->limit($limit)
                ->get();

            $response = [
                'status' => true,
                'message' => 'Lấy danh sách thể loại footer thành công',
                'genres' => $genres
            ];

            Cache::put($cacheKey, $response, 1800);

            return response()->json($response);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi lấy danh sách thể loại: ' . $e->getMessage(),
            ], 500);
        }
    }
}
