<?php

namespace App\Http\Controllers\backend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TeamMembers;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class TeamMemberController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->input('limit'); // Lấy limit, không set giá trị mặc định
        $query = TeamMembers::where('team_members.status', '!=', 0)
            ->orderBy('team_members.created_at', 'DESC')
            ->join('teams', 'team_members.team_id', '=', 'teams.id')
            ->join('users', 'team_members.user_id', '=', 'users.id')
            ->select(
                'team_members.id',
                'team_members.team_id',
                'team_members.user_id',
                'team_members.role',
                'team_members.status',
                'teams.name as team_name',
                'users.name as username',
            );

        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
        ];

        if ($limit) {
            // Có limit, thực hiện phân trang
            $teamMembers = $query->paginate($limit);
            $result['teammembers'] = $teamMembers->items();
            $result['pagination'] = [
                'current_page' => $teamMembers->currentPage(),
                'last_page' => $teamMembers->lastPage(),
                'per_page' => $teamMembers->perPage(),
                'total' => $teamMembers->total(),
            ];
        } else {
            // Không có limit, lấy toàn bộ dữ liệu
            $teamMembers = $query->get();
            $result['teammembers'] = $teamMembers;
            $result['pagination'] = null; // Không trả về pagination
        }

        return response()->json($result);
    }
    public function trash(Request $request)
    {
        $query = TeamMembers::where('team_members.status', '=', 0)
            ->orderBy('team_members.created_at', 'DESC')
            ->join('teams', 'team_members.team_id', '=', 'teams.id')
            ->join('users', 'team_members.user_id', '=', 'users.id')
            ->select(
                'team_members.id',
                'team_members.team_id',
                'team_members.user_id',
                'team_members.role',
                'team_members.status',
                'teams.name as team_name',
                'users.name as username',
            );
        // Lọc theo team_id cho người dùng team
        if ($request->attributes->has('team_id')) {
            $query->where('team_id', $request->attributes->get('team_id'));
        }
        $teamMembers = $query->get();
        $result = [
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
            'teammembers' => $teamMembers
        ];
        return response()->json($result);
    }

    public function show(Request $request, $id)
    {
        $query = TeamMembers::where('team_members.id', $id)
            ->join('teams', 'team_members.team_id', '=', 'teams.id')
            ->join('users', 'team_members.user_id', '=', 'users.id')
            ->leftJoin('users as creator', 'team_members.created_by', '=', 'creator.id')
            ->leftJoin('users as updater', 'team_members.updated_by', '=', 'updater.id')
            ->select(
                'team_members.*',
                'teams.name as team_name',
                'users.name as username',
                'creator.name as creator_name',
                'updater.name as updater_name'
            );

        // Lọc theo team_id cho người dùng team
        if ($request->attributes->has('team_id')) {
            $query->where('team_id', $request->attributes->get('team_id'));
        }

        $teamMember = $query->first();
        if ($teamMember == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy dữ liệu',
                'teammembers' => null
            ]);
        }

        return response()->json([
            'status' => true,
            'message' => 'Tải dữ liệu thành công',
            'teammembers' => $teamMember->load(['team', 'user'])
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $teamId = $user->role === 'admin' ? $request->team_id : $request->attributes->get('team_id');

        // Kiểm tra quyền admin hoặc leader
        if ($user->role !== 'admin') {
            if (!$request->attributes->has('team_id')) {
                return response()->json([
                    'status' => false,
                    'message' => 'Không có quyền thêm thành viên',
                    'teammember' => null
                ]);
            }
            $isLeader = TeamMembers::where('team_id', $teamId)
                ->where('user_id', $user->id)
                ->where('role', 'leader')
                ->exists();
            if (!$isLeader) {
                return response()->json([
                    'status' => false,
                    'message' => 'Chỉ leader mới có quyền thêm thành viên',
                    'teammember' => null
                ]);
            }
            // Không cho phép non-leader thêm thành viên với vai trò leader
            if ($request->role === 'leader') {
                return response()->json([
                    'status' => false,
                    'message' => 'Chỉ leader hoặc admin mới có thể thêm thành viên với vai trò leader',
                    'teammember' => null
                ]);
            }
        }

        // Validation: Bỏ team_id nếu role là team
        $validationRules = [
            'user_id' => 'required|exists:users,id',
            'role' => 'required|in:leader,translator,proofreader,cleaner',
            'status' => 'required|in:1,2,0',
        ];
        if ($user->role === 'admin') {
            $validationRules['team_id'] = 'required|exists:teams,id';
        }

        $validator = Validator::make($request->all(), $validationRules);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'teammember' => null
            ]);
        }

        // Kiểm tra team_id hợp lệ cho non-admin
        if ($user->role !== 'admin' && $teamId !== $request->attributes->get('team_id')) {
            return response()->json([
                'status' => false,
                'message' => 'Không có quyền thêm thành viên vào nhóm này',
                'teammember' => null
            ]);
        }

        $existingTeamMember = TeamMembers::where('team_id', $teamId)
            ->where('user_id', $request->user_id)
            ->first();
        if ($existingTeamMember) {
            return response()->json([
                'status' => false,
                'message' => 'Thành viên đã tồn tại trong nhóm này',
                'teammember' => null
            ]);
        }

        $teamMember = new TeamMembers();
        $teamMember->team_id = $teamId;
        $teamMember->user_id = $request->user_id;
        $teamMember->role = $request->role;
        $teamMember->status = $request->status;
        $teamMember->created_by = Auth::id() ?: 1;
        $teamMember->created_at = now();

        if ($teamMember->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thêm thành công',
                'teammember' => $teamMember->load(['team', 'user'])
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể thêm',
            'teammember' => null
        ]);
    }

    public function update(Request $request, $id)
    {
        $teamMember = TeamMembers::find($id);
        if ($teamMember == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'teammember' => null
            ]);
        }

        $user = Auth::user();
        $teamId = $user->role === 'admin' ? $request->team_id : $request->attributes->get('team_id');

        // Kiểm tra quyền admin hoặc leader
        if ($user->role !== 'admin') {
            if (!$request->attributes->has('team_id') || $teamMember->team_id != $request->attributes->get('team_id')) {
                return response()->json([
                    'status' => false,
                    'message' => 'Không có quyền cập nhật thành viên trong nhóm này',
                    'teammember' => null
                ]);
            }
            $isLeader = TeamMembers::where('team_id', $teamMember->team_id)
                ->where('user_id', $user->id)
                ->where('role', 'leader')
                ->exists();
            if (!$isLeader) {
                return response()->json([
                    'status' => false,
                    'message' => 'Chỉ leader mới có quyền cập nhật thành viên',
                    'teammember' => null
                ]);
            }
            // Không cho phép non-leader sửa thành viên thành leader
            if ($request->role === 'leader' && $teamMember->role !== 'leader') {
                return response()->json([
                    'status' => false,
                    'message' => 'Chỉ leader hoặc admin mới có thể gán vai trò leader',
                    'teammember' => null
                ]);
            }
        }

        // Validation: Bỏ team_id nếu role là team
        $validationRules = [
            'user_id' => 'required|exists:users,id',
            'role' => 'required|in:leader,translator,proofreader,cleaner',
            'status' => 'required|in:1,2,0',
        ];
        if ($user->role === 'admin') {
            $validationRules['team_id'] = 'required|exists:teams,id';
        }

        $validator = Validator::make($request->all(), $validationRules);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi xác thực: ' . $validator->errors()->first(),
                'teammember' => null
            ]);
        }

        // Kiểm tra team_id hợp lệ cho non-admin
        if ($user->role !== 'admin' && $teamId !== $request->attributes->get('team_id')) {
            return response()->json([
                'status' => false,
                'message' => 'Không có quyền cập nhật thành viên vào nhóm này',
                'teammember' => null
            ]);
        }

        $existingTeamMember = TeamMembers::where('team_id', $teamId)
            ->where('user_id', $request->user_id)
            ->where('id', '!=', $id)
            ->first();
        if ($existingTeamMember) {
            return response()->json([
                'status' => false,
                'message' => 'Thành viên đã tồn tại trong nhóm này',
                'teammember' => null
            ]);
        }

        $teamMember->team_id = $teamId;
        $teamMember->user_id = $request->user_id;
        $teamMember->role = $request->role;
        $teamMember->status = $request->status;
        $teamMember->updated_by = Auth::id() ?: 1;
        $teamMember->updated_at = now();

        if ($teamMember->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Cập nhật thành công',
                'teammember' => $teamMember->load(['team', 'user'])
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể cập nhật',
            'teammember' => null
        ]);
    }

    public function status(Request $request, $id)
    {
        $query = TeamMembers::where('id', $id);
        if ($request->attributes->has('team_id') && Auth::user()->role !== 'admin') {
            $query->where('team_id', $request->attributes->get('team_id'));
        }

        $teamMember = $query->first();

        if ($teamMember == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'teammember' => null
            ]);
        }
        // Kiểm tra quyền leader
        $user = Auth::user();
        if ($user->role !== 'admin') {
            $isLeader = TeamMembers::where('team_id', $teamMember->team_id)
                ->where('user_id', $user->id)
                ->where('role', 'leader')
                ->exists();
            if (!$isLeader) {
                return response()->json([
                    'status' => false,
                    'message' => 'Chỉ leader mới có quyền xóa thành viên',
                    'teammember' => null
                ]);
            }
        }
        $teamMember->status = ($teamMember->status == 1) ? 2 : 1;
        $teamMember->updated_by = Auth::id() ?: 1;
        $teamMember->updated_at = now();

        if ($teamMember->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'teammember' => $teamMember->load(['team', 'user'])
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể thay đổi',
            'teammember' => null
        ]);
    }
    public function delete(Request $request, $id)
    {
        $query = TeamMembers::where('id', $id);
        if ($request->attributes->has('team_id') && Auth::user()->role !== 'admin') {
            $query->where('team_id', $request->attributes->get('team_id'));
        }

        $teamMember = $query->first();

        if ($teamMember == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin',
                'teammember' => null
            ]);
        }
        // Kiểm tra quyền leader
        $user = Auth::user();
        if ($user->role !== 'admin') {
            $isLeader = TeamMembers::where('team_id', $teamMember->team_id)
                ->where('user_id', $user->id)
                ->where('role', 'leader')
                ->exists();
            if (!$isLeader) {
                return response()->json([
                    'status' => false,
                    'message' => 'Chỉ leader mới có quyền xóa thành viên',
                    'teammember' => null
                ]);
            }
        }
        $teamMember->status = 0;
        $teamMember->updated_by = Auth::id() ?: 1;
        $teamMember->updated_at = now();

        if ($teamMember->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'teammember' => $teamMember->load(['team', 'user'])
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể thay đổi',
            'teammember' => null
        ]);
    }

    public function restore(Request $request, $id)
    {
        $query = TeamMembers::where('id', $id);
        if ($request->attributes->has('team_id') && Auth::user()->role !== 'admin') {
            $query->where('team_id', $request->attributes->get('team_id'));
        }

        $teamMember = $query->first();
        if ($teamMember == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập',
                'teammember' => null
            ]);
        }

        // Kiểm tra quyền leader
        $user = Auth::user();
        if ($user->role !== 'admin') {
            $isLeader = TeamMembers::where('team_id', $teamMember->team_id)
                ->where('user_id', $user->id)
                ->where('role', 'leader')
                ->exists();
            if (!$isLeader) {
                return response()->json([
                    'status' => false,
                    'message' => 'Chỉ leader mới có quyền khôi phục thành viên',
                    'teammember' => null
                ]);
            }
        }

        $teamMember->status = 2;
        $teamMember->updated_by = Auth::id() ?: 1;
        $teamMember->updated_at = now();

        if ($teamMember->save()) {
            return response()->json([
                'status' => true,
                'message' => 'Thay đổi thành công',
                'teammember' => $teamMember->load(['team', 'user'])
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể thay đổi',
            'teammember' => null
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $query = TeamMembers::where('id', $id);
        if ($request->attributes->has('team_id') && Auth::user()->role !== 'admin') {
            $query->where('team_id', $request->attributes->get('team_id'));
        }

        $teamMember = $query->first();
        if ($teamMember == null) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hoặc bạn không có quyền truy cập',
                'teammember' => null
            ]);
        }

        // Kiểm tra quyền leader
        $user = Auth::user();
        if ($user->role !== 'admin') {
            $isLeader = TeamMembers::where('team_id', $teamMember->team_id)
                ->where('user_id', $user->id)
                ->where('role', 'leader')
                ->exists();
            if (!$isLeader) {
                return response()->json([
                    'status' => false,
                    'message' => 'Chỉ leader mới có quyền xóa vĩnh viễn thành viên',
                    'teammember' => null
                ]);
            }
        }

        if ($teamMember->delete()) {
            return response()->json([
                'status' => true,
                'message' => 'Xóa thành công',
                'teammember' => $teamMember
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể xóa',
            'teammember' => null
        ]);
    }
}
