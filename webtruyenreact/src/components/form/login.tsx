import React, { useState } from "react";
import { apiService } from "../../services/apiService.ts";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await apiService.login({ email, password });

      if (result.status) {
        setMessage(result.message);
        localStorage.setItem("user", JSON.stringify(result.user));
        toast.success("Đăng nhập thành công!");
        setTimeout(() => {
          navigate("/admin");
        }, 1000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Có lỗi xảy ra, vui lòng thử lại");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #4b6cb7, #182848);
        }
        .login-card {
          max-width: 400px;
          width: 100%;
          padding: 2rem;
          border-radius: 15px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
          background: white;
          transition: transform 0.3s ease;
        }
        .login-card:hover {
          transform: translateY(-5px);
        }
        .form-control:focus {
          border-color: #4b6cb7;
          box-shadow: 0 0 0 0.25rem rgba(75, 108, 183, 0.25);
        }
        .btn-primary {
          background-color: #4b6cb7;
          border-color: #4b6cb7;
          transition: background-color 0.3s ease;
        }
        .btn-primary:hover {
          background-color: #182848;
          border-color: #182848;
        }
        .password-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
        }
        .spinner-border {
          width: 1.5rem;
          height: 1.5rem;
          margin-right: 0.5rem;
        }
      `}</style>
      <div className="login-container">
        <div className="login-card">
          <h2 className="text-center mb-4 fw-bold text-dark">Đăng Nhập</h2>
          {error && (
            <div
              className="alert alert-danger alert-dismissible fade show"
              role="alert"
            >
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError("")}
              ></button>
            </div>
          )}
          {message && (
            <div
              className="alert alert-success alert-dismissible fade show"
              role="alert"
            >
              {message}
              <button
                type="button"
                className="btn-close"
                onClick={() => setMessage("")}
              ></button>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
            <div className="mb-3 position-relative">
              <label htmlFor="password" className="form-label">
                Mật Khẩu
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                id="password"
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg
                    className="bi mt-4"
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.211.135-.52.165-.756.081l.97.97z" />
                    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.822.822a2.5 2.5 0 0 0 2.83 2.83z" />
                    <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" />
                  </svg>
                ) : (
                  <svg
                    className="bi  mt-4"
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 1.5a6.5 6.5 0 0 0-6.5 6.5c0 3.032 2.467 5.5 5.5 5.5s6.5-2.468 6.5-5.5S11.032 1.5 8 1.5zm0 12a5.5 5.5 0 0 1-5.5-5.5C2.5 4.468 4.968 2 8 2s5.5 2.468 5.5 5.5S11.032 13 8 13z" />
                    <path d="M8 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0 6a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                  </svg>
                )}
              </span>
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Đang xử lý...</span>
                  </div>
                  <span className="ms-2">Đang xử lý...</span>
                </>
              ) : (
                "Đăng Nhập"
              )}
            </button>
          </form>
          <p className="text-center mt-4">
            Chưa có tài khoản?{" "}
            <a href="/register" className="text-primary fw-medium">
              Đăng ký ngay
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
