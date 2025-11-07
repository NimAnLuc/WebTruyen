import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../../services/apiService.ts";
interface ResetPasswordResponse {
  status: boolean;
  message?: string;
}

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const tokenParam = searchParams.get("token");

    if (emailParam && tokenParam) {
      setEmail(emailParam);
      setToken(tokenParam);
    } else {
      toast.error("Liên kết đặt lại mật khẩu không hợp lệ!");
      navigate("/login");
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.warning("Vui lòng nhập đầy đủ mật khẩu!");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiService.resetPassword<ResetPasswordResponse>({
        email,
        token,
        password,
      });

      if (res.status) {
        toast.success("Đặt lại mật khẩu thành công!");
        navigate("/login");
      } else {
        toast.error(res.message || "Không thể đặt lại mật khẩu!");
      }
    } catch (err: any) {
      console.error("[ResetPassword]", err);
      toast.error(err.message || "Lỗi khi đặt lại mật khẩu!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div
        className="card shadow-lg border-0 p-4"
        style={{ maxWidth: "420px", width: "100%" }}
      >
        <div className="text-center mb-4">
          <h3 className="fw-bold text-dark">Đặt Lại Mật Khẩu</h3>
          <p className="text-muted small">
            Nhập mật khẩu mới cho tài khoản <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3 position-relative">
            <label className="form-label fw-semibold">Mật khẩu mới</label>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control rounded-pill pe-5"
              placeholder="Nhập mật khẩu mới"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="btn position-absolute end-0 translate-middle-y border-0 bg-transparent"
              style={{ top: "75%" }}
            >
              <i
                className={`fas ${
                  showPassword ? "fa-eye-slash" : "fa-eye"
                } text-secondary`}
              ></i>
            </button>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              className="form-control rounded-pill"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-warning w-100 fw-bold rounded-pill py-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Đang cập nhật...
              </>
            ) : (
              "Xác nhận đặt lại mật khẩu"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
