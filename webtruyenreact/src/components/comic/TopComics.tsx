import React, { useState, useEffect } from "react";
import { apiService } from "../../services/apiService.ts";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";

interface Comic {
  id: number;
  title: string;
  slug: string;
  cover_image: string;
  views: number;
  latest_chapter_number: number;
  latest_chapter_slug: string;
  latest_chapter_created_at: string;
}

interface ComicsResponse {
  comics: Comic[];
}

const TopViewComics: React.FC = () => {
  const [topviewComics, setTopviewComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  // Gọi API lấy top view comics
  useEffect(() => {
    const fetchTopViewComics = async () => {
      setLoading(true);
      try {
        const topviewData = await apiService.fetchTopViews<ComicsResponse>();
        setTopviewComics(
          Array.isArray(topviewData.comics) ? topviewData.comics : []
        );
      } catch (error) {
        toast.error("Lỗi khi lấy dữ liệu top view comics");
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopViewComics();
  }, []);

  return (
    <div className="sidebar-widget card mb-4">
      <div className="widget-header d-flex align-items-center">
        🏆 Top 10 lượt xem cao nhất
      </div>
      <div className="card-body">
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="d-flex align-items-center gap-3 mb-3">
              <div style={{ width: 30, height: 30 }}>
                <Skeleton circle width={24} height={24} />
              </div>
              <Skeleton height={60} width={45} />
              <div className="flex-grow-1">
                <Skeleton width="80%" height={14} />
                <Skeleton width="50%" height={12} />
              </div>
            </div>
          ))
        ) : topviewComics.length > 0 ? (
          topviewComics.map((comic, index) => (
            <div
              key={comic.id}
              className="ranking-item d-flex align-items-center gap-3 mb-3"
            >
              <div className="ranking-number fw-bold">
                {String(index + 1).padStart(2, "0")}
              </div>

              {/* Ảnh truyện */}
              <div className="ranking-cover">
                {!loadedImages[comic.id] && <div className="placeholder" />}

                <img
                  src={`${comic.cover_image}`}
                  alt={comic.title}
                  loading="lazy"
                  style={{ opacity: loadedImages[comic.id] ? 1 : 0 }}
                  onLoad={() =>
                    setLoadedImages((prev) => ({ ...prev, [comic.id]: true }))
                  }
                  onError={(
                    e: React.SyntheticEvent<HTMLImageElement, Event>
                  ) => {
                    e.currentTarget.src = "/images/logo.png";
                  }}
                />
              </div>

              {/* Thông tin truyện */}
              <div className="ranking-info flex-grow-1">
                <a
                  href={`/comic/${comic.slug}`}
                  className="ranking-title text-decoration-none fw-bold text-dark d-block text-truncate"
                  title={comic.title}
                >
                  {comic.title}
                </a>
                <div className="ranking-chapter small text-muted">
                  Chapter {comic.latest_chapter_number}
                </div>
                <div className="ranking-views small text-secondary">
                  👁️ {comic.views.toLocaleString()}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div>Không có truyện</div>
        )}
      </div>

      {/* CSS animation nhẹ */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TopViewComics;
