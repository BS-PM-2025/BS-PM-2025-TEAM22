// src/components/map/Navigation/PowerupsMenu.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaBolt, FaClock, FaCoins, FaInfoCircle } from 'react-icons/fa';
import styles from './styles/PowerupsMenu.module.css';

/**
 * תפריט כוחות מיוחדים משודרג עבור משחק StreetView
 * עם תמיכה בטיימרים, אנימציות ומצבים פעילים
 * 
 * @param {Object} props - פרופס של הקומפוננטה
 * @returns {JSX.Element} - הקומפוננטה המרונדרת
 */
function PowerupsMenu({
  isLoading,
  error,
  starMagnetActive,
  starRadarActive,
  playerCoins,
  onActivateMagnet,
  onActivateRadar,
  magnetTimeLeft = 0,
  radarTimeLeft = 0,
  magnetDuration = 30,
  radarDuration = 20
}) {
  // מצב מקומי לניהול ספירה לאחור
  const [magnetTimer, setMagnetTimer] = useState(magnetTimeLeft);
  const [radarTimer, setRadarTimer] = useState(radarTimeLeft);
  const [showInfo, setShowInfo] = useState(false);
  
useEffect(() => {
  let magnetInterval;

  if (starMagnetActive) {
    magnetInterval = setInterval(() => {
      setMagnetTimer(prev => {
        if (prev <= 1) {
          clearInterval(magnetInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  } else {
    setMagnetTimer(magnetTimeLeft);
  }

  return () => clearInterval(magnetInterval);
}, [starMagnetActive, magnetTimeLeft]);

  // אפקט לעדכון הספירה לאחור אם הרדאר פעיל
useEffect(() => {
  let radarInterval;

  if (starRadarActive) {
    radarInterval = setInterval(() => {
      setRadarTimer(prev => {
        if (prev <= 1) {
          clearInterval(radarInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  } else {
    setRadarTimer(radarTimeLeft);
  }

  return () => clearInterval(radarInterval);
}, [starRadarActive, radarTimeLeft]);

  // בדיקה אם ניתן להציג את הקומפוננטה
  if (isLoading || error) {
    return null;
  }
  
  // חישוב אחוזי התקדמות הטיימר
  const magnetProgressPercent = starMagnetActive ? (magnetTimer / magnetDuration) * 100 : 0;
  const radarProgressPercent = starRadarActive ? (radarTimer / radarDuration) * 100 : 0;
  
  // רינדור מצב פעיל של המגנט
  const renderMagnetEffect = () => {
    if (!starMagnetActive) return null;
    
    return (
      <div className={styles.magnetEffectContainer}>
        <div className={styles.magnetEffectRings}></div>
        <div className={styles.magnetEffectParticles}></div>
      </div>
    );
  };

  return (
    <div className={styles.powerupsMenu}>
      <div className={styles.powerupTitle}>
        כוחות מיוחדים
        <button 
          className={styles.infoButton}
          onClick={() => setShowInfo(!showInfo)}
          aria-label="מידע נוסף"
        >
          <FaInfoCircle />
        </button>
      </div>
      
      {showInfo && (
        <div className={styles.infoBox}>
          <div className={styles.infoHeader}>
            <h4>כוחות מיוחדים</h4>
            <button 
              className={styles.closeButton}
              onClick={() => setShowInfo(false)}
            >
              ×
            </button>
          </div>
          <p>כוחות מיוחדים מאפשרים לך לאסוף כוכבים בקלות רבה יותר. השתמש במטבעות שצברת כדי להפעיל אותם!</p>
          <ul>
            <li><strong>מגנט כוכבים</strong> - מושך כוכבים מרוחקים אליך</li>
            <li><strong>רדאר כוכבים</strong> - חושף את כל הכוכבים באזור</li>
          </ul>
        </div>
      )}
      
      <div className={styles.powerupsList}>
        <button
          className={`${styles.powerupButton} ${starMagnetActive ? styles.active : ""}`}
          onClick={onActivateMagnet}
          disabled={starMagnetActive || playerCoins < 50}
          title="מושך כוכבים קרובים אליך"
          style={starMagnetActive ? {'--progress': `${100 - magnetProgressPercent}%`} : {}}
        >
          <div className={styles.powerupIcon}>🧲</div>
          <div className={styles.powerupName}>מגנט כוכבים</div>
          {starMagnetActive ? (
            <div className={styles.powerupTimer}>
              <FaClock className={styles.timerIcon} />
              <span>{magnetTimer}s</span>
            </div>
          ) : (
            <div className={styles.powerupCost}>
              <FaCoins className={styles.coinIcon} />
              <span>50</span>
            </div>
          )}
          
          {starMagnetActive && (
            <div className={styles.progressRing} style={{
              background: `conic-gradient(
                rgba(139, 92, 246, 0.7) ${magnetProgressPercent}%,
                rgba(15, 23, 42, 0.3) ${magnetProgressPercent}%
              )`
            }}></div>
          )}
          
          {starMagnetActive && <div className={styles.activeBadge}><FaBolt /></div>}
        </button>

        <button
          className={`${styles.powerupButton} ${starRadarActive ? styles.active : ""}`}
          onClick={onActivateRadar}
          disabled={starRadarActive || playerCoins < 100}
          title="חושף את כל הכוכבים בסביבה"
          style={starRadarActive ? {'--progress': `${100 - radarProgressPercent}%`} : {}}
        >
          <div className={styles.powerupIcon}>📡</div>
          <div className={styles.powerupName}>רדאר כוכבים</div>
          {starRadarActive ? (
            <div className={styles.powerupTimer}>
              <FaClock className={styles.timerIcon} />
              <span>{radarTimer}s</span>
            </div>
          ) : (
            <div className={styles.powerupCost}>
              <FaCoins className={styles.coinIcon} />
              <span>100</span>
            </div>
          )}
          
          {starRadarActive && (
            <div className={styles.progressRing} style={{
              background: `conic-gradient(
                rgba(139, 92, 246, 0.7) ${radarProgressPercent}%,
                rgba(15, 23, 42, 0.3) ${radarProgressPercent}%
              )`
            }}></div>
          )}
          
          {starRadarActive && <div className={styles.activeBadge}><FaBolt /></div>}
        </button>
      </div>
      
      {/* רינדור אפקט המגנט כאשר הוא פעיל */}
      {renderMagnetEffect()}
    </div>
  );
}

// פרופטייפס עם תמיכה בפרמטרים נוספים
PowerupsMenu.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  starMagnetActive: PropTypes.bool.isRequired,
  starRadarActive: PropTypes.bool.isRequired,
  playerCoins: PropTypes.number.isRequired,
  onActivateMagnet: PropTypes.func.isRequired,
  onActivateRadar: PropTypes.func.isRequired,
  magnetTimeLeft: PropTypes.number,
  radarTimeLeft: PropTypes.number,
  magnetDuration: PropTypes.number,
  radarDuration: PropTypes.number
};

export default PowerupsMenu;