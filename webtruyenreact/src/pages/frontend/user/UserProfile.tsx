import React, { useEffect, useState } from "react";
import { apiService } from "../../../services/apiService.ts";
import { toast } from "react-toastify";
import UpdateProfile from "./UpdateProfile.tsx";
import UpdateAccount from "./UpdateAccount.tsx";
import { useLocation, useNavigate } from "react-router-dom";
export interface ApiResponse {
  status: boolean;
  message?: string;
  user?: [];
  followed_comics?: [];
  comments?: [];
}

const UserProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [followList, setFollowList] = useState<any[]>([]);
  const [commentList, setCommentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const filteredList = followList.filter(
    (item) => !filterStatus || item.comic_status === filterStatus
  );
  // ✅ Nếu không có token thì logout + chuyển hướng
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.warning("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!");

      navigate("/");
    }
  }, [navigate]);

  // ✅ Khi có query ?tab=... thì đổi tab tương ứng
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (["follow", "comment", "account", "profile"].includes(tab || "")) {
      setActiveTab(tab || "profile");
    }
  }, [location.search]);

  // ✅ Tải thông tin user
  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadProfile = async () => {
    try {
      const res = await apiService.getUserProfile<ApiResponse>();
      if (res.status) setUserProfile(res.user);
    } catch (error) {
      toast.error("Không thể tải thông tin người dùng!");
    }
  };

  const loadTabData = async () => {
    try {
      setLoading(true);
      if (activeTab === "follow") {
        const res = await apiService.getFollowedComics<ApiResponse>();
        if (res.status) setFollowList(res.followed_comics || []);
      } else if (activeTab === "comment") {
        const res = await apiService.getUserComments<ApiResponse>();
        if (res.status) setCommentList(res.comments || []);
      }
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (comicId: number) => {
    if (!window.confirm("Bạn có chắc muốn bỏ theo dõi truyện này?")) return;
    try {
      await apiService.removeBookmark(comicId);
      toast.success("Đã bỏ theo dõi truyện!");
      setFollowList((prev) => prev.filter((c) => c.id !== comicId));
    } catch (error: any) {
      toast.error(error.message || "Không thể bỏ theo dõi!");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    try {
      await apiService.deleteComment(commentId);
      toast.success("🗑 Xóa bình luận thành công!");
      setCommentList((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error: any) {
      toast.error(error.message || "Không thể xóa bình luận!");
    }
  };

  return (
    <div className="container my-4">
      {/* --- Hồ sơ người dùng --- */}
      {userProfile ? (
        <div className="card mb-4 shadow-sm">
          <div className="card-body d-flex align-items-center gap-3 flex-wrap">
            <img
              src={
                userProfile.image_url
                  ? `${userProfile.image_url}`
                  : "/images/logo.png"
              }
              alt={userProfile.name}
              className="rounded-circle border shadow-sm object-fit-cover"
              width="100"
              height="100"
            />

            <div>
              <h3 className="mb-1">{userProfile.name}</h3>
              📅 Tham gia:{" "}
              {new Date(userProfile.created_at).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      ) : (
        <p>Đang tải hồ sơ...</p>
      )}

      {/* --- Tabs --- */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            🧑‍💻 Thông tin cá nhân
          </button>
        </li>

        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "account" ? "active" : ""}`}
            onClick={() => setActiveTab("account")}
          >
            🔒 Cập nhật tài khoản
          </button>
        </li>

        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "follow" ? "active" : ""}`}
            onClick={() => setActiveTab("follow")}
          >
            📖 Truyện đang theo dõi
          </button>
        </li>

        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "comment" ? "active" : ""}`}
            onClick={() => setActiveTab("comment")}
          >
            💬 Bình luận của tôi
          </button>
        </li>
      </ul>

      {/* --- Nội dung tab --- */}
      {loading && (activeTab === "follow" || activeTab === "comment") ? (
        <p>Đang tải dữ liệu...</p>
      ) : activeTab === "profile" ? (
        <UpdateProfile onProfileUpdated={loadProfile} />
      ) : activeTab === "account" ? (
        <UpdateAccount />
      ) : activeTab === "follow" ? (
        /* --- Truyện theo dõi --- */
        <div className="p-3">
          <h4 className="fw-bold text-uppercase border-bottom pb-2">
            📚 Truyện đang theo dõi
          </h4>

          {/* Bộ lọc trạng thái */}
          <div className="d-flex align-items-center gap-2 mt-3">
            <label className="fw-bold mb-0">Lọc trạng thái:</label>
            <select
              className="form-select w-auto border-0 shadow-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="ongoing">Đang ra</option>
              <option value="completed">Hoàn thành</option>
              <option value="hiatus">Tạm dừng</option>
            </select>
          </div>

          <div className="table-responsive mt-4">
            <table className="table align-middle table-hover">
              <thead className="bg-dark text-white">
                <tr>
                  <th style={{ width: "70%" }}>Truyện</th>
                  <th>Trạng thái</th>
                  <th>Ngày theo dõi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length > 0 ? (
                  filteredList.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="d-flex align-items-start">
                          <img
                            src={
                              item.cover_image
                                ? `${item.cover_image}`
                                : "/no-cover.png"
                            }
                            alt={item.title}
                            className="rounded me-3"
                            width="70"
                            height="90"
                            style={{ objectFit: "cover" }}
                          />
                          <div>
                            <a
                              href={`/comic/${item.slug}`}
                              className="fw-semibold text-decoration-none text-dark"
                            >
                              {item.title}
                            </a>
                            <div className="mt-2">
                              <button
                                className="btn btn-sm btn-outline-danger px-3 py-1"
                                onClick={() => handleUnfollow(item.id)}
                              >
                                ✗ Bỏ theo dõi
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge px-3 py-2 rounded-pill ${
                            item.comic_status === "ongoing"
                              ? "bg-success-subtle text-success"
                              : item.comic_status === "completed"
                              ? "bg-primary-subtle text-primary"
                              : "bg-warning-subtle text-dark"
                          }`}
                        >
                          {item.comic_status === "ongoing"
                            ? "Đang ra"
                            : item.comic_status === "completed"
                            ? "Hoàn thành"
                            : "Tạm dừng"}
                        </span>
                      </td>
                      <td className="text-muted small">
                        {new Date(item.followed_at).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-muted">
                      Bạn chưa theo dõi truyện nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* --- Bình luận --- */
        <div className="p-3">
          <h4 className="fw-bold text-uppercase border-bottom pb-2">
            BÌNH LUẬN CỦA BẠN
          </h4>

          <div className="table-responsive mt-3">
            <table className="table align-middle">
              <thead className="bg-dark text-white">
                <tr>
                  <th style={{ width: "40%" }}>Truyện</th>
                  <th style={{ width: "25%" }}>Chương</th>
                  <th>Bình luận</th>
                </tr>
              </thead>
              <tbody>
                {commentList.length > 0 ? (
                  commentList.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={
                              item.cover_image
                                ? `${item.cover_image}`
                                : "/no-cover.png"
                            }
                            alt={item.title}
                            className="rounded me-3"
                            width="70"
                            height="90"
                            style={{ objectFit: "cover" }}
                          />
                          <div>
                            <a
                              href={`/comic/${item.comic_slug}`}
                              className="fw-bold text-primary text-decoration-none"
                            >
                              {item.comic_title}
                            </a>
                            <div>
                              <button
                                className="btn btn-sm btn-outline-danger mt-1"
                                onClick={() => handleDeleteComment(item.id)}
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {item.chapter_title ? (
                          <a
                            href={`/comic/${item.comic_slug}/${item.chapter_slug}/${item.chapter_id}`}
                            className="text-decoration-none text-dark"
                          >
                            {item.chapter_title}
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <div>{item.content}</div>
                        <small className="text-muted">{item.created_at}</small>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-3">
                      Chưa có bình luận nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
