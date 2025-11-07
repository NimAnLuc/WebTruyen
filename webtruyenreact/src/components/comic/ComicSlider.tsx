import React, { useState, useEffect } from "react";
import { apiService } from "../../services/apiService.ts";
import { toast } from "react-toastify";
import Lottie from "lottie-react";
import animationData from "../Loading/animation.json";
import { Link } from "react-router-dom";
import SliderImage from "../Loading/SliderImage.tsx";
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

interface ComicsResponse {
  comics: Comic[];
}

interface ComicSliderProps {
  chunkSize?: number;
  autoSlideInterval?: number;

}

const ImageLoading: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(0, 0, 0, 0.1)",
      }}
    >
      <Lottie
        animationData={animationData}
        loop={false}
        autoplay={true}
        style={{
          width: "50px",
          height: "50px",
        }}
      />
    </div>
  );
};

const ComicSlider: React.FC<ComicSliderProps> = ({
  chunkSize = 4,
  autoSlideInterval = 3000,

}) => {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const featuredData = await apiService.fetchFeatured<ComicsResponse>({
          limit: 8,
        });

        setComics(
          Array.isArray(featuredData.comics) ? featuredData.comics : []
        );
      } catch (error) {
        toast.error("Lỗi khi lấy dữ liệu truyện nổi bật");
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Hàm chia danh sách comics thành các nhóm
  const chunkArray = (array: Comic[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  const chunks = chunkArray(comics, chunkSize);

  // Tự động chuyển slide
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (comics.length > 1 && chunks.length > 1) {
      interval = setInterval(() => {
        setCurrentSlide((prevSlide) => {
          if (prevSlide === chunks.length - 1) {
            return 0;
          }
          return prevSlide + 1;
        });
      }, autoSlideInterval);
    }
    return () => clearInterval(interval);
  }, [comics, chunks.length, autoSlideInterval]);

if (loading) {
  return (
    <div className="row row-cols-2 row-cols-md-4 g-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="col">
          <div className="card border-0 shadow-sm rounded overflow-hidden">
            <Skeleton height={200} borderRadius={8} />
            <div className="p-2">
              <Skeleton width={`80%`} height={18} />
              <Skeleton width={`60%`} height={14} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

  if (comics.length === 0) {
    return <div>Không có truyện nổi bật</div>;
  }

  if (comics.length === 1) {
    return (
      <div className="row">
        <div className="col-6 col-md-3 text-center">
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "200px",
            }}
          >
            {comics[0].isLoading ? (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                }}
              >
                <ImageLoading />
              </div>
            ) : (
              <img
                src={`${comics[0].cover_image}`}
                alt={comics[0].title}
                className="img-fluid mb-2"
                loading="lazy"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            )}
          </div>
          <a
            href={`/comic/${comics[0].slug}`}
            className="fw-bold d-block text-decoration-none"
          >
            {comics[0].title} 
          </a>
          <div className="text-muted small">
            Chapter {comics[0].latest_chapter_number} -{" "}
            {comics[0].latest_chapter_created_at}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "250px" }}>
      <div id="carouselExample" className="carousel slide">
        <div className="carousel-inner">
          {chunks.map((chunk, index) => (
            <div
              key={index}
              className={`carousel-item ${
                index === currentSlide ? "active" : ""
              }`}
            >
              <div className="row">
                {chunk.map((comic) => (
                  <div key={comic.id} className="col-6 col-md-3 mb-3">
                    <div className="comic-card position-relative overflow-hidden rounded shadow-sm">
                      <Link to={`/comic/${comic.slug}`}>
                        <SliderImage
                          src={`${comic.cover_image}`}
                          alt={comic.title}
                          height="250px"
                        />
                      </Link>
                      <div className="comic-overlay  d-flex flex-column justify-content-end p-2">
                        <h5 className="comic-title text-center text-white fw-bold mb-1 text-truncate">
                          <Link
                            to={`/comic/${comic.slug}`}
                            className="text-white text-decoration-none"
                          >
                            {comic.title}
                          </Link> 
                        </h5>
                        <div className="text-white-50 small text-center">
                          <Link
                            to={`/comic/${comic.slug}/${comic.latest_chapter_slug}/${comic.latest_chapter_id}`}
                            className="text-warning text-decoration-none fw-bold"
                          >
                            Chapter {comic.latest_chapter_number}
                            <span className="text-light">
                              - {comic.latest_chapter_created_at}
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {chunks.length > 1 && (
          <>
            <button
              className="btn btn-warning position-absolute top-50 start-0 translate-middle-y"
              style={{
                zIndex: 1000, // Tăng zIndex để đảm bảo nút không bị che
                borderRadius: "50%",
                width: "45px",
                height: "45px",
                opacity: 0.8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffc107", // Fallback màu vàng nếu thiếu Bootstrap
                color: "#000", // Fallback màu chữ
              }}
              onClick={() =>
                setCurrentSlide((prev) =>
                  prev === 0 ? chunks.length - 1 : prev - 1
                )
              }
            >
              ❮
            </button>
            <button
              className="btn btn-warning position-absolute top-50 end-0 translate-middle-y"
              style={{
                zIndex: 1000, // Tăng zIndex để đảm bảo nút không bị che
                borderRadius: "50%",
                width: "45px",
                height: "45px",
                opacity: 0.8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffc107", // Fallback màu vàng nếu thiếu Bootstrap
                color: "#000", // Fallback màu chữ
              }}
              onClick={() =>
                setCurrentSlide((prev) =>
                  prev === chunks.length - 1 ? 0 : prev + 1
                )
              }
            >
              ❯
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ComicSlider;
