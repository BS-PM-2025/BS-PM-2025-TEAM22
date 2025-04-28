// src/components/map/UserLocationControl.js
import React from "react";
import { FaLocationArrow } from "react-icons/fa";
import styles from "../../styles/FitnessMap.module.css";

function UserLocationControl({ onCenterOnUser }) {
  return (
    <button
    className={styles.userLocationButton}
    onClick={onCenterOnUser}
    aria-label="עבור למיקום הנוכחי"
    title="המיקום שלי"
  >
    <FaLocationArrow />
  </button>
  );
}

export default UserLocationControl;
