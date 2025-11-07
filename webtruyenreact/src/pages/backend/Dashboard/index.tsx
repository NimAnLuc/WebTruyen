import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../../components/Header.tsx";

import * as XLSX from "xlsx";


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const MainDashboard = () => {

  const [stats, setStats] = useState({
    total_comics: 0,
    total_chapters: 0,
    total_users: 0,
    total_genres: 0,
    total_views: 0,
    comic_views: [] as {
      id: number;
      title: string;
      views: number;
      chapters_count: number;
      bookmark_count: number;
    }[],
    genre_distribution: [] as {
      id: number;
      name: string;
      comic_count: number;
    }[],
    current_month_bookmarks: 0,
    top_comics: [] as { id: number; title: string; bookmark_count: number }[],
    top_teams: [] as { id: number; name: string; chapter_count: number }[],
    top_comments: [] as { id: number; title: string; comment_count: number }[],
  });
  const navigate = useNavigate();

  // Hàm chuẩn hóa tên thể loại
  const normalizeGenreName = (name: string): string => {
    const genreMap: { [key: string]: string } = {
      Action: "Hành Động",
      "mạt thế": "Mạt Thế",
      manhua: "Manhua",
      "đô thị": "Đô Thị",
      "Truyện Màu": "Truyện Màu",
    };
    const normalized =
      genreMap[name] ||
      name
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    return normalized;
  };
  // Thêm hàm xuất Excel cho Top 5 Thể Loại
  const handleExportGenres = () => {
    const data = stats.genre_distribution.map((genre, index) => ({
      Top: index + 1,
      "Tên Thể Loại": genre.name,
      "Số Truyện": genre.comic_count,
    }));
    exportToExcel(data, "Top_5_The_Loai", "Top Genres");
  };
  // Hàm xuất dữ liệu sang Excel
  const exportToExcel = (data: any[], fileName: string, sheetName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  // Hàm xử lý tải Excel cho từng loại bảng
  const handleExportViews = () => {
    const data = stats.comic_views.map((comic, index) => ({
      Top: index + 1,
      "Tiêu Đề": comic.title,
      "Lượt Xem": comic.views,
      "Số Chương": comic.chapters_count,
      "Lượt đánh dấu": comic.bookmark_count,
    }));
    exportToExcel(data, "Top_5_Truyen_Luot_Xem", "Top Views");
  };

  const handleExportBookmarks = () => {
    const data = stats.top_comics.map((comic, index) => ({
      Top: index + 1,
      "Tiêu Đề": comic.title,
      "Lượt Theo Dõi": comic.bookmark_count,
    }));
    exportToExcel(data, "Top_5_Truyen_Theo_Doi", "Top Bookmarks");
  };

  const handleExportComments = () => {
    const data = stats.top_comments.map((comic, index) => ({
      Top: index + 1,
      "Tiêu Đề": comic.title,
      "Lượt Bình Luận": comic.comment_count,
    }));
    exportToExcel(data, "Top_5_Truyen_Binh_Luan", "Top Comments");
  };

  const handleExportTeams = () => {
    const data = stats.top_teams.map((team, index) => ({
      Top: index + 1,
      "Tên Nhóm": team.name,
      "Số Chương": team.chapter_count,
    }));
    exportToExcel(data, "Top_5_Nhom_Dang_Chuong", "Top Teams");
  };

  // Gọi API và kiểm tra đăng nhập
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || !user.role) {
      navigate("/admin/login");
    } else {
      axios
        .get(`${API_BASE_URL}/dashboard`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then((response) => {
          if (response.data.status) {
            // Chuẩn hóa dữ liệu từ API
            const data = {
              ...response.data.data,
              total_views: parseInt(response.data.data.total_views, 10) || 0,
              genre_distribution: Array.isArray(
                response.data.data.genre_distribution
              )
                ? response.data.data.genre_distribution.map((genre: any) => ({
                    id: genre.id,
                    name: normalizeGenreName(genre.name),
                    comic_count: genre.comic_count,
                  }))
                : [],
            };
            setStats(data);
          }
        })
        .catch((error) => {
          console.error("Lỗi khi tải thống kê:", error);
          if (error.response?.status === 401) {
            navigate("/admin/login");
          }
        });
    }
  }, [navigate]);


  return (
    <div>
      <style>
        {`
          .stat-card {
            position: relative;
            background: #ffffff;
            border-radius: 12px;
            padding: 20px;
            color: #1f2937;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
          }
          .stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
          }
          .stat-value {
            font-size: 1.8rem;
            font-weight: 600;
            margin-bottom: 5px;
            color: #1f2937;
          }
          .stat-label {
            font-size: 0.9rem;
            font-weight: 500;
            color: #4b5563;
          }
          .progress-ring {
            width: 60px;
            height: 60px;
          }
          .chart-card {
            background: #ffffff;
            border-radius: 12px;
            padding: 20px;
            color: #1f2937;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
          }
          .header-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: #1f2937;
            background: #f3f4f6;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s;
          }
          .header-icon:hover {
            background: #e5e7eb;
          }
          .table-card {
            background: #ffffff;
            border-radius: 12px;
            padding: 20px;
            color: #1f2937;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
          }
          .table-card table {
            width: 100%;
            border-collapse: collapse;
          }
          .table-card th,
          .table-card td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          .table-card th {
            background: #e6fffa;
            color: #059669;
            font-weight: 600;
          }
          .table-card tr:hover {
            background: #f3f4f6;
          }
        `}
      </style>

      <Header
        title="Bảng Điều Khiển"
        description="Quản lý website truyện tranh"
      />

      {/* Dòng 1: 4 cột cho tổng số truyện, chương, người dùng, thể loại */}
      <div className="row row-cols-1 row-cols-md-4 g-4 mb-4">
        <div className="col">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div
                className="stat-icon"
                style={{
                  background: "#d1fae5",
                  color: "#059669",
                }}
              >
                <i className="fas fa-book"></i>
              </div>
            </div>
            <div className="stat-value">
              {stats.total_comics.toLocaleString()} Truyện
            </div>
            <div className="stat-label text-emerald-600 opacity-75">
              Tổng số truyện
            </div>
            <svg
              className="progress-ring"
              style={{ position: "absolute", top: "20px", right: "20px" }}
            >
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="#d1fae5"
                strokeWidth="4"
              />
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="#059669"
                strokeWidth="4"
                strokeDasharray="157"
                strokeDashoffset="39"
                transform="rotate(-90 30 30)"
              />
            </svg>
          </div>
        </div>
        <div className="col">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div
                className="stat-icon"
                style={{
                  background: "#dbeafe",
                  color: "#2563eb",
                }}
              >
                <i className="fas fa-file-alt"></i>
              </div>
            </div>
            <div className="stat-value">
              {stats.total_chapters.toLocaleString()} Chương
            </div>
            <div className="stat-label text-emerald-600 opacity-75">
              Tổng số chương
            </div>
            <svg
              className="progress-ring"
              style={{ position: "absolute", top: "20px", right: "20px" }}
            >
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="#dbeafe"
                strokeWidth="4"
              />
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="#2563eb"
                strokeWidth="4"
                strokeDasharray="157"
                strokeDashoffset="47"
                transform="rotate(-90 30 30)"
              />
            </svg>
          </div>
        </div>
        <div className="col">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div
                className="stat-icon"
                style={{
                  background: "#e0e7ff",
                  color: "#4f46e5",
                }}
              >
                <i className="fas fa-users"></i>
              </div>
            </div>
            <div className="stat-value">
              {stats.total_users.toLocaleString()} Người Dùng
            </div>
            <div className="stat-label text-emerald-600 opacity-75">
              Tổng số người dùng
            </div>
            <svg
              className="progress-ring"
              style={{ position: "absolute", top: "20px", right: "20px" }}
            >
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="#e0e7ff"
                strokeWidth="4"
              />
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="#4f46e5"
                strokeWidth="4"
                strokeDasharray="157"
                strokeDashoffset="78"
                transform="rotate(-90 30 30)"
              />
            </svg>
          </div>
        </div>
        <div className="col">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div
                className="stat-icon"
                style={{
                  background: "#ede9fe",
                  color: "#7c3aed",
                }}
              >
                <i className="fas fa-tags"></i>
              </div>
            </div>
            <div className="stat-value">
              {stats.total_genres.toLocaleString()} Thể Loại
            </div>
            <div className="stat-label text-emerald-600 opacity-75">
              Tổng số thể loại
            </div>
            <svg
              className="progress-ring"
              style={{ position: "absolute", top: "20px", right: "20px" }}
            >
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="#ede9fe"
                strokeWidth="4"
              />
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="#7c3aed"
                strokeWidth="4"
                strokeDasharray="157"
                strokeDashoffset="24"
                transform="rotate(-90 30 30)"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Dòng 2: 2 cột cho tổng lượt xem và lượt theo dõi tháng này */}
      <div className="row row-cols-1 row-cols-md-2 g-4 mb-4">
        <div className="col">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div
                className="stat-icon"
                style={{
                  background: "#ffe4e6",
                  color: "#e11d48",
                }}
              >
                <i className="fas fa-eye"></i>
              </div>
            </div>
            <div className="stat-value">
              {stats.total_views.toLocaleString()} Lượt Xem
            </div>
            <div className="stat-label text-emerald-600 opacity-75">
              Tổng số lượt xem
            </div>
            <svg
              className="progress-ring"
              style={{ position: "absolute", top: "20px", right: "20px" }}
            >
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="#ffe4e6"
                strokeWidth="4"
              />
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="#e11d48"
                strokeWidth="4"
                strokeDasharray="157"
                strokeDashoffset="31"
                transform="rotate(-90 30 30)"
              />
            </svg>
          </div>
        </div>
        <div className="col">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div
                className="stat-icon"
                style={{
                  background: "#dbeafe",
                  color: "#2563eb",
                }}
              >
                <i className="fas fa-bookmark"></i>
              </div>
            </div>
            <div className="stat-value">
              {stats.current_month_bookmarks.toLocaleString()} Lượt Theo Dõi
            </div>
            <div className="stat-label text-emerald-600 opacity-75">
              Theo dõi tháng này
            </div>
            <svg
              className="progress-ring"
              style={{ position: "absolute", top: "20px", right: "20px" }}
            >
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="#dbeafe"
                strokeWidth="4"
              />
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="#2563eb"
                strokeWidth="4"
                strokeDasharray="157"
                strokeDashoffset="28"
                transform="rotate(-90 30 30)"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Dòng 3: 1 cột cho top truyện có lượt xem cao nhất */}
      <div className="row row-cols-1 g-4 mb-4">
        <div className="col">
          <div className="table-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <div className="fs-5 fw-bold">
                  Top 5 Truyện Có Nhiều Lượt Xem Nhất
                </div>
              </div>
              <div
                className="header-icon"
                onClick={handleExportViews}
                title="Tải xuống Excel"
              >
                <i className="fas fa-download"></i>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Top</th>
                  <th>Tiêu Đề</th>
                  <th>Lượt Xem</th>
                  <th>Số chương</th>
                  <th>Lượt đánh dấu</th>
                </tr>
              </thead>
              <tbody>
                {stats.comic_views.length > 0 ? (
                  stats.comic_views.map((comic, index) => (
                    <tr key={comic.id}>
                      <td>Top {index + 1}</td>
                      <td>{comic.title}</td>
                      <td>{comic.views.toLocaleString()}</td>
                      <td>{comic.chapters_count.toLocaleString()}</td>
                      <td>{comic.bookmark_count.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>Không có truyện nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dòng 4: 1 cột cho top truyện theo dõi và bình luận */}
      <div className="row row-cols-1 g-4 mb-4">
        <div className="col">
          <div className="table-card">
            <div className="fs-5 fw-bold mb-3">Top Truyện Nổi Bật</div>
            <div className="row">
              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="fs-6 fw-bold">
                    Top 5 Truyện Có Nhiều Lượt Theo Dõi Nhất
                  </div>
                  <div
                    className="header-icon"
                    onClick={handleExportBookmarks}
                    title="Tải xuống Excel"
                  >
                    <i className="fas fa-download"></i>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Top</th>
                      <th>Tiêu Đề</th>
                      <th>Lượt Theo Dõi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_comics.length > 0 ? (
                      stats.top_comics.map((comic, index) => (
                        <tr key={comic.id}>
                          <td>Top {index + 1}</td>
                          <td>{comic.title}</td>
                          <td>{comic.bookmark_count.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3}>Không có truyện nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="fs-6 fw-bold">
                    Top 5 Truyện Có Nhiều Bình Luận Nhất
                  </div>
                  <div
                    className="header-icon"
                    onClick={handleExportComments}
                    title="Tải xuống Excel"
                  >
                    <i className="fas fa-download"></i>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Top</th>
                      <th>Tiêu Đề</th>
                      <th>Lượt Bình Luận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_comments.length > 0 ? (
                      stats.top_comments.map((comic, index) => (
                        <tr key={comic.id}>
                          <td>Top {index + 1}</td>
                          <td>{comic.title}</td>
                          <td>{comic.comment_count.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3}>Không có truyện nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dòng 5: 2 cột cho top thể loại và top nhóm, ẩn top thể loại nếu không phải admin */}
      <div className="row row-cols-1 row-cols-md-2 g-4">
        <div className="col-md-6">
          <div className="table-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="fs-5 fw-bold">
                Top 5 Thể Loại Có Nhiều Truyện Nhất
              </div>
              <div
                className="header-icon"
                onClick={handleExportGenres}
                title="Tải xuống Excel"
              >
                <i className="fas fa-download"></i>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Top</th>
                  <th>Tên Thể Loại</th>
                  <th>Số Truyện</th>
                </tr>
              </thead>
              <tbody>
                {stats.genre_distribution.length > 0 ? (
                  stats.genre_distribution.map((genre, index) => (
                    <tr key={genre.id}>
                      <td>Top {index + 1}</td>
                      <td>{genre.name}</td>
                      <td>{genre.comic_count.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>Không có thể loại nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-md-6">
          <div className="table-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="fs-5 fw-bold">
                Top 5 Nhóm Đăng Nhiều Chương Nhất
              </div>
              <div
                className="header-icon"
                onClick={handleExportTeams}
                title="Tải xuống Excel"
              >
                <i className="fas fa-download"></i>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Top</th>
                  <th>Tên Nhóm</th>
                  <th>Số Chương</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_teams.length > 0 ? (
                  stats.top_teams.map((team, index) => (
                    <tr key={team.id}>
                      <td>Top {index + 1}</td>
                      <td>{team.name}</td>
                      <td>{team.chapter_count.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>Không có nhóm nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
