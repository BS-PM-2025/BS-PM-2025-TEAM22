import React, { useState, useEffect } from 'react';
import { FaCookieBite, FaTimesCircle } from 'react-icons/fa';
import styles from '../../styles/LegalPages.module.css';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
    // בדיקה האם המשתמש כבר אישר עוגיות
 useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className={styles.cookieConsent}>
      <div className={styles.cookieContent}>
        <div className={styles.cookieIcon}>
          <FaCookieBite />
        </div>
        <div className={styles.cookieText}>
          <h3>אנחנו משתמשים בעוגיות</h3>
          <p>
            אתר זה משתמש בעוגיות כדי לשפר את חווית המשתמש שלך. העוגיות שלנו 
            מסייעות לנו להבין כיצד אתה משתמש באתר ולהתאים את החוויה עבורך.
            <a href="/cookies" className={styles.cookieLink}> מידע נוסף</a>
          </p>
        </div>
        <button className={styles.closeButton} onClick={declineCookies} aria-label="סגור">
          <FaTimesCircle />
        </button>
      </div>
      <div className={styles.cookieButtons}>
        <button className={styles.acceptButton} onClick={acceptCookies}>
          אני מסכים/ה
        </button>
        <button className={styles.declineButton} onClick={declineCookies}>
          רק עוגיות חיוניות
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;