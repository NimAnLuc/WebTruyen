import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiService } from "../../../services/apiService.ts";
import { toast } from "react-toastify";
import ComicCard from "../../../components/comic/ComicCard.tsx";
import Skeleton from "react-loading-skeleton";

interface Chapter {
  id: number;
  slug: string;
  chapter_number: number;
  created_at: string;
}

interface Comic {
  id: number;
  title: string;
  cover_image: string;
  slug: string;
  views: number;
  comic_status: string;
  chapters?: Chapter[];
}

interface Pagination {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

interface Genre {
  id: number;
  name: string;
}
type ComicStatus = "ongoing" | "completed" | "hiatus" | "";
type SortBy = "views" | "comic_created" | "chapter_created";
const FilterComics: React.FC = () => {
  const [comics, setComics] = useState<Comic[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // 🟢 Lấy giá trị ban đầu từ URL
  const [selectedGenres, setSelectedGenres] = useState<number[]>(
    searchParams.get("genre")
      ? searchParams
          .get("genre")!
          .split(",")
          .map((g) => parseInt(g))
      : []
  );
  const [comicStatus, setComicStatus] = useState<ComicStatus>(
    (searchParams.get("status") as ComicStatus) || ""
  );
  const [keyword, setKeyword] = useState<string>(
    searchParams.get("keyword") || ""
  );
  const [tempKeyword, setTempKeyword] = useState<string>(
    searchParams.get("keyword") || ""
  );

  const [sortBy, setSortBy] = useState<SortBy>(
    (searchParams.get("sort") as SortBy) || "comic_created"
  );
  const [page, setPage] = useState<number>(
    parseInt(searchParams.get("page") || "1")
  );
  const [teamId] = useState<number | null>(
    searchParams.get("team_id") ? parseInt(searchParams.get("team_id")!) : null
  );

  const [limit] = useState<number>(16);

  // 🟢 Gọi danh sách thể loại
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await apiService.listgenres<{ genres: Genre[] }>();
        setGenres(res.genres);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải danh sách thể loại!");
      }
    };
    fetchGenres();
  }, []);

  // 🟢 Gọi danh sách truyện mỗi khi filter thay đổi
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiService.filterComics<{
          comics: Comic[];
          pagination: Pagination;
        }>({
          genre_id: selectedGenres,
          comic_status: comicStatus || undefined,
          sort_by: sortBy || undefined,
          team_id: teamId ?? undefined,
          limit,
          page,
          keyword: keyword || undefined,
        });

        setComics(res.comics);
        setPagination(res.pagination);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải danh sách truyện!");
      } finally {
        setLoading(false); // 🔴 Kết thúc tải
      }
    };

    fetchData();

    // 🟡 Cập nhật URL mỗi lần filter thay đổi
    const params: any = {};
    if (selectedGenres.length > 0) params.genre = selectedGenres.join(",");
    if (comicStatus) params.status = comicStatus;
    if (sortBy) params.sort = sortBy;
    if (page !== 1) params.page = page.toString();
    if (teamId) params.team_id = teamId;
    if (keyword) params.keyword = keyword;

    setSearchParams(params);
  }, [
    selectedGenres,
    comicStatus,
    sortBy,
    page,
    limit,
    teamId,
    setSearchParams,
    keyword,
  ]);

  // 🟢 Xử lý chọn thể loại
  const handleGenreChange = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
    setPage(1);
  };

  // 🟢 Xử lý chọn trạng thái
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setComicStatus(e.target.value as ComicStatus);
    setPage(1);
  };

  // 🟢 Xử lý sắp xếp
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortBy);
    setPage(1);
  };
  // 🔹 Nhấn Enter hoặc nút tìm kiếm
  const handleSearch = () => {
    setKeyword(tempKeyword.trim());
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="container my-4 bg-white border rounded p-3">
      <div className="row">
        {/* 🟢 Right Column - Genre Filter (Hiển thị TRƯỚC ở mobile) */}
        <div className="col-md-3 p-3 order-1 order-md-2">
          <div className="filter-section border border-2 rounded p-2">
            <label className="form-label fw-bold">Thể loại</label>
            <div className="d-flex flex-column gap-1">
              {genres.map((genre) => (
                <label
                  key={genre.id}
                  className="d-flex align-items-center gap-2 text-uppercase"
                >
                  <input
                    type="checkbox"
                    value={genre.id}
                    checked={selectedGenres.includes(genre.id)}
                    onChange={() => handleGenreChange(genre.id)}
                  />
                  {genre.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 🟢 Left Column - Danh sách truyện */}
        <div className="col-md-9 p-3 order-2 order-md-1">
          {/* Filter Section */}
          <div className="filter-section mb-4">
            <div className="row g-3 align-items-end">
              <div className="col-md-12 mb-3">
                <label className="form-label">Tìm kiếm truyện</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập tên truyện..."
                    value={tempKeyword}
                    onChange={(e) => setTempKeyword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button className="btn btn-primary" onClick={handleSearch}>
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Trạng thái</label>

                <select
                  className="form-select"
                  value={comicStatus}
                  onChange={handleStatusChange}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="ongoing">Đang cập nhật</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="hiatus">Tạm dừng</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">Sắp xếp</label>
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={handleSortChange}
                >
                  <option value="comic_created">Mới nhất</option>
                  <option value="views">Lượt xem</option>
                  <option value="chapter_created">Chương mới nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* Danh sách truyện */}
          <div className="row g-4">
            {loading ? (
              <div className="row g-4">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="col-6 col-md-3">
                    <Skeleton height={250} />
                    <div className="p-2">
                      <Skeleton width={`80%`} height={18} />
                      <Skeleton width={`60%`} height={14} />
                    </div>
                  </div>
                ))}
              </div>
            ) : comics.length > 0 ? (
              comics.map((comic) => (
                <div key={comic.id} className="col-6 col-md-3">
                  <ComicCard comic={comic} />
                </div>
              ))
            ) : (
              // 🟠 Chỉ hiện khi KHÔNG loading và thực sự không có kết quả
              <div className="text-center text-muted py-5">
                Không có truyện nào phù hợp!
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center">
                {Array.from(
                  { length: pagination.last_page },
                  (_, i) => i + 1
                ).map((num) => (
                  <li
                    key={num}
                    className={`page-item ${
                      num === pagination.current_page ? "active" : ""
                    }`}
                  >
                    <button className="page-link" onClick={() => setPage(num)}>
                      {num}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterComics;
