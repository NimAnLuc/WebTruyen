import React, { useState } from "react";
import { Link } from "react-router-dom";
import animationData from "../Loading/animation.json";
import Lottie from "lottie-react";
interface Chapter {
  id: number;
  slug: string;
  chapter_number: number;
  created_at: string;
}

interface ComicCardProps {
  comic: {
    id: number;
    title: string;
    slug: string;
    views?: number;
    cover_image: string;
    bookmark_count?: number;
    comment_count?: number;
    chapters?: Chapter[];
  };
}

// 🧮 Làm tròn số chapter
const formatChapterNumber = (num: number) => {
  return Number.isInteger(num) ? num : parseFloat(num.toFixed(1));
};

const ComicCard: React.FC<ComicCardProps> = ({ comic }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const imageUrl = `${comic.cover_image}`;

  return (
    <div className="comic-card card h-100 border-0 bg-transparent">
      {/* Ảnh truyện */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "300px",
          overflow: "hidden",
          borderRadius: "6px",
          backgroundColor: "#f2f2f2", // ✅ giữ khung nền trong lúc ảnh load
        }}
      >
        <Link to={`/comic/${comic.slug}`}>
          {/* 🔄 Hiện animation khi ảnh chưa load */}
          {!imgLoaded && (
            <div
              className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
              style={{
                backgroundColor: "#fff", // hoặc bỏ nếu không muốn nền
                zIndex: 5,
              }}
            >
              <Lottie
                animationData={animationData}
                loop
                autoplay
                style={{ width: 100, height: 100 }}
              />
            </div>
          )}

          {/* Ảnh chính */}
          <img
            src={imageUrl}
            alt={comic.title}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/logo.png";
            }}
            className="w-100 h-100 object-fit-cover"
            style={{
              transition: "opacity 0.5s ease",
              opacity: imgLoaded ? 1 : 0, // ✅ fade-in sau khi load
            }}
          />

          <div className="comic-info d-flex justify-content-center">
            <i className="fas fa-eye"></i>
            {comic.views}
            <i className="fas fa-comment ms-2"></i>
            {comic.comment_count}
            <i className="fas fa-bookmark ms-2"></i>
            {comic.bookmark_count}
          </div>
        </Link>
      </div>

      {/* Nội dung chữ - render ngay lập tức */}
      <div className="card-body px-0 pt-2">
        <h6 className="fw-bold text-truncate mb-1">
          <Link to={`/comic/${comic.slug}`} className="text-decoration-none">
            {comic.title}
          </Link>
        </h6>

        <ul className="list-unstyled small text-muted mb-0">
          {comic.chapters && comic.chapters.length > 0 ? (
            comic.chapters.slice(0, 3).map((chapter) => (
              <li key={`chapter-${chapter.id}`}>
                <Link
                  to={`/comic/${comic.slug}/${chapter.slug}/${chapter.id}`}
                  className="text-dark text-decoration-none d-flex justify-content-between align-items-center"
                >
                  <span>
                    Chapter {formatChapterNumber(chapter.chapter_number)}
                  </span>
                  <span className="text-secondary">{chapter.created_at}</span>
                </Link>
              </li>
            ))
          ) : (
            <li className="text-secondary fst-italic">Chưa có chương nào</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ComicCard;
