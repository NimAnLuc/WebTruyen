import React, { useState } from "react";
import { toast } from "react-toastify";
import { apiService } from "../../services/apiService.ts";

interface RequestCreateTeamModalProps {
  show: boolean;
  onClose: () => void;
}

const RequestCreateTeamModal: React.FC<RequestCreateTeamModalProps> = ({
  show,
  onClose,
}) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    reason: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Xử lý nhập text
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Xử lý upload ảnh
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF!");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 2MB!");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // ✅ Gửi form
  const handleSubmit = async () => {
    if (!form.name.trim() || !form.reason.trim()) {
      toast.warning("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("team_name", form.name);
      formData.append("description", form.description);
      formData.append("reason", form.reason);
      if (image) formData.append("logo", image);

      const res = await apiService.requestTeamCreation(formData);

      if (res.status) {
        toast.success(res.message || "Gửi yêu cầu thành công!");
        onClose();
      } else {
        toast.error(res.message || "Không thể gửi yêu cầu!");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi gửi yêu cầu!");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reset preview khi đóng
  const handleClose = () => {
    setForm({ name: "", description: "", reason: "" });
    setImage(null);
    setPreview(null);
    onClose();
  };

  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">📢 Yêu cầu tạo nhóm dịch</h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
            ></button>
          </div>

          <div className="modal-body">
            {/* Tên nhóm */}
            <div className="mb-3">
              <label className="form-label fw-bold">Tên nhóm dịch</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={form.name}
                onChange={handleChange}
                placeholder="Nhập tên nhóm..."
              />
              <small className="text-muted">
                ⚙️ Gợi ý: Chọn tên ngắn gọn, dễ nhớ, tránh trùng với nhóm khác.
              </small>
            </div>

            {/* Mô tả */}
            <div className="mb-3">
              <label className="form-label fw-bold">Mô tả</label>
              <textarea
                name="description"
                className="form-control"
                rows={3}
                value={form.description}
                onChange={handleChange}
                placeholder="Giới thiệu ngắn gọn về nhóm..."
              />
              <small className="text-muted">
                ✏️ Gợi ý: Viết đôi nét về nhóm, định hướng, thể loại chính và
                nếu có thì nêu thêm chính sách hoạt động, quy tắc hoặc quy trình
                tuyển thành viên.
              </small>
            </div>

            {/* Lý do */}
            <div className="mb-3">
              <label className="form-label fw-bold">Lý do tạo nhóm</label>
              <textarea
                name="reason"
                className="form-control"
                rows={3}
                value={form.reason}
                onChange={handleChange}
                placeholder="Giải thích lý do muốn tạo nhóm..."
              />
              <small className="text-muted d-block">
                💬 <b>Lý do:</b> Giải thích vì sao bạn muốn lập nhóm (ví dụ:
                dịch lâu dài, lập cộng đồng riêng, học hỏi thêm, v.v.)
              </small>
              <small className="text-muted d-block">
                🎯 <b>Mục tiêu:</b> Nêu định hướng hoạt động của nhóm nếu có (ví
                dụ: tập trung dịch truyện hành động, tuyển thêm thành viên,...)
              </small>
              <small className="text-muted d-block">
                📬 <b>Liên hệ:</b> Ghi rõ cách để admin có thể xác nhận với bạn
                (ví dụ: link Facebook, Discord, email hoặc số điện thoại).
              </small>
            </div>

            {/* Upload ảnh */}
            <div className="mb-3 text-center">
              <label className="form-label fw-bold">Logo nhóm (tùy chọn)</label>
              <div>
                <input
                  id="teamLogoUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() =>
                    document.getElementById("teamLogoUpload")?.click()
                  }
                  disabled={loading}
                >
                  📸 Chọn ảnh
                </button>
              </div>

              {preview && (
                <div className="mt-3">
                  <img
                    src={preview}
                    alt="Xem trước"
                    className="img-thumbnail shadow-sm"
                    style={{
                      maxWidth: "180px",
                      borderRadius: "10px",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}
              <small className="text-muted">
                🧩 Logo giúp nhóm bạn dễ nhận diện hơn trên hệ thống.
              </small>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestCreateTeamModal;
