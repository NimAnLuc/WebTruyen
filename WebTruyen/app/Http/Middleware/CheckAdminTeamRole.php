<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CheckAdminTeamRole
{
    public function handle(Request $request, Closure $next)
    {
        // Kiểm tra đăng nhập
        if (!Auth::check()) {
            return response()->json([
                'status' => false,
                'message' => 'Chưa đăng nhập.'
            ], 401);
        }

        $user = Auth::user();

        // Kiểm tra status của user
        if ($user->status !== 1) {
            return response()->json([
                'status' => false,
                'message' => 'Tài khoản của bạn chưa được kích hoạt.'
            ], 403);
        }

        // Nếu user là admin, cho phép truy cập toàn bộ
        if ($user->role === 'admin') {
            return $next($request);
        }

        // Nếu user là team, kiểm tra team_id
        if ($user->role === 'team') {
            // Lấy team_id của user từ bảng team_members
            $teamMember = DB::table('team_members')
                ->where('user_id', $user->id)
                ->first();

            if (!$teamMember) {
                return response()->json([
                    'status' => false,
                    'message' => 'Không tìm thấy thông tin team của user.'
                ], 403);
            }

            // Gắn team_id vào request để sử dụng trong controller hoặc query
            $request->attributes->set('team_id', $teamMember->team_id);

            return $next($request);
        }

        // Nếu không phải admin hoặc team, từ chối truy cập
        return response()->json([
            'status' => false,
            'message' => 'Bạn không có quyền truy cập. Yêu cầu vai trò Admin hoặc Team.'
        ], 403);
    }
}