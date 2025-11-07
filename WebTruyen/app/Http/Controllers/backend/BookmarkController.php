<?php

namespace App\Http\Controllers\backend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Bookmarks;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class BookmarkController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->input('limit');
        $query = Bookmarks::where('status', '!=', 0)
            ->orderBy('created_at', 'DESC')
            ->select('id', 'user_id', 'comic_id', 'status')
            ->with(['user', 'comic']);

        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
        ];

        if ($limit) {
            // Có limit, thực hiện phân trang
            $bookmarks = $query->paginate($limit);
            $result['bookmarks'] = $bookmarks->items();
            $result['pagination'] = [
                'current_page' => $bookmarks->currentPage(),
                'last_page' => $bookmarks->lastPage(),
                'per_page' => $bookmarks->perPage(),
                'total' => $bookmarks->total(),
            ];
        } else {
            $bookmarks = $query->get();
            $result['bookmarks'] = $bookmarks;
            $result['pagination'] = null;
        }

        return response()->json($result);
    }

    public function trash()
    {
        $bookmarks = Bookmarks::where('status', '=', 0)
            ->orderBy('created_at', 'DESC')
            ->select('id', 'user_id', 'comic_id', 'status')
            ->with(['user', 'comic'])
            ->get();
        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
            'bookmarks' => $bookmarks
        ];
        return response()->json($result);
    }

    public function show($id)
    {
        $bookmark = Bookmarks::find($id);

        if ($bookmark == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy dữ liệu',
                'bookmarks' => null
            ]);
        }

        return response()->json([
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
            'bookmarks' => $bookmark->load(['user', 'comic'])
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'comic_id' => 'required|exists:comics,id',
            'status' => 'required|in:1,2,0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'bookmark' => null
            ]);
        }

        $existingBookmark = Bookmarks::where('user_id', $request->user_id)
            ->where('comic_id', $request->comic_id)
            ->first();
        if ($existingBookmark) {
            return response()->json([
                'status' => false,
                'message' => 'Bookmark đã tồn tại',
                'bookmark' => null
            ]);
        }

        $bookmark = new Bookmarks();
        $bookmark->user_id = $request->user_id;
        $bookmark->comic_id = $request->comic_id;
        $bookmark->status = $request->status;
        $bookmark->created_by = Auth::id() ?: 1;
        $bookmark->created_at = now();

        if ($bookmark->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thêm thành công',
                'bookmark' => $bookmark->load(['user', 'comic'])
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể thêm',
            'bookmark' => null
        ]);
    }

    public function update(Request $request, $id)
    {
        $bookmark = Bookmarks::find($id);

        if ($bookmark == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'bookmark' => null
            ]);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:1,2,0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'bookmark' => null
            ]);
        }

        $bookmark->status = $request->status;
        $bookmark->updated_by = Auth::id() ?: 1;
        $bookmark->updated_at = now();

        if ($bookmark->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Cập nhật thành công',
                'bookmark' => $bookmark->load(['user', 'comic'])
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể cập nhật',
            'bookmark' => null
        ]);
    }

    public function status($id)
    {
        $bookmark = Bookmarks::find($id);

        if ($bookmark == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'bookmark' => null
            ]);
        }

        $bookmark->status = ($bookmark->status == 1) ? 2 : 1;
        $bookmark->updated_by = Auth::id() ?: 1;
        $bookmark->updated_at = now();

        if ($bookmark->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'bookmark' => $bookmark->load(['user', 'comic'])
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể thay đổi',
            'bookmark' => null
        ]);
    }

    public function delete($id)
    {
        $bookmark = Bookmarks::find($id);

        if ($bookmark == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'bookmark' => null
            ]);
        }

        $bookmark->status = 0;
        $bookmark->updated_by = Auth::id() ?: 1;
        $bookmark->updated_at = now();

        if ($bookmark->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'bookmark' => $bookmark->load(['user', 'comic'])
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể thay đổi',
            'bookmark' => null
        ]);
    }

    public function restore($id)
    {
        $bookmark = Bookmarks::find($id);

        if ($bookmark == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'bookmark' => null
            ]);
        }

        $bookmark->status = 2;
        $bookmark->updated_by = Auth::id() ?: 1;
        $bookmark->updated_at = now();

        if ($bookmark->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'bookmark' => $bookmark->load(['user', 'comic'])
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể thay đổi',
            'bookmark' => null
        ]);
    }

    public function destroy($id)
    {
        $bookmark = Bookmarks::find($id);

        if ($bookmark == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'bookmark' => null
            ]);
        }

        if ($bookmark->delete()) {
            return response()->json([
                'status' => true,
                'message' => 'Xóa thành công',
                'bookmark' => $bookmark
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể xóa',
            'bookmark' => null
        ]);
    }
}
