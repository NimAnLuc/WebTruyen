import { useState, useEffect } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { apiService } from "../../services/apiService.ts";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-loading-skeleton/dist/skeleton.css";
import "../../assets/css/style.css";
import SearchBar from "../../components/search/SearchBar.tsx";

interface Genre {
  id: number;
  name: string;
  slug: string;
  description: string;
}
interface GenreResponse {
  genres: Genre[];
}

const HomePage: React.FC = () => {
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);

  const [genresList, setGenresList] = useState<Genre[]>([]);
  const [isGenresOpen, setIsGenresOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [footerGenres, setFooterGenres] = useState<Genre[]>([]);

  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Lỗi parse user:", error);
      }
    }
  }, []);
  const handleLogout = async () => {
    try {
      await apiService.logout();
      window.location.reload();
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  // Gọi API cho footer
  useEffect(() => {
    const fetchFooterGenres = async () => {
      try {
        const data = (await apiService.listGenresFooter({
          limit: 5,
        })) as GenreResponse;

        setFooterGenres(
          data.genres.map((genre) => ({
            ...genre,
            name: genre.name.toUpperCase(),
          }))
        );
      } catch (error) {
        toast.error("Lỗi khi lấy thể loại footer!");
      }
    };

    fetchFooterGenres();
  }, []);
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

  const toggleOffcanvas = () => {
    setIsOffcanvasOpen((prev) => !prev);
    if (isGenresOpen) setIsGenresOpen(false);
  };
  useEffect(() => {
    if (isOffcanvasOpen) {
      // Khi mở offcanvas
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "22px";

      // Tạo backdrop mờ
      const backdrop = document.createElement("div");
      backdrop.className = "offcanvas-backdrop fade show";

      document.body.appendChild(backdrop);
    } else {
      // Khi đóng offcanvas → gỡ CSS và backdrop
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document
        .querySelectorAll(".offcanvas-backdrop")
        .forEach((el) => el.remove());
    }
  }, [isOffcanvasOpen]);
  // Toggle danh sách thể loại trong menu mobile
  const toggleGenres = () => {
    setIsGenresOpen(!isGenresOpen);
  };

  // Navigation menu items
  const navItems = [
    { name: "HOT", icon: "fa-fire", path: "/" },
    { name: "THỂ LOẠI", icon: "fa-book" },
    { name: "LỊCH SỬ", icon: "fa-history", path: "/lich-su-doc" },
    { name: "THEO DÕI", icon: "fa-user-friends", path: "/profile?tab=follow" },
    { name: "TÌM KIẾM", icon: "fa-search", path: "/comics/filter" },
    { name: "NHÓM DỊCH", icon: "fa-users", path: "/teams" },
    {
      name: "GROUP",
      icon: "fa-users",
      path: "https://www.facebook.com/max.powel.genos",
    },
  ];
  // Gọi API để lấy danh sách thể loại
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const data = (await apiService.listgenres({
          limit: 12,
        })) as GenreResponse;

        const upperCaseGenres = data.genres.map((genre) => ({
          ...genre,
          name: genre.name.toUpperCase(),
        }));
        setGenresList(upperCaseGenres);
      } catch (error) {
        toast.error("Lỗi khi lấy danh sách thể loại!");
      }
    };

    fetchGenres();
  }, []);

  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="container d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <button
              className="mobile-menu-btn d-lg-none"
              type="button"
              onClick={toggleOffcanvas}
            >
              <i className="fas fa-bars"></i>
            </button>
            <div className="logo">
              <a href="/">
                <img
                  src="/images/logo1.png"
                  alt="Logo"
                  style={{
                    width: "100px",
                    height: "auto",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              </a>
            </div>
          </div>
          <div className="flex-grow-1 mx-3 d-none d-lg-flex justify-content-center">
            <SearchBar />
          </div>

          <div
            className="d-flex align-items-center p-3 rounded"
            style={{ gap: "12px" }}
          >
            {/* Nút Dark Mode — luôn hiển thị */}
            <button
              className="btn btn-sm rounded-circle"
              onClick={toggleDarkMode}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                width: "36px",
                height: "36px",
                flexShrink: 0,
              }}
            >
              <i className={`fas ${isDarkMode ? "fa-moon" : "fa-sun"}`}></i>
            </button>

            {/* Khối đăng ký + đăng nhập — chỉ hiện trên desktop */}
            <div className="d-none d-lg-flex align-items-center justify-content-between flex-grow-1 ms-2">
              {user ? (
                <div className="dropdown">
                  <button
                    className="btn btn-light d-flex align-items-center gap-2 dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{ borderRadius: "30px", padding: "6px 12px" }}
                  >
                    <img
                      src={
                        user.image_url
                          ? `${user.image_url}`
                          : "/images/logo.png"
                      }
                      alt="avatar"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                    <span className="fw-semibold text-dark d-none d-md-inline">
                      {user.name || "Người dùng"}
                    </span>
                  </button>

                  <ul className="dropdown-menu dropdown-menu-end shadow">
                    <li>
                      <Link className="dropdown-item" to="/profile">
                        <i className="fas fa-user me-2"></i> Thông tin tài khoản
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/profile?tab=follow">
                        <i className="fas fa-book me-2"></i> Truyện theo dõi
                      </Link>
                    </li>
                    <li>
                      <button
                        className="dropdown-item text-danger"
                        onClick={handleLogout}
                      >
                        <i className="fas fa-sign-out-alt me-2"></i> Đăng xuất
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <>
                  <div className="mx-2">
                    <div className="text-white fw-semibold mb-1">
                      Chưa có tài khoản?
                    </div>
                    <Link
                      to="/register"
                      className="text-white fw-bold text-decoration-none"
                    >
                      Đăng ký ngay <i className="fas fa-chevron-right"></i>
                    </Link>
                  </div>
                  <Link
                    to="/login"
                    className="btn btn-warning fw-bold d-flex align-items-center gap-2 px-3 py-2"
                  >
                    <i className="fas fa-sign-in-alt"></i> Đăng nhập
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav bg-white shadow-sm py-2 d-none d-lg-block">
        <div className="container">
          <ul className="nav nav-menu">
            {navItems.map((item) =>
              item.name === "THỂ LOẠI" ? (
                <li className="nav-item dropdown" key={item.name}>
                  <button
                    className="nav-link dropdown-toggle btn btn-link"
                    id="genresDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className={`fas ${item.icon} me-1`}></i> {item.name}
                  </button>
                  <ul
                    className="dropdown-menu"
                    aria-labelledby="genresDropdown"
                  >
                    {genresList.length > 0 ? (
                      genresList.map((genre) => (
                        <li key={genre.id}>
                          <a
                            href={`/comics/filter?genre=${genre.id}`}
                            className="dropdown-item"
                          >
                            {genre.name}
                          </a>
                        </li>
                      ))
                    ) : (
                      <li className="dropdown-item">Đang tải thể loại...</li>
                    )}
                  </ul>
                </li>
              ) : (
                <li className="nav-item" key={item.name}>
                  {item.path?.startsWith("https") ? (
                    // 🔗 Link ngoài → mở tab mới
                    <a
                      href={item.path}
                      className="nav-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className={`fas ${item.icon} me-1`}></i> {item.name}
                    </a>
                  ) : (
                    // 🧭 Link nội bộ
                    <NavLink
                      to={item.path || "#"}
                      className={({ isActive }) =>
                        `nav-link ${isActive ? "active" : ""}`
                      }
                    >
                      <i className={`fas ${item.icon} me-1`}></i> {item.name}
                    </NavLink>
                  )}
                </li>
              )
            )}
          </ul>
        </div>
      </nav>

      {/* Mobile Menu Offcanvas */}
      <div
        className={`offcanvas offcanvas-start ${isOffcanvasOpen ? "show" : ""}`}
        tabIndex={-1}
        id="mobileMenu"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">
            <img
              src="/images/logo1.png"
              alt="Logo"
              style={{
                width: "100px",
                height: "auto",
                display: "block",
                margin: "0 auto",
              }}
            />
          </h5>
          <button
            type="button"
            className="btn-close"
            onClick={toggleOffcanvas}
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body p-0">
          <div className="p-3 border-bottom bg-light sticky-top">
            <SearchBar />
          </div>

          <nav className="nav flex-column offcanvas-menu">
            {navItems.map((item) =>
              item.name === "THỂ LOẠI" ? (
                <div key={item.name} className="nav-item">
                  <button
                    className="nav-link d-flex align-items-center w-100"
                    onClick={toggleGenres}
                  >
                    <i className={`fas ${item.icon} me-2`}></i>
                    {item.name}
                    <i
                      className={`fas fa-chevron-${
                        isGenresOpen ? "up" : "down"
                      } ms-auto`}
                    ></i>
                  </button>
                  {isGenresOpen && (
                    <ul className="genres-sub-menu">
                      {genresList.length > 0 ? (
                        genresList.map((genre) => (
                          <li key={genre.id}>
                            <NavLink
                              to={`comics/filter?genre=${genre.id}`}
                              className="nav-link sub-menu-item"
                              onClick={toggleOffcanvas}
                            >
                              {genre.name}
                            </NavLink>
                          </li>
                        ))
                      ) : (
                        <li className="nav-link sub-menu-item text-center py-3">
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          Đang tải thể loại...
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ) : (
                <NavLink
                  key={item.name}
                  to={item.path ? item.path : "#"}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "active" : ""}`
                  }
                  onClick={toggleOffcanvas}
                >
                  <i className={`fas ${item.icon} me-2`}></i> {item.name}
                </NavLink>
              )
            )}
            <div className="p-3 border-top">
              {user ? (
                <div className="text-center">
                  <img
                    src={
                      user.image_url ? `${user.image_url}` : "/images/logo.png"
                    }
                    alt="avatar"
                    className="rounded-circle mb-2"
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "cover",
                    }}
                  />
                  <div className="fw-bold mb-3">
                    {user.name || "Người dùng"}
                  </div>

                  <Link
                    to="/profile"
                    className="btn btn-outline-warning w-100 mb-2"
                    onClick={toggleOffcanvas}
                  >
                    <i className="fas fa-user me-2"></i> Thông tin tài khoản
                  </Link>

                  <Link
                    to="/profile?tab=follow"
                    className="btn btn-outline-warning w-100 mb-2"
                    onClick={toggleOffcanvas}
                  >
                    <i className="fas fa-book me-2"></i> Truyện theo dõi
                  </Link>

                  <button
                    className="btn btn-danger w-100"
                    onClick={() => {
                      handleLogout();
                      toggleOffcanvas();
                    }}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i> Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Link
                    to="/login"
                    className="btn btn-warning w-100 mb-2 fw-bold"
                    onClick={toggleOffcanvas}
                  >
                    <i className="fas fa-sign-in-alt me-2"></i> Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-outline-warning w-100 fw-bold"
                    onClick={toggleOffcanvas}
                  >
                    <i className="fas fa-user-plus me-2"></i> Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content Outlet */}
      <Outlet />

      {/* Footer */}
      <footer className="footer py-5 mt-4">
        <div className="container">
          {/* --- THỂ LOẠI --- */}
          <div className="mb-4">
            <h4 className="text-warning h5 mb-3 text-center">
              Thể loại Nổi Bật
            </h4>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              {footerGenres.length > 0 ? (
                footerGenres.slice(0, 20).map((genre) => (
                  <NavLink
                    key={genre.id}
                    to={`comics/filter?genre=${genre.id}`}
                    className="text-white text-decoration-none"
                  >
                    {genre.name}
                  </NavLink>
                ))
              ) : (
                <span className="text-light small">
                  <i className="fas fa-spinner fa-spin me-2"></i>Đang tải thể
                  loại...
                </span>
              )}
            </div>
          </div>

          {/* --- 3 CỘT GIỚI THIỆU / HỖ TRỢ / LIÊN HỆ --- */}
          <div className="row text-light text-start mb-4">
            <div className="col-md-4 mb-3">
              <h5 className="footer-title">GIỚI THIỆU</h5>
              <p className="small mb-0">
                ZeroTruyen - Đọc Truyện Tranh Online Hoàn Toàn Miễn Phí - Nơi
                Thỏa Mãn Đam Mê. <br />
                Cập nhật các bộ truyện tranh hay, mới nhất, nhanh nhất để phục
                vụ độc giả, hỗ trợ trên mọi thiết bị.
              </p>
            </div>
            <div className="col-md-4 mb-3">
              <h5 className="footer-title">HỖ TRỢ</h5>
              <p className="small mb-0">
                Mọi thông tin và hình ảnh trên website đều được sưu tầm trên
                Internet. Chúng tôi không sở hữu hay chịu trách nhiệm bất kỳ
                thông tin nào trên web này. Nếu làm ảnh hưởng đến cá nhân hay tổ
                chức nào, hãy liên hệ để được gỡ bỏ.
              </p>
            </div>
            <div className="col-md-4 mb-3">
              <h5 className="footer-title">LIÊN HỆ</h5>
              <ul className="list-unstyled small mb-0">
                <li>
                  <span className="text-danger fw-bold me-1">G+ :</span>
                  <a
                    href="mailto:zerotruyen68@gmail.com"
                    className="text-white text-decoration-none"
                  >
                    zerotruyen@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* --- LOGO & SOCIAL --- */}
          <div className="text-center mt-4">
            <div className="mb-3">
              <img
                src="/images/logo1.png"
                alt="Logo"
                style={{ width: "100px", height: "auto" }}
              />
            </div>
            <h5 className="text-warning mb-3 fw-bold">
              Quality - Quickly - Quantity
            </h5>

            {/* Icon mạng xã hội */}
            <div className="d-flex justify-content-center gap-4 mb-3">
              <a
                href="https://web.facebook.com/"
                className="text-warning fs-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-facebook"></i>
              </a>
              <a
                href="https://www.tiktok.com/"
                className="text-warning fs-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-tiktok"></i>
              </a>
              <a
                href="https://www.youtube.com/"
                className="text-warning fs-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-youtube"></i>
              </a>
            </div>

            <div className="small text-light border-top pt-3">
              Copyright © 2025 ZeroTruyenVN. All Right Reserved
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
