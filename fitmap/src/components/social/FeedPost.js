// src/components/social/FeedPost.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUser, 
  FaHeart, 
  FaRegHeart, 
  FaComment, 
  FaShare, 
  FaEllipsisV,
  FaDumbbell,
  FaTrophy,
  FaUsers,
  FaMapMarkerAlt,
  FaLock,
  FaTimes,
  FaSpinner
} from 'react-icons/fa';
import { feedService } from '../../services/feedService';
import PostComments from './PostComments';
import styles from './styles/FeedPost.module.css';

/**
 * רכיב להצגת פוסט בפיד החברתי
 * 
 * @param {Object} props - מאפייני הרכיב
 * @param {Object} props.post - נתוני הפוסט
 * @param {string} props.currentUserId - מזהה המשתמש המחובר
 * @param {Function} props.onPostUpdated - פונקציה לעדכון הפוסט
 * @param {boolean} props.expandComments - האם להציג תגובות ישירות
 */
function FeedPost({ 
  post, 
  currentUserId, 
  onPostUpdated,
  expandComments = false
}) {
  const [isLiked, setIsLiked] = useState(post.liked_by_me || false);
  const [likesCount, setLikesCount] = useState(post.post_likes?.count || 0);
  const [showComments, setShowComments] = useState(expandComments);
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  // טיפול בלחיצת לייק
  const handleLikeClick = async () => {
    if (!currentUserId) return;
    
    const newLikeState = !isLiked;
    
    // עדכון אופטימי בממשק
    setIsLiked(newLikeState);
    setLikesCount(prev => newLikeState ? prev + 1 : Math.max(0, prev - 1));
    
    // עדכון בשרת
    const { success, error } = await feedService.toggleLike(post.id, currentUserId, newLikeState);
    
    if (!success) {
      // שחזור מצב קודם במקרה של שגיאה
      setIsLiked(!newLikeState);
      setLikesCount(prev => !newLikeState ? prev + 1 : Math.max(0, prev - 1));
      console.error('שגיאה בעדכון לייק:', error);
    }
    
    // עדכון ההורה
    if (onPostUpdated) {
      onPostUpdated(post.id, { 
        liked_by_me: newLikeState,
        post_likes: { count: newLikeState ? likesCount + 1 : Math.max(0, likesCount - 1) }
      });
    }
  };

  // טיפול במחיקת פוסט
  const handleDeletePost = async () => {
    if (!currentUserId || isDeleting) return;
    
    if (!window.confirm('האם אתה בטוח שברצונך למחוק פוסט זה?')) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const { success, error } = await feedService.deletePost(post.id, currentUserId);
      
      if (!success) throw new Error(error || 'שגיאה במחיקת הפוסט');
      
      if (onPostUpdated) {
        onPostUpdated(post.id, { deleted: true });
      }
    } catch (err) {
      setError(err.message || 'שגיאה במחיקת הפוסט');
      setIsDeleting(false);
    }
  };

  // טיפול בעדכון תגובות
  const handleCommentsUpdated = (updateInfo) => {
    // עדכון ספירת תגובות בפוסט
    if (updateInfo.type === 'add') {
      const newCount = (post.comments?.count || 0) + 1;
      
      if (onPostUpdated) {
        onPostUpdated(post.id, {
          comments: { count: newCount }
        });
      }
    }
  };

  // טיפול בשיתוף פוסט
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/posts/${post.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: `פוסט מאת ${post.user?.name || 'משתמש'}`,
        text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        url: shareUrl
      }).catch(err => console.error('שגיאה בשיתוף:', err));
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert('הקישור הועתק ללוח'))
        .catch(err => console.error('שגיאה בהעתקה:', err));
    }
  };

  // קבלת אייקון לסוג הפעילות
  const getActivityIcon = () => {
    switch(post.activity_type) {
      case 'workout': return <FaDumbbell className={styles.activityIcon} />;
      case 'challenge': return <FaTrophy className={styles.activityIcon} />;
      case 'group_workout': return <FaUsers className={styles.activityIcon} />;
      case 'facility_check_in': return <FaMapMarkerAlt className={styles.activityIcon} />;
      default: return null;
    }
  };

  // עיבוד תוכן עם תמיכה בקישורים
  const formatContent = (content) => {
    if (!content) return null;
    
    // תבנית לזיהוי קישורים בטקסט
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    return content.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.contentLink}
          >
            {part}
          </a>
        );
      }
      
      // פיצול לשורות
      return part.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < part.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    });
  };

  // פורמט זמן יחסי (לפני X שעות)
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
    }
    if (diffDay > 0) {
      return `לפני ${diffDay} ${diffDay === 1 ? 'יום' : 'ימים'}`;
    }
    if (diffHour > 0) {
      return `לפני ${diffHour} ${diffHour === 1 ? 'שעה' : 'שעות'}`;
    }
    if (diffMin > 0) {
      return `לפני ${diffMin} ${diffMin === 1 ? 'דקה' : 'דקות'}`;
    }
    
    return 'כרגע';
  };

  // כותרת לסוג הפעילות
  const renderActivityTitle = () => {
    switch(post.activity_type) {
      case 'workout': return <span className={styles.activityTitle}>השלים אימון</span>;
      case 'challenge': return <span className={styles.activityTitle}>התקדם באתגר</span>;
      case 'group_workout': return <span className={styles.activityTitle}>הצטרף לאימון קבוצתי</span>;
      case 'facility_check_in': return <span className={styles.activityTitle}>התאמן במתחם</span>;
      default: return null;
    }
  };

  // אם הפוסט נמחק או חסר
  if (!post) return null;

  return (
    <div className={styles.post}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.header}>
        <div className={styles.userInfo}>
          <Link to={`/profile/${post.user_id}`} className={styles.avatarLink}>
            <div className={styles.avatar}>
              {post.user?.avatar_url ? (
                <img 
                  src={post.user.avatar_url} 
                  alt={post.user.name || 'משתמש'} 
                  className={styles.avatarImage} 
                />
              ) : (
                <div className={styles.defaultAvatar}><FaUser /></div>
              )}
            </div>
          </Link>

          <div className={styles.userDetails}>
            <div className={styles.nameContainer}>
              <Link to={`/profile/${post.user_id}`} className={styles.userName}>
                {post.user?.name || 'משתמש'}
              </Link>
              {!post.is_public && <FaLock className={styles.privateIcon} title="פוסט פרטי" />}
              {renderActivityTitle()}
            </div>

            <div className={styles.postMeta}>
              <time dateTime={post.created_at} className={styles.timestamp}>
                {formatTimeAgo(post.created_at)}
              </time>
              {post.activity_type !== 'post' && getActivityIcon()}
            </div>
          </div>
        </div>

        <div className={styles.postOptions}>
          <button 
            className={styles.optionsButton} 
            onClick={() => setShowOptions(!showOptions)}
            aria-label="אפשרויות"
          >
            <FaEllipsisV />
          </button>
          
          {showOptions && currentUserId === post.user_id && (
            <div className={styles.optionsMenu}>
              <button 
                className={styles.deleteOption} 
                onClick={handleDeletePost} 
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <FaSpinner className={styles.spinner} /> מוחק...
                  </>
                ) : (
                  <>
                    <FaTimes /> מחק פוסט
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <p className={styles.postText}>{formatContent(post.content)}</p>
        
        {post.image_url && (
          <div className={styles.imageContainer}>
            <img 
              src={post.image_url} 
              alt="תמונת פוסט" 
              className={styles.postImage} 
              onClick={() => window.open(post.image_url, '_blank')} 
            />
          </div>
        )}
      </div>

      <div className={styles.postStats}>
        <div className={styles.likesInfo}>
          {likesCount > 0 && (
            <>
              <FaHeart className={styles.likeIcon} />
              <span className={styles.likesCount}>{likesCount}</span>
            </>
          )}
        </div>
        <div className={styles.commentsInfo}>
          {post.comments?.count > 0 && (
            <span className={styles.commentsCount}>
              {post.comments.count} תגובות
            </span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button 
          className={`${styles.actionButton} ${isLiked ? styles.likedButton : ''}`} 
          onClick={handleLikeClick}
          aria-label={isLiked ? 'הסר לייק' : 'הוסף לייק'}
        >
          {isLiked ? <FaHeart /> : <FaRegHeart />}
          <span>אהבתי</span>
        </button>
        
        <button 
          className={styles.actionButton} 
          onClick={() => setShowComments(!showComments)}
          aria-label={showComments ? 'הסתר תגובות' : 'הצג תגובות'}
        >
          <FaComment />
          <span>תגובה</span>
        </button>
        
        <button 
          className={styles.actionButton} 
          onClick={handleShare}
          aria-label="שתף"
        >
          <FaShare />
          <span>שתף</span>
        </button>
      </div>

      {showComments && (
        <PostComments 
          postId={post.id} 
          currentUserId={currentUserId} 
          onCommentsUpdated={handleCommentsUpdated} 
        />
      )}
    </div>
  );
}

export default FeedPost;