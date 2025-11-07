import React, { useState, useEffect } from "react";
import { IoEyeSharp } from "react-icons/io5";
import { FaToggleOn, FaToggleOff, FaTrash } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiService } from "../../../services/apiService.ts";
import axios from "axios";
import Header from "../../../components/Header.tsx";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor để thêm token vào header Authorization
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface TeamJoin {
  id: number;
  team_id: number;
  user_id: number;
  approver_id?: number | null;
  message?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: number;
  requested_role?: "leader" | "translator" | "proofreader" | "cleaner";
  team?: { id: number; name: string };
  user?: { id: number; name: string };
  approver?: { id: number; name: string };
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ApiListResponse {
  status: boolean;
  message: string;
  teamjoins: TeamJoin[];
  pagination: Pagination;
}

interface ApiReplayResponse {
  status: boolean;
  message: string;
  teamjoin: TeamJoin;
}

const TeamJoinList: React.FC = () => {
  const [data, setData] = useState<TeamJoin[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof TeamJoin | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const [lastPage, setLastPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const limit = 15;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
        }

        const response = await apiClient.get<ApiListResponse>(
          `/teamjoins?page=${page}&limit=${limit}&search=${encodeURIComponent(
            searchTerm
          )}`
        );
        const responseData = response.data;
        if (responseData.status && responseData.teamjoins) {
          setData(responseData.teamjoins);
          setLastPage(responseData.pagination.last_page);
        } else {
          throw new Error("Không tìm thấy danh sách yêu cầu tham gia đội nhóm");
        }
      } catch (error: any) {
        toast.error(
          error.message || "Lỗi khi tải dữ liệu yêu cầu tham gia đội nhóm"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, searchTerm]);

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

  const filteredData = data; // Lọc đã được xử lý ở backend

  const handleSort = (key: keyof TeamJoin): void => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aValue: any = a[sortConfig.key];
    let bValue: any = b[sortConfig.key];

    if (sortConfig.key === "approver_id") {
      aValue = aValue ? "Đã duyệt" : "Chưa duyệt";
      bValue = bValue ? "Đã duyệt" : "Chưa duyệt";
    } else if (sortConfig.key === "status") {
      aValue = aValue !== undefined ? aValue : 0;
      bValue = bValue !== undefined ? bValue : 0;
    } else if (
      sortConfig.key === "created_at" ||
      sortConfig.key === "updated_at"
    ) {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    } else {
      aValue = aValue || "Không xác định";
      bValue = bValue || "Không xác định";
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
      toast.info("Vui lòng chọn ít nhất một yêu cầu để xóa.");
      return;
    }
    if (window.confirm("Bạn có chắc chắn muốn xóa các yêu cầu đã chọn?")) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
        }
        await apiService.softDeleteMultiple("teamjoins", selectedIds);
        setData((prev) =>
          prev.filter((item) => !selectedIds.includes(item.id))
        );
        setSelectedIds([]);
        toast.success("Xóa nhiều yêu cầu thành công!");
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi xóa yêu cầu");
      }
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (window.confirm("Bạn có chắc chắn muốn xóa yêu cầu này?")) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
        }
        await apiService.softDelete("teamjoins", id.toString());
        setData((prev) => prev.filter((item) => item.id !== id));
        toast.success("Xóa yêu cầu thành công!");
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi xóa yêu cầu");
      }
    }
  };

  const handleStatus = async (id: number): Promise<void> => {
    const item = data.find((item) => item.id === id);
    if (!item) return;
    const newStatus = item.status === 1 ? 2 : 1;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }
      await apiService.status("teamjoins", id.toString());
      setData((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item
        )
      );
      toast.success(
        `Cập nhật trạng thái yêu cầu thành ${
          newStatus === 1 ? "Đã duyệt" : "Bị từ chối"
        } thành công!`
      );
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi cập nhật trạng thái");
    }
  };

  const handleApprove = async (id: number): Promise<void> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }
      const response = await apiClient.post<ApiReplayResponse>(
        `/teamjoins/approve/${id}`
      );

      const data = response.data;

      if (data.status) {
        setData((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, approver_id: data.teamjoin.approver_id, status: 1 }
              : item
          )
        );

        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response.data.message||error.message || "Lỗi khi duyệt yêu cầu");
    }
  };

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
          .btn-info {
            background-color: #17a2b8;
            border-color: #17a2b8;
          }
          .btn-info:hover {
            background-color: #138496;
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
                  Quản lý Yêu cầu tham gia đội nhóm
                </li>
              </ol>
            </nav>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <input
              type="text"
              placeholder="Tìm kiếm yêu cầu..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              className="form-control w-25"
            />
            <button onClick={handleDeleteSelected} className="btn btn-danger">
              <MdDelete className="me-1" /> Xóa đã chọn
            </button>
          </div>

          <div className="card shadow rounded">
            <div className="card-body">
              <h2 className="card-title mb-4">
                Danh sách Yêu cầu tham gia đội nhóm
              </h2>
              <div className="mb-4 d-flex gap-2">
                <Link to="/admin/teamjoin/trash">
                  <button className="btn btn-danger">
                    <FaTrash className="me-1" /> Thùng rác
                  </button>
                </Link>
              </div>
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
                        <th
                          onClick={() => handleSort("id")}
                          style={{ cursor: "pointer" }}
                        >
                          ID{" "}
                          {sortConfig.key === "id" &&
                            (sortConfig.direction === "asc" ? "▲" : "▼")}
                        </th>
                        <th
                          onClick={() => handleSort("team_id")}
                          style={{ cursor: "pointer" }}
                        >
                          Đội nhóm{" "}
                          {sortConfig.key === "team_id" &&
                            (sortConfig.direction === "asc" ? "▲" : "▼")}
                        </th>
                        <th
                          onClick={() => handleSort("user_id")}
                          style={{ cursor: "pointer" }}
                        >
                          Người yêu cầu{" "}
                          {sortConfig.key === "user_id" &&
                            (sortConfig.direction === "asc" ? "▲" : "▼")}
                        </th>
                        <th
                          onClick={() => handleSort("requested_role")}
                          style={{ cursor: "pointer" }}
                        >
                          Vai trò yêu cầu{" "}
                          {sortConfig.key === "requested_role" &&
                            (sortConfig.direction === "asc" ? "▲" : "▼")}
                        </th>
                        <th
                          onClick={() => handleSort("approver_id")}
                          style={{ cursor: "pointer" }}
                        >
                          Người duyệt{" "}
                          {sortConfig.key === "approver_id" &&
                            (sortConfig.direction === "asc" ? "▲" : "▼")}
                        </th>
                        <th
                          onClick={() => handleSort("status")}
                          style={{ cursor: "pointer" }}
                        >
                          Trạng thái{" "}
                          {sortConfig.key === "status" &&
                            (sortConfig.direction === "asc" ? "▲" : "▼")}
                        </th>
                        <th>Duyệt</th>
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
                            <td>{item.id}</td>
                            <td>{item.team?.name || item.team_id}</td>
                            <td>{item.user?.name || item.user_id}</td>
                            <td>
                              {item.requested_role
                                ? {
                                    leader: "Trưởng nhóm",
                                    translator: "Dịch giả",
                                    proofreader: "Hiệu đính",
                                    cleaner: "Cleaner",
                                  }[item.requested_role]
                                : "Không xác định"}
                            </td>
                            <td>
                              {item.approver?.name ||
                                (item.approver_id
                                  ? item.approver_id
                                  : "Chưa duyệt")}
                            </td>
                            <td>
                              {item.status === 1 ? (
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleStatus(item.id)}
                                >
                                  <FaToggleOn className="me-1" /> Hoạt động
                                </button>
                              ) : item.status === 2 ? (
                                <button
                                  className="btn btn-warning  btn-sm"
                                  onClick={() => handleStatus(item.id)}
                                >
                                  <FaToggleOff className="me-1" />
                                  Đang theo dõi
                                </button>
                              ) : (
                                <button
                                  className="btn btn-danger  btn-sm"
                                  onClick={() => handleStatus(item.id)}
                                >
                                  <FaToggleOff className="me-1" /> Không hoạt
                                  động
                                </button>
                              )}
                            </td>
                            <td>
                              {item.approver_id ? (
                                <span className="text-success">Đã duyệt</span>
                              ) : (
                                <button
                                  className="btn btn-info btn-sm"
                                  onClick={() => handleApprove(item.id)}
                                >
                                  <FaToggleOff className="me-1" /> Chưa duyệt
                                </button>
                              )}
                            </td>
                            <td>
                              <Link
                                to={`/admin/teamjoin/show/${item.id}`}
                                className="btn btn-primary btn-sm m-1"
                              >
                                <IoEyeSharp className="me-1" /> Xem
                              </Link>

                              <button
                                className="btn btn-danger btn-sm m-1"
                                onClick={() => handleDelete(item.id)}
                              >
                                <MdDelete className="me-1" /> Xóa
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="no-data">
                            <p className="text-lg font-semibold">
                              Không có yêu cầu nào.
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

export default TeamJoinList;
