<?php

namespace App\Http\Controllers\backend;

use App\Http\Controllers\Controller;
use App\Models\Comics;
use App\Models\Chapters;
use App\Models\User;
use App\Models\Genres;
use App\Models\Bookmarks;
use App\Models\ComicGenre;
use App\Models\Team;
use App\Models\Comments;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function index(Request $request)
    {
        try {
            // Khởi tạo biến cho thống kê
            $totalComics = 0;
            $totalChapters = 0;
            $totalUsers = 0;
            $totalGenres = 0;
            $totalViews = 0;
            $comicViews = [];
            $genreDistribution = [];
            $currentMonthBookmarks = 0;
            $topComics = [];
            $topTeams = [];
            $topComments = [];

            // Lấy thông tin người dùng hiện tại
            $user = Auth::user();

            // Tính toán phân bố thể loại (chỉ cho admin, top 5)
            if ($user && $user->role === 'admin') {
                $genreDistribution = ComicGenre::select('genres.id', 'genres.name', DB::raw('COUNT(comic_genre.comic_id) as comic_count'))
                    ->join('genres', 'comic_genre.genre_id', '=', 'genres.id')
                    ->join('comics', 'comic_genre.comic_id', '=', 'comics.id')
                    ->where('comics.status', '!=', 0)
                    ->where('genres.status', '!=', 0)
                    ->groupBy('genres.id', 'genres.name')
                    ->orderByDesc('comic_count')
                    ->limit(5)
                    ->get()
                    ->map(function ($genre) {
                        return [
                            'id' => $genre->id,
                            'name' => $genre->name,
                            'comic_count' => $genre->comic_count,
                        ];
                    })
                    ->toArray();
            }

            // Tính toán tổng số bookmark trong tháng hiện tại
            $bookmarkQuery = Bookmarks::where('status', 1)
                ->whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month);

            // Tính toán top 5 truyện có lượt bookmark cao nhất
            $topComicsQuery = Bookmarks::select('comics.id', 'comics.title', DB::raw('COUNT(bookmarks.id) as bookmark_count'))
                ->join('comics', 'bookmarks.comic_id', '=', 'comics.id')
                ->where('bookmarks.status', 1)
                ->where('comics.status', '!=', 0)
                ->groupBy('comics.id', 'comics.title')
                ->orderByDesc('bookmark_count')
                ->limit(5);

            // Tính toán top 5 nhóm đăng nhiều chapter nhất
            $topTeamsQuery = Chapters::select('teams.id', 'teams.name', DB::raw('COUNT(chapters.id) as chapter_count'))
                ->join('comics', 'chapters.comic_id', '=', 'comics.id')
                ->join('teams', 'comics.team_id', '=', 'teams.id')
                ->where('chapters.status', '!=', 0)
                ->where('comics.status', '!=', 0)
                ->where('teams.status', '!=', 0)
                ->groupBy('teams.id', 'teams.name')
                ->orderByDesc('chapter_count')
                ->limit(5);

            // Tính toán top 5 truyện có nhiều bình luận nhất
            $topCommentsQuery = Comments::select('comics.id', 'comics.title', DB::raw('COUNT(comments.id) as comment_count'))
                ->join('comics', 'comments.comic_id', '=', 'comics.id')
                ->where('comics.status', '!=', 0)
                ->whereNull('comments.parent_id')
                ->groupBy('comics.id', 'comics.title')
                ->orderByDesc('comment_count')
                ->limit(5);

            if ($user && $user->role === 'team' && $request->attributes->has('team_id')) {
                // Role 'team': Lọc dữ liệu theo team_id
                $teamId = $request->attributes->get('team_id');

                // Đếm truyện của team
                $totalComics = Comics::where('status', '!=', 0)
                    ->where('team_id', $teamId)
                    ->count();

                // Đếm chương của truyện thuộc team
                $totalChapters = Chapters::where('status', '!=', 0)
                    ->whereIn('comic_id', function ($query) use ($teamId) {
                        $query->select('id')
                            ->from('comics')
                            ->where('team_id', $teamId);
                    })
                    ->count();

                // Đếm người dùng trong team
                $totalUsers = User::where('status', 1)
                    ->whereIn('id', function ($query) use ($teamId) {
                        $query->select('user_id')
                            ->from('team_join')
                            ->where('team_id', $teamId);
                    })
                    ->count();

                // Tổng lượt xem truyện của team
                $totalViews = Comics::where('status', '!=', 0)
                    ->where('team_id', $teamId)
                    ->sum('views');

                // Top 5 truyện có lượt xem cao nhất của team
                $comicViews = Comics::where('status', '!=', 0)
                    ->where('team_id', $teamId)
                    ->select(
                        'id',
                        'title',
                        'views',
                        DB::raw('(SELECT COUNT(*) FROM chapters WHERE chapters.comic_id = comics.id AND chapters.status != 0) as chapters_count'),
                        DB::raw('(SELECT COUNT(*) FROM bookmarks WHERE bookmarks.comic_id = comics.id AND bookmarks.status = 1) as bookmark_count')
                    )
                    ->orderByDesc('views')
                    ->limit(5)
                    ->get()
                    ->map(function ($comic) {
                        return [
                            'id' => $comic->id,
                            'title' => $comic->title,
                            'views' => $comic->views,
                            'chapters_count' => $comic->chapters_count,
                            'bookmark_count' => $comic->bookmark_count,
                        ];
                    })
                    ->toArray();

                // Tổng số thể loại (không lọc theo team_id)
                $totalGenres = Genres::where('status', '!=', 0)->count();

                // Lọc bookmark tháng hiện tại theo team
                $bookmarkQuery->whereIn('comic_id', function ($subQuery) use ($teamId) {
                    $subQuery->select('id')
                        ->from('comics')
                        ->where('team_id', $teamId)
                        ->where('status', '!=', 0);
                });

                // Lọc top 5 truyện theo team
                $topComicsQuery->where('comics.team_id', $teamId);

                // Lọc top 5 truyện có nhiều bình luận nhất theo team
                $topCommentsQuery->where('comics.team_id', $teamId);
            } else {
                // Role 'admin' hoặc không có team_id: Lấy tất cả dữ liệu
                // Đếm tổng số truyện
                $totalComics = Comics::where('status', '!=', 0)->count();

                // Đếm tổng số chương
                $totalChapters = Chapters::where('status', '!=', 0)->count();

                // Đếm tổng số người dùng có role = 'user' và status = 1
                $totalUsers = User::where('role', 'user')->where('status', 1)->count();

                // Tổng lượt xem tất cả truyện
                $totalViews = Comics::where('status', '!=', 0)->sum('views');

                // Top 5 truyện có lượt xem cao nhất
                $comicViews = Comics::where('status', '!=', 0)
                    ->select(
                        'id',
                        'title',
                        'views',
                        DB::raw('(SELECT COUNT(*) FROM chapters WHERE chapters.comic_id = comics.id AND chapters.status != 0) as chapters_count'),
                        DB::raw('(SELECT COUNT(*) FROM bookmarks WHERE bookmarks.comic_id = comics.id AND bookmarks.status = 1) as bookmark_count')
                    )
                    ->orderByDesc('views')
                    ->limit(5)
                    ->get()
                    ->map(function ($comic) {
                        return [
                            'id' => $comic->id,
                            'title' => $comic->title,
                            'views' => $comic->views,
                            'chapters_count' => $comic->chapters_count,
                            'bookmark_count' => $comic->bookmark_count,
                        ];
                    })
                    ->toArray();

                // Đếm tổng số thể loại
                $totalGenres = Genres::where('status', '!=', 0)->count();
            }

            // Tính tổng số bookmark trong tháng hiện tại
            $currentMonthBookmarks = $bookmarkQuery->count();

            // Lấy top 5 truyện có lượt bookmark cao nhất
            $topComics = $topComicsQuery->get()
                ->map(function ($comic) {
                    return [
                        'id' => $comic->id,
                        'title' => $comic->title,
                        'bookmark_count' => $comic->bookmark_count,
                    ];
                })
                ->toArray();

            // Lấy top 5 nhóm đăng nhiều chapter nhất
            $topTeams = $topTeamsQuery->get()
                ->map(function ($team) {
                    return [
                        'id' => $team->id,
                        'name' => $team->name,
                        'chapter_count' => $team->chapter_count,
                    ];
                })
                ->toArray();

            // Lấy top 5 truyện có nhiều bình luận nhất
            $topComments = $topCommentsQuery->get()
                ->map(function ($comic) {
                    return [
                        'id' => $comic->id,
                        'title' => $comic->title,
                        'comment_count' => $comic->comment_count,
                    ];
                })
                ->toArray();

            // Chuẩn bị kết quả
            $result = [
                'status' => true,
                'message' => 'Tải thống kê thành công',
                'data' => [
                    'total_comics' => $totalComics,
                    'total_chapters' => $totalChapters,
                    'total_users' => $totalUsers,
                    'total_genres' => $totalGenres,
                    'total_views' => $totalViews,
                    'comic_views' => $comicViews,
                    'genre_distribution' => $genreDistribution,
                    'current_month_bookmarks' => $currentMonthBookmarks,
                    'top_comics' => $topComics,
                    'top_teams' => $topTeams,
                    'top_comments' => $topComments,
                ],
            ];

            return response()->json($result, 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi lấy thống kê: ' . $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }
}