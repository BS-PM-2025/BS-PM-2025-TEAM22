// src/components/map/FilterToggle.js
import React from "react";
import { FaFilter } from "react-icons/fa";
import styles from "../../styles/FitnessMap.module.css";

function FilterToggle({ showFilters, setShowFilters }) {
  return (
    <div className={styles.filterToggle}>
      <button
        className={styles.filterButton}
        onClick={() => setShowFilters(!showFilters)}
      >
        <FaFilter /> {showFilters ? "הסתר פילטרים" : "סנן מתקנים"}
      </button>
    </div>
  );
}

export default FilterToggle;