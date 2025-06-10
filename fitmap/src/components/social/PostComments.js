// src/components/social/PostComments.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUser, 
  FaHeart, 
  FaRegHeart, 
  FaReply, 
  FaSpinner, 
  FaTimes,
  FaExclamationTriangle,
  FaPaperPlane
} from 'react-icons/fa';
import { feedService } from '../../services/feedService';
import styles from './styles/PostComments.module.css';

/**
 * רכיב להצגת ושליחת תגובות לפוסט
 * 
 * @param {Object} props - מאפייני הרכיב
 * @param {string} props.postId - מזהה הפוסט
 * @param {string} props.currentUserId - מזהה המשתמש המחובר
 * @param {function} props.onCommentsUpdated - פונקציה לעדכון מידע על תגובות
 */
function PostComments({ postId, currentUserId, onCommentsUpdated }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  
  const commentInputRef = useRef(null);

  // טעינת תגובות בעת טעינת הרכיב
  useEffect(() => {
    loadComments();
  }, [postId]);

  // התמקדות בשדה הקלט כאשר עונים לתגובה
  useEffect(() => {
    if (replyingTo && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [replyingTo]);

  // פונקציה לטעינת תגובות
  const loadComments = async () => {
    if (!postId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await feedService.getComments(postId, currentUserId);
      
      if (error) {
        throw new Error(error);
      }
      
      // ארגון התגובות במבנה עץ (parent-child)
      const rootComments = [];
      const commentMap = {};
      
      // ראשית, נמפה את כל התגובות
      data.forEach(comment => {
        commentMap[comment.id] = { ...comment, replies: [] };
      });
      
      // אז, נבנה את העץ
      data.forEach(comment => {
        if (comment.parent_id) {
          if (commentMap[comment.parent_id]) {
            commentMap[comment.parent_id].replies.push(commentMap[comment.id]);
          } else {
            rootComments.push(commentMap[comment.id]);
          }
        } else {
          rootComments.push(commentMap[comment.id]);
        }
      });
      
      setComments(rootComments);
    } catch (err) {
      console.error('שגיאה בטעינת תגובות:', err);
      setError('לא ניתן היה לטעון את התגובות');
    } finally {
      setLoading(false);
    }
  };

  // שליחת תגובה חדשה
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!currentUserId || !newComment.trim() || submitting) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const { data, error } = await feedService.addComment(
        postId, 
        currentUserId, 
        newComment, 
        replyingTo?.id // אם יש replyingTo, זו תגובה לתגובה
      );
      
      if (error) {
        throw new Error(error);
      }
      
      // עדכון ממשק המשתמש
      if (replyingTo) {
        // עדכון תגובה בתוך תגובה
        setComments(prevComments => {
          return prevComments.map(comment => {
            if (comment.id === replyingTo.id) {
              return {
                ...comment,
                replies: [...(comment.replies || []), data]
              };
            }
            return comment;
          });
        });
      } else {
        // הוספת תגובה ברמה העליונה
        setComments(prevComments => [
          ...prevComments,
          { ...data, replies: [] }
        ]);
      }
      
      // איפוס הטופס
      setNewComment('');
      setReplyingTo(null);
      
      // עדכון פונקציית קולבק
      if (onCommentsUpdated) {
        onCommentsUpdated({ type: 'add' });
      }
    } catch (err) {
      console.error('שגיאה בהוספת תגובה:', err);
      setError('לא ניתן היה להוסיף את התגובה');
    } finally {
      setSubmitting(false);
    }
  };

  // עדכון לייק לתגובה
  const handleToggleLike = async (commentId, isCurrentlyLiked) => {
    if (!currentUserId) return;
    
    try {
      // עדכון אופטימי בממשק
      setComments(prevComments => 
        updateCommentLikeStatus(prevComments, commentId, !isCurrentlyLiked)
      );
      
      // שליחה לשרת
      const { success, error } = await feedService.toggleCommentLike(
        commentId, 
        currentUserId, 
        !isCurrentlyLiked
      );
      
      if (!success) {
        // שחזור המצב הקודם במקרה של שגיאה
        setComments(prevComments => 
          updateCommentLikeStatus(prevComments, commentId, isCurrentlyLiked)
        );
        console.error('שגיאה בעדכון לייק לתגובה:', error);
      }
    } catch (err) {
      console.error('שגיאה בעדכון לייק לתגובה:', err);
    }
  };

  // עדכון סטטוס הלייק במבנה המקונן של התגובות
  const updateCommentLikeStatus = (comments, commentId, newLikeStatus) => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          liked_by_me: newLikeStatus,
          comment_likes: {
            count: newLikeStatus 
              ? (comment.comment_likes?.count || 0) + 1 
              : Math.max(0, (comment.comment_likes?.count || 0) - 1)
          }
        };
      }
      
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentLikeStatus(comment.replies, commentId, newLikeStatus)
        };
      }
      
      return comment;
    });
  };

  // רינדור תגובה בודדת (משמש גם לתגובות ראשיות וגם לתת-תגובות)
  const renderComment = (comment, isReply = false) => {
    if (!comment) return null;
    
    return (
      <div 
        key={comment.id} 
        className={`${styles.comment} ${isReply ? styles.replyComment : ''}`}
      >
        <div className={styles.commentHeader}>
          <Link to={`/profile/${comment.user_id}`} className={styles.commentAvatar}>
            {comment.profiles?.avatar_url ? (
              <img 
                src={comment.profiles.avatar_url} 
                alt={comment.profiles.name || "משתמש"} 
                className={styles.avatarImage}
              />
            ) : (
              <div className={styles.defaultAvatar}>
                <FaUser />
              </div>
            )}
          </Link>
          
          <div className={styles.commentContent}>
            <div className={styles.commentInfo}>
              <Link to={`/profile/${comment.user_id}`} className={styles.commenterName}>
                {comment.profiles?.name || "משתמש"}
              </Link>
              
              <time className={styles.commentTime}>
                {formatTimeAgo(comment.created_at)}
              </time>
            </div>
            
            <p className={styles.commentText}>{comment.content}</p>
            
            <div className={styles.commentActions}>
              <button 
                className={`${styles.likeAction} ${comment.liked_by_me ? styles.liked : ''}`}
                onClick={() => handleToggleLike(comment.id, comment.liked_by_me)}
                aria-label={comment.liked_by_me ? "הסר לייק" : "הוסף לייק"}
              >
                {comment.liked_by_me ? <FaHeart /> : <FaRegHeart />}
                {comment.comment_likes?.count > 0 && (
                  <span className={styles.likesCount}>{comment.comment_likes.count}</span>
                )}
              </button>
              
              <button 
                className={styles.replyAction}
                onClick={() => setReplyingTo(comment)}
                aria-label="הגב"
              >
                <FaReply />
                <span>הגב</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* תת-תגובות */}
        {comment.replies && comment.replies.length > 0 && (
          <div className={styles.repliesContainer}>
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  // פורמט זמן יחסי (כמו "לפני 5 דקות")
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 30) {
      return date.toLocaleDateString('he-IL');
    } else if (diffDay > 0) {
      return `לפני ${diffDay} ${diffDay === 1 ? 'יום' : 'ימים'}`;
    } else if (diffHour > 0) {
      return `לפני ${diffHour} ${diffHour === 1 ? 'שעה' : 'שעות'}`;
    } else if (diffMin > 0) {
      return `לפני ${diffMin} ${diffMin === 1 ? 'דקה' : 'דקות'}`;
    } else {
      return 'כרגע';
    }
  };

  return (
    <div className={styles.commentsContainer}>
      {error && (
        <div className={styles.error}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <span>{error}</span>
        </div>
      )}
      
      {/* טופס תגובה חדשה */}
      <form className={styles.commentForm} onSubmit={handleSubmitComment}>
        {replyingTo && (
          <div className={styles.replyingBanner}>
            <span>מגיב לתגובה של {replyingTo.profiles?.name || "משתמש"}</span>
            <button 
              type="button" 
              className={styles.cancelReplyButton}
              onClick={() => setReplyingTo(null)}
              aria-label="בטל תגובה"
            >
              <FaTimes />
            </button>
          </div>
        )}
        
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="כתוב תגובה..."
            className={styles.commentInput}
            ref={commentInputRef}
            disabled={submitting || !currentUserId}
          />
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={submitting || !newComment.trim() || !currentUserId}
          >
            {submitting ? <FaSpinner className={styles.spinner} /> : <FaPaperPlane />}
          </button>
        </div>
      </form>
      
      {/* רשימת התגובות */}
      <div className={styles.commentsList}>
        {loading ? (
          <div className={styles.loading}>
            <FaSpinner className={styles.spinner} />
            <span>טוען תגובות...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className={styles.noComments}>
            <p>אין תגובות עדיין. היה הראשון להגיב!</p>
          </div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
}

export default PostComments;