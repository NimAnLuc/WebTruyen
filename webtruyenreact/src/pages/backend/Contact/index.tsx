import React, { useState, useEffect } from "react";
import { IoEyeSharp } from "react-icons/io5";
import {
  FaToggleOn,
  FaToggleOff,
  FaEdit,
  FaTrash,
  FaPlus,
} from "react-icons/fa";
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

interface Contact {
  id: number;
  name: string | null;
  title: string | null;
  status: number;
  replay_id: number | null;
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
  contacts: Contact[];
  pagination: Pagination;
}

interface ApiReplayResponse {
  status: boolean;
  message: string;
  contact: Contact;
}

const ContactList: React.FC = () => {
  const [data, setData] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Contact | null;
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
        const token = localStorage.getItem("token"); // lấy token
        const response = await apiClient.get<ApiListResponse>(
          `/contacts?page=${page}&limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // thêm token vào header
            },
          }
        );
        const responseData = response.data;
        if (responseData.status && responseData.contacts) {
          setData(responseData.contacts);
          setLastPage(responseData.pagination.last_page);
        } else {
          throw new Error("Không tìm thấy danh sách liên hệ");
        }
      } catch (error) {
        toast.error("Lỗi khi tải dữ liệu liên hệ");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page]);

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
    if (!searchTerm) return true;
    const fields = [item.name || "", item.title || ""];
    return fields.some((value) =>
      removeVietnameseTones(value.toLowerCase()).includes(
        removeVietnameseTones(searchTerm.toLowerCase())
      )
    );
  });

  const handleSort = (key: keyof Contact): void => {
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

    if (sortConfig.key === "replay_id") {
      aValue = aValue ? "Đã trả lời" : "Chưa trả lời";
      bValue = bValue ? "Đã trả lời" : "Chưa trả lời";
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
      toast.info("Vui lòng chọn ít nhất một liên hệ để xóa.");
      return;
    }
    if (window.confirm("Bạn có chắc chắn muốn xóa các liên hệ đã chọn?")) {
      try {
        await apiService.softDeleteMultiple("contacts", selectedIds);
        setData((prev) =>
          prev.filter((item) => !selectedIds.includes(item.id))
        );
        setSelectedIds([]);
        toast.success("Xóa nhiều liên hệ thành công!");
      } catch (error) {
        toast.error("Lỗi khi xóa liên hệ");
      }
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (window.confirm("Bạn có chắc chắn muốn xóa liên hệ này?")) {
      try {
        await apiService.softDelete("contacts", id.toString());
        setData((prev) => prev.filter((item) => item.id !== id));
        toast.success("Xóa liên hệ thành công!");
      } catch (error) {
        toast.error("Lỗi khi xóa liên hệ");
      }
    }
  };

  const handleStatus = async (id: number): Promise<void> => {
    const item = data.find((item) => item.id === id);
    if (!item) return;
    const newStatus = item.status === 1 ? 2 : 1;
    try {
      await apiService.status("contacts", id.toString());
      setData((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item
        )
      );
      toast.success(
        `Cập nhật trạng thái liên hệ thành ${
          newStatus === 1 ? "Hoạt động" : "Đang theo dõi"
        } thành công!`
      );
    } catch (error) {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleReply = async (id: number): Promise<void> => {
    try {
      const response = await apiClient.post<ApiReplayResponse>(
        `/contacts/replay/${id}`
      );
      const data = response.data;
      if (data.status) {
        setData((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, replay_id: data.contact.replay_id }
              : item
          )
        );
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Lỗi khi cập nhật trạng thái trả lời");
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
                  Quản lý Liên hệ
                </li>
              </ol>
            </nav>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <input
              type="text"
              placeholder="Tìm kiếm liên hệ..."
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
              <h2 className="card-title mb-4">Danh sách Liên hệ</h2>
              <div className="mb-4 d-flex gap-2">
                <Link to="/admin/contact/add">
                  <button className="btn btn-success">
                    <FaPlus className="me-1" /> Thêm
                  </button>
                </Link>
                <Link to="/admin/contact/trash">
                  <button className="btn btn-danger">
                    <FaTrash className="me-1" /> Thùng rác
                  </button>
                </Link>
              </div>
              {loading ? (
                <LoadingAdmin />
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
                          onClick={() => handleSort("name")}
                          style={{ cursor: "pointer" }}
                        >
                          Tên{" "}
                          {sortConfig.key === "name" &&
                            (sortConfig.direction === "asc" ? "▲" : "▼")}
                        </th>
                        <th
                          onClick={() => handleSort("title")}
                          style={{ cursor: "pointer" }}
                        >
                          Tiêu đề{" "}
                          {sortConfig.key === "title" &&
                            (sortConfig.direction === "asc" ? "▲" : "▼")}
                        </th>
                        <th
                          onClick={() => handleSort("replay_id")}
                          style={{ cursor: "pointer" }}
                        >
                          Trạng thái trả lời{" "}
                          {sortConfig.key === "replay_id" &&
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
                        <th>Trả lời</th>
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
                            <td>{item.name || "Không xác định"}</td>
                            <td>{item.title || "Không xác định"}</td>
                            <td>
                              {item.replay_id ? "Đã trả lời" : "Chưa trả lời"}
                            </td>
                            <td>
                              {item.status === 1 ? (
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleStatus(item.id)}
                                >
                                  <FaToggleOn className="me-1" /> Hoạt động
                                </button>
                              ) : (
                                <button
                                  className="btn btn-warning btn-sm"
                                  onClick={() => handleStatus(item.id)}
                                >
                                  <FaToggleOff className="me-1" /> Đang theo dõi
                                </button>
                              )}
                            </td>
                            <td>
                              {item.replay_id ? (
                                <span className="text-success">Đã trả lời</span>
                              ) : (
                                <button
                                  className="btn btn-info btn-sm"
                                  onClick={() => handleReply(item.id)}
                                >
                                  <FaToggleOff className="me-1" /> Chưa trả lời
                                </button>
                              )}
                            </td>
                            <td>
                              <Link
                                to={`/admin/contact/show/${item.id}`}
                                className="btn btn-primary btn-sm m-1"
                              >
                                <IoEyeSharp className="me-1" /> Xem
                              </Link>
                              <Link
                                to={`/admin/contact/edit/${item.id}`}
                                className="btn btn-warning btn-sm m-1"
                              >
                                <FaEdit className="me-1" /> Sửa
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
                          <td colSpan={8} className="no-data">
                            <p className="text-lg font-semibold">
                              Không có liên hệ nào.
                            </p>
                            <p className="text-sm">
                              Hãy thêm liên hệ mới để hiển thị danh sách.
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

export default ContactList;
