// src/components/map/FacilityList.js
import React, { useState, useRef } from "react";
import FacilityListItem from "./FacilityListItem";
import styles from "./styles/FitnessMap.module.css";

function FacilityList({
  facilities,
  userLocation,
  selectedFacility,
  setSelectedFacility,
  isLoading,
  isSearchingGoogle
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [listHeight, setListHeight] = useState(300);
  const startDragY = useRef(0);
  const startHeight = useRef(0);
  
  // גבולות גובה
  const MIN_HEIGHT = 60;
  const MAX_HEIGHT = Math.min(window.innerHeight * 0.8, 600); // מקסימום 80% מהמסך או 600px
  const DEFAULT_HEIGHT = 300;

  // טיפול בתחילת גרירה
  const handleDragStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    startDragY.current = e.clientY || e.touches[0].clientY;
    startHeight.current = listHeight;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';
  };

  // טיפול בגרירה - משופר עם תמיכה בגרירה למעלה ולמטה
  const handleDrag = (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const currentY = e.clientY || e.touches[0].clientY;
    const deltaY = startDragY.current - currentY; // חיובי = גרירה למעלה, שלילי = גרירה למטה
    const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeight.current + deltaY));
    
    setListHeight(newHeight);
    
    // עדכון מצב ממוזער בהתאם לגובה
    if (newHeight <= MIN_HEIGHT + 20) {
      setIsMinimized(true);
    } else {
      setIsMinimized(false);
    }
  };

  // טיפול בסיום גרירה
  const handleDragEnd = () => {
    setIsDragging(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    // התאמת גובה סופי
    if (listHeight < MIN_HEIGHT + 40) {
      // אם הגובה קטן מדי, מזער לחלוטין
      setListHeight(MIN_HEIGHT);
      setIsMinimized(true);
    } else if (listHeight < DEFAULT_HEIGHT - 50) {
      // אם הגובה קטן מהברירת מחדל אבל לא מינימלי, קבע גובה בינוני
      setListHeight(200);
      setIsMinimized(false);
    } else {
      // אחרת, שמור על הגובה הנוכחי
      setIsMinimized(false);
    }
  };

  // הוספת event listeners לגרירה
  React.useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e) => handleDrag(e);
      const handleMouseUp = () => handleDragEnd();
      const handleTouchMove = (e) => handleDrag(e);
      const handleTouchEnd = () => handleDragEnd();
      
      window.addEventListener('mousemove', handleMouseMove, { passive: false });
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, listHeight]);

  // החלפת מצב ממוזער/מורחב
  const toggleMinimize = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setListHeight(DEFAULT_HEIGHT);
    } else {
      setIsMinimized(true);
      setListHeight(MIN_HEIGHT);
    }
  };

  // הגדלה מהירה לגובה מקסימלי
  const expandToMax = () => {
    setIsMinimized(false);
    setListHeight(MAX_HEIGHT);
  };

  const containerStyle = {
    height: `${listHeight}px`,
    transition: isDragging ? 'none' : 'height 0.2s ease',
  };

  return (
    <div 
      className={`${styles.facilitySidebar} ${isMinimized ? styles.minimized : ''}`}
      style={containerStyle}
    >
      {/* ידית גרירה משופרת */}
      <div 
        className={styles.dragHandle}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onDoubleClick={isMinimized ? expandToMax : toggleMinimize}
        style={{ 
          cursor: isDragging ? 'ns-resize' : 'ns-resize',
          height: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDragging ? 'rgba(0,0,0,0.1)' : 'transparent'
        }}
        title="גרור למעלה או למטה לשינוי גובה, לחץ כפול להגדלה מקסימלית"
      >
        {/* אינדיקטור חזותי לגרירה */}
        <div style={{
          width: '30px',
          height: '4px',
          backgroundColor: '#ccc',
          borderRadius: '2px',
          position: 'relative'
        }}>
          {isDragging && (
            <div style={{
              position: 'absolute',
              top: '-2px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '10px',
              color: '#666',
              whiteSpace: 'nowrap'
            }}>
              {listHeight}px
            </div>
          )}
        </div>
      </div>
      
      <h3 className={styles.sidebarTitle}>
        <span>
          מתקני כושר בסביבה ({facilities.length})
          {isSearchingGoogle && (
            <span className={styles.searchingIndicator}> מחפש...</span>
          )}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {/* כפתור הגדלה מהירה */}
          {!isMinimized && listHeight < MAX_HEIGHT && (
            <button 
              className={styles.expandButton}
              onClick={expandToMax}
              aria-label="הגדל לגובה מקסימלי"
              title="הגדל לגובה מקסימלי"
              style={{ 
                fontSize: '12px', 
                padding: '2px 6px',
                border: '1px solid #ccc',
                borderRadius: '3px',
                background: 'white'
              }}
            >
              ⬆
            </button>
          )}
          
          <button 
            className={styles.minimizeButton}
            onClick={toggleMinimize}
            aria-label={isMinimized ? "הרחב רשימה" : "מזער רשימה"}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
        </div>
      </h3>

      {!isMinimized && (
        <>
          {isLoading ? (
            <div className={styles.loading}>טוען מתקנים...</div>
          ) : facilities.length === 0 ? (
            <div className={styles.noResults}>לא נמצאו מתקנים מתאימים</div>
          ) : (
            <ul className={styles.facilityList} style={{ 
              height: `${listHeight - 80}px`, // מותאם לגובה הכללי
              overflowY: 'auto'
            }}>
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
        </>
      )}
      
      {/* אינדיקטור גובה נוכחי (רק בזמן גרירה) */}
      {isDragging && (
        <div style={{
          position: 'absolute',
          top: '15px',
          right: '10px',
          fontSize: '11px',
          color: '#666',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '2px 6px',
          borderRadius: '3px',
          pointerEvents: 'none'
        }}>
          {listHeight}px / {MAX_HEIGHT}px
        </div>
      )}
    </div>
  );
}

export default FacilityList;