// src/components/map/Navigation/StartWalkingButton.js
import { FaWalking } from "react-icons/fa";
import styles from "./styles/StartWalkingButton.module.css";

/**
 * כפתור להתחלת הליכה במפה
 * 
 * @param {Object} props - פרופס של הקומפוננטה
 * @param {Function} props.onClick - פונקציה שתופעל בלחיצה על הכפתור
 * @param {boolean} props.isVisible - האם הכפתור יוצג
 * @param {boolean} props.disabled - האם הכפתור מושבת
 * @returns {JSX.Element} - קומפוננטת React
 */
function StartWalkingButton({ onClick, isVisible = true, disabled = false }) {
  // אם הכפתור לא אמור להיות מוצג, לא נרנדר כלום
  if (!isVisible) {
    return null;
  }

  return (
    <button
      className={`${styles.startWalkingButton} ${disabled ? styles.disabled : ""}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={disabled ? "לא ניתן להתחיל הליכה כרגע" : "התחל הליכה במפה"}
      aria-label="התחל הליכה במפה"
    >
      <FaWalking className={styles.walkingIcon} />
      <span className={styles.buttonText}>התחל לשחק</span>
    </button>
  );
}

export default StartWalkingButton;