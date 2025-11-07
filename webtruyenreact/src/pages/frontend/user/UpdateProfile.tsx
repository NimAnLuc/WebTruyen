import React, { useState } from "react";
import { apiService } from "../../../services/apiService.ts";
import { toast } from "react-toastify";
import { ApiResponse } from "../../../services/apiService.ts";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: number;
  image_url: string;
  created_at: string;
  updated_at: string;
}

interface UpdateProfileProps {
  onProfileUpdated?: (updatedUser: User) => void; // callback sau khi update thành công
}

const UpdateProfile: React.FC<UpdateProfileProps> = ({ onProfileUpdated }) => {
  const storedUser = localStorage.getItem("user");
  const user: User = storedUser ? JSON.parse(storedUser) : ({} as User);

  const [name, setName] = useState(user.name || "");
  const [email] = useState(user.email || "");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    user.image_url ? user.image_url : null
  );
  const [loading, setLoading] = useState(false);

  // ✅ Danh sách định dạng ảnh cho phép
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const maxSize = 2 * 1024 * 1024; // 2MB

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    // ✅ Kiểm tra định dạng ảnh
    if (!allowedTypes.includes(file.type)) {
      toast.error("❌ Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF!");
      e.target.value = ""; // reset input
      return;
    }

    // ✅ Giới hạn dung lượng
    if (file.size > maxSize) {
      toast.error("❌ Ảnh vượt quá 2MB, vui lòng chọn ảnh nhỏ hơn!");
      e.target.value = "";
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = user.image_url;

      // ✅ Upload ảnh lên Cloudinary nếu có chọn ảnh mới
      if (image) {
        const formDataCloud = new FormData();
        formDataCloud.append("file", image);
        formDataCloud.append("upload_preset", "uploadcomics");
        formDataCloud.append("folder", "users");

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formDataCloud,
          }
        );
        const data = await res.json();

        if (data.secure_url) {
          imageUrl = data.secure_url;
        } else {
          toast.error("❌ Upload ảnh thất bại!");
          console.error("Cloudinary error:", data);
          setLoading(false);
          return;
        }
      }

      // ✅ Gửi dữ liệu lên API backend
      const res = await apiService.updateProfile<ApiResponse>(name, imageUrl);

      if (res && res.status === true) {
        toast.success("✅ Cập nhật hồ sơ thành công!");

        // ✅ Cập nhật lại user trong localStorage
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}") as User;
        const updatedUser: User = {
          ...currentUser,
          name,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // ✅ Gọi callback để cập nhật UserProfile
        onProfileUpdated?.(updatedUser);
      } else {
        toast.error(res?.message || "❌ Cập nhật thất bại!");
      }
    } catch (error: any) {
      toast.error(error.message || "Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-dark text-white fw-bold">
        Cập nhật thông tin cá nhân
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          {/* Họ tên */}
          <div className="mb-3">
            <label className="form-label fw-bold">Họ và tên</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập họ tên"
              required
            />
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label fw-bold">Email</label>
            <input
              type="email"
              className="form-control bg-light"
              value={email}
              readOnly
              disabled
            />
          </div>

          {/* Ảnh đại diện */}
          <div className="mb-3">
            <label className="form-label fw-bold">Ảnh đại diện</label>
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={handleImageChange}
              disabled={loading}
            />
            {preview && (
              <img
                src={preview}
                alt="preview"
                className="mt-3 rounded-circle border"
                width="120"
                height="120"
                style={{ objectFit: "cover" }}
              />
            )}
            <div className="form-text">
              Chấp nhận: JPG, PNG, WEBP, GIF — Tối đa 2MB
            </div>
          </div>

          {/* Nút lưu */}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;
