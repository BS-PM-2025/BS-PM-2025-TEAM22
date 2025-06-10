// src/components/social/CreatePostForm.js
import React, { useState, useRef } from 'react';
import { 
  FaImage, 
  FaPaperPlane, 
  FaLock, 
  FaGlobe, 
  FaSpinner,
  FaTimes,
  FaDumbbell,
  FaTrophy,
  FaUsers,
  FaMapMarkerAlt,
  FaExclamationTriangle
} from 'react-icons/fa';
import { supabase } from '../../utils/supabaseClient';
import { feedService } from '../../services/feedService';
import styles from './styles/CreatePostForm.module.css';

/**
 * רכיב ליצירת פוסט חדש
 * 
 * @param {Object} props - מאפייני הרכיב
 * @param {string} props.userId - מזהה המשתמש היוצר
 * @param {string} props.userAvatar - תמונת משתמש
 * @param {string} props.userName - שם המשתמש
 * @param {function} props.onPostCreated - קולבק שנקרא לאחר יצירת פוסט
 * @param {Object} props.relatedActivity - פעילות קשורה
 * @param {string} props.activityType - סוג הפעילות (post/workout/challenge/facility_check_in)
 * @param {boolean} props.initialIsPublic - האם הפוסט ציבורי כברירת מחדל
 */
function CreatePostForm({ 
  userId, 
  userAvatar, 
  userName, 
  onPostCreated, 
  relatedActivity = null,
  activityType = 'post',
  initialIsPublic = true
}) {
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // פונקציה לפתיחת חלון בחירת קובץ
  const handleImageButtonClick = () => {
    fileInputRef.current.click();
  };

  // פונקציה לטיפול בקובץ שנבחר
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // בדיקת סוג הקובץ
    if (!file.type.startsWith('image/')) {
      setError('יש לבחור קובץ תמונה בלבד');
      return;
    }

    // בדיקת גודל הקובץ (מקסימום 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('התמונה גדולה מדי. גודל מרבי: 5MB');
      return;
    }

    setImage(file);
    
    // יצירת תצוגה מקדימה של התמונה
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // פונקציה להסרת התמונה
  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // פונקציה לשליחת הפוסט
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId || !content.trim() || submitting) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      let imageUrl = null;
      
      // אם יש תמונה, מעלים אותה קודם
      if (image) {
        setIsUploading(true);
        
        const fileName = `${userId}_${Date.now()}_${image.name.replace(/\s+/g, '_')}`;
        const filePath = `posts/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, image);
        
        if (uploadError) {
          throw new Error('שגיאה בהעלאת התמונה');
        }
        
        // יצירת URL ציבורי
        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(filePath);
          
        imageUrl = urlData.publicUrl;
        setIsUploading(false);
      }
      
      // יצירת הפוסט
      const postData = {
        user_id: userId,
        content: content.trim(),
        image_url: imageUrl,
        activity_type: activityType,
        is_public: isPublic
      };
      
      const { data, error } = await feedService.createPost(postData, relatedActivity);
      
      if (error) {
        throw new Error(error);
      }
      
      // איפוס הטופס
      setContent('');
      setImage(null);
      setImagePreview(null);
      
      // קריאה לפונקציית הקולבק
      if (onPostCreated) {
        onPostCreated(data);
      }
    } catch (err) {
      console.error('שגיאה ביצירת פוסט:', err);
      setError(err.message || 'שגיאה ביצירת הפוסט');
    } finally {
      setSubmitting(false);
      setIsUploading(false);
    }
  };

  // קבלת כותרת מותאמת לסוג הפעילות
  const getActivityTitle = () => {
    switch (activityType) {
      case 'workout':
        return 'שיתוף אימון';
      case 'challenge':
        return 'שיתוף אתגר';
      case 'group_workout':
        return 'שיתוף אימון קבוצתי';
      case 'facility_check_in':
        return 'צ׳ק-אין למתקן';
      default:
        return 'פוסט חדש';
    }
  };

  // קבלת אייקון לסוג הפעילות
  const getActivityIcon = () => {
    switch (activityType) {
      case 'workout':
        return <FaDumbbell className={styles.activityIcon} />;
      case 'challenge':
        return <FaTrophy className={styles.activityIcon} />;
      case 'group_workout':
        return <FaUsers className={styles.activityIcon} />;
      case 'facility_check_in':
        return <FaMapMarkerAlt className={styles.activityIcon} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.formContainer}>
      {error && (
        <div className={styles.error}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className={styles.header}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={userName} 
                  className={styles.avatarImage}
                />
              ) : (
                <div className={styles.defaultAvatar}>
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>
            <span className={styles.userName}>{userName}</span>
          </div>
          
          <div className={styles.postType}>
            {getActivityIcon()}
            <span className={styles.postTypeLabel}>{getActivityTitle()}</span>
          </div>
        </div>
        
        {/* פרטי הפעילות המקושרת */}
        {relatedActivity && activityType !== 'post' && (
          <div className={styles.relatedActivity}>
            {/* תצוגת פרטי האובייקט שמקושר לפי סוג הפעילות */}
            <div className={styles.activityInfo}>
              {activityType === 'workout' && relatedActivity.workout_id && (
                <div>
                  <strong>שם האימון:</strong> {relatedActivity.workout_name || "אימון"}
                </div>
              )}
              {activityType === 'challenge' && relatedActivity.challenge_id && (
                <div>
                  <strong>שם האתגר:</strong> {relatedActivity.challenge_name || "אתגר"}
                </div>
              )}
              {activityType === 'group_workout' && relatedActivity.group_workout_id && (
                <div>
                  <strong>שם האימון הקבוצתי:</strong> {relatedActivity.group_workout_name || "אימון קבוצתי"}
                </div>
              )}
              {activityType === 'facility_check_in' && relatedActivity.facility_id && (
                <div>
                  <strong>שם המתקן:</strong> {relatedActivity.facility_name || "מתקן"}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* שדה טקסט להזנת תוכן הפוסט */}
        <div className={styles.contentContainer}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`מה אתה רוצה לשתף, ${userName}?`}
            className={styles.contentTextarea}
            maxLength={1000} // מגבלת תווים
            rows={4}
          />
          
          {/* תצוגה מקדימה של תמונה שנבחרה */}
          {imagePreview && (
            <div className={styles.imagePreviewContainer}>
              <img 
                src={imagePreview} 
                alt="תצוגה מקדימה" 
                className={styles.imagePreview}
              />
              <button 
                type="button"
                onClick={handleRemoveImage}
                className={styles.removeImageButton}
              >
                <FaTimes />
              </button>
            </div>
          )}
        </div>
        
        {/* כפתורי פעולה */}
        <div className={styles.actions}>
          {/* כפתור בחירת תמונה */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={handleImageButtonClick}
            className={styles.imageButton}
            disabled={isUploading || submitting}
          >
            <FaImage /> תמונה
          </button>
          
          {/* כפתור פרטיות */}
          <div className={styles.privacyToggle}>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={styles.privacyButton}
            >
              {isPublic ? (
                <>
                  <FaGlobe /> ציבורי
                </>
              ) : (
                <>
                  <FaLock /> פרטי
                </>
              )}
            </button>
          </div>
          
          {/* כפתור שליחה */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={!content.trim() || submitting || isUploading}
          >
            {submitting || isUploading ? (
              <FaSpinner className={styles.spinner} />
            ) : (
              <>
                <FaPaperPlane /> שלח
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePostForm;