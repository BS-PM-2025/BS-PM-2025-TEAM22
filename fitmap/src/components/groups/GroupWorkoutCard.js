// src/components/groups/GroupWorkoutCard.js
import React from 'react';
import { FaMapMarkerAlt, FaClock, FaUsers, FaBolt, FaHeart, FaDumbbell } from 'react-icons/fa';
import styles from './styles/GroupWorkoutCard.module.css';

function GroupWorkoutCard({ workout, onClick }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('he-IL', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const translateWorkoutType = (type) => {
    const types = {
      strength: 'חיזוק',
      cardio: 'סיבולת',
      flexibility: 'גמישות',
      mixed: 'משולב',
    };
    return types[type] || type;
  };

  const translateDifficulty = (difficulty) => {
    const levels = {
      beginner: 'מתחיל',
      intermediate: 'בינוני',
      advanced: 'מתקדם',
      all: 'כל הרמות',
    };
    return levels[difficulty] || difficulty;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'cardio':
        return <FaHeart className={styles.icon} />;
      case 'strength':
        return <FaDumbbell className={styles.icon} />;
      case 'flexibility':
        return <FaBolt className={styles.icon} />;
      default:
        return <FaUsers className={styles.icon} />;
    }
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner':
        return '#22c55e'; // ירוק
      case 'intermediate':
        return '#f97316'; // כתום
      case 'advanced':
        return '#ef4444'; // אדום
      default:
        return '#6366f1'; // סגול
    }
  };

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.header}>
        <h3 className={styles.title}>{workout.title}</h3>
        <span className={styles.typeBadge} style={{ backgroundColor: '#3b82f6' }}>
          {getTypeIcon(workout.workout_type)} {translateWorkoutType(workout.workout_type)}
        </span>
      </div>
      <p className={styles.description}>{workout.description}</p>

      <div className={styles.details}>
        <div><FaMapMarkerAlt className={styles.icon} /> {workout.facility_name}</div>
        <div><FaClock className={styles.icon} /> {formatDate(workout.start_time)}</div>
        <div><FaUsers className={styles.icon} /> {workout.max_participants || 'ללא הגבלה'} משתתפים</div>
        <div className={styles.difficultyBadge} style={{ backgroundColor: getDifficultyColor(workout.difficulty) }}>
          {translateDifficulty(workout.difficulty)}
        </div>
      </div>
    </div>
  );
}

export default GroupWorkoutCard;
