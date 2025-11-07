<?php

namespace App\Http\Controllers\backend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chapters;
use App\Models\Comics;
use App\Models\TeamMembers;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ChapterController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->input('limit'); // Lấy limit, không set giá trị mặc định
        $query = Chapters::where('chapters.status', '!=', 0)
            ->orderBy('chapters.created_at', 'DESC')
            ->select('chapters.id', 'chapters.comic_id', 'chapters.chapter_number', 'chapters.title', 'chapters.status', 'comics.title as comic_title')
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
            $chapters = $query->paginate($limit);
            $result['chapters'] = $chapters->items();
            $result['pagination'] = [
                'current_page' => $chapters->currentPage(),
                'last_page' => $chapters->lastPage(),
                'per_page' => $chapters->perPage(),
                'total' => $chapters->total(),
            ];
        } else {
            // Không có limit, lấy toàn bộ dữ liệu
            $chapters = $query->get();
            $result['chapters'] = $chapters;
            $result['pagination'] = null; // Không trả về pagination
        }

        return response()->json($result);
    }

    public function trash(Request $request)
    {
        $query = Chapters::where('chapters.status', '=', 0)
            ->orderBy('chapters.created_at', 'DESC')
            ->select('chapters.id', 'chapters.comic_id', 'chapters.chapter_number', 'chapters.title', 'comics.title as comic_title', 'chapters.status')
            ->join('comics', 'chapters.comic_id', '=', 'comics.id');
        // Lọc theo team_id cho người dùng team
        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $chapters = $query->get();
        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
            'chapters' => $chapters
        ];
        return response()->json($result);
    }
    public function show(Request $request, $id)
    {
        $query = Chapters::where('chapters.id', $id)
            ->join('comics', 'chapters.comic_id', '=', 'comics.id')
            ->leftJoin('teams', 'comics.team_id', '=', 'teams.id')
            ->leftJoin('users as creator', 'chapters.created_by', '=', 'creator.id')
            ->leftJoin('users as updater', 'chapters.updated_by', '=', 'updater.id')
            ->select(
                'chapters.*',
                'comics.title as comic_title',
                'comics.team_id',
                'teams.name as team_name',
                'creator.name as creator_name',
                'updater.name as updater_name'
            );

        // Lọc theo team_id cho người dùng team
        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $chapter = $query->first();

        if ($chapter == null) {
            $result = [
                'status' => false,
                'message' => 'Không tìm thấy dữ liệu hoặc bạn không có quyền truy cập',
                'chapters' => null
            ];
        } else {

            $result = [
                'status' => true,
                'message' => 'Tải dữ liệu thành công',
                'chapters' => $chapter
            ];
        }

        return response()->json($result);
    }

    public function store(Request $request)
    {
        // Ràng buộc trực tiếp
        $validator = Validator::make($request->all(), [
            'comic_id' => 'required|exists:comics,id',
            'chapter_number' => 'required|numeric|min:0',
            'title' => 'nullable|string|max:255',
            'status' => 'required|in:1,2,0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'chapter' => null
            ]);
        }
        // Kiểm tra team_id của comic
        $comic = Comics::find($request->comic_id);
        if (!$comic || ($request->attributes->has('team_id') && $comic->team_id != $request->attributes->get('team_id'))) {
            return response()->json([
                'status' => false,
                'message' => 'Không có quyền thêm chapter cho comic này',
                'chapter' => null
            ]);
        }


        // Kiểm tra xem chapter_number đã tồn tại cho comic_id
        $existingChapter = Chapters::where('comic_id', $request->comic_id)
            ->where('chapter_number', $request->chapter_number)
            ->first();
        if ($existingChapter) {
            return response()->json([
                'status' => false,
                'message' => 'Số chương đã tồn tại cho truyện này',
                'chapter' => null
            ]);
        }

        $chapter = new Chapters();
        $chapter->comic_id = $request->comic_id;
        $chapter->chapter_number = $request->chapter_number;
        $chapter->title = $request->title;
        $chapter->slug = Str::slug($request->title ?: 'chapter-' . $request->chapter_number);
        $chapter->view_count = 0;
        $chapter->status = $request->status;
        $chapter->created_by = Auth::id() ?: 1;
        $chapter->created_at = now();
        $comic->updated_at = now();

        if ($chapter->save()) {
            $comic->save();
            $result = [
                'status' => true,
                'message' => 'Thêm thành công',
                'chapter' => $chapter->load('comic')
            ];
        } else {
            $result = [
                'status' => false,
                'message' => 'Không thể thêm',
                'chapter' => null
            ];
        }

        return response()->json($result);
    }

    public function update(Request $request, $id)
    {
        $chapter = Chapters::find($id);
        if ($chapter == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'chapter' => null
            ]);
        }

        // Kiểm tra team_id của comic
        $comic = Comics::find($request->comic_id);
        if (!$comic || ($request->attributes->has('team_id') && $comic->team_id != $request->attributes->get('team_id'))) {
            return response()->json([
                'status' => false,
                'message' => 'Không có quyền cập nhật chapter cho comic này',
                'chapter' => null
            ]);
        }
        // Ràng buộc trực tiếp
        $validator = Validator::make($request->all(), [
            'comic_id' => 'required|exists:comics,id',
            'chapter_number' => 'required|numeric|min:0',
            'title' => 'nullable|string|max:255',
            'status' => 'required|in:1,2,0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'chapter' => null
            ]);
        }

        // Kiểm tra xem chapter_number đã tồn tại cho comic_id (ngoại trừ chính chapter này)
        $existingChapter = Chapters::where('comic_id', $request->comic_id)
            ->where('chapter_number', $request->chapter_number)
            ->where('id', '!=', $id)
            ->first();
        if ($existingChapter) {
            return response()->json([
                'status' => false,
                'message' => 'Số chương đã tồn tại cho truyện này',
                'chapter' => null
            ]);
        }

        $chapter->comic_id = $request->comic_id;
        $chapter->chapter_number = $request->chapter_number;
        $chapter->title = $request->title;
        $chapter->slug = Str::slug($request->title ?: 'chapter-' . $request->chapter_number);
        $chapter->status = $request->status;
        $chapter->updated_by = Auth::id() ?: 1;
        $chapter->updated_at = now();
        $comic->updated_at = now();



        if ($chapter->save()) {
            $comic->save();
            return response()->json([
                'status' => true,
                'message' => 'Cập nhật thành công',
                'chapter' => $chapter->load('comic')
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể cập nhật',
                'chapter' => null
            ]);
        }
    }

    public function status(Request $request, $id)
    {
        // Kiểm tra quyền truy cập với join
        $query = Chapters::where('chapters.id', $id)
            ->join('comics', 'chapters.comic_id', '=', 'comics.id');

        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $chapter = $query->first();
        if ($chapter == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập',
                'chapter' => null
            ]);
        }

        // Lấy bản ghi chapter thực tế từ model Chapters để cập nhật
        $chapterToUpdate = Chapters::find($id);
        if (!$chapterToUpdate) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy chapter',
                'chapter' => null
            ]);
        }

        $chapterToUpdate->status = ($chapterToUpdate->status == 1) ? 2 : 1;
        $chapterToUpdate->updated_by = Auth::id() ?: 1;
        $chapterToUpdate->updated_at = now();

        if ($chapterToUpdate->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'chapter' => $chapterToUpdate
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'chapter' => null
            ]);
        }
    }
    public function delete(Request $request, $id)
    {
        // Kiểm tra quyền truy cập với join
        $query = Chapters::where('chapters.id', $id)
            ->join('comics', 'chapters.comic_id', '=', 'comics.id');

        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $chapter = $query->first();
        if ($chapter == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập',
                'chapter' => null
            ]);
        }
        // Kiểm tra quyền leader
        $user = Auth::user();
        if ($user->role !== 'admin') {
            $isLeader = TeamMembers::where('team_id',  $chapter->team_id)
                ->where('user_id', $user->id)
                ->where('role', 'leader')
                ->exists();
            if (!$isLeader) {
                return response()->json([
                    'status' => false,
                    'message' => 'Chỉ leader mới có quyền xóa thành viên',
                    'chapter' => null
                ]);
            }
        }
        // Lấy bản ghi chapter thực tế từ model Chapters để cập nhật
        $chapterToUpdate = Chapters::find($id);
        if (!$chapterToUpdate) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy chapter',
                'chapter' => null
            ]);
        }

        $chapterToUpdate->status = 0;
        $chapterToUpdate->updated_by = Auth::id() ?: 1;
        $chapterToUpdate->updated_at = now();

        if ($chapterToUpdate->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'chapter' => $chapterToUpdate
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'chapter' => null
            ]);
        }
    }

    public function restore(Request $request, $id)
    {
        // Kiểm tra quyền truy cập với join
        $query = Chapters::where('chapters.id', $id)
            ->join('comics', 'chapters.comic_id', '=', 'comics.id');

        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $chapter = $query->first();
        if ($chapter == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập',
                'chapter' => null
            ]);
        }

        // Lấy bản ghi chapter thực tế từ model Chapters để cập nhật
        $chapterToUpdate = Chapters::find($id);
        if (!$chapterToUpdate) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy chapter',
                'chapter' => null
            ]);
        }

        $chapterToUpdate->status = 2;
        $chapterToUpdate->updated_by = Auth::id() ?: 1;
        $chapterToUpdate->updated_at = now();

        if ($chapterToUpdate->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'chapter' => $chapterToUpdate
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'chapter' => null
            ]);
        }
    }

    public function destroy(Request $request, $id)
    {
        $query = Chapters::where('chapters.id', $id)
            ->join('comics', 'chapters.comic_id', '=', 'comics.id');

        if ($request->attributes->has('team_id')) {
            $query->where('comics.team_id', $request->attributes->get('team_id'));
        }

        $chapter = $query->first();
        if ($chapter == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập',
                'chapter' => null
            ]);
        }

        if ($chapter->delete()) {
            return response()->json([
                'status' => true,
                'message' => 'Xóa thành công',
                'chapter' => $chapter
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể xóa',
                'chapter' => null
            ]);
        }
    }
    public function filterChapters(Request $request)
    {
        $keyword = trim($request->input('keyword', '')); // 🔍 từ khóa tìm kiếm

        $query = DB::table('chapters')
            ->join('comics', 'chapters.comic_id', '=', 'comics.id')
            ->orderBy('chapters.created_at', 'DESC')
            ->select(
                'chapters.id',
                'chapters.comic_id',
                'chapters.chapter_number',
                'chapters.title',
                'chapters.status',
                'comics.title as comic_title'
            );

        if (!empty($keyword)) {
            // Tách chữ và số trong keyword
            preg_match_all('/\d+/', $keyword, $numbers);
            $number = $numbers[0][0] ?? null; // số đầu tiên nếu có
            $text = trim(preg_replace('/\d+/', '', $keyword)); // phần chữ

            $query->where(function ($q) use ($text, $number) {
                if ($text && $number) {
                    // 🧩 Có cả chữ và số → phải trùng cả tên truyện và số chương
                    $q->where('comics.title', 'like', '%' . $text . '%')
                        ->where('chapters.chapter_number', 'like', $number . '%');
                } elseif ($text) {
                    // 🧠 Chỉ có chữ → lọc theo tên truyện
                    $q->where('comics.title', 'like', '%' . $text . '%');
                } elseif ($number) {
                    // 🔢 Chỉ có số → lọc theo số chương
                    $q->where('chapters.chapter_number', 'like', $number . '%');
                }
            });
        }


        // ⚡ Giới hạn kết quả cho dropdown
        $chapters = $query->limit(50)->get();

        return response()->json([
            'status' => true,
            'message' => 'Lọc truyện thành công!',
            'chapters' => $chapters,
        ]);
    }
}
