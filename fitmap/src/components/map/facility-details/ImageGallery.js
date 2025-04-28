import React, { useState } from 'react';
import styles from './ImageGallery.module.css';
const ImageGallery = ({ images, name }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // אם אין תמונות, לא מציגים כלום
  if (!images || images.length === 0) {
    return null;
  }

  // אם יש רק תמונה אחת, מציגים אותה בלבד
  if (images.length === 1) {
    return (
      <div className={styles.imageContainer}>
        <img src={images[0]} alt={name} className={styles.facilityImage} />
      </div>
    );
  }

  const nextImage = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToImage = (index) => {
    setActiveIndex(index);
  };

  return (
    <div className={styles.galleryContainer}>
      <div className={styles.imageContainer}>
        <img 
          src={images[activeIndex]} 
          alt={`${name} - תמונה ${activeIndex + 1}`} 
          className={styles.facilityImage}
        />
        
        <button 
          onClick={prevImage} 
          className={`${styles.galleryButton} ${styles.galleryButtonRight}`}
          aria-label="תמונה קודמת"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
        
        <button 
          onClick={nextImage} 
          className={`${styles.galleryButton} ${styles.galleryButtonLeft}`}
          aria-label="תמונה הבאה"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        
        <div className={styles.imagePagination}>
          {images.map((_, index) => (
            <button 
              key={index}
              onClick={() => goToImage(index)}
              className={`${styles.paginationDot} ${index === activeIndex ? styles.activeDot : ''}`}
              aria-label={`עבור לתמונה ${index + 1}`}
              aria-current={index === activeIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;