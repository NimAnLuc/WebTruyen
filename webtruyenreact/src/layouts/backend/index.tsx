import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import "bootstrap/dist/js/bootstrap.bundle.min.js";


const Dashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userAvatar, setUserAvatar] = useState<string>("");
  const navigate = useNavigate();

  // Lấy role từ localStorage khi component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || !user.role) {
      navigate("/admin/login");
    } else {
      setUserRole(user.role);
      setUserName(user.name || "Người dùng");
      setUserAvatar(
        user.image_url
          ? `${user.image_url}`
          : ""
      );
    }
  }, [navigate]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div>
      <style>
        {`
          body {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1f3c5c 0%, #3b7ea1 100%);
            color: #ffffff;
            min-height: 100vh;
          }

          .sidebar {
            width: 280px;
            height: 100vh;
            background: rgba(30, 45, 75, 0.9);
            position: fixed;
            top: 0;
            left: 0;
            padding: 10px;
            backdrop-filter: blur(10px);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            transition: width 0.3s ease;
            z-index: 1000;
            overflow-y: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .sidebar::-webkit-scrollbar {
            display: none;
          }

          .sidebar.collapsed {
            width: 80px;
          }

          .sidebar.collapsed .profile-avatar,
          .sidebar.collapsed .profile-name,
          .sidebar.collapsed .profile-role,
          .sidebar.collapsed .menu-title,
          .sidebar.collapsed .menu-item span:not(.menu-icon) {
            display: none;
          }

          .profile-section {
            text-align: center;
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 20px;
            position: relative;
          }

          .profile-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: bold;
            object-fit: cover;
          }

          .menu-title {
            font-size: 10px;
            text-transform: uppercase;
            color: #64ffda;
            margin-bottom: 15px;
            font-weight: 600;
            letter-spacing: 1px;
          }

          .menu-item {
            display: flex;
            flex-direction: column;
            padding: 12px 15px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            text-decoration: none; 
            color: inherit;   
            text-decoration: none !important;
          }

          .menu-item:hover {
            background: rgba(100, 255, 218, 0.1);
          }

          .menu-item.active {
            background: linear-gradient(135deg, #64ffda 0%, #64b5f6 100%);
            color: #1e2a47;
            font-weight: 600;
          }

          .menu-item-header {
            display: flex;
            align-items: center;
            text-decoration: none;
            color: inherit;
            width: 100%;
          }

          .menu-item-header:hover {
            text-decoration: none;
            color: inherit;
          }

          .menu-icon {
            width: 20px;
            height: 20px;
            margin-right: 15px;
            opacity: 0.8;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .sidebar.collapsed .menu-icon {
            margin-right: 0;
            margin-left: 15px;
          }

          .toggle-btn {
            width: 30px;
            height: 30px;
            background: #64ffda;
            border: none;
            border-radius: 50%;
            color: #1e2a47;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            position: absolute;
            top: 10px;
            right: 10px;
          }

          .external-toggle-btn {
            position: fixed;
            top: 10px;
            left: 90px;
            width: 40px;
            height: 40px;
            background: #64ffda;
            border: none;
            border-radius: 8px;
            color: #1e2a47;
            cursor: pointer;
            display: ${isCollapsed ? "flex" : "none"};
            align-items: center;
            justify-content: center;
            z-index: 1001;
            transition: all 0.3s ease;
          }

          .external-toggle-btn:hover {
            background: #22c55e;
            transform: scale(1.1);
          }

          .main-content {
            margin-left: 280px;
            padding: 20px;
            transition: margin-left 0.3s ease;
          }

          .main-content.collapsed {
            margin-left: 80px;
          }

          .header {
            background: linear-gradient(135deg, #2c3e50, #3498db);
            padding: 1.5rem 2rem;
            border-radius: 12px;
            color: white;
            margin-bottom: 2rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .header h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }

          .header p {
            font-size: 1rem;
            opacity: 0.9;
          }

          .header-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            transition: all 0.3s ease;
          }

          .header-icon:hover {
            background-color: rgba(255, 255, 255, 0.2) !important;
            transform: scale(1.1);
          }

          .download-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            color: white;
            padding: 12px 25px;
            border-radius: 10px;
            font-weight: 600;
            transition: all 0.3s ease;
          }

          .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
          }

          .stat-card {
            background: rgba(255, 255, 255, 0.05);
            padding: 25px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }

          .stat-card::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #64ffda, #64b5f6, #667eea, #764ba2);
          }

          .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
          }

          .stat-icon {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }

          .progress-ring {
            width: 60px;
            height: 60px;
          }

          .chart-card,
          .recent-transactions {
            background: rgba(255, 255, 255, 0.05);
            padding: 25px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .transaction-avatar {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: linear-gradient(135deg, #64ffda, #64b5f6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #1e2a47;
          }

          .transaction-actions {
            display: flex;
            gap: 10px;
          }

          .action-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .action-btn.edit {
            background: rgba(100, 181, 246, 0.2);
            color: #64b5f6;
          }

          .action-btn.delete {
            background: rgba(244, 67, 54, 0.2);
            color: #f44336;
          }

          .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
          }

          .chart-placeholder {
            text-align: center;
            padding: 40px;
            color: #64ffda;
          }

          @media (max-width: 768px) {
            .sidebar {
              width: 80px;
            }

            .sidebar .profile-avatar,
            .sidebar .profile-name,
            .sidebar .profile-role,
            .sidebar .menu-title,
            .sidebar .menu-item span:not(.menu-icon) {
              display: none;
            }

            .sidebar .menu-icon {
              margin-right: 0;
              margin-left: 15px;
            }

            .main-content {
              margin-left: 80px;
            }


          }
        `}
      </style>

      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`} id="sidebar">
        <div className="profile-section">
          <button className="toggle-btn" onClick={toggleSidebar}>
            <i className="fas fa-bars"></i>
          </button>

          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="profile-avatar" />
          ) : (
            <div className="profile-avatar">
              {userName ? userName.charAt(0).toUpperCase() : "?"}
            </div>
          )}

          <div className="profile-name">{userName}</div>
          <div className="profile-role">
            {userRole === "admin" ? "Quản trị viên" : "Thành viên nhóm"}
          </div>
        </div>

        {/* Tổng quan */}
        <div className="menu-section">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
          >
            <div className="menu-item-header">
              <span className="menu-icon">
                <i className="fas fa-tachometer-alt"></i>
              </span>
              <span>Tổng quan</span>
            </div>
          </NavLink>
        </div>

        {/* Quản lý nội dung */}
        <div className="menu-section">
          <div className="menu-title">Quản lý nội dung</div>
          {[
            { icon: "fa-book", label: "Truyện", path: "/admin/comic" },
            { icon: "fa-file-alt", label: "Chương", path: "/admin/chapter" },
            { icon: "fa-tags", label: "Thể loại", path: "/admin/genre" },
            { icon: "fa-image", label: "Trang", path: "/admin/page" },
          ].map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
            >
              <div className="menu-item-header">
                <span className="menu-icon">
                  <i className={`fas ${item.icon}`}></i>
                </span>
                <span>{item.label}</span>
              </div>
            </NavLink>
          ))}
        </div>

        {/* Quản lý đội nhóm */}
        <div className="menu-section">
          <div className="menu-title">Quản lý đội nhóm</div>
          {[
            ...(userRole === "admin"
              ? [
                  { icon: "fa-users", label: "Nhóm dịch", path: "/admin/team" },
                  {
                    icon: "fa-file-alt",
                    label: "Truyện của nhóm",
                    path: "/admin/teamcomic",
                  },
                ]
              : []),
            {
              icon: "fa-user-friends",
              label: "Thành viên nhóm",
              path: "/admin/teammember",
            },
            {
              icon: "fa-user-check",
              label: "Duyệt thành viên nhóm",
              path: "/admin/teamjoin",
            },
            {
              icon: "fa-comment-dots",
              label: "Comment truyện",
              path: "/admin/comment",
            },
          ].map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
            >
              <div className="menu-item-header">
                <span className="menu-icon">
                  <i className={`fas ${item.icon}`}></i>
                </span>
                <span>{item.label}</span>
              </div>
            </NavLink>
          ))}
        </div>

        {/* Quản lý người dùng - chỉ admin */}
        {userRole === "admin" && (
          <div className="menu-section">
            <div className="menu-title">Quản lý người dùng</div>
            {[
              { icon: "fa-user", label: "Người dùng", path: "/admin/user" },
              { icon: "fa-phone", label: "Liên hệ", path: "/admin/contact" },
              {
                icon: "fa-bookmark",
                label: "Bookmarks",
                path: "/admin/bookmark",
              },
            ].map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `menu-item ${isActive ? "active" : ""}`
                }
              >
                <div className="menu-item-header">
                  <span className="menu-icon">
                    <i className={`fas ${item.icon}`}></i>
                  </span>
                  <span>{item.label}</span>
                </div>
              </NavLink>
            ))}
          </div>
        )}

        {/* Hệ thống - Chỉ hiển thị cho admin
        {userRole === "admin" && (
          <div className="menu-section">
            <div className="menu-title">Hệ thống</div>
            {[
              {
                icon: "fa-cogs",
                label: "Công việc (Jobs)",
                path: "/admin/jobs",
              },
              {
                icon: "fa-database",
                label: "Bộ nhớ đệm (Cache)",
                path: "/admin/cache",
              },
              {
                icon: "fa-user-shield",
                label: "Phiên (Sessions)",
                path: "/admin/sessions",
              },
              {
                icon: "fa-exchange-alt",
                label: "Di cư (Migrations)",
                path: "/admin/migrations",
              },
              {
                icon: "fa-exclamation-circle",
                label: "Công việc thất bại",
                path: "/admin/failed-jobs",
              },
              {
                icon: "fa-tasks",
                label: "Batch Jobs",
                path: "/admin/batch-jobs",
              },
            ].map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `menu-item ${isActive ? "active" : ""}`
                }
              >
                <div className="menu-item-header">
                  <span className="menu-icon">
                    <i className={`fas ${item.icon}`}></i>
                  </span>
                  <span>{item.label}</span>
                </div>
              </NavLink>
            ))}
          </div>
        )} */}
      </div>

      <div
        className={`main-content ${isCollapsed ? "collapsed" : ""}`}
        id="content"
      >
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;