import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type Props = {
  images: string[];
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  imgClass?: string;
  loading?: "eager" | "lazy";
};

export default function HeroImageSwiper({
  images,
  alt = "",
  width = 1000,
  height = 500,
  className = "",
  imgClass = "w-full h-auto rounded-lg object-cover",
  loading = "lazy",
}: Props) {
  return (
    <div className={`hero-carousel hero-carousel__swiper ${className}`.trim()}>
      <Swiper
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        loop={images.length > 1}
        className="rounded-lg"
      >
        {images.map((src, index) => (
          <SwiperSlide key={`${src}-${index}`}>
            <img
              src={src}
              alt={alt}
              width={width}
              height={height}
              className={imgClass}
              loading={index === 0 ? loading : "lazy"}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
