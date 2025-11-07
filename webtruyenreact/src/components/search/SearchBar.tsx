import { useState } from "react";
import { toast } from "react-toastify";
import { apiService } from "../../services/apiService.ts";

interface Comic {
  id: number;
  title: string;
  slug: string;
  cover_image: string;
  views: number;
  latest_chapter_number: number;
  latest_chapter_created_at: string;
}



const SearchBar: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Comic[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(false);
    try {
      const data = await apiService.fetchSearch<{
        status: boolean;
        comics: Comic[];
      }>({
        keyword,
      });

      if (data.status) {
        setResults(data.comics);
      } else {
        setResults([]);
      }
    } catch {
      toast.error("Lỗi khi tìm kiếm!");
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="position-relative w-100" style={{ maxWidth: "400px" }}>
      <input
        type="text"
        className="form-control rounded-pill"
        placeholder="Nhập tên truyện cần tìm..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button
        className="btn btn-primary rounded-pill"
        style={{
          position: "absolute",
          right: "0px",
          top: "50%",
          transform: "translateY(-50%)",
        }}
        onClick={handleSearch}
      >
        <i className="fas fa-search"></i>
      </button>

      {(keyword.trim() || loading) && (
        <div
          className="search-results bg-white shadow rounded p-2"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {loading ? (
            <div className="text-center py-3">Đang tải...</div>
          ) : results.length > 0 ? (
            <>
              {results.slice(0, 10).map((comic) => (
                <div
                  key={comic.id}
                  className="d-flex align-items-center gap-2 p-2 border-bottom"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    (window.location.href = `/comic/${comic.slug}`)
                  }
                >
                  <img
                    src={`${comic.cover_image}`}
                    alt={comic.title}
                    style={{
                      width: "40px",
                      height: "60px",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                  <div>
                    <div
                      className="comic-title fw-bold"
                      style={{ color: "#000" }}
                    >
                      {comic.title}
                    </div>
                    <div className="small text-muted">
                      Ch. {comic.latest_chapter_number} -{" "}
                      {comic.latest_chapter_created_at}
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-center mt-2">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() =>
                    (window.location.href = `/comics/filter?sort=comic_created&keyword=${encodeURIComponent(
                      keyword
                    )}`)
                  }
                >
                  Xem thêm kết quả
                </button>
              </div>
            </>
          ) : (
            searched && (
              <div className="text-center p-2 text-muted">
                Không tìm thấy truyện nào phù hợp với “{keyword}”
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
