import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

interface ComicHistory {
  id: number;
  title: string;
  slug: string;
  cover_image: string;
  latest_chapter_number: number;
  latest_chapter_slug: string;
  latest_chapter_id: number;
  last_read_at: string;
}

const ReadingHistory: React.FC = () => {
  const [readingHistory, setReadingHistory] = useState<ComicHistory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const comicsPerPage = 16;

  useEffect(() => {
    const data = localStorage.getItem("readingHistory");
    if (data) {
      const parsed = JSON.parse(data);
      // Sắp xếp theo thời gian đọc gần nhất
      setReadingHistory(
        parsed.sort(
          (a: ComicHistory, b: ComicHistory) =>
            new Date(b.last_read_at).getTime() -
            new Date(a.last_read_at).getTime()
        )
      );
    }
  }, []);

  // Tính phân trang
  const indexOfLast = currentPage * comicsPerPage;
  const indexOfFirst = indexOfLast - comicsPerPage;
  const currentComics = readingHistory.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(readingHistory.length / comicsPerPage);
  const handleDeleteOne = (id: number) => {
    if (window.confirm("Bạn có chắc muốn xóa truyện này khỏi lịch sử?")) {
      const updated = readingHistory.filter((comic) => comic.id !== id);
      setReadingHistory(updated);
      localStorage.setItem("readingHistory", JSON.stringify(updated));
    }
  };
  return (
    <div className="container my-4">
      {/* Phần tiêu đề */}
      <h2 className="fw-bold border-bottom border-warning pb-2 mb-3">
        Lịch Sử Đọc Truyện
      </h2>

      <div
        style={{
          backgroundColor: "#fff5f5",
          border: "1px solid #ffcccc",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "12px",
          color: "red",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <p style={{ margin: 0, flex: 1, lineHeight: "1.5" }}>
          Nhấn vào <b>“Đọc tiếp”</b> để đọc tiếp chapter bạn đang đọc trước đó.
          <br />
          <i>
            Lưu ý danh sách được sắp xếp theo thời gian đọc cuối cùng chứ không
            phải ngày cập nhật mới nhất.
          </i>
        </p>

        <button
          onClick={() => {
            localStorage.removeItem("readingHistory");
            alert("Đã xóa toàn bộ lịch sử đọc!");
            window.location.reload();
          }}
          style={{
            marginLeft: "12px",
            padding: "6px 12px",
            backgroundColor: "red",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          🗑 Xóa lịch sử
        </button>
      </div>

      {/* Danh sách truyện */}
      {currentComics.length > 0 ? (
        <div className="row row-cols-2 row-cols-md-4 g-3">
          {currentComics.map((comic) => (
            <div key={comic.id} className="col">
              <div className="card h-100 shadow-sm">
                <button
                  className="btn btn-sm btn-secondary position-absolute top-0 end-0 m-1"
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    border: "none",
                    fontSize: "15px",
                    borderRadius: "12px",
                    padding: "2px 8px",
                    zIndex: 2,
                  }}
                  onClick={() => handleDeleteOne(comic.id)}
                >
                  Xóa
                </button>
                <img
                  src={`${comic.cover_image}`}
                  alt={comic.title}
                  className="card-img-top"
                  style={{
                    height: "260px",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "/images/logo.png";
                  }}
                />
                <div className="card-body text-center">
                  <h6 className="fw-bold text-truncate">{comic.title}</h6>
                  <p className="small mb-1 text-muted">
                    Chapter {comic.latest_chapter_number}
                  </p>
                  <a
                    href={`/comic/${comic.slug}/${comic.latest_chapter_slug}/${comic.latest_chapter_id}`}
                    className="btn btn-sm btn-warning text-white"
                  >
                    Đọc tiếp »
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted mt-4">
          Chưa có truyện nào trong lịch sử đọc.
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`btn ${
                currentPage === i + 1 ? "btn-warning" : "btn-light"
              }`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadingHistory;
