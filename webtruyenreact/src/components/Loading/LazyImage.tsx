import React, { useState } from "react";
import Lottie from "lottie-react";
import animationData from "./animation.json";

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void; // ✅ cần thêm
  onError?: () => void; // ✅ để đồng bộ lỗi nếu muốn
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  style,
  onLoad,
  onError,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const handleLoad = () => {
    setLoaded(true);
    if (onLoad) onLoad(); // ✅ gọi lại hàm từ ComicReader
  };

  const handleError = () => {
    setError(true);
    if (onError) onError();
  };
  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        minHeight: "200px", // giữ chỗ khi loading
      }}
      className="w-100 text-center"
    >
      {/* Hiện loading khi chưa load xong */}
      {!loaded && !error && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 5,
          }}
        >
          <Lottie
            animationData={animationData}
            loop
            autoplay
            style={{ width: 80, height: 80 }}
          />
        </div>
      )}

      {/* Ảnh chính */}
      {!error ? (
        <img
          src={src}
          alt={alt}
          className={className}
          style={{
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.5s ease",
            ...style,
          }}
          onLoad={handleLoad} // ✅
          onError={handleError}
          loading="lazy"
        />
      ) : (
        <div
          className="bg-light text-danger d-flex align-items-center justify-content-center"
          style={{
            width: "100%",
            minHeight: "150px",
            border: "1px dashed #ccc",
            borderRadius: "8px",
            fontWeight: 500,
            fontSize: "1rem",
          }}
        >
          ⚠️ Không tải được ảnh
        </div>
      )}
    </div>
  );
};

export default LazyImage;
