<?php

namespace App\Http\Controllers\frontend;

use App\Http\Controllers\Controller;
use App\Models\TeamJoin;
use App\Models\Teams;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
    use Illuminate\Support\Facades\Storage;

class SearchController extends Controller
{
    public function filterComics(Request $request)
    {
        $genreIds = $request->input('genre_id'); // mảng hoặc chuỗi id thể loại
        $teamId = $request->input('team_id');   // id nhóm dịch
        $comicStatus = $request->input('comic_status'); // ongoing | completed | hiatus
        $sortBy = $request->input('sort_by', 'comic_created'); // mặc định sắp theo comic_created
        $limit = $request->input('limit', 10);
        $keyword = trim($request->input('keyword', '')); // 🔍 từ khóa tìm kiếm (tên truyện)

        $allowedSorts = [
            'comic_created' => 'comics.created_at',
            'chapter_created' => 'chapters.created_at',
            'views' => 'comics.views',
        ];
        $params = [
            'genres' => $request->input('genre_id', ''),
            'team' => $request->input('team_id', ''),
            'status' => $request->input('comic_status', ''),
            'sort' => $request->input('sort_by', 'comic_created'),
            'page' => $request->input('page', 1),
            'limit' => $request->input('limit', 10),
            'keyword' => trim($request->input('keyword', ''))
        ];

        $cacheKey = 'filter:' . http_build_query($params);

        if (Cache::has($cacheKey)) {
            return response()->json(Cache::get($cacheKey));
        }

        $sortColumn = $allowedSorts[$sortBy] ?? 'comics.created_at';

        $query = DB::table('comics')
            ->leftJoin('comic_genre', 'comic_genre.comic_id', '=', 'comics.id')
            ->leftJoin('chapters', function ($join) {
                $join->on('chapters.comic_id', '=', 'comics.id')
                    ->where('chapters.status', 1);
            })
            ->where('comics.status', 1)
            ->select(
                'comics.id',
                'comics.title',
                'comics.cover_image',
                'comics.views',
                'comics.slug',
                'comics.team_id',
                'comics.comic_status',
                'comics.created_at as comic_created_at',
                DB::raw('MAX(chapters.created_at) as last_chapter_created_at'),
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
            ->groupBy(
                'comics.id',
                'comics.title',
                'comics.cover_image',
                'comics.views',
                'comics.slug',
                'comics.team_id',
                'comics.comic_status',
                'comics.created_at'
            );

        // ✅ Lọc theo thể loại (truyện phải có đủ tất cả thể loại)
        if (!empty($genreIds)) {
            $genreIds = is_array($genreIds) ? $genreIds : explode(',', $genreIds);
            $query->whereIn('comics.id', function ($sub) use ($genreIds) {
                $sub->select('comic_id')
                    ->from('comic_genre')
                    ->whereIn('genre_id', $genreIds)
                    ->groupBy('comic_id')
                    ->havingRaw('COUNT(DISTINCT genre_id) = ' . count($genreIds));
            });
        }

        // ✅ Lọc theo nhóm dịch
        if (!empty($teamId)) {
            $query->where('comics.team_id', $teamId);
        }

        // ✅ Lọc theo trạng thái truyện
        if (!empty($comicStatus)) {
            $query->where('comics.comic_status', $comicStatus);
        }

        // ✅ 🔍 Tìm kiếm theo tên truyện
        if (!empty($keyword)) {
            $query->where('comics.title', 'like', '%' . $keyword . '%');
        }

        // ✅ Sắp xếp
        if ($sortColumn === 'chapters.created_at') {
            $query->orderByDesc(DB::raw('MAX(chapters.created_at)'));
        } else {
            $query->orderByDesc($sortColumn);
        }

        // ✅ Phân trang
        $comics = $query->paginate($limit);

        // ✅ Gắn 3 chương mới nhất
        $comics->getCollection()->transform(function ($comic) {
            $chapters = DB::table('chapters')
                ->where('comic_id', $comic->id)
                ->where('status', 1)
                ->orderByDesc('chapter_number')
                ->limit(3)
                ->get(['id', 'slug', 'chapter_number', 'created_at'])
                ->map(function ($chapter) {
                    $chapter->chapter_number =
                        fmod($chapter->chapter_number, 1) === 0.0
                        ? intval($chapter->chapter_number)
                        : round($chapter->chapter_number, 1);

                    $chapter->created_at = \Carbon\Carbon::parse($chapter->created_at)->diffForHumans();
                    return $chapter;
                });

            $comic->chapters = $chapters;
            return $comic;
        });

        $data = [
            'status' => true,
            'message' => 'Lọc truyện thành công!',
            'comics' => $comics->items(),
            'pagination' => [
                'current_page' => $comics->currentPage(),
                'last_page' => $comics->lastPage(),
                'per_page' => $comics->perPage(),
                'total' => $comics->total(),
            ],
        ];

        Cache::put($cacheKey, $data, now()->addSeconds(180));

        return response()->json($data);
    }

    public function listTeams(Request $request)
    {
        $cacheKey = 'teams:list';

        if (Cache::has($cacheKey)) {
            return response()->json(Cache::get($cacheKey));
        }
        try {
            $teams = Teams::with(['leader:id,name,image_url'])
                ->select('id', 'name', 'slug', 'description', 'logo', 'status', 'leader_id')
                ->where('status', 1)
                ->orderByDesc('created_at')
                ->get();

            $data = [
                'status' => true,
                'message' => 'Tải danh sách nhóm dịch thành công',
                'teams' => $teams
            ];

            Cache::put($cacheKey, $data, now()->addMinutes(60));
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi tải danh sách nhóm dịch: ' . $e->getMessage(),
            ], 500);
        }
    }
    public function listTeamById($id)
    {
        $cacheKey = 'teams:detail:' . $id;

        if (Cache::has($cacheKey)) {
            return response()->json(Cache::get($cacheKey));
        }
        try {
            $team = Teams::with([
                'leader:id,name,image_url',
                'members.user:id,name,image_url'
            ])
                ->select('id', 'name', 'slug', 'description', 'logo', 'status', 'leader_id')
                ->where('id', $id)
                ->where('status', 1)
                ->first();

            if (!$team) {
                return response()->json([
                    'status' => false,
                    'message' => 'Không tìm thấy nhóm dịch!',
                ], 404);
            }

            $data = [
                'status' => true,
                'message' => 'Tải thông tin nhóm dịch thành công',
                'team' => $team,
            ];

            Cache::put($cacheKey, $data, now()->addMinutes(10));
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi tải dữ liệu nhóm dịch: ' . $e->getMessage(),
            ], 500);
        }
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'team_id' => 'required|exists:teams,id',
            'requested_role' => 'required|in:translator,proofreader,cleaner',
            'message' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'teamjoin' => null
            ], 422);
        }

        try {
            $userId = Auth::id();

            // 🔹 Kiểm tra đã gửi yêu cầu chưa
            $existing = TeamJoin::where('team_id', $request->team_id)
                ->where('user_id', $userId)
                ->whereIn('status', [0, 2]) // 0: pending, 2: rejected — tránh spam
                ->first();

            if ($existing) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bạn đã gửi yêu cầu vào nhóm này rồi, vui lòng chờ duyệt',
                    'teamjoin' => $existing
                ], 409);
            }

            // 🔹 Tạo mới yêu cầu
            $teamJoin = new TeamJoin();
            $teamJoin->team_id = $request->team_id;
            $teamJoin->user_id = $userId;
            $teamJoin->requested_role = $request->requested_role;
            $teamJoin->message = $request->message;
            $teamJoin->status = 2; // 2 = "chờ duyệt"
            $teamJoin->created_by = $userId;
            $teamJoin->created_at = now();

            if ($teamJoin->save()) {
                return response()->json([
                    'status' => true,
                    'message' => 'Gửi yêu cầu tham gia nhóm thành công',
                    'teamjoin' => $teamJoin->load(['team', 'user'])
                ], 201);
            }

            return response()->json([
                'status' => false,
                'message' => 'Không thể gửi yêu cầu',
                'teamjoin' => null
            ], 500);
        } catch (\Exception $e) {
            Log::error('Lỗi khi gửi yêu cầu vào nhóm: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage(),
                'teamjoin' => null
            ], 500);
        }
    }




    public function requestTeamCreation(Request $request)
    {
        $request->validate([
            'team_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'reason' => 'required|string|max:500',
            'logo' => 'nullable|image|max:2048',
        ]);

        try {
            $user = $request->user();
            $adminEmails = explode(',', env('ADMIN_EMAIL', 'admin@example.com'));

            // ✅ Lưu file vào storage/app/public/team_logos
            $logoPath = null;
            if ($request->hasFile('logo')) {
                $logoPath = $request->file('logo')->store('team_logos', 'public');
            }

            // ✅ Gửi email và nhúng ảnh inline (nếu có)
            Mail::send('emails.team_request', [
                'user' => $user,
                'teamName' => $request->team_name,
                'description' => $request->description,
                'reason' => $request->reason,
                'logoPath' => $logoPath,
            ], function ($message) use ($adminEmails, $logoPath) {
                $message->to($adminEmails)
                    ->subject('📢 Yêu cầu tạo nhóm dịch mới');

                // 💡 Nhúng logo vào email để dùng trong Blade
                if ($logoPath && Storage::disk('public')->exists($logoPath)) {
                    $message->embed(Storage::disk('public')->path($logoPath));
                }
            });

            return response()->json([
                'status' => true,
                'message' => 'Yêu cầu tạo nhóm dịch đã được gửi thành công!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Không thể gửi email. Lỗi: ' . $e->getMessage(),
            ], 500);
        }
    }
}
