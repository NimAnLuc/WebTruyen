<?php

namespace App\Helpers;

class ResponseHelper
{
    public static function success($message, $data = null, $pagination = null)
    {
        return response()->json([
            'status' => true,
            'message' => $message,
            'data' => $data,
            'pagination' => $pagination,
        ]);
    }

    public static function error($message, $data = null)
    {
        return response()->json([
            'status' => false,
            'message' => $message,
            'data' => $data,
        ]);
    }
}
