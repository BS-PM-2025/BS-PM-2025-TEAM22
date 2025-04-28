// src/components/map/FacilityList.js
import React from "react";
import FacilityListItem from "./FacilityListItem";
import styles from "../../styles/FitnessMap.module.css";

function FacilityList({
  facilities,
  userLocation,
  selectedFacility,
  setSelectedFacility,
  isLoading,
  isSearchingGoogle
}) {
  return (
    <div className={styles.facilitySidebar}>
      <h3 className={styles.sidebarTitle}>
        מתקני כושר בסביבה ({facilities.length})
        {isSearchingGoogle && (
          <span className={styles.searchingIndicator}> מחפש...</span>
        )}
      </h3>

      {isLoading ? (
        <div className={styles.loading}>טוען מתקנים...</div>
      ) : facilities.length === 0 ? (
        <div className={styles.noResults}>לא נמצאו מתקנים מתאימים</div>
      ) : (
        <ul className={styles.facilityList}>
          {facilities.map((facility) => (
            <FacilityListItem
              key={facility.id}
              facility={facility}
              userLocation={userLocation}
              isSelected={selectedFacility?.id === facility.id}
              onClick={() => setSelectedFacility(facility)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default FacilityList;