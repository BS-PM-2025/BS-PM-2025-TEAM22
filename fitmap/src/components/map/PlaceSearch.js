// src/components/map/PlaceSearch.js
import React, { useEffect, useRef, useState } from 'react';
import styles from './styles/PlaceSearch.module.css';
import { FaSearchLocation, FaSpinner } from 'react-icons/fa';

/**
 * PlaceSearch - רכיב חיפוש מקום עם Google Places Autocomplete
 */
function PlaceSearch({ onPlaceSelected }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!window.google?.maps?.places || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        fields: ['name', 'geometry'],
        types: ['geocode', 'establishment'],
      }
    );

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place?.geometry?.location) {
        onPlaceSelected(place);
      }
    });

    autocompleteRef.current = autocomplete;
    setIsLoaded(true);

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [onPlaceSelected]);

  return (
    <div className={styles.wrapper} role="search">
      {!isLoaded && (
        <div className={styles.loadingOverlay}>
          <FaSpinner className={styles.spinner} />
          <span>טוען חיפוש...</span>
        </div>
      )}

      <div className={styles.inputContainer}>
        <FaSearchLocation className={styles.icon} />
        <input
          ref={inputRef}
          type="text"
          placeholder="חפש"
          aria-label="חיפוש מתקן"
          className={styles.searchInput}
          autoComplete="off"
          dir="rtl"
        />
      </div>
    </div>
  );
}

export default PlaceSearch;