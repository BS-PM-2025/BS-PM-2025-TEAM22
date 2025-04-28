// src/components/shared/LoadingSpinner.js
import React from 'react';
import styles from '../../styles/LoadingSpinner.module.css';

function LoadingSpinner({ size = 'medium', text = 'טוען...', fullScreen = false }) {
  const sizeClass = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large
  }[size];
  
  if (fullScreen) {
    return (
      <div className={styles.fullScreenOverlay}>
        <div className={styles.spinnerContainer}>
          <div className={`${styles.spinner} ${sizeClass}`}></div>
          {text && <p className={styles.text}>{text}</p>}
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={`${styles.spinner} ${sizeClass}`}></div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
}

export default LoadingSpinner;