import React from 'react';
import styles from './EmbeddedMap.module.css'; // Assuming you have a CSS module for styles

const EmbeddedMap = ({ facility }) => {
  if (!facility || !facility.latitude || !facility.longitude) {
    return (
      <div className={styles.mapPlaceholder}>
        <i className="fas fa-map-marker-alt"></i>
        <p>לא ניתן להציג מפה - מיקום חסר</p>
      </div>
    );
  }

  // יצירת URL עבור המפה המוטמעת
  const mapUrl = `https://maps.google.com/maps?q=${facility.latitude},${facility.longitude}&z=15&output=embed`;

  return (
    <div className={styles.embeddedMapContainer}>
      <iframe
        title={`מפה של ${facility.name}`}
        src={mapUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 0 }}
        allowFullScreen=""
        aria-hidden="false"
        tabIndex="0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

export default EmbeddedMap;