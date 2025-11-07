import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/darkmode.css";

import { apiService } from "../services/apiService.ts";

interface HeaderProps {
  title?: string;
  description?: string;
}

const Header: React.FC<HeaderProps> = ({
  title = "Bảng điều khiển",
  description = "Quản lý website truyện",
}) => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "true");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "false");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      navigate("/admin/login");
    } catch (error) {
      // Lỗi đã được xử lý trong apiService.logout với toast
    }
  };

  return (
    <div className="header">
      <div className="row align-items-center">
        <div className="col">
          <h1>{title}</h1>
          <p className="text-success opacity-75">{description}</p>
        </div>
        <div className="col-auto d-flex align-items-center gap-3">
          <div className="d-flex gap-3">
            <div
              className="header-icon text-white bg-white bg-opacity-10 rounded m-2"
              onClick={toggleDarkMode}
              title={
                isDarkMode
                  ? "Chuyển sang chế độ sáng"
                  : "Chuyển sang chế độ tối"
              }
            >
              <i className={isDarkMode ? "fas fa-sun" : "fas fa-moon"}></i>
            </div>
            <div className="header-icon text-white bg-white bg-opacity-10 rounded m-2" title="Thông báo">
              <i className="fas fa-bell"></i>
            </div>
            <div className="header-icon text-white bg-white bg-opacity-10 rounded m-2" title="Cài đặt">
              <i className="fas fa-cog"></i>
            </div>
            <div
              className="header-icon text-white bg-white bg-opacity-10 rounded m-2"
              onClick={handleLogout}
                title="Đăng xuất"
            >
              <i className="fas fa-sign-out-alt"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
