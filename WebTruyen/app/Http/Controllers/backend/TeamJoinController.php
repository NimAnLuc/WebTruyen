<?php

namespace App\Http\Controllers\backend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TeamJoin;
use App\Models\TeamMembers;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class TeamJoinController extends Controller
{
    /**
     * Kiểm tra quyền leader hoặc admin
     */
    private function checkPermission(Request $request, TeamJoin $teamJoin)
    {
        $user = Auth::user();
        
        // Admin có quyền truy cập tất cả
        if ($user->role === 'admin') {
            return true;
        }

        // Kiểm tra xem người dùng có phải leader của team_id liên quan
        return TeamMembers::where('team_id', $teamJoin->team_id)
            ->where('user_id', $user->id)
            ->where('role', 'leader')
            ->exists();
    }

    /**
     * Lấy danh sách team join
     */
    public function index(Request $request)
    {
        try {
            $limit = $request->input('limit', 15);
            $search = $request->input('search');
            $query = TeamJoin::where('team_join.status', '!=', 0)
                ->join('teams', 'team_join.team_id', '=', 'teams.id')
                ->join('users', 'team_join.user_id', '=', 'users.id')
                ->leftJoin('users as approver', 'team_join.approver_id', '=', 'approver.id')
                ->select(
                    'team_join.id',
                    'team_join.team_id',
                    'team_join.user_id',
                    'team_join.requested_role',
                    'team_join.approver_id',
                    'team_join.status',
                    'team_join.message',
                    'team_join.created_at',
                    'team_join.updated_at',
                    'teams.name as team_name',
                    'users.name as username',
                    'approver.name as approver_name'
                )
                ->with(['team:id,name', 'user:id,name', 'approver:id,name'])
                ->orderBy('team_join.created_at', 'DESC');

            // Lọc theo team_id cho người dùng không phải admin
            if ($request->attributes->has('team_id') && Auth::user()->role !== 'admin') {
                $query->where('team_join.team_id', $request->attributes->get('team_id'));
            }

            // Xử lý tìm kiếm
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('team_join.requested_role', 'like', "%{$search}%")
                        ->orWhere('team_join.message', 'like', "%{$search}%")
                        ->orWhere('users.name', 'like', "%{$search}%")
                        ->orWhere('teams.name', 'like', "%{$search}%");
                });
            }

            $result = [
                'status' => true,
                'message' => 'Tải dữ liệu thành công',
            ];

            if ($limit) {
                $teamJoins = $query->paginate($limit);
                $result['teamjoins'] = $teamJoins->items();
                $result['pagination'] = [
                    'current_page' => $teamJoins->currentPage(),
                    'last_page' => $teamJoins->lastPage(),
                    'per_page' => $teamJoins->perPage(),
                    'total' => $teamJoins->total(),
                ];
            } else {
                $teamJoins = $query->get();
                $result['teamjoins'] = $teamJoins;
                $result['pagination'] = null;
            }

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi tải dữ liệu: ' . $e->getMessage(),
                'teamjoins' => [],
                'pagination' => null,
            ], 500);
        }
    }

    /**
     * Lấy danh sách team join đã bị xóa (status = 0)
     */
    public function trash(Request $request)
    {
        try {
            $query = TeamJoin::where('team_join.status', '=', 0)
                ->join('teams', 'team_join.team_id', '=', 'teams.id')
                ->join('users', 'team_join.user_id', '=', 'users.id')
                ->leftJoin('users as approver', 'team_join.approver_id', '=', 'approver.id')
                ->select(
                    'team_join.id',
                    'team_join.team_id',
                    'team_join.user_id',
                    'team_join.requested_role',
                    'team_join.approver_id',
                    'team_join.status',
                    'team_join.message',
                    'team_join.created_at',
                    'team_join.updated_at',
                    'teams.name as team_name',
                    'users.name as username',
                    'approver.name as approver_name'
                )
                ->orderBy('team_join.created_at', 'DESC');

            // Lọc theo team_id cho người dùng không phải admin
            if ($request->attributes->has('team_id') && Auth::user()->role !== 'admin') {
                $query->where('team_join.team_id', $request->attributes->get('team_id'));
            }

            $teamJoins = $query->get();
            return response()->json([
                'status' => true,
                'message' => 'Tải dữ liệu thành công',
                'teamjoins' => $teamJoins
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi tải dữ liệu: ' . $e->getMessage(),
                'teamjoins' => [],
            ], 500);
        }
    }

    /**
     * Lấy thông tin chi tiết team join
     */
    public function show(Request $request, $id)
    {
        $query = TeamJoin::where('team_join.id', $id)
            ->join('teams', 'team_join.team_id', '=', 'teams.id')
            ->join('users', 'team_join.user_id', '=', 'users.id')
            ->leftJoin('users as approver', 'team_join.approver_id', '=', 'approver.id')
            ->leftJoin('users as creator', 'team_join.created_by', '=', 'creator.id')
            ->leftJoin('users as updater', 'team_join.updated_by', '=', 'updater.id')
            ->select(
                'team_join.*',
                'teams.name as team_name',
                'users.name as username',
                'approver.name as approver_name',
                'creator.name as creator_name',
                'updater.name as updater_name'
            );

        // Lọc theo team_id cho người dùng không phải admin
        if ($request->attributes->has('team_id') && Auth::user()->role !== 'admin') {
            $query->where('team_join.team_id', $request->attributes->get('team_id'));
        }

        $teamJoin = $query->first();
        if ($teamJoin == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy dữ liệu hoặc bạn không có quyền truy cập',
                'teamjoins' => null
            ], 404);
        }

        return response()->json([
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
            'teamjoins' => $teamJoin
        ]);
    }

    /**
     * Cập nhật thông tin team join
     */
    public function update(Request $request, $id)
    {
        $teamJoin = TeamJoin::find($id);
        if ($teamJoin == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'teamjoin' => null
            ], 404);
        }

        // Kiểm tra quyền
        if (!$this->checkPermission($request, $teamJoin)) {
            return response()->json([
                'status' => false,
                'message' => 'Chỉ leader hoặc admin mới có quyền cập nhật yêu cầu',
                'teamjoin' => null
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:0,1,2', // 0: Pending, 1: Approved, 2: Rejected
            'requested_role' => 'sometimes|in:leader,translator,proofreader,cleaner',
            'message' => 'sometimes|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'teamjoin' => null
            ], 422);
        }

        $teamJoin->fill($request->only(['status', 'requested_role', 'message']));
        $teamJoin->approver_id = Auth::id() ?: 1;
        $teamJoin->updated_by = Auth::id() ?: 1;
        $teamJoin->updated_at = now();

        if ($teamJoin->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Cập nhật yêu cầu thành công',
                'teamjoin' => $teamJoin->load(['team', 'user', 'approver'])
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể cập nhật',
            'teamjoin' => null
        ], 500);
    }

    /**
     * Duyệt yêu cầu tham gia đội nhóm
     */
    public function approve(Request $request, $id)
    {
        $teamJoin = TeamJoin::find($id);
        if ($teamJoin == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'teamjoin' => null
            ], 404);
        }

        // Kiểm tra quyền
        if (!$this->checkPermission($request, $teamJoin)) {
            return response()->json([
                'status' => false,
                'message' => 'Chỉ leader hoặc admin mới có quyền duyệt yêu cầu',
                'teamjoin' => null
            ], 403);
        }

        $teamJoin->status = 1; // Approved
        $teamJoin->approver_id = Auth::id() ?: 1;
        $teamJoin->updated_by = Auth::id() ?: 1;
        $teamJoin->updated_at = now();

        if ($teamJoin->save()) {
            // Tạo bản ghi trong TeamMembers khi duyệt thành công
            $teamMember = TeamMembers::firstOrCreate(
                [
                    'team_id' => $teamJoin->team_id,
                    'user_id' => $teamJoin->user_id,
                ],
                [
                    'role' => $teamJoin->requested_role,
                    'status' => 1, // Hoạt động
                    'created_by' => Auth::id() ?: 1,
                    'updated_by' => Auth::id() ?: 1,
                ]
            );

            return response()->json([
                'status' => true,
                'message' => 'Duyệt yêu cầu thành công',
                'teamjoin' => $teamJoin->load(['team', 'user', 'approver'])
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể duyệt',
            'teamjoin' => null
        ], 500);
    }

    /**
     * Thay đổi trạng thái (toggle giữa Approved và Rejected)
     */
    public function status(Request $request, $id)
    {
        $query = TeamJoin::where('id', $id);
        if ($request->attributes->has('team_id') && Auth::user()->role !== 'admin') {
            $query->where('team_id', $request->attributes->get('team_id'));
        }

        $teamJoin = $query->first();
        if ($teamJoin == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập',
                'teamjoin' => null
            ], 404);
        }

        // Kiểm tra quyền
        if (!$this->checkPermission($request, $teamJoin)) {
            return response()->json([
                'status' => false,
                'message' => 'Chỉ leader hoặc admin mới có quyền thay đổi trạng thái',
                'teamjoin' => null
            ], 403);
        }

        $teamJoin->status = ($teamJoin->status == 1) ? 2 : 1; // Toggle giữa Approved (1) và Rejected (2)
        $teamJoin->approver_id = Auth::id() ?: 1;
        $teamJoin->updated_by = Auth::id() ?: 1;
        $teamJoin->updated_at = now();

        if ($teamJoin->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi trạng thái thành công',
                'teamjoin' => $teamJoin->load(['team', 'user', 'approver'])
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể thay đổi',
            'teamjoin' => null
        ], 500);
    }

    /**
     * Xóa mềm (chuyển status về 0)
     */
    public function delete(Request $request, $id)
    {
        $query = TeamJoin::where('id', $id);
        if ($request->attributes->has('team_id') && Auth::user()->role !== 'admin') {
            $query->where('team_id', $request->attributes->get('team_id'));
        }

        $teamJoin = $query->first();
        if ($teamJoin == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập',
                'teamjoin' => null
            ], 404);
        }

        // Kiểm tra quyền
        if (!$this->checkPermission($request, $teamJoin)) {
            return response()->json([
                'status' => false,
                'message' => 'Chỉ leader hoặc admin mới có quyền xóa yêu cầu',
                'teamjoin' => null
            ], 403);
        }

        $teamJoin->status = 0; // Soft delete
        $teamJoin->updated_by = Auth::id() ?: 1;
        $teamJoin->updated_at = now();

        if ($teamJoin->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Xóa yêu cầu thành công',
                'teamjoin' => $teamJoin->load(['team', 'user', 'approver'])
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể xóa',
            'teamjoin' => null
        ], 500);
    }

    /**
     * Khôi phục yêu cầu (chuyển status về 2)
     */
    public function restore(Request $request, $id)
    {
        $query = TeamJoin::where('id', $id);
        if ($request->attributes->has('team_id') && Auth::user()->role !== 'admin') {
            $query->where('team_id', $request->attributes->get('team_id'));
        }

        $teamJoin = $query->first();
        if ($teamJoin == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập',
                'teamjoin' => null
            ], 404);
        }

        // Kiểm tra quyền
        if (!$this->checkPermission($request, $teamJoin)) {
            return response()->json([
                'status' => false,
                'message' => 'Chỉ leader hoặc admin mới có quyền khôi phục yêu cầu',
                'teamjoin' => null
            ], 403);
        }

        $teamJoin->status = 2; // Restore to Rejected state
        $teamJoin->updated_by = Auth::id() ?: 1;
        $teamJoin->updated_at = now();

        if ($teamJoin->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Khôi phục yêu cầu thành công',
                'teamjoin' => $teamJoin->load(['team', 'user', 'approver'])
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể khôi phục',
            'teamjoin' => null
        ], 500);
    }

    /**
     * Xóa vĩnh viễn yêu cầu
     */
    public function destroy(Request $request, $id)
    {
        $query = TeamJoin::where('id', $id);
        if ($request->attributes->has('team_id') && Auth::user()->role !== 'admin') {
            $query->where('team_id', $request->attributes->get('team_id'));
        }

        $teamJoin = $query->first();
        if ($teamJoin == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập',
                'teamjoin' => null
            ], 404);
        }

        // Kiểm tra quyền
        if (!$this->checkPermission($request, $teamJoin)) {
            return response()->json([
                'status' => false,
                'message' => 'Chỉ leader hoặc admin mới có quyền xóa vĩnh viễn yêu cầu',
                'teamjoin' => null
            ], 403);
        }

        if ($teamJoin->delete()) {
            return response()->json([
                'status' => true,
                'message' => 'Xóa vĩnh viễn yêu cầu thành công',
                'teamjoin' => $teamJoin
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể xóa',
            'teamjoin' => null
        ], 500);
    }
}