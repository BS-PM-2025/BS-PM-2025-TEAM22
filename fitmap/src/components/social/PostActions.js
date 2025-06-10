// src/components/social/PostActions.js
import React, { useState } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaShare } from 'react-icons/fa';
import styles from './styles/PostActions.module.css';

/**
 * כפתורי פעולות על פוסט (לייק, תגובה, שיתוף)
 * 
 * @param {Object} props
 * @param {boolean} props.isLiked - האם המשתמש סימן לייק
 * @param {number} props.likesCount - מספר לייקים
 * @param {Function} props.onLike - פונקציית לייק
 * @param {Function} props.onCommentClick - הצגת תגובות
 * @param {Function} props.onShare - פונקציית שיתוף
 */
function PostActions({
  isLiked,
  likesCount = 0,
  onLike,
  onCommentClick,
  onShare
}) {
  const [likeAnimating, setLikeAnimating] = useState(false);

  const handleLike = () => {
    if (onLike) {
      setLikeAnimating(true);
      onLike();
      setTimeout(() => setLikeAnimating(false), 400);
    }
  };

  return (
    <div className={styles.actions}>
      <button 
        className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`} 
        onClick={handleLike}
        aria-label={isLiked ? "הסר לייק" : "הוסף לייק"}
      >
        {isLiked ? <FaHeart className={likeAnimating ? styles.animate : ''} /> : <FaRegHeart />}
        <span>אהבתי</span>
        {likesCount > 0 && <span className={styles.count}>{likesCount}</span>}
      </button>

      <button 
        className={styles.actionButton} 
        onClick={onCommentClick}
        aria-label="הצג תגובות"
      >
        <FaComment />
        <span>תגובה</span>
      </button>

      <button 
        className={styles.actionButton} 
        onClick={onShare}
        aria-label="שתף"
      >
        <FaShare />
        <span>שתף</span>
      </button>
    </div>
  );
}

export default PostActions;
