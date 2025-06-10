// src/components/social/NotificationsCenter.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaBell,
  FaCheck,
  FaBellSlash,
  FaSpinner,
  FaHeart,
  FaComment,
  FaUserPlus,
  FaTrophy,
  FaEnvelope,
} from "react-icons/fa";
import { useNotifications } from "../../hooks/useNotifications";
import styles from "./styles/NotificationsCenter.module.css";

function NotificationsCenter({ className = "", onNotificationClick }) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef(null);

  // לוגים לדיבוג
  useEffect(() => {
    console.log("Notifications state changed:", { isOpen, unreadCount, notificationsCount: notifications.length });
  }, [isOpen, unreadCount, notifications.length]);

  // האזנה לקליקים מחוץ לתפריט כדי לסגור אותו
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // טיפול בלחיצה על התראה
  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);

    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  // טיפול בלחיצה על הפעמון
  const handleBellClick = (e) => {
    e.stopPropagation(); // מניעת בעיות בבועה של האירוע
    setIsOpen(prevState => !prevState);
  };

  // בחירת הלינק המתאים להתראה
  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case "follow":
        return `/profile/${notification.sender_id}`;
      case "like":
      case "comment":
        return notification.related_post_id
          ? `/posts/${notification.related_post_id}`
          : "#";
      case "challenge_complete":
        return notification.challenge_id
          ? `/challenges/${notification.challenge_id}`
          : "#";
      case "workout_invite":
        return notification.entity_id && notification.entity_type === "workout"
          ? `/group-workouts/${notification.entity_id}`
          : "#";
      case "new_message":
        return `/chat/${
          notification.related_user_id || notification.related_id
        }`;
      default:
        return "#";
    }
  };

  // בחירת האיקון בצבע המתאים לסוג ההתראה
  const getNotificationIcon = (type) => {
    const iconStyles = {
      follow: { icon: FaUserPlus, color: "#3498db" },
      like: { icon: FaHeart, color: "#e74c3c" },
      comment: { icon: FaComment, color: "#2ecc71" },
      challenge_complete: { icon: FaTrophy, color: "#f39c12" },
      new_message: { icon: FaEnvelope, color: "#9b59b6" },
      default: { icon: FaBell, color: "#95a5a6" },
    };

    const config = iconStyles[type] || iconStyles.default;
    const Icon = config.icon;

    return { icon: <Icon />, color: config.color };
  };

  // תוכן ההתראה בהתאם לסוג
  const getNotificationContent = (notification) => {
    const name = notification.sender?.name || "משתמש";

    switch (notification.type) {
      case "follow":
        return `${name} מתחיל לעקוב אחריך`;
      case "like":
        return `${name} אהב את הפוסט שלך`;
      case "comment":
        return `${name} הגיב על הפוסט שלך`;
      case "challenge_complete":
        return `${name} השלים אתגר!`;
      case "workout_invite":
        return `${name} הזמין אותך לאימון`;
      case "new_message":
        return notification.content;
      default:
        return notification.content || "יש לך התראה חדשה";
    }
  };

  // פורמט זמן יחסי
  const formatTimeAgo = (isoTime) => {
    if (!isoTime) return "";

    const diff = (Date.now() - new Date(isoTime)) / 1000;

    if (diff < 60) return "הרגע";
    if (diff < 3600) return `לפני ${Math.floor(diff / 60)} ד'`;
    if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שע'`;

    return new Date(isoTime).toLocaleDateString("he-IL", {
      month: "short",
      day: "numeric",
    });
  };

  // רנדור הרשימה עם כל העטיפה
  const renderNotificationsList = () => {
    if (loading) {
      return (
        <div className={styles.loading}>
          <FaSpinner className={styles.spinner} />
          <p>טוען התראות...</p>
        </div>
      );
    }
    
    if (notifications.length === 0) {
      return (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <FaBellSlash />
          </div>
          <h4>אין התראות חדשות</h4>
          <p>תהיה הראשון לקבל התראות!</p>
        </div>
      );
    }
    
    return (
      <>
        <ul className={styles.list}>
          {notifications.slice(0, 10).map((notification) => {
            const { icon, color } = getNotificationIcon(notification.type);
            
            return (
              <li
                key={notification.id}
                className={`${styles.item} ${
                  !notification.is_read ? styles.unread : ""
                }`}
              >
                <Link
                  to={getNotificationLink(notification)}
                  onClick={() => handleNotificationClick(notification)}
                  className={styles.link}
                >
                  <div
                    className={styles.iconWrapper}
                    style={{ backgroundColor: color }}
                  >
                    {icon}
                  </div>
                  <div className={styles.textWrapper}>
                    <p className={styles.message}>
                      {getNotificationContent(notification)}
                    </p>
                    <span className={styles.time}>
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                  {!notification.is_read && (
                    <div className={styles.unreadDot} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        
        {notifications.length > 0 && (
          <div className={styles.footer}>
            <Link to="/notifications" onClick={() => setIsOpen(false)}>
              צפה בכל ההתראות
              <span className={styles.arrow}>←</span>
            </Link>
          </div>
        )}
      </>
    );
  };

  return (
    <div
      className={`${styles.container} ${className} ${
        unreadCount > 0 ? styles.hasUnread : ""
      }`}
      ref={notificationRef}
    >
      <button
        className={styles.bellButton}
        onClick={handleBellClick}
        aria-label={`התראות${unreadCount ? ` (${unreadCount})` : ""}`}
        aria-expanded={isOpen}
      >
        <FaBell className={styles.bellIcon} />
        {unreadCount > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <div 
        className={`${styles.dropdown} ${isOpen ? styles.visible : styles.hidden}`} 
        role="dialog" 
        aria-label="התראות"
      >
        <div className={styles.header}>
          <h3 className={styles.title}>התראות</h3>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className={styles.markAll}>
              <FaCheck />
              <span>סמן הכל כנקרא</span>
            </button>
          )}
        </div>

        <div className={styles.content}>
          {renderNotificationsList()}
        </div>
      </div>
    </div>
  );
}

export default NotificationsCenter;