<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckAdminRole
{
    public function handle(Request $request, Closure $next)
    {
        if (!Auth::check()) {
            return response()->json([
                'status' => false,
                'message' => 'Chưa đăng nhập.'
            ], 401);
        }

        $user = Auth::user();
        
        if ($user->status !== 1) {
            return response()->json([
                'status' => false,
                'message' => 'Tài khoản của bạn chưa được kích hoạt.'
            ], 403);
        }

        if ($user->role !== 'admin') {
            return response()->json([
                'status' => false,
                'message' => 'Bạn không có quyền truy cập. Yêu cầu vai trò Admin.'
            ], 403);
        }

        return $next($request);
    }
}