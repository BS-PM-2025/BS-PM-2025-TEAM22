// src/components/auth/PendingApproval.js
import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../utils/supabaseClient';
import styles from '../../styles/PendingApproval.module.css';

function PendingApproval() {
  const { user, userProfile, loading } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // בדיקה אם המשתמש עדיין בטעינה
  if (loading) {
    return (
      <div className={styles.pendingContainer}>
        <div className={styles.pendingCard}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>טוען פרטי משתמש...</p>
          </div>
        </div>
      </div>
    );
  }

  // אם המשתמש לא מחובר, הפנה לדף ההתחברות
  if (!user || !userProfile) {
    return <Navigate to="/auth" />;
  }

  // אם המשתמש כבר אושר, הפנה לדף המתאים
  if (userProfile.approval_status === 'approved' || userProfile.role === 'user' || userProfile.role === 'admin') {
    return <Navigate to="/fitness-map" />;
  }

  // אם המשתמש נדחה
  if (userProfile.approval_status === 'rejected') {
    return (
      <div className={styles.pendingContainer}>
        <div className={styles.rejectedCard}>
          <div className={styles.icon}>
            <i className="fas fa-times-circle"></i>
          </div>
          <h1>בקשתך נדחתה</h1>
          <p>
            לצערנו, בקשתך לשמש כמנהל מתקן נדחתה על ידי מנהל המערכת.
          </p>
          <p>
            לשאלות או בירורים, אנא צור קשר עם צוות התמיכה שלנו.
          </p>
          <div className={styles.actions}>
            <Link to="/" className={styles.homeButton}>
              <i className="fas fa-home"></i> חזרה לדף הבית
            </Link>
            <button onClick={handleLogout} className={styles.logoutButton}>
              <i className="fas fa-sign-out-alt"></i> התנתק
            </button>
          </div>
        </div>
      </div>
    );
  }

  // תצוגה למשתמש בהמתנה
  return (
    <div className={styles.pendingContainer}>
      <div className={styles.pendingCard}>
        <div className={styles.icon}>
          <i className="fas fa-clock"></i>
        </div>
        <h1>חשבונך ממתין לאישור</h1>
        <p>
          תודה שנרשמת כמנהל מתקן במערכת <strong>מתקני כושר עירוניים</strong>.
        </p>
        <p>
          חשבונך נמצא כעת בבדיקה וממתין לאישור על ידי מנהל המערכת.
          נשלח אליך הודעת אימייל ל-<strong>{userProfile.email}</strong> כאשר חשבונך יאושר.
        </p>
        <div className={styles.infoSection}>
          <h3>פרטי הבקשה:</h3>
          <div className={styles.infoItem}>
            <span className={styles.label}>שם:</span>
            <span className={styles.value}>{userProfile.name}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>אימייל:</span>
            <span className={styles.value}>{userProfile.email}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>סטטוס:</span>
            <span className={`${styles.value} ${styles.badge}`}>ממתין לאישור</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>תאריך בקשה:</span>
            <span className={styles.value}>{new Date(userProfile.created_at).toLocaleDateString('he-IL')}</span>
          </div>
        </div>
        <div className={styles.actions}>
          <Link to="/" className={styles.homeButton}>
            <i className="fas fa-home"></i> חזרה לדף הבית
          </Link>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <i className="fas fa-sign-out-alt"></i> התנתק
          </button>
        </div>
      </div>
    </div>
  );
}

export default PendingApproval;