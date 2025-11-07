import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaArrowLeft, FaTrashRestore, FaTrash } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { EntityConfig } from "../../types/index";
import { apiService } from "../../services/apiService.ts"; 

interface GenericTrashProps<T> {
  config: EntityConfig<T>;
  data: T[];
  setData: React.Dispatch<React.SetStateAction<T[]>>;
}

const GenericTrash = <T extends { id: number; status?: number }>({
  config,
  data,
  setData,
}: GenericTrashProps<T>) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string | null>(null);
  const page = parseInt(searchParams.get("page") || "1");
  const [lastPage] = useState<number>(1);

  // Lấy user.role từ localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role || null);
    }
  }, []);

  const handleCheckboxChange = (id: number): void => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.checked) {
      const allIds = data.map((item) => item.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleRestore = async (id: number): Promise<void> => {
    if (window.confirm(`Bạn có chắc chắn muốn khôi phục ${config.entityName.toLowerCase()} này?`)) {
      try {
        await apiService.restore(config.endpoint.toLowerCase(), id.toString());
        setData((prev) => prev.filter((item) => item.id !== id));
        toast.success(`Khôi phục ${config.entityName.toLowerCase()} thành công!`);
      } catch (error) {
        // Lỗi đã được xử lý trong apiService (hiển thị toast.error), không cần xử lý thêm
      }
    }
  };

  const handleRestoreSelected = async (): Promise<void> => {
    if (selectedIds.length === 0) {
      toast.info(`Vui lòng chọn ít nhất một ${config.entityName.toLowerCase()} để khôi phục.`);
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn khôi phục các ${config.entityName.toLowerCase()} đã chọn?`)) {
      try {
        await apiService.restoreMultiple(config.endpoint.toLowerCase(), selectedIds);
        setData((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
        setSelectedIds([]);
        toast.success(`Khôi phục nhiều ${config.entityName.toLowerCase()} thành công!`);
      } catch (error) {
        // Lỗi đã được xử lý trong apiService (hiển thị toast.error), không cần xử lý thêm
      }
    }
  };

  const handlePermanentDelete = async (id: number): Promise<void> => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn ${config.entityName.toLowerCase()} này?`)) {
      try {
        await apiService.permanentDelete(config.endpoint.toLowerCase(), id.toString());
        setData((prev) => prev.filter((item) => item.id !== id));
        toast.success(`Xóa vĩnh viễn ${config.entityName.toLowerCase()} thành công!`);
      } catch (error) {
        // Lỗi đã được xử lý trong apiService (hiển thị toast.error), không cần xử lý thêm
      }
    }
  };

  const handlePermanentDeleteSelected = async (): Promise<void> => {
    if (selectedIds.length === 0) {
      toast.info(`Vui lòng chọn ít nhất một ${config.entityName.toLowerCase()} để xóa vĩnh viễn.`);
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn các ${config.entityName.toLowerCase()} đã chọn?`)) {
      try {
        await apiService.permanentDeleteMultiple(config.endpoint.toLowerCase(), selectedIds);
        setData((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
        setSelectedIds([]);
        toast.success(`Xóa vĩnh viễn nhiều ${config.entityName.toLowerCase()} thành công!`);
      } catch (error) {
        // Lỗi đã được xử lý trong apiService (hiển thị toast.error), không cần xử lý thêm
      }
    }
  };

  return (
    <div className="container-fluid entity-trash-container">
      <style>
        {`
          .entity-trash-container {
            padding: 2rem;
            background-color: #f4f7fa;
            min-height: 100vh;
          }

          .card {
            border: none;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
          }

          .card:hover {
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
          }

          .card-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #2c3e50;
          }

          .btn {
            border-radius: 8px;
            padding: 0.5rem 1rem;
            font-weight: 500;
            transition: all 0.3s ease;
          }

          .btn-success {
            background-color: #28a745;
            border-color: #28a745;
          }

          .btn-success:hover {
            background-color: #218838;
            transform: translateY(-2px);
          }

          .btn-danger {
            background-color: #dc3545;
            border-color: #dc3545;
          }

          .btn-danger:hover {
            background-color: #c82333;
            transform: translateY(-2px);
          }

          .btn-secondary {
            background-color: #6c757d;
            border-color: #6c757d;
          }

          .btn-secondary:hover {
            background-color: #5a6268;
            transform: translateY(-2px);
          }

          .table {
            border-radius: 8px;
            overflow: hidden;
            background: white;
          }

          .table th {
            background-color: #f8f9fa;
            color: #2c3e50;
            font-weight: 600;
            padding: 1rem;
            text-align: center;
          }

          .table td {
            vertical-align: middle;
            padding: 1rem;
            text-align: center;
          }

          .table tr {
            transition: all 0.2s ease;
          }

          .table tr:hover {
            background-color: #f1f5f9;
          }

          .pagination-btn {
            border-radius: 8px;
            padding: 0.5rem 1.5rem;
            font-weight: 500;
          }

          .pagination-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .breadcrumb {
            background-color: transparent;
            padding: 0.5rem 0;
          }

          .breadcrumb-item a {
            color: #3498db;
            text-decoration: none;
          }

          .breadcrumb-item a:hover {
            text-decoration: underline;
          }

          .no-data {
            padding: 2rem;
            text-align: center;
            color: #6c757d;
          }

          .no-data p {
            margin: 0;
          }
        `}
      </style>

      <div className="row">
        <div className="col-12 bg-white p-4 rounded card">
          <div className="card-body p-0">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/">Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to={`/admin/${config.entityName.toLowerCase()}`}>
                    Quản lý {config.entityName}
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Thùng rác
                </li>
              </ol>
            </nav>
          </div>

          <div className="card shadow rounded">
            <div className="card-body">
              <h2 className="card-title mb-4">Thùng rác {config.entityName}</h2>
              <div className="mb-4 d-flex gap-2">
                <Link to={`/admin/${config.entityName.toLowerCase()}`}>
                  <button className="btn btn-secondary">
                    <FaArrowLeft className="me-1" /> Quay lại
                  </button>
                </Link>
                <button onClick={handleRestoreSelected} className="btn btn-success">
                  <FaTrashRestore className="me-1" /> Khôi phục đã chọn
                </button>
                {userRole !== 'team' && (
                  <button onClick={handlePermanentDeleteSelected} className="btn btn-danger">
                    <MdDelete className="me-1" /> Xóa vĩnh viễn đã chọn
                  </button>
                )}
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={data.length > 0 && selectedIds.length === data.length}
                        />
                      </th>
                      {config.fields.map((field) => (
                        <th key={String(field.key)}>{field.label}</th>
                      ))}
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length > 0 ? (
                      data.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item.id)}
                              onChange={() => handleCheckboxChange(item.id)}
                            />
                          </td>
                          {config.fields.map((field) => (
                            <td key={String(field.key)}>
                              {field.render
                                ? field.render(item[field.key], item)
                                : String(item[field.key])}
                            </td>
                          ))}
                          <td >
                            <button
                              className="btn btn-success btn-sm m-1"
                              onClick={() => handleRestore(item.id)}
                            >
                              <FaTrashRestore className="me-1" /> Khôi phục
                            </button>
                            {userRole !== 'team' && (
                              <button
                                className="btn btn-danger btn-sm m-1"
                                onClick={() => handlePermanentDelete(item.id)}
                              >
                                <FaTrash className="me-1" /> Xóa vĩnh viễn
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={config.fields.length + (config.statusField ? 2 : 1)} className="no-data">
                          <p className="text-lg font-semibold">
                            Không có {config.entityName.toLowerCase()} nào trong thùng rác.
                          </p>
                          <p className="text-sm">
                            Hãy kiểm tra danh sách {config.entityName.toLowerCase()} chính.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-center mt-4 gap-3">
                <button
                  onClick={() => setSearchParams({ page: (page - 1).toString() })}
                  disabled={page <= 1}
                  className="btn btn-outline-secondary pagination-btn"
                >
                  Trước
                </button>
                <span className="align-self-center font-weight-bold">
                  {page} / {lastPage}
                </span>
                <button
                  onClick={() => setSearchParams({ page: (page + 1).toString() })}
                  disabled={page >= lastPage}
                  className="btn btn-outline-secondary pagination-btn"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericTrash;