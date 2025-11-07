<?php

namespace App\Http\Controllers\backend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Helpers\ResponseHelper as R;

abstract class BaseCrudController extends Controller
{
    protected $model;
    protected $relations = [];
    protected $validateRules = [];
    protected $softDelete = true; // có dùng status = 0 hay không

    // ✅ Danh sách
    public function index(Request $request)
    {
        $limit = $request->input('limit');
        $query = $this->model->orderByDesc('created_at')->with($this->relations);

        $data = $limit ? $query->paginate($limit) : $query->get();
        $pagination = $limit ? [
            'current_page' => $data->currentPage(),
            'last_page' => $data->lastPage(),
            'per_page' => $data->perPage(),
            'total' => $data->total(),
        ] : null;

        return R::success('Tải dữ liệu thành công', $limit ? $data->items() : $data, $pagination);
    }

    // ✅ Xem chi tiết
    public function show($id)
    {
        $item = $this->model->with($this->relations)->find($id);
        return $item
            ? R::success('Tải dữ liệu thành công', $item)
            : R::error('Không tìm thấy dữ liệu');
    }

    // ✅ Thêm mới
    public function store(Request $request)
    {
        $validator = validator($request->all(), $this->validateRules);
        if ($validator->fails()) {
            return R::error('Lỗi xác thực: ' . $validator->errors()->first());
        }

        $data = $request->all();
        $data['created_by'] = Auth::id() ?: 1;

        $item = $this->model->create($data);
        return R::success('Thêm thành công', $item->load($this->relations));
    }

    // ✅ Cập nhật
    public function update(Request $request, $id)
    {
        $item = $this->model->find($id);
        if (!$item) return R::error('Không tìm thấy dữ liệu');

        $validator = validator($request->all(), $this->validateRules);
        if ($validator->fails()) {
            return R::error('Lỗi xác thực: ' . $validator->errors()->first());
        }

        $data = $request->all();
        $data['updated_by'] = Auth::id() ?: 1;

        $item->update($data);
        return R::success('Cập nhật thành công', $item->load($this->relations));
    }

    // ✅ Xóa mềm
    public function delete($id)
    {
        $item = $this->model->find($id);
        if (!$item) return R::error('Không tìm thấy dữ liệu');

        if ($this->softDelete && $item->status !== null) {
            $item->update([
                'status' => 0,
                'updated_by' => Auth::id() ?: 1,
            ]);
            return R::success('Đã chuyển vào thùng rác', $item);
        }

        $item->delete();
        return R::success('Xóa thành công', $item);
    }

    // ✅ Khôi phục
    public function restore($id)
    {
        $item = $this->model->find($id);
        if (!$item) return R::error('Không tìm thấy dữ liệu');

        if ($this->softDelete && $item->status !== null) {
            $item->update([
                'status' => 1,
                'updated_by' => Auth::id() ?: 1,
            ]);
            return R::success('Khôi phục thành công', $item);
        }

        return R::error('Không thể khôi phục');
    }

    // ✅ Xóa vĩnh viễn
    public function destroy($id)
    {
        $item = $this->model->find($id);
        if (!$item) return R::error('Không tìm thấy dữ liệu');

        $item->delete();
        return R::success('Xóa vĩnh viễn thành công');
    }
}
