// src/components/facility-details/FacilityInfo.js
import React from 'react';
import styles from './FacilityInfo.module.css';

function FacilityInfo({ facility, isGoogleSource }) {
  return (
    <div className={styles.section}>
      <strong>כתובת:</strong> {facility.address}<br />
      <strong>סוג:</strong> {facility.type}<br />
      <strong>דירוג:</strong> {facility.rating ? `${facility.rating} / 5` : 'לא דורג'}
      {isGoogleSource && (
        <div className={styles.sourceInfo}>
          <small>מקור: Google Maps</small>
        </div>
      )}
    </div>
  );
}

export default FacilityInfo;