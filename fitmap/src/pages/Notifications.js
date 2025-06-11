// src/pages/Notifications.js
import React from 'react';
import {
  FaBell,
  FaSpinner,
  FaCheck,
  FaInbox,
  FaArrowRight
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import NotificationsList from '../components/social/NotificationsList';
import styles from './Notifications.module.css';

function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    hasMore,
    loadMore
  } = useNotifications();

  const handleBackToFeed = () => navigate('/community');

  const renderHeader = () => (
    <div className={styles.header}>
      <div className={styles.topActions}>
        <button className={styles.backButton} onClick={handleBackToFeed}>
          <FaArrowRight className={styles.backIcon} />
          <span>חזור לפיד</span>
        </button>
      </div>

      <div className={styles.titleSection}>
        <FaBell className={styles.headerIcon} />
        <h1 className={styles.title}>ההתראות שלי</h1>
        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>{unreadCount}</span>
        )}
      </div>

      {unreadCount > 0 && (
        <button
          className={styles.markAllButton}
          onClick={markAllAsRead}
          aria-label="סמן את כל ההתראות כנקראו"
        >
          <FaCheck />
          <span>סמן הכל כנקרא</span>
        </button>
      )}
    </div>
  );

  const renderLoading = () => (
    <div className={styles.loading}>
      <FaSpinner className={styles.spinner} />
      <p>טוען התראות...</p>
    </div>
  );

  const renderError = () => (
    <div className={styles.error}>
      <FaInbox className={styles.errorIcon} />
      <h3>אופס!</h3>
      <p>{error}</p>
    </div>
  );

  const renderList = () => (
    <>
      <NotificationsList
        notifications={notifications}
        onMarkAsRead={markAsRead}
      />

      {hasMore && (
        <div className={styles.loadMoreSection}>
          <button
            className={styles.loadMoreButton}
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className={styles.loadingIcon} />
                <span>טוען...</span>
              </>
            ) : (
              <span>טען עוד התראות</span>
            )}
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className={styles.container}>
      {renderHeader()}
      <div className={styles.content}>
        {loading && notifications.length === 0
          ? renderLoading()
          : error
          ? renderError()
          : renderList()}
      </div>
    </div>
  );
}

export default Notifications;
