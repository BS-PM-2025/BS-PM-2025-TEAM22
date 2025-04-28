// src/components/map/FacilityListItem.js
import React from "react";
import { calculateDistance } from "../../utils/geoUtils"; // נדרש ליצור קובץ utils עם פונקציות שירות
import styles from "../../styles/FitnessMap.module.css";

function FacilityListItem({ facility, userLocation, isSelected, onClick }) {
  return (
    <li
      className={`${styles.facilityItem} 
               ${isSelected ? styles.selectedFacility : ""} 
               ${facility.source === "google" ? styles.googleFacility : ""}`}
      onClick={onClick}
    >
      <div className={styles.facilityName}>
        {facility.name}
        {facility.source === "google" && (
          <span className={styles.facilitySource}></span>
        )}
      </div>
      <div className={styles.facilityAddress}>{facility.address}</div>
      {facility.type && (
        <span className={styles.facilityType}>{facility.type}</span>
      )}
      {userLocation && (
        <div className={styles.facilityDistance}>
          {calculateDistance(
            userLocation.lat,
            userLocation.lng,
            parseFloat(facility.latitude || 0),
            parseFloat(facility.longitude || 0)
          ).toFixed(1)}{" "}
          ק"מ
        </div>
      )}
    </li>
  );
}

export default FacilityListItem;