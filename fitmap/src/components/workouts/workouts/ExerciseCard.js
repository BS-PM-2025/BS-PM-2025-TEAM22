// src/components/workouts/ExerciseCard.js
import React, { useState, useEffect } from "react";
import { FaStar, FaHeart, FaRegHeart, FaPlayCircle } from "react-icons/fa";
import styles from "./styles/ExerciseLibrary.module.css";

/**
 * כרטיס תרגיל בודד - מציג מידע בסיסי על תרגיל ומאפשר מעבר לדף פרטים
 * @param {Object} exercise - אובייקט התרגיל
 * @param {Function} onClick - פונקציה שתופעל בלחיצה על הכרטיס
 * @param {Boolean} isFavorite - האם התרגיל מסומן כמועדף
 * @param {Function} onToggleFavorite - פעולה להפעלת/ביטול מועדף
 */
function ExerciseCard({ exercise, onClick, isFavorite, onToggleFavorite }) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  
  useEffect(() => {
    if (exercise && exercise.videoUrl) {
      setVideoUrl(prepareVideoUrl(exercise.videoUrl));
    }
  }, [exercise]);
  
  if (!exercise) return null;

  const getDifficultyStars = (difficulty) => {
    switch (difficulty) {
      case "beginner":
        return 1;
      case "intermediate":
        return 2;
      case "advanced":
        return 3;
      default:
        return 1;
    }
  };

  const translateDifficulty = (difficulty) => {
    switch (difficulty) {
      case "beginner":
        return "מתחיל";
      case "intermediate":
        return "בינוני";
      case "advanced":
        return "מתקדם";
      default:
        return difficulty;
    }
  };
  
  // הכנת קישור הוידאו לתצוגה (וידוא שהוא בפורמט הטמעה)
  const prepareVideoUrl = (url) => {
    if (!url) return null;
    
    // פרמטרים שנוסיף לכל קישור יוטיוב
    const params = 'mute=1&controls=1&showinfo=0&rel=0&modestbranding=1';
    
    // אם זה כבר בפורמט הטמעה
    if (url.includes('/embed/')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${params}`;
    } 
    // אם זה בפורמט רגיל של youtube
    else if (url.includes('youtube.com/watch')) {
      try {
        const videoId = new URL(url).searchParams.get('v');
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}?${params}`;
        }
      } catch (e) {
        console.error('שגיאה בהמרת קישור YouTube:', e);
      }
    }
    // אם זה קישור קצר של youtube
    else if (url.includes('youtu.be/')) {
      try {
        const videoId = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}?${params}`;
      } catch (e) {
        console.error('שגיאה בהמרת קישור YouTube מקוצר:', e);
      }
    }
    
    return url;
  };
  
  // מניעת הפעלת האירוע בלחיצה על הווידאו/תמונה, כדי שהמשתמש יוכל לאינטרקט איתו
  const handleMediaClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.libraryItem} onClick={onClick}>
      <div className={styles.mediaSection}>
        {videoUrl ? (
          <>
            <div className={styles.videoWrapper} onClick={handleMediaClick}>
              <iframe
                src={videoUrl}
                title={`הדגמת ${exercise.name}`}
                frameBorder="0"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles.cardVideo}
                onLoad={() => setIsVideoReady(true)}
              ></iframe>
              
              {/* תצוגת טעינה */}
              {!isVideoReady && (
                <div className={styles.videoLoading}>
                  <FaPlayCircle className={styles.loadingIcon} />
                </div>
              )}
            </div>
          </>
        ) : (
          // אם אין וידאו, מציג תמונה רגילה
          <img
            src={exercise.image}
            alt={exercise.name}
            className={styles.exerciseImage}
          />
        )}
      </div>

      <div className={styles.exerciseInfo}>
        <h3>{exercise.name}</h3>
        <p>{exercise.description}</p>
        <p>
          <strong>קושי:</strong> {translateDifficulty(exercise.difficulty)}{" "}
          {[...Array(getDifficultyStars(exercise.difficulty))].map((_, i) => (
            <FaStar key={i} />
          ))}
        </p>
        <p>
          <strong>קבוצת שרירים:</strong> {exercise.muscleGroup}
        </p>
      </div>

      <button
        className={styles.favoriteButton}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
      >
        {isFavorite ? <FaHeart color="red" /> : <FaRegHeart />}
      </button>
    </div>
  );
}

export default ExerciseCard;