import React, { useEffect, useState, useRef } from 'react';
import { FaTrophy, FaCheck, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import styles from './styles/UserProgressBar.module.css';

/**
 * רכיב משודרג שמציג את התקדמות המשתמש באתגר
 * @param {Number} currentValue - הערך הנוכחי של המשתמש באתגר
 * @param {Number} targetValue - ערך היעד של האתגר
 * @param {String} metric - יחידת המדידה של האתגר (ק"מ, דקות, אימונים וכו')
 * @param {Boolean} compact - האם להציג גרסה מצומצמת של רכיב ההתקדמות
 * @param {Boolean} animated - האם להפעיל אנימציה כאשר הרכיב מוצג לראשונה
 * @param {Function} onExpandToggle - פונקציה לטיפול בלחיצה על כפתור הרחבה/צמצום
 */
function UserProgressBar({ 
  currentValue, 
  targetValue, 
  metric, 
  compact = false,
  animated = true,
  onExpandToggle = null
}) {
  const [visibleProgress, setVisibleProgress] = useState(compact ? 0 : currentValue);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [hasAnimated, setHasAnimated] = useState(false);
  const progressBarRef = useRef(null);

  useEffect(() => {
    if (!animated || hasAnimated) {
      setVisibleProgress(currentValue);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 1000; // משך האנימציה במילישניות
          const startTime = performance.now();
          
          const animateProgress = (timestamp) => {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentProgressValue = Math.floor(progress * currentValue);
            
            setVisibleProgress(currentProgressValue);
            
            if (progress < 1) {
              requestAnimationFrame(animateProgress);
            } else {
              setHasAnimated(true);
            }
          };
          
          requestAnimationFrame(animateProgress);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1
      }
    );

    if (progressBarRef.current) {
      observer.observe(progressBarRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [currentValue, animated, hasAnimated]);

  if (typeof currentValue !== 'number' || typeof targetValue !== 'number' || targetValue === 0) {
    return null;
  }

  // חישוב אחוז השלמה
  const progressPercent = Math.min(Math.round((visibleProgress / targetValue) * 100), 100);

  // קביעת צבע על פי אחוז ההתקדמות
  const getProgressColor = () => {
    if (progressPercent >= 100) return 'var(--success)';
    if (progressPercent >= 70) return 'var(--primary)';
    if (progressPercent >= 30) return 'var(--warning)';
    return 'var(--energy)';
  };

  // עיצוב טקסט לפי יחידות
  const formatMetric = (value, metric) => {
    const formatted = value.toLocaleString('he-IL');
    switch (metric) {
      case 'km': return `${formatted} ק"מ`;
      case 'minutes': return `${formatted} דקות`;
      case 'workouts': return `${formatted} אימונים`;
      case 'steps': return `${formatted} צעדים`;
      case 'calories': return `${formatted} קלוריות`;
      default: return `${formatted} ${metric}`;
    }
  };

  const isComplete = progressPercent >= 100;
  
  // טיפול בלחיצה על כפתור הרחבה/צמצום
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (onExpandToggle) {
      onExpandToggle(!isExpanded);
    }
  };

  return (
    <div 
      className={`${styles.progressContainer} ${compact ? styles.compactMode : ''} ${isComplete ? styles.completedProgress : ''}`} 
      role="progressbar" 
      aria-valuemin={0} 
      aria-valuemax={100} 
      aria-valuenow={progressPercent}
      ref={progressBarRef}
    >
      <div className={styles.progressHeader}>
        <div className={styles.progressTitle}>
          {isComplete ? (
            <div className={styles.completeStatus}>
              <FaCheck className={styles.completeIcon} />
              <span>הושלם!</span>
            </div>
          ) : (
            <span>{progressPercent}% הושלמו</span>
          )}
        </div>
        
        {!compact && (
          <div className={styles.progressValue}>
            <span className={styles.currentValue}>{formatMetric(visibleProgress, metric)}</span>
            <span className={styles.targetValue}>מתוך {formatMetric(targetValue, metric)}</span>
          </div>
        )}
        
        {onExpandToggle && (
          <button 
            className={styles.expandToggleButton}
            onClick={handleToggleExpand}
            aria-label={isExpanded ? "צמצם" : "הרחב"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        )}
      </div>

      <div className={styles.progressBarContainer}>
        <div
          className={`${styles.progressBar} ${isComplete ? styles.completeBar : ''}`}
          style={{
            width: `${progressPercent}%`,
            backgroundColor: getProgressColor()
          }}
        >
          {isComplete && progressPercent === 100 && (
            <FaTrophy className={styles.trophyIcon} />
          )}
        </div>
        
        {/* סמנים לאחוזי התקדמות */}
        <div className={styles.progressMarkers}>
          <div className={styles.marker} style={{ left: '25%' }}>
            <div className={styles.markerDot}></div>
            <div className={styles.markerLabel}>25%</div>
          </div>
          <div className={styles.marker} style={{ left: '50%' }}>
            <div className={styles.markerDot}></div>
            <div className={styles.markerLabel}>50%</div>
          </div>
          <div className={styles.marker} style={{ left: '75%' }}>
            <div className={styles.markerDot}></div>
            <div className={styles.markerLabel}>75%</div>
          </div>
          <div className={styles.marker} style={{ left: '100%' }}>
            <div className={styles.markerDot}></div>
            <div className={styles.markerLabel}>100%</div>
          </div>
        </div>
      </div>

      {isExpanded && isComplete && (
        <div className={styles.completeMessage}>
          <FaTrophy className={styles.messageTrophyIcon} />
          <span>כל הכבוד! השלמת את האתגר 🎉</span>
        </div>
      )}
      
      {compact && (
        <div className={styles.compactInfo}>
          <span>{formatMetric(visibleProgress, metric)}</span>
          <span className={styles.compactDivider}>/</span>
          <span>{formatMetric(targetValue, metric)}</span>
        </div>
      )}
    </div>
  );
}

export default UserProgressBar;