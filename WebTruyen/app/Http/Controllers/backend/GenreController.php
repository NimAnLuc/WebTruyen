<?php

namespace App\Http\Controllers\backend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Genres;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class GenreController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->input('limit'); // Lấy limit, không set giá trị mặc định
        $query = Genres::where('status', '!=', 0)
            ->orderBy('created_at', 'DESC')
            ->select('id', 'name', 'slug', 'description', 'status');

        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
        ];

        if ($limit) {
            // Có limit, thực hiện phân trang
            $genres = $query->paginate($limit);
            $result['genres'] = $genres->items();
            $result['pagination'] = [
                'current_page' => $genres->currentPage(),
                'last_page' => $genres->lastPage(),
                'per_page' => $genres->perPage(),
                'total' => $genres->total(),
            ];
        } else {
            // Không có limit, lấy toàn bộ dữ liệu
            $genres = $query->get();
            $result['genres'] = $genres;
            $result['pagination'] = null; // Không trả về pagination
        }

        return response()->json($result);
    }

    public function trash()
    {
        $genres = Genres::where('status', '=', 0)
            ->orderBy('created_at', 'DESC')
            ->select('id', 'name', 'slug', 'description', 'status')
            ->get();
        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
            'genres' => $genres
        ];
        return response()->json($result);
    }

    public function show($id)
    {
        $genre = Genres::find($id);
        if ($genre == null) {
            $result = [
                'status' => false,
                'message' => 'Không tìm thấy dữ liệu',
                'genres' => null
            ];
        } else {
            $result = [
                'status' => true,
                'message' => 'Tải dữ liệu thành công',
                'genres' => $genre
            ];
        }
        return response()->json($result);
    }

    public function store(Request $request)
    {
        // Ràng buộc trực tiếp
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:50',
            'description' => 'nullable|string',
            'status' => 'required|in:1,2,0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'genre' => null
            ]);
        }

        $genre = new Genres();
        $genre->name = $request->name;
        $genre->slug = Str::slug($request->name);
        $genre->description = $request->description;
        $genre->status = $request->status;
        $genre->created_by = Auth::id() ?: 1;
        $genre->created_at = now();

        if ($genre->save()) {
            $result = [
                'status' => true,
                'message' => 'Thêm thành công',
                'genre' => $genre
            ];
        } else {
            $result = [
                'status' => false,
                'message' => 'Không thể thêm',
                'genre' => null
            ];
        }

        return response()->json($result);
    }

    public function update(Request $request, $id)
    {
        $genre = Genres::find($id);
        if ($genre == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'genre' => null
            ]);
        }

        // Ràng buộc trực tiếp
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:50',
            'description' => 'nullable|string',
            'status' => 'required|in:1,2,0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'genre' => null
            ]);
        }

        $genre->name = $request->name;
        $genre->slug = Str::slug($request->name);
        $genre->description = $request->description;
        $genre->status = $request->status;
        $genre->updated_by = Auth::id() ?: 1;
        $genre->updated_at = now();

        if ($genre->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Cập nhật thành công',
                'genre' => $genre
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể cập nhật',
                'genre' => null
            ]);
        }
    }

    public function status($id)
    {
        $genre = Genres::find($id);
        if ($genre == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'genre' => null
            ]);
        }

        $genre->status = ($genre->status == 1) ? 2 : 1;
        $genre->updated_by = Auth::id() ?: 1;
        $genre->updated_at = now();

        if ($genre->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'genre' => $genre
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'genre' => null
            ]);
        }
    }

    public function delete($id)
    {
        $genre = Genres::find($id);
        if ($genre == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'genre' => null
            ]);
        }

        $genre->status = 0;
        $genre->updated_by = Auth::id() ?: 1;
        $genre->updated_at = now();

        if ($genre->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'genre' => $genre
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'genre' => null
            ]);
        }
    }

    public function restore($id)
    {
        $genre = Genres::find($id);
        if ($genre == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'genre' => null
            ]);
        }

        $genre->status = 2;
        $genre->updated_by = Auth::id() ?: 1;
        $genre->updated_at = now();

        if ($genre->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'genre' => $genre
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'genre' => null
            ]);
        }
    }

    public function destroy($id)
    {
        $genre = Genres::find($id);
        if ($genre == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'genre' => null
            ]);
        }

        if ($genre->delete()) {
            return response()->json([
                'status' => true,
                'message' => 'Xóa thành công',
                'genre' => $genre
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể xóa',
                'genre' => null
            ]);
        }
    }
}
