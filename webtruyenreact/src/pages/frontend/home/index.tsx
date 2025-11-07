import React, { useState, useEffect } from "react";
import { apiService } from "../../../services/apiService.ts";
import { toast } from "react-toastify";
import TopViewComics from "../../../components/comic/TopComics.tsx";
import ComicCard from "../../../components/comic/ComicCard.tsx";
import { useSearchParams } from "react-router-dom";
import ComicSlider from "../../../components/comic/ComicSlider.tsx";
import Skeleton from "react-loading-skeleton";

interface Comic {
  isLoading: any;
  id: number;
  title: string;
  slug: string;
  latest_chapter_slug: string;
  cover_image: string;
  views: number;
  latest_chapter_number: number;
  latest_chapter_created_at: string;
  latest_chapter_id: number;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface ComicsResponse {
  comics: Comic[];
  pagination: Pagination;
}

const App: React.FC = () => {
  const [homeComics, setHomeComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalComics, setTotalComics] = useState(0);
  const [readingHistory, setReadingHistory] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const comicsPerPage = 16;

  // Lấy trang hiện tại từ URL khi component mount
  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1", 10);
    if (page >= 1) {
      setCurrentPage(page);
    }
  }, [searchParams]);

  // Lưu lịch sử đọc từ localStorage
  useEffect(() => {
    const historyData = localStorage.getItem("readingHistory");
    if (historyData) {
      setReadingHistory(JSON.parse(historyData));
    }
  }, []);

  const handleRemoveHistory = (id: number) => {
    const updated = readingHistory.filter((item) => item.id !== id);
    setReadingHistory(updated);
    localStorage.setItem("readingHistory", JSON.stringify(updated));
  };

  // Gọi API khi currentPage thay đổi
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const homeData = await apiService.fetchHome<ComicsResponse>({
          limit: comicsPerPage,
          page: currentPage,
        });
        setHomeComics(Array.isArray(homeData.comics) ? homeData.comics : []);
        setTotalPages(homeData.pagination?.last_page || 0);
        setTotalComics(homeData.pagination?.total || 0);
        if (homeData.pagination?.current_page !== currentPage) {
          setSearchParams({
            page: homeData.pagination.current_page.toString(),
          });
          setCurrentPage(homeData.pagination.current_page);
        }
      } catch (error) {
        toast.error("Lỗi khi lấy dữ liệu");
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, setSearchParams]);

  // Hàm tạo danh sách các trang để hiển thị
  const getPageNumbers = () => {
    const maxPagesToShow = 6;
    const pageNumbers: (number | string)[] = [];

    if (totalPages <= 0) {
      return [];
    }

    if (totalPages <= maxPagesToShow + 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      pageNumbers.push(
        ...Array.from({ length: Math.min(6, totalPages) }, (_, i) => i + 1)
      );
      if (totalPages > maxPagesToShow) {
        pageNumbers.push("...");
        pageNumbers.push(totalPages - 1, totalPages);
      }
    } else {
      pageNumbers.push(1, 2);
      if (currentPage > 5) {
        pageNumbers.push("...");
      }
      const startPage = Math.max(3, currentPage - 2);
      const endPage = Math.min(totalPages - 2, currentPage + 2);
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      if (endPage < totalPages - 2) {
        pageNumbers.push("...");
      }
      pageNumbers.push(totalPages - 1, totalPages);
    }

    return pageNumbers;
  };

  // Hàm xử lý thay đổi trang và cập nhật URL
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSearchParams({ page: page.toString() });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="container my-4">
      {/* Featured Section */}
      <section className="bg-white rounded shadow p-4 mb-4">
        <h2 className="h5 fw-bold mb-3 border-bottom border-2 border-warning">
          Truyện Nổi Bật
        </h2>
        <ComicSlider
          chunkSize={4}
          autoSlideInterval={3000}

        />
      </section>

      {/* Main and Sidebar */}
      <div className="row g-4">
        <main className="col-lg-8">
          <section className="bg-white rounded shadow p-4">
            <h2 className="h5 fw-bold mb-3">Truyện mới cập nhật</h2>
            {loading ? (
              <div className="row row-cols-2 row-cols-md-4 g-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="col">
                    <div className="card border-0 shadow-sm">
                      <Skeleton height={200} borderRadius={8} />
                      <div className="p-2">
                        <Skeleton width={`80%`} height={18} />
                        <Skeleton width={`60%`} height={14} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : homeComics.length > 0 ? (
              <div className="row row-cols-2 row-cols-md-4 g-3">
                {homeComics.map((comic) => (
                  <div key={comic.id} className="col">
                    <ComicCard comic={comic} />
                  </div>
                ))}
              </div>
            ) : (
              <div>Không có truyện mới</div>
            )}
            {totalComics > 0 && (
              <div className="d-flex justify-content-center gap-2 mt-4">
                <button
                  className={`btn ${
                    currentPage === 1 ? "btn-light disabled" : "btn-light"
                  }`}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {getPageNumbers().map((page, index) =>
                  typeof page === "string" ? (
                    <span key={index} className="btn btn-light disabled">
                      {page}
                    </span>
                  ) : (
                    <button
                      key={index}
                      type="button"
                      className={`btn ${
                        currentPage === page ? "btn-warning" : "btn-light"
                      }`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  className={`btn ${
                    currentPage === totalPages
                      ? "btn-light disabled"
                      : "btn-light"
                  }`}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </main>

        {/* Sidebar */}
        <aside className="col-lg-4">
          {readingHistory.length > 0 && (
            <div className="sidebar-widget card mb-4">
              <div className="widget-header d-flex justify-content-between align-items-center border-bottom pb-2">
                <h6 className="fw-bold mb-0 text-primary">
                  <i className="bi bi-clock-history me-1"></i> Lịch sử đọc
                  truyện
                </h6>
                <a
                  href="/lich-su-doc"
                  className="small text-decoration-none text-secondary"
                >
                  Xem tất cả &raquo;
                </a>
              </div>
              <div className="card-body p-2">
                {readingHistory.map((item) => (
                  <div
                    key={item.id}
                    className="d-flex align-items-center justify-content-between mb-2 border-bottom pb-2"
                  >
                    <div className="d-flex align-items-center">
                      <img
                        src={`${item.cover_image}`}
                        alt={item.title}
                        style={{
                          width: "50px",
                          height: "60px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                        onError={(e) => {
                          e.currentTarget.src = "/images/logo.png";
                        }}
                      />
                      <div className="ms-2">
                        <a
                          href={`/comic/${item.slug}`}
                          className="fw-bold text-dark text-decoration-none small d-block text-truncate"
                          style={{ maxWidth: "160px" }}
                        >
                          {item.title}
                        </a>
                        <a
                          href={`/comic/${item.slug}/${item.latest_chapter_slug}/${item.latest_chapter_id}`}
                          className="text-muted small text-decoration-none"
                        >
                          Đọc tiếp Chapter {item.latest_chapter_number} &raquo;
                        </a>
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-light border text-muted"
                      onClick={() => handleRemoveHistory(item.id)}
                    >
                      × Xóa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <TopViewComics />
        </aside>
      </div>
    </div>
  );
};

export default App;
