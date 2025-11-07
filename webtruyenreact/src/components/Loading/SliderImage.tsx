import React, { useState } from "react";
import Lottie from "lottie-react";
import animationData from "./animation.json";

interface SliderImageProps {
  src: string;
  alt: string;
  height?: string | number;
}

const SliderImage: React.FC<SliderImageProps> = ({
  src,
  alt,
  height = "250px",
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        overflow: "hidden",
        borderRadius: "8px",
        backgroundColor: "#f5f5f5",
      }}
    >
      {!loaded && !error && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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

      {!error ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        />
      ) : (
        <img
          src="/images/logo.png"
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "opacity 0.4s ease",
          }}
        />
      )}
    </div>
  );
};

export default SliderImage;
