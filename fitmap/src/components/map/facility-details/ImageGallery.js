// src/components/facility-details/ImageGallery.js
import React, { useState, useRef } from 'react';
import styles from './ImageGallery.module.css';

const ImageGallery = ({ images, name }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(null);

  if (!images || images.length === 0) return null;

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) nextImage();
    else if (diff < -50) prevImage();
    touchStartX.current = null;
  };

  return (
    <div className={styles.carousel}>
      <div
        className={styles.slider}
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((img, idx) => (
          <div className={styles.slide} key={idx}>
            <img
              src={img}
              alt={`${name} - תמונה ${idx + 1}`}
              className={styles.image}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      <button className={styles.prev} onClick={prevImage} aria-label="הקודם">
        <i className="fas fa-chevron-right" />
      </button>
      <button className={styles.next} onClick={nextImage} aria-label="הבא">
        <i className="fas fa-chevron-left" />
      </button>

      <div className={styles.pagination}>
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`${styles.dot} ${idx === activeIndex ? styles.active : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;