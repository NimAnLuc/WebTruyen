import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiService } from "../../services/apiService.ts";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import ForgotPasswordModal from "./ForgotPasswordModal.tsx";

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";
interface LoginResponse {
  status: boolean;
  token?: string;
  user?: any;
  message?: string;
}

const Signin: React.FC = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

  // Theo dõi thay đổi class trên body
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains("dark-mode"));
    };

    // Kiểm tra ngay lập tức
    checkDarkMode();

    // Theo dõi thay đổi (nếu bạn dùng MutationObserver)
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res: LoginResponse = await apiService.loginUser<LoginResponse>(
        formData.email,
        formData.password
      );

      if (res.status) {
        localStorage.setItem("token", JSON.stringify(res.token));
        localStorage.setItem("user", JSON.stringify(res.user));
        toast.success("Đăng nhập thành công!");
        navigate("/");
        window.location.reload();
      } else {
        toast.error(res.message || "Đăng nhập thất bại!");
      }
    } catch (err: any) {
      toast.error(err.message || "Đăng nhập thất bại!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: any) => {
    if (!response.credential) {
      toast.error("Không nhận được credential từ Google.");
      return;
    }
    try {
      const res = await apiService.handleGoogleCallback<LoginResponse>(
        response.credential
      );
      if (res.status) {
        localStorage.setItem("token", JSON.stringify(res.token));
        localStorage.setItem("user", JSON.stringify(res.user));
        toast.success("Đăng nhập bằng Google thành công!");
        navigate("/");
        window.location.reload();
      } else {
        toast.error(res.message || "Đăng nhập Google thất bại!");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi đăng nhập Google.");
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div
          className="card shadow-lg border-0 p-4"
          style={{ maxWidth: "420px", width: "100%" }}
        >
          <div className="text-center mb-4">
            <h3 className="fw-bold text-dark">Đăng Nhập</h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Email</label>
              <input
                type="email"
                name="email"
                className="form-control rounded-pill"
                placeholder="Nhập email của bạn"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3 position-relative">
              <label className="form-label fw-semibold">Mật khẩu</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="form-control rounded-pill pe-5"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn position-absolute end-0 translate-middle-y border-0 bg-transparent"
                style={{ top: "75%" }}
              >
                <i
                  className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                  style={{ color: "#6c757d" }}
                ></i>
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-warning w-100 fw-bold rounded-pill py-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng Nhập"
              )}
            </button>
          </form>

          {/* Hoặc đăng nhập bằng Google */}
          <div className="text-center mt-4">
            <div className="text-muted mb-2">Hoặc đăng nhập bằng</div>
            <GoogleLogin
      key={isDarkMode ? "dark" : "light"}
      theme={isDarkMode ? "filled_black" : "outline"}
      shape="pill"
      size="large"
      text="signin_with"
      onSuccess={handleGoogleSuccess}
      onError={() => toast.error("Đăng nhập Google thất bại")}
    />
          </div>

          {/* Link đăng ký + quên mật khẩu */}
          <div className="text-center mt-4">
            <button
              type="button"
              className="btn btn-link text-decoration-none small text-secondary"
              onClick={() => setShowForgotModal(true)}
            >
              Quên mật khẩu?
            </button>

            <ForgotPasswordModal
              show={showForgotModal}
              handleClose={() => setShowForgotModal(false)}
            />
            <p className="mt-3 mb-0 text-muted">
              Chưa có tài khoản?{" "}
              <a
                href="/register"
                className="text-warning fw-semibold text-decoration-none"
              >
                Đăng ký ngay
              </a>
            </p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Signin;
