<?php

namespace App\Http\Controllers\frontend;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class PageComicController extends Controller
{
    public function getPagesByChapter($chapter_id, $comic_slug)
    {
        $cacheKey = "chapter_pages:{$chapter_id}";

        if (Cache::has($cacheKey)) {
            return response()->json(Cache::get($cacheKey));
        }

        try {
            $chapter = DB::table('chapters')
                ->where('id', $chapter_id)
                ->where('status', 1)
                ->first();

            if (!$chapter) {
                return response()->json([
                    'status' => false,
                    'message' => "Không tìm thấy chương ID: $chapter_id",
                    'pages' => [],
                    'chapters' => [],
                ], 404);
            }

            // 🔹 Lấy thông tin truyện
            $comic = DB::table('comics')
                ->where('id', $chapter->comic_id)
                ->where('slug', $comic_slug)
                ->where('status', 1)
                ->first();

            if (!$comic) {
                return response()->json([
                    'status' => false,
                    'message' => "Không tìm thấy truyện với slug: $comic_slug",
                    'pages' => [],
                    'chapters' => [],
                ], 404);
            }

            // 🔹 Lấy danh sách trang
            $pages = DB::table('pages')
                ->where('chapter_id', $chapter_id)
                ->where('status', 1)
                ->orderBy('page_number')
                ->get(['id', 'chapter_id', 'page_number', 'image_url']);

            // 🔹 Lấy danh sách chương
            $chapters = DB::table('chapters')
                ->where('comic_id', $chapter->comic_id)
                ->where('status', 1)
                ->orderBy('chapter_number', 'desc')
                ->get(['id', 'chapter_number', 'slug']);

            // ✅ Làm tròn số chương: 14.0 -> 14 | 14.5 -> 14.5
            $chapters = $chapters->map(function ($ch) {
                $num = floatval($ch->chapter_number);
                // Nếu là số nguyên (vd: 14.0) thì hiển thị 14
                // Nếu có phần thập phân khác 0 thì giữ nguyên (vd: 14.5)
                $ch->chapter_number = fmod($num, 1) == 0 ? intval($num) : $num;
                return $ch;
            });
            $data = [
                'status' => true,
                'message' => 'Lấy danh sách trang và chương thành công',
                'comic' => [
                    'id' => $comic->id,
                    'title' => $comic->title,
                    'slug' => $comic->slug,
                    'cover_image' => $comic->cover_image,
                ],
                'pages' => $pages,
                'chapters' => $chapters,
                'current_chapter_id' => $chapter_id,
            ];

            Cache::put($cacheKey, $data, now()->addMinutes(10));

            return response()->json($data);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi lấy dữ liệu: ' . $e->getMessage(),
                'pages' => [],
                'chapters' => [],
            ], 500);
        }
    }
    // 🔹 1. Gửi báo lỗi truyện (contacts)
    public function reportComicError(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|max:255',
            'phone'   => 'nullable|string|max:20',
            'title'   => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            DB::table('contacts')->insert([
                'name'       => $request->name,
                'email'      => $request->email,
                'phone'      => $request->phone ?? '',
                'title'      => $request->title,
                'content'    => $request->content,
                'user_id'    => Auth::id(),
                'status'     => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Báo lỗi truyện thành công! Cảm ơn bạn đã gửi phản hồi.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi gửi báo lỗi: ' . $e->getMessage(),
            ], 500);
        }
    }

    // 🔹 2. Lấy toàn bộ comment của truyện theo thời gian 
    public function getComicComments(Request $request, $comic_id)
    {
        $limit = $request->input('limit', 10);
        $page = $request->input('page', 1);

        $cacheKey = "comic_comments:{$comic_id}:p={$page}:l={$limit}";
        if (Cache::has($cacheKey)) {
            return response()->json(Cache::get($cacheKey));
        }

        // Lấy tất cả comment nhưng sẽ phân trang phần ROOT
        $allComments = DB::table('comments')
            ->leftJoin('users', 'comments.user_id', '=', 'users.id')
            ->where('comic_id', $comic_id)
            ->orderBy('comments.created_at', 'asc')
            ->select(
                'comments.*',
                'users.name as user_name',
                'users.image_url as user_avatar'
            )
            ->get();

        // Hàm đệ quy lấy replies theo cha
        $buildReplies = function ($parentId) use ($allComments, &$buildReplies) {
            return $allComments
                ->where('parent_id', $parentId)
                ->map(function ($comment) use ($buildReplies) {
                    $comment->replies = $buildReplies($comment->id);
                    return $comment;
                })
                ->values();
        };

        // Lọc comment gốc
        $root = $allComments->whereNull('parent_id')
            ->sortByDesc('created_at')
            ->values();

        // ✅ Phân trang chỉ root
        $total = $root->count();
        $pagedRoot = $root
            ->slice(($page - 1) * $limit, $limit)
            ->map(function ($comment) use ($buildReplies) {
                $comment->replies = $buildReplies($comment->id);
                return $comment;
            })
            ->values();

        $data = [
            'status' => true,
            'comments' => $pagedRoot,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'last_page' => ceil($total / $limit)
            ]
        ];

        Cache::put($cacheKey, $data, 30);
        return response()->json($data);
    }

    // 🔹 3. Lấy comment của 1 chương cụ thể (bao gồm cả comment con)
    public function getChapterComments(Request $request, $chapter_id)
    {
        $limit = $request->input('limit', 10);
        $page = $request->input('page', 1);

        $cacheKey = "chapter_comments:{$chapter_id}:p={$page}:l={$limit}";
        if (Cache::has($cacheKey)) {
            return response()->json(Cache::get($cacheKey));
        }

        try {
            // Lấy tất cả comment chương + thông tin user
            $allComments = DB::table('comments')
                ->leftJoin('users', 'comments.user_id', '=', 'users.id')
                ->where('comments.chapter_id', $chapter_id)
                ->orderBy('comments.created_at', 'asc')
                ->select(
                    'comments.*',
                    'users.name as user_name',
                    'users.image_url as user_avatar'
                )
                ->get();

            // Hàm đệ quy xây replies
            $buildReplies = function ($parentId) use ($allComments, &$buildReplies) {
                return $allComments
                    ->where('parent_id', $parentId)
                    ->map(function ($comment) use ($buildReplies) {
                        $comment->replies = $buildReplies($comment->id);
                        return $comment;
                    })
                    ->values();
            };

            // Lọc comment gốc
            $root = $allComments
                ->whereNull('parent_id')
                ->sortByDesc('created_at')
                ->values();

            // ✅ Phân trang chỉ root
            $total = $root->count();
            $pagedRoot = $root
                ->slice(($page - 1) * $limit, $limit)
                ->map(function ($comment) use ($buildReplies) {
                    $comment->replies = $buildReplies($comment->id);
                    return $comment;
                })
                ->values();

            $data = [
                'status' => true,
                'comments' => $pagedRoot,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total' => $total,
                    'last_page' => ceil($total / $limit)
                ]
            ];

            Cache::put($cacheKey, $data, 30);

            return response()->json($data);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi lấy bình luận chương: ' . $e->getMessage(),
            ], 500);
        }
    }


    public function postComment(Request $request)
    {
        try {
            $user = Auth::user();

            $validated = $request->validate([
                'comic_id'   => 'required|integer|exists:comics,id',
                'chapter_id' => 'nullable|integer|exists:chapters,id',
                'parent_id'  => 'nullable|integer|exists:comments,id',
                'content'    => 'required|string|max:2000',
            ]);

            $commentId = DB::table('comments')->insertGetId([
                'comic_id'   => $validated['comic_id'],
                'chapter_id' => $validated['chapter_id'] ?? null,
                'user_id'    => $user->id,
                'parent_id'  => $validated['parent_id'] ?? null,
                'content'    => $validated['content'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $newComment = DB::table('comments')->leftJoin('users', 'comments.user_id', '=', 'users.id')
                ->select(
                    'comments.*',
                    'users.name as user_name',
                    'users.image_url as user_avatar'
                )
                ->where('comments.id', $commentId)->first();

            return response()->json([
                'status' => true,
                'message' => 'Gửi bình luận thành công!',
                'comment' => $newComment,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi gửi bình luận: ' . $e->getMessage(),
            ], 500);
        }
    }
    public function deleteComment($comment_id)
    {
        try {
            $user = Auth::user();

            $comment = DB::table('comments')->where('id', $comment_id)->first();

            if (!$comment) {
                return response()->json(['status' => false, 'message' => 'Bình luận không tồn tại!'], 404);
            }

            if ($comment->user_id !== $user->id) {
                return response()->json(['status' => false, 'message' => 'Bạn không có quyền xóa bình luận này!'], 403);
            }

            // Xóa comment và tất cả reply con
            DB::table('comments')->where('parent_id', $comment_id)->delete();
            DB::table('comments')->where('id', $comment_id)->delete();

            return response()->json([
                'status' => true,
                'message' => 'Đã xóa bình luận thành công!',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi xóa bình luận: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function replyComment(Request $request, $parent_id)
    {
        try {
            $user = Auth::user();

            $parent = DB::table('comments')->where('id', $parent_id)->first();
            if (!$parent) {
                return response()->json(['status' => false, 'message' => 'Bình luận gốc không tồn tại!'], 404);
            }

            $validated = $request->validate([
                'content' => 'required|string|max:2000',
            ]);

            $replyId = DB::table('comments')->insertGetId([
                'comic_id'   => $parent->comic_id,
                'chapter_id' => $parent->chapter_id,
                'user_id'    => $user->id,
                'parent_id'  => $parent_id,
                'content'    => $validated['content'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $newReply = DB::table('comments')->leftJoin('users', 'comments.user_id', '=', 'users.id')
                ->select(
                    'comments.*',
                    'users.name as user_name',
                    'users.image_url as user_avatar'
                )->where('comments.id', $replyId)->first();

            return response()->json([
                'status' => true,
                'message' => 'Đã trả lời bình luận!',
                'reply' => $newReply,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi trả lời bình luận: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function increaseChapterView(Request $request)
    {
        try {
            $chapterId = $request->chapter_id;

            if (!$chapterId) {
                return response()->json([
                    'status' => false,
                    'message' => 'Thiếu chapter_id!'
                ], 400);
            }

            // Lấy comic_id từ chapter
            $chapter = DB::table('chapters')->select('comic_id')->where('id', $chapterId)->first();

            if (!$chapter) {
                return response()->json([
                    'status' => false,
                    'message' => 'Không tìm thấy chapter!'
                ], 404);
            }

            $comicId = $chapter->comic_id;

            // dispatch(new UpdateViewCountJob($chapterId, $chapter->comic_id));

            // Transaction cho an toàn dữ liệu
            DB::transaction(function () use ($chapterId, $comicId) {
                DB::table('chapters')
                    ->where('id', $chapterId)
                    ->increment('view_count', 1);

                DB::table('comics')
                    ->where('id', $comicId)
                    ->increment('views', 1);
            });

            return response()->json([
                'status' => true,
                'message' => 'Tăng view thành công!'
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ], 500);
        }
    }
}
