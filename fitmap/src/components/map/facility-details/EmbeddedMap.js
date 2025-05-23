// EmbeddedMap.js
import React, { useState } from 'react';
import styles from './EmbeddedMap.module.css';

const EmbeddedMap = ({ facility }) => {
  const [showStreetView, setShowStreetView] = useState(false);
  const [mapKey, setMapKey] = useState(0); // רינדור מחדש למפה

  if (!facility?.latitude || !facility?.longitude) {
    return (
      <div className={styles.mapPlaceholder}>
        <i className="fas fa-map-marker-alt"></i>
        <p>לא ניתן להציג מפה - מיקום חסר</p>
      </div>
    );
  }

  const lat = facility.latitude;
  const lng = facility.longitude;

  const mapUrl = showStreetView
    ? `https://www.google.com/maps/embed?pb=!1m0!3m2!1sen!2sil!6m1!1e1!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${lat},${lng}`
    : `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;

  const handleFocusOnMap = () => {
    setMapKey(prev => prev + 1); // מרענן את ה־iframe
    setShowStreetView(false);
  };

  const toggleStreetView = () => {
    setShowStreetView(prev => !prev);
    setMapKey(prev => prev + 1);
  };

  return (
    <div className={styles.embeddedMapContainer}>
      <iframe
        key={mapKey}
        title={`מפה של ${facility.name}`}
        src={mapUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        loading="lazy"
        allowFullScreen
        aria-hidden="false"
        tabIndex="0"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className={styles.mapButtons}>
        <button onClick={handleFocusOnMap} aria-label="מקד אותי למתקן">
          <i className="fas fa-crosshairs"></i>
        </button>
        <button onClick={toggleStreetView} aria-label="החלף ל־Street View">
          <i className="fas fa-street-view"></i>
        </button>
      </div>
    </div>
  );
};

export default EmbeddedMap;