<?php

namespace App\Http\Controllers\backend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Contacts;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class ContactController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->input('limit');
        $query = Contacts::where('status', '!=', 0)
            ->orderBy('created_at', 'DESC')
            ->select('id', 'name', 'phone', 'email', 'title', 'replay_id', 'user_id', 'status');

        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
        ];

        if ($limit) {
            // Có limit, thực hiện phân trang
            $contacts = $query->paginate($limit);
            $result['contacts'] = $contacts->items();
            $result['pagination'] = [
                'current_page' => $contacts->currentPage(),
                'last_page' => $contacts->lastPage(),
                'per_page' => $contacts->perPage(),
                'total' => $contacts->total(),
            ];
        } else {
            // Không có limit, lấy toàn bộ dữ liệu
            $contacts = $query->get();
            $result['contacts'] = $contacts;
            $result['pagination'] = null; // Không trả về pagination
        }

        return response()->json($result);
    }

    public function trash()
    {
        $contacts = Contacts::where('status', '=', 0)
            ->orderBy('created_at', 'DESC')
            ->select('id', 'name', 'phone', 'email', 'title', 'replay_id', 'user_id', 'status')
            ->get();
        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
            'contacts' => $contacts
        ];
        return response()->json($result);
    }

    public function show($id)
    {
        $contact = Contacts::find($id);
        if ($contact == null) {
            $result = [
                'status' => false,
                'message' => 'Không tìm thấy dữ liệu',
                'contacts' => null
            ];
        } else {
            $result = [
                'status' => true,
                'message' => 'Tải dữ liệu thành công',
                'contacts' => $contact
            ];
        }
        return response()->json($result);
    }

    public function store(Request $request)
    {
        // Validation cho các cột bắt buộc và tùy chọn
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'status' => 'required|in:0,1,2',
            'replay_id' => 'nullable|integer|exists:users,id',
            'user_id' => 'nullable|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực',
                'errors' => $validator->errors(),
            ], 422);
        }

        $contact = new Contacts();
        $contact->fill([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'title' => $request->title,
            'content' => $request->content,
            'status' => $request->status,
            'replay_id' => $request->replay_id,
            'user_id' => $request->user_id,
            'created_at' => now(),
        ]);

        if ($contact->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thêm thành công',
                'contact' => $contact,
            ], 201);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể thêm',
            'contact' => null,
        ], 500);
    }

    public function update(Request $request, $id)
    {
        $contact = Contacts::findOrFail($id);

        // Validation cho các cột bắt buộc và tùy chọn
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'status' => 'required|in:0,1,2',
            'replay_id' => 'nullable|integer|exists:users,id',
            'user_id' => 'nullable|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực',
                'errors' => $validator->errors(),
            ], 422);
        }

        $contact->fill([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'title' => $request->title,
            'content' => $request->content,
            'status' => $request->status,
            'replay_id' => $request->replay_id,
            'user_id' => $request->user_id,
            'updated_by' => Auth::id() ?: 1,
            'updated_at' => now(),
        ]);

        if ($contact->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Cập nhật thành công',
                'contact' => $contact,
            ], 200);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể cập nhật',
            'contact' => null,
        ], 500);
    }

    public function status($id)
    {
        $contact = Contacts::find($id);
        if ($contact == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'contact' => null
            ]);
        }
        $contact->status = ($contact->status == 1) ? 2 : 1;
        $contact->updated_by = Auth::id() ?: 1;
        $contact->updated_at = now();

        if ($contact->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'contact' => $contact
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'contact' => null
            ]);
        }
    }

    public function replay($id)
    {
        $contact = Contacts::find($id);
        if ($contact == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'contact' => null
            ]);
        }

        $contact->replay_id = Auth::id() ?: 1;
        $contact->updated_by = Auth::id() ?: 1;
        $contact->updated_at = now();

        if ($contact->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Trả lời thành công',
                'contact' => $contact
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'contact' => null
            ]);
        }
    }
    public function delete($id)
    {
        $contact = Contacts::find($id);
        if ($contact == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'contact' => null
            ]);
        }

        $contact->status = 0;
        $contact->updated_by = Auth::id() ?: 1;
        $contact->updated_at = now();

        if ($contact->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'contact' => $contact
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'contact' => null
            ]);
        }
    }

    public function restore($id)
    {
        $contact = Contacts::find($id);
        if ($contact == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'contact' => null
            ]);
        }

        $contact->status = 2;
        $contact->updated_by = Auth::id() ?: 1;
        $contact->updated_at = now();

        if ($contact->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'contact' => $contact
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể thay đổi',
                'contact' => null
            ]);
        }
    }

    public function destroy($id)
    {
        $contact = Contacts::find($id);
        if ($contact == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'contact' => null
            ]);
        }

        if ($contact->delete()) {
            return response()->json([
                'status' => true,
                'message' => 'Xóa thành công',
                'contact' => $contact
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'Không thể xóa',
                'contact' => null
            ]);
        }
    }
}
