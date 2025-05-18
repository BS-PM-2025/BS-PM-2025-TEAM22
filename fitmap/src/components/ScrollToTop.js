import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaChevronUp } from 'react-icons/fa';

/**
 * קומפוננטה משולבת שגוללת את העמוד לראש בכל מעבר בין עמודים
 * ובנוסף מציגה כפתור גלילה לראש כשהמשתמש גולל למטה
 */
function ScrollToTop() {
  // השגת המיקום הנוכחי (משתנה בין עמודים)
  const { pathname } = useLocation();
  const [showButton, setShowButton] = useState(false);

  // גלילה לראש העמוד בכל שינוי של הנתיב
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // הוספת אירוע גלילה להצגת/הסתרת הכפתור
  useEffect(() => {
    const handleScroll = () => {
      // מציג את הכפתור כשהמשתמש גלל יותר מ-300 פיקסלים למטה
      if (window.scrollY > 300) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    // הוספת מאזין לאירוע גלילה
    window.addEventListener('scroll', handleScroll);

    // ניקוי המאזין כשהקומפוננטה מתפרקת
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // פונקציה לגלילה חלקה לראש העמוד
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // כאן מרנדרים את כפתור ה"גלול למעלה" רק אם showButton הוא true
  return (
    <>
      {showButton && (
        <button
          onClick={scrollToTop}
          className="scrollTopButton"
          aria-label="גלול לראש העמוד"
          title="גלול לראש העמוד"
        >
          <FaChevronUp />
        </button>
      )}

      <style jsx="true">{`
        .scrollTopButton {
          position: fixed;
          bottom: 30px;
          left: 30px;
          z-index: 1000;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--primary, #3F8CFF);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0.8;
          transition: all 0.3s ease;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }
        
        .scrollTopButton:hover {
          opacity: 1;
          transform: translateY(-3px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
        }
        
        @media (prefers-reduced-motion: reduce) {
          .scrollTopButton {
            transition: opacity 0.3s ease;
          }
          
          .scrollTopButton:hover {
            transform: none;
          }
        }
      `}</style>
    </>
  );
}

export default ScrollToTop;