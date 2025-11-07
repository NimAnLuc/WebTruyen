import React, { useState, useEffect } from "react";
import { IoEyeSharp } from "react-icons/io5";
import { FaPlus, FaTrash } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTeamListConfig } from "../../../config/entityConfigs.tsx";
import { Team, Comic } from "../../../types/index";
import { apiService } from "../../../services/apiService.ts";
import Header from "../../../components/Header.tsx";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ApiListResponse<T> {
  status: boolean;
  message: string;
  pagination?: Pagination;
  data?: T[];
  teams?: Team[];
  comics?: Comic[];
}

const TeamActiveList: React.FC = () => {
  const { teamListConfig } = useTeamListConfig();
  const [data, setData] = useState<Team[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Team | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const [lastPage, setLastPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamComics, setTeamComics] = useState<Comic[]>([]);
  const [loadingComics, setLoadingComics] = useState<boolean>(false);
  const [errorComics, setErrorComics] = useState<string | null>(null);
  const limit = 15; // Số bản ghi mỗi trang

  // Lấy danh sách đội nhóm đang hoạt động
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = (await apiService.fetchList(
          `${teamListConfig.endpoint}?page=${page}&limit=${limit}&status=1`
        )) as unknown as ApiListResponse<Team>;

        const items = response.teams as Team[];
        const pagination = response.pagination as Pagination;

        if (response.status && items) {
          setData(items);
          setLastPage(pagination.last_page);
        } else {
          throw new Error("Không tìm thấy đội nhóm");
        }
      } catch (error) {
        toast.error("Lỗi khi tải dữ liệu đội nhóm");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, teamListConfig.endpoint]);

  // Lấy danh sách truyện của đội nhóm khi mở modal
  useEffect(() => {
    const fetchTeamComics = async () => {
      if (!selectedTeamId) {
        setTeamComics([]);
        setErrorComics(null);
        return;
      }

      setLoadingComics(true);
      setErrorComics(null);
      try {
        const response = (await apiService.fetchList(
          `comics?team_id=${selectedTeamId}&limit=100`
        )) as any as ApiListResponse<Comic>;

        const items = response.comics as Comic[];

        if (response.status && items) {
          setTeamComics(items);
        } else {
          throw new Error("Không tìm thấy truyện");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Lỗi khi tải truyện";
        setErrorComics(errorMessage);
        toast.error(errorMessage);
        setTeamComics([]);
      } finally {
        setLoadingComics(false);
      }
    };

    fetchTeamComics();
  }, [selectedTeamId]);

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
    if (!searchTerm || !teamListConfig.searchFields) return true;
    return teamListConfig.searchFields.some((field) => {
      const fieldConfig = teamListConfig.fields.find((f) => f.key === field);
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

  const handleSort = (key: keyof Team): void => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const fieldConfig = teamListConfig.fields.find(
      (f) => f.key === sortConfig.key
    );
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
      toast.info("Vui lòng chọn ít nhất một đội nhóm để xóa.");
      return;
    }
    if (window.confirm("Bạn có chắc chắn muốn xóa các đội nhóm đã chọn?")) {
      try {
        await apiService.softDeleteMultiple(
          teamListConfig.endpoint.toLowerCase(),
          selectedIds
        );
        setData((prev) =>
          prev.filter((item) => !selectedIds.includes(item.id))
        );
        setSelectedIds([]);
        toast.success("Xóa nhiều đội nhóm thành công!");
      } catch (error) {
        // Lỗi đã được xử lý trong apiService
      }
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đội nhóm này?")) {
      try {
        await apiService.softDelete(
          teamListConfig.endpoint.toLowerCase(),
          id.toString()
        );
        setData((prev) => prev.filter((item) => item.id !== id));
        toast.success("Xóa đội nhóm thành công!");
      } catch (error) {
        // Lỗi đã được xử lý trong apiService
      }
    }
  };

  const openComicsModal = (teamId: number) => {
    setSelectedTeamId(teamId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTeamId(null);
    setTeamComics([]);
    setErrorComics(null);
  };

  // Tạo danh sách các nút trang
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

            .modal {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 1000;
            }

            .modal-content {
              background: white;
              border-radius: 12px;
              padding: 2rem;
              max-width: 800px;
              width: 90%;
              max-height: 80vh;
              overflow-y: auto;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            }

            .modal-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 1rem;
            }

            .modal-close {
              background: none;
              border: none;
              font-size: 1.5rem;
              cursor: pointer;
              color: #6c757d;
            }

            .modal-close:hover {
              color: #dc3545;
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
                  Đội nhóm đang hoạt động
                </li>
              </ol>
            </nav>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <input
              type="text"
              placeholder="Tìm kiếm đội nhóm..."
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
                Danh sách đội nhóm đang hoạt động
              </h2>
              <div className="mb-4 d-flex gap-2">
                <Link to="/admin/team/add">
                  <button className="btn btn-success">
                    <FaPlus className="me-1" /> Thêm
                  </button>
                </Link>
                <Link to="/admin/team/trash">
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
                        {teamListConfig.fields.map((field) => (
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
                            {teamListConfig.fields.map((field) => (
                              <td key={String(field.key)}>
                                {field.render
                                  ? field.render(item[field.key], item)
                                  : String(item[field.key])}
                              </td>
                            ))}
                            <td >
                              <button
                                className="btn btn-primary btn-sm m-1"
                                onClick={() => openComicsModal(item.id)}
                              >
                                <IoEyeSharp className="me-1" /> Xem truyện
                              </button>
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
                          <td
                            colSpan={teamListConfig.fields.length + 1}
                            className="no-data"
                          >
                            <p className="text-lg font-semibold">
                              Không có đội nhóm nào đang hoạt động.
                            </p>
                            <p className="text-sm">
                              Hãy thêm đội nhóm mới để hiển thị danh sách.
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

      {/* Modal hiển thị danh sách truyện */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="text-xl font-semibold">
                Truyện của đội nhóm:{" "}
                {data.find((t) => t.id === selectedTeamId)?.name}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>
            {loadingComics ? (
              <LoadingAdmin />
            ) : errorComics ? (
              <p className="text-center text-red-500">Lỗi: {errorComics}</p>
            ) : teamComics.length === 0 ? (
              <p className="text-center text-gray-500">
                Không có truyện nào từ đội nhóm này.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Tiêu đề</th>
                      <th>Ảnh bìa</th>
                      <th>Lượt xem</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamComics.map((comic) => (
                      <tr key={comic.id}>
                        <td>{comic.id}</td>
                        <td>{comic.title || "Không có tiêu đề"}</td>
                        <td>
                          {comic.cover_image ? (
                            <img
                              src={`${comic.cover_image}`}
                              alt="Cover"
                              style={{ width: "50px" }}
                            />
                          ) : (
                            "Không có ảnh"
                          )}
                        </td>
                        <td>{comic.views?.toString() || "0"}</td>
                        <td>
                          {(() => {
                            const status = comic.status ?? -1; 
                            return (
                              {
                                0: "Không hoạt động",
                                1: "Hoạt động",
                                2: "Đang theo dõi",
                              }[status] || "Không xác định"
                            );
                          })()}
                        </td>
                        <td>
                          <Link
                            to={`/admin/comic/show/${comic.id}`}
                            className="btn btn-primary btn-sm"
                          >
                            <IoEyeSharp className="me-1" /> Xem
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamActiveList;
