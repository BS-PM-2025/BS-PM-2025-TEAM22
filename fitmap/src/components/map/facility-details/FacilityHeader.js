// src/components/facility-details/FacilityHeader.js
import React from 'react';
import styles from './FacilityHeader.module.css';
import ImageGallery from './ImageGallery';

function FacilityHeader({ name, images, onClose }) {
  return (
    <>
      <div className={styles.header}>
        <h2>{name}</h2>
        <button onClick={onClose}>×</button>
      </div>

      <ImageGallery images={images} name={name} />
    </>
  );
}

export default FacilityHeader;