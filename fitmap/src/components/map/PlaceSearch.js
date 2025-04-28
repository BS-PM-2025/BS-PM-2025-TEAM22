// src/components/map/PlaceSearch.js
import React, { useEffect, useRef, useState } from 'react';
import styles from '../../styles/PlaceSearch.module.css';

/**
 * רכיב חיפוש מקום המשתמש ב-Google Places Autocomplete
 * משתמש בשירות Autocomplete היציב.
 */
function PlaceSearch({ onPlaceSelected }) {
  const inputRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!window.google?.maps?.places || !inputRef.current || autocompleteRef.current) {
      return;
    }

    // אתחול Autocomplete
    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      { fields: ['name', 'geometry'], types: ['geocode', 'establishment'] }
    );

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        onPlaceSelected(place);
      }
    });

    autocompleteRef.current = autocomplete;
    setIsLoaded(true);

    return () => {
      // ניקוי מאזינים
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [onPlaceSelected]);

  return (
    <div className={styles.wrapper}>
      {!isLoaded && <div className={styles.loader}>טוען...</div>}
      <input
        ref={inputRef}
        className={styles.searchInput}
        type="text"
        placeholder="חפש מתקן לפי שם או כתובת"
        aria-label="חיפוש מתקן"
      />
    </div>
  );
}

export default PlaceSearch;

