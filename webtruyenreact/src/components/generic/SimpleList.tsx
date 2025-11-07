import React, { useState, useEffect } from "react";
import { IoEyeSharp } from "react-icons/io5";
import { FaToggleOn, FaToggleOff, FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { EntityConfig } from "../../types/index";
import { apiService } from "../../services/apiService.ts";
import Header from "../Header.tsx";
import LoadingAdmin from "../Loading/loadingadmin.tsx";

interface SimpleListProps<T> {
  config: EntityConfig<T>;
  lookupData?: Record<string, any[]>;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ApiListResponse<T> {
  status: boolean;
  message: string;
  [key: string]: T[] | Pagination | boolean | string;
}

const SimpleList = <T extends { id: number; status?: number }>({
  config,
  lookupData = {},
}: SimpleListProps<T>) => {
  const [data, setData] = useState<T[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const [lastPage, setLastPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const limit = 15; // Số bản ghi mỗi trang

  // Lấy user role từ localStorage
  const userRole = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!).role
    : null;

  // Lấy dữ liệu từ API khi page thay đổi
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiService.fetchList<ApiListResponse<T>>(
          `${config.endpoint}?page=${page}&limit=${limit}`
        );
        const entityName = config.entityName.toLowerCase() + "s"; // bookmarks, chapters
        const items = response[entityName] as T[];
        const pagination = response.pagination as Pagination;

        if (response.status && items) {
          setData(items);
          setLastPage(pagination.last_page);
        } else {
          throw new Error(`Không tìm thấy ${entityName}`);
        }
      } catch (error) {
        toast.error(`Lỗi khi tải dữ liệu ${config.entityName.toLowerCase()}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, config.endpoint, config.entityName]);

  const removeVietnameseTones = (str: string): string => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  };

  const handleCheckboxChange = (id: number): void => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.checked) {
      const allIds = filteredData.map((item) => item.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const filteredData = data.filter((item) => {
    if (!searchTerm || !config.searchFields) return true;
    return config.searchFields.some((field) => {
      const fieldConfig = config.fields.find((f) => f.key === field);
      let value: any;
      if (fieldConfig?.render) {
        const renderedValue = fieldConfig.render(item[field], item);
        value =
          typeof renderedValue === "string"
            ? renderedValue
            : String(renderedValue);
      } else {
        value = String(item[field]);
      }
      return removeVietnameseTones(value.toLowerCase()).includes(
        removeVietnameseTones(searchTerm.toLowerCase())
      );
    });
  });

  const handleSort = (key: keyof T): void => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const fieldConfig = config.fields.find((f) => f.key === sortConfig.key);
    let aValue: any;
    let bValue: any;
    if (fieldConfig?.render) {
      aValue = String(fieldConfig.render(a[sortConfig.key], a)).toLowerCase();
      bValue = String(fieldConfig.render(b[sortConfig.key], b)).toLowerCase();
    } else {
      aValue = a[sortConfig.key];
      bValue = b[sortConfig.key];
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
    }
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
    if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleDeleteSelected = async (): Promise<void> => {
    if (selectedIds.length === 0) {
      toast.info(
        `Vui lòng chọn ít nhất một ${config.entityName.toLowerCase()} để xóa.`
      );
      return;
    }
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa các ${config.entityName.toLowerCase()} đã chọn?`
      )
    ) {
      try {
        await apiService.permanentDeleteMultiple(
          config.endpoint.toLowerCase(),
          selectedIds
        );
        setData((prev) =>
          prev.filter((item) => !selectedIds.includes(item.id))
        );
        setSelectedIds([]);
        toast.success(
          `Xóa nhiều ${config.entityName.toLowerCase()} thành công!`
        );
      } catch (error) {
        // Lỗi đã được xử lý trong apiService
      }
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa ${config.entityName.toLowerCase()} này?`
      )
    ) {
      try {
        await apiService.permanentDelete(
          config.endpoint.toLowerCase(),
          id.toString()
        );
        setData((prev) => prev.filter((item) => item.id !== id));
        toast.success(`Xóa ${config.entityName.toLowerCase()} thành công!`);
      } catch (error) {
        // Lỗi đã được xử lý trong apiService
      }
    }
  };

  const handleStatus = async (id: number): Promise<void> => {
    if (!config.statusField) {
      toast.error(
        "Không thể cập nhật trạng thái vì không có trường trạng thái được định nghĩa."
      );
      return;
    }
    const item = data.find((item) => item.id === id);
    if (!item) return;
    const currentStatus = item[config.statusField as keyof T] as number;
    const newStatus = currentStatus === 1 ? 2 : 1;
    try {
      await apiService.status(config.endpoint.toLowerCase(), id.toString());
      setData((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, [config.statusField as keyof T]: newStatus }
            : item
        )
      );
      toast.success(
        `Cập nhật trạng thái ${config.entityName.toLowerCase()} thành ${
          newStatus === 1 ? "Hoạt động" : "Đang theo dõi"
        } thành công!`
      );
    } catch (error) {
      // Lỗi đã được xử lý trong apiService
    }
  };

  // Tạo danh sách các nút trang, tối đa 8 trang
  const maxPagesToShow = 8;
  const pageNumbers: (number | string)[] = [];
  if (lastPage <= maxPagesToShow) {
    for (let i = 1; i <= lastPage; i++) {
      pageNumbers.push(i);
    }
  } else {
    const leftSibling = Math.max(3, page - 2);
    const rightSibling = Math.min(lastPage - 1, page + 2);

    pageNumbers.push(1);
    if (leftSibling > 3) {
      pageNumbers.push("...");
    } else {
      pageNumbers.push(2);
    }

    for (let i = leftSibling; i <= rightSibling; i++) {
      pageNumbers.push(i);
    }

    if (rightSibling < lastPage - 1) {
      pageNumbers.push("...");
    }
    if (rightSibling < lastPage) {
      pageNumbers.push(lastPage);
    }
  }

  return (
    <div className="container-fluid entity-list-container">
      <style>
        {`
          .entity-list-container {
            padding: 2rem;
            background-color: #f4f7fa;
            min-height: 100vh;
          }

          .download-btn {
            background-color: #28a745;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
          }

          .download-btn:hover {
            background-color: #218838;
            transform: translateY(-2px);
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

          .form-control {
            border-radius: 8px;
            padding: 0.75rem;
            border: 1px solid #ced4da;
            transition: all 0.3s ease;
          }

          .form-control:focus {
            border-color: #3498db;
            box-shadow: 0 0 8px rgba(52, 152, 219, 0.3);
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

          .btn-primary {
            background-color: #3498db;
            border-color: #3498db;
          }

          .btn-primary:hover {
            background-color: #2980b9;
            transform: translateY(-2px);
          }

          .btn-warning {
            background-color: #f39c12;
            border-color: #f39c12;
          }

          .btn-warning:hover {
            background-color: #e67e22;
            transform: translateY(-2px);
          }

          .btn-page {
            background-color: #3498db;
            color: white;
            margin: 0 5px;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-weight: 500;
            transition: all 0.3s ease;
          }

          .btn-page:hover {
            background-color: #2980b9;
            transform: translateY(-2px);
          }

          .btn-page.active {
            background-color: #1c6ea4;
            font-weight: 700;
          }

          .btn-page:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .btn-ellipsis {
            background-color: transparent;
            color: #6c757d;
            cursor: default;
            margin: 0 5px;
            padding: 0.5rem 1rem;
            font-weight: 500;
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

          .table th:hover {
            background-color: #e9ecef;
            cursor: pointer;
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

      <Header title="Bảng điều khiển" description="Quản lý website truyện" />

      <div className="row">
        <div className="col-12 bg-white p-4 rounded card">
          <div className="card-body p-0">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/">Home</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Quản lý {config.entityName}
                </li>
              </ol>
            </nav>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <input
              type="text"
              placeholder={`Tìm kiếm ${config.entityName.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              className="form-control w-25"
            />
            {userRole !== "team" && ( // Ẩn nút "Xóa đã chọn" nếu user.role là team
              <button onClick={handleDeleteSelected} className="btn btn-danger">
                <MdDelete className="me-1" /> Xóa đã chọn
              </button>
            )}
          </div>

          <div className="card shadow rounded">
            <div className="card-body">
              <h2 className="card-title mb-4">Danh sách {config.entityName}</h2>
              {loading ? (
                <LoadingAdmin/>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            onChange={handleSelectAll}
                            checked={
                              filteredData.length > 0 &&
                              selectedIds.length === filteredData.length
                            }
                          />
                        </th>
                        {config.fields.map((field) => (
                          <th
                            key={String(field.key)}
                            onClick={() =>
                              field.sortable && handleSort(field.key)
                            }
                            style={{
                              cursor: field.sortable ? "pointer" : "default",
                            }}
                          >
                            {field.label}{" "}
                            {sortConfig.key === field.key &&
                              field.sortable &&
                              (sortConfig.direction === "asc" ? "▲" : "▼")}
                          </th>
                        ))}
                        {config.statusField && <th>Trạng thái</th>}
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedData.length > 0 ? (
                        sortedData.map((item) => (
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
                            {config.statusField && (
                              <td>
                                {(item[
                                  config.statusField as keyof T
                                ] as number) === 1 ? (
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleStatus(item.id)}
                                  >
                                    <FaToggleOn className="me-1" />{" "}
                                    {config.statusLabels?.[1] || "Hoạt động"}
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-warning btn-sm"
                                    onClick={() => handleStatus(item.id)}
                                  >
                                    <FaToggleOff className="me-1" />{" "}
                                    {config.statusLabels?.[2] ||
                                      "Đang theo dõi"}
                                  </button>
                                )}
                              </td>
                            )}
                            <td>
                              <Link
                                to={`/admin/${config.entityName.toLowerCase()}/show/${
                                  item.id
                                }`}
                                className="btn btn-primary btn-sm m-1"
                              >
                                <IoEyeSharp className="me-1" /> Xem
                              </Link>
                              {userRole !== "team" && (
                                <Link
                                  to={`/admin/${config.entityName.toLowerCase()}/edit/${
                                    item.id
                                  }`}
                                  className="btn btn-warning btn-sm m-1"
                                >
                                  <FaEdit className="me-1" /> Sửa
                                </Link>
                              )}
                              {userRole !== "team" && ( // Ẩn nút "Xóa vĩnh viễn" nếu user.role là team
                                <button
                                  className="btn btn-danger btn-sm m-1"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <MdDelete className="me-1" /> Xóa vĩnh viễn
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={
                              config.fields.length +
                              (config.statusField ? 2 : 1)
                            }
                            className="no-data"
                          >
                            <p className="text-lg font-semibold">
                              Không có {config.entityName.toLowerCase()} nào.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="d-flex justify-content-center mt-4 gap-3">
                <button
                  onClick={() =>
                    setSearchParams({ page: (page - 1).toString() })
                  }
                  disabled={page <= 1 || loading}
                  className="btn btn-outline-secondary pagination-btn"
                >
                  Trước
                </button>
                {pageNumbers.map((pageNum, index) => (
                  <button
                    key={`${pageNum}-${index}`}
                    onClick={() =>
                      typeof pageNum === "number" &&
                      setSearchParams({ page: pageNum.toString() })
                    }
                    className={`btn ${
                      pageNum === "..." ? "btn-ellipsis" : "btn-page"
                    } ${pageNum === page ? "active" : ""}`}
                    disabled={pageNum === "..." || loading}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setSearchParams({ page: (page + 1).toString() })
                  }
                  disabled={page >= lastPage || loading}
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

export default SimpleList;
