// UpdateAccount.tsx
import React, { useState } from "react";
import { apiService } from "../../../services/apiService.ts";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import { ApiResponse } from "../../../services/apiService.ts";
const UpdateAccount = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiService.updateAccount<ApiResponse>(
        email,
        currentPassword,
        newPassword
      );

      if (res && res.status === true) {
        toast.success(
          "✅ Cập nhật tài khoản thành công! Vui lòng đăng nhập lại."
        );

        // Reset input
        setCurrentPassword("");
        setNewPassword("");

        await apiService.logout();
        // Điều hướng sang login, rồi reload lại để reset toàn bộ state
        navigate("/login");
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error(res?.message || "❌ Cập nhật thất bại!");
      }
    } catch (error: any) {
      toast.error(error.message || "Cập nhật thất bại!");
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-dark text-white fw-bold">
        Cập nhật tài khoản
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-bold">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email mới"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Mật khẩu hiện tại</label>
            <input
              type="password"
              className="form-control"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Mật khẩu mới</label>
            <input
              type="password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
              required
            />
          </div>

          <button type="submit" className="btn btn-success">
            🔒 Cập nhật tài khoản
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateAccount;
