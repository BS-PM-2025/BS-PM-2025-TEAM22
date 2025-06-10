 import React from 'react';
 import styles from './FacilityInfo.module.css';

function FacilityInfo({ facility, isGoogleSource }) { return ( <div className={styles.section}> <div className={styles.infoRow}> <span className={styles.label}>כתובת:</span> <span>{facility.address}</span> </div>

<div className={styles.infoRow}>
    <span className={styles.label}>סוג:</span>
    <span>{facility.type}</span>
  </div>

  <div className={styles.infoRow}>
    <span className={styles.label}>דירוג:</span>
    <span>
      {facility.rating ? `${facility.rating} / 5` : 'לא דורג'}
    </span>
  </div>

  {isGoogleSource && (
    <div className={styles.sourceInfo}>
      <small>מקור: Google Maps</small>
    </div>
  )}
</div>

); }

export default FacilityInfo;

