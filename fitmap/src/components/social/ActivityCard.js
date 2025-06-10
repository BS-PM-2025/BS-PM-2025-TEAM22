import React, { memo } from "react";
import { Link } from "react-router-dom";
import {
  FaRunning,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUserFriends,
  FaTrophy,
  FaHeart,
  FaComment,
  FaStar,
} from "react-icons/fa";
import styles from "./styles/ActivityCard.module.css";

function ActivityCard({
  activity,
  className = "",
  showInteractions = false,
  onLike,
  onComment,
  isLiked = false,
  likesCount = 0,
  commentsCount = 0,
}) {
  if (!activity) return null;

  const formatDistance = (distance) => {
    if (!distance) return "";
    return distance < 1
      ? `${(distance * 1000).toFixed(0)} מטר`
      : `${distance.toFixed(1)} ק"מ`;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")} שעות`;
    }
    return `${mins} דקות`;
  };

  const renderActivityContent = () => {
    switch (activity.type) {
      case "workout_created":
        return (
          <div className={styles.content} aria-label="יצירת אימון חדש">
            <div className={`${styles.icon} ${styles.created}`}><FaRunning /></div>
            <div className={styles.details}>
              <p>
                <strong>{activity.user?.name || "משתמש"}</strong> יצר אימון חדש: {" "}
                <Link to={`/group-workouts/${activity.workout_id}`} className={styles.link}>
                  {activity.workout_title || "אימון קבוצתי"}
                </Link>
              </p>
              <div className={styles.meta}>
                <span><FaCalendarAlt /> {activity.time_ago || "לאחרונה"}</span>
                {activity.location && <span><FaMapMarkerAlt /> {activity.location}</span>}
                {activity.participants_count !== undefined && <span><FaUserFriends /> {activity.participants_count} משתתפים</span>}
                {activity.workout_type && <span className={styles.tag}>{activity.workout_type}</span>}
              </div>
            </div>
          </div>
        );

      case "workout_joined":
        return (
          <div className={styles.content} aria-label="הצטרפות לאימון">
            <div className={`${styles.icon} ${styles.joined}`}><FaUserFriends /></div>
            <div className={styles.details}>
              <p>
                <strong>{activity.user?.name || "משתמש"}</strong> נרשם לאימון: {" "}
                <Link to={`/group-workouts/${activity.workout_id}`} className={styles.link}>
                  {activity.workout_title || "אימון קבוצתי"}
                </Link>
              </p>
              <div className={styles.meta}>
                <span><FaCalendarAlt /> {activity.time_ago || "לאחרונה"}</span>
              </div>
            </div>
          </div>
        );

      case "workout_completed":
        return (
          <div className={styles.content} aria-label="סיום אימון">
            <div className={`${styles.icon} ${styles.completed}`}><FaTrophy /></div>
            <div className={styles.details}>
              <p>
                <strong>{activity.user?.name || "משתמש"}</strong> סיים אימון: {" "}
                <Link to={`/group-workouts/${activity.workout_id}`} className={styles.link}>
                  {activity.workout_title || "אימון"}
                </Link>
              </p>
              <div className={styles.meta}>
                {activity.distance !== undefined && <span><strong>מרחק:</strong> {formatDistance(activity.distance)}</span>}
                {activity.duration !== undefined && <span><strong>זמן:</strong> {formatDuration(activity.duration)}</span>}
              </div>
            </div>
          </div>
        );

      case "achievement_earned":
        return (
          <div className={styles.content} aria-label="הישג חדש">
            <div className={`${styles.icon} ${styles.achievement}`}><FaStar /></div>
            <div className={styles.details}>
              <p>
                <strong>{activity.user?.name || "משתמש"}</strong> השיג: <span className={styles.highlight}>{activity.achievement_title || "הישג חדש"}</span>
              </p>
              {activity.message && <p className={styles.description}>{activity.message}</p>}
            </div>
          </div>
        );

      case "workout_rated":
        return (
          <div className={styles.content} aria-label="דירוג אימון">
            <div className={`${styles.icon} ${styles.rated}`}><FaStar /></div>
            <div className={styles.details}>
              <p>
                <strong>{activity.user?.name || "משתמש"}</strong> דירג את האימון: {" "}
                <Link to={`/group-workouts/${activity.workout_id}`} className={styles.link}>
                  {activity.workout_title || "אימון"}
                </Link>
              </p>
              <div className={styles.rating}>
                {activity.rating && Array.from({ length: 5 }).map((_, i) => (
                  <FaStar key={i} className={i < activity.rating ? styles.filled : styles.empty} />
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className={styles.content}>
            <p>פעילות חדשה: {activity.message || "התרחשה פעילות חדשה"}</p>
          </div>
        );
    }
  };

  const renderInteractions = () => {
    if (!showInteractions) return null;

    return (
      <div className={styles.interactions}>
        <button
          className={`${styles.button} ${isLiked ? styles.liked : ''}`}
          onClick={() => onLike?.(activity.id)}
          aria-label={isLiked ? "הסר לייק" : "הוסף לייק"}
        >
          <FaHeart /> <span>{likesCount}</span>
        </button>

        <button
          className={styles.button}
          onClick={() => onComment?.(activity.id)}
          aria-label="הוסף תגובה"
        >
          <FaComment /> <span>{commentsCount}</span>
        </button>
      </div>
    );
  };

  const renderImages = () => {
    if (!activity.images?.length) return null;

    return (
      <div className={styles.images}>
        {activity.images.map((image, i) => (
          <img
            key={i}
            src={image}
            alt={`תמונה מאימון ${activity.workout_title || i + 1}`}
            loading="lazy"
          />
        ))}
      </div>
    );
  };

  return (
    <article className={`${styles.card} ${className}`}>
      {renderActivityContent()}
      {renderImages()}
      {renderInteractions()}
    </article>
  );
}

export default memo(ActivityCard);