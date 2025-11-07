<?php

namespace App\Http\Controllers\backend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Comments;
use App\Models\Chapters;
use App\Models\Comics;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class CommentController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->input('limit');
        $query = Comments::orderBy('comments.created_at', 'DESC')
            ->select(
                'comments.id',
                'comments.comic_id',
                'comments.chapter_id',
                'comments.user_id',
                'comments.parent_id',
                'users.name as user_name',
                'chapters.title as chapter_title',
                'comics.title as comic_title',
            )
            ->join('chapters', 'comments.chapter_id', '=', 'chapters.id')
            ->join('comics', 'chapters.comic_id', '=', 'comics.id')
            ->join('users', 'comments.user_id', '=', 'users.id');


        // Lọc theo comic_id hoặc chapter_id nếu có
        if ($request->has('comic_id')) {
            $query->where('comments.comic_id', $request->comic_id);
        }
        if ($request->has('chapter_id')) {
            $query->where('comments.chapter_id', $request->chapter_id);
        }

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
            $comments = $query->paginate($limit);
            $result['comments'] = $comments->items();
            $result['pagination'] = [
                'current_page' => $comments->currentPage(),
                'last_page' => $comments->lastPage(),
                'per_page' => $comments->perPage(),
                'total' => $comments->total(),
            ];
        } else {
            // Không có limit, lấy toàn bộ dữ liệu
            $comments = $query->get();
            $result['comments'] = $comments;
            $result['pagination'] = null; // Không trả về pagination
        }

        return response()->json($result);
    }
    public function show(Request $request, $id)
    {
        $query = Comments::where('comments.id', $id)
            ->join('chapters', 'comments.chapter_id', '=', 'chapters.id')
            ->join('comics', 'chapters.comic_id', '=', 'comics.id')
            ->join('users', 'comments.user_id', '=', 'users.id')
            ->leftJoin('teams', 'comics.team_id', '=', 'teams.id')
            ->select(
                'comments.*',
                'comics.title as comic_title',
                'chapters.title as chapter_title',
                'comics.team_id',
                'teams.name as team_name',
                'users.name as user_name',
            );

        // Lọc theo team_id cho người dùng team
        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $comment = $query->first();

        if ($comment == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy dữ liệu hoặc bạn không có quyền truy cập',
                'comments' => null
            ]);
        }


        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
            'comments' =>  $comment,
        ];

        return response()->json($result);
    }
    public function update(Request $request, $id)
    {
        // Kiểm tra quyền truy cập với join
        $query = Comments::where('comments.id', $id)
            ->join('chapters', 'comments.chapter_id', '=', 'chapters.id')
            ->join('comics', 'chapters.comic_id', '=', 'comics.id');

        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $commentCheck = $query->first();
        if ($commentCheck == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập',
                'comment' => null
            ]);
        }

        // Lấy bản ghi thực tế từ model Comments để cập nhật
        $comment = Comments::find($id);
        if ($comment == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'comment' => null
            ]);
        }

        $validator = Validator::make($request->all(), [
            'content' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'comment' => null
            ]);
        }

        $comment->parent_id = $request->parent_id ?? $comment->parent_id;
        $comment->content = $request->content;
        $comment->updated_at = now();

        if ($comment->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Cập nhật thành công',
                'comment' => $comment,
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể cập nhật',
            'comment' => null
        ]);
    }

    public function delete(Request $request, $id)
    {
        // Kiểm tra quyền truy cập với join
        $query = Comments::where('comments.id', $id)
            ->join('chapters', 'comments.chapter_id', '=', 'chapters.id')
            ->join('comics', 'chapters.comic_id', '=', 'comics.id');

        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $commentCheck = $query->first();
        if ($commentCheck == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập',
                'comment' => null
            ]);
        }

        // Lấy bản ghi thực tế từ model Comments để xóa
        $comment = Comments::find($id);
        if ($comment == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'comment' => null
            ]);
        }

        if ($comment->delete()) {
            return response()->json([
                'status' => true,
                'message' => 'Xóa thành công',
                'comment' => $comment
            ]);
        }


        return response()->json([
            'status' => false,
            'message' => 'Không thể xóa',
            'comment' => null
        ]);
    }
}
