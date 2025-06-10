// src/components/challenges/CreateChallengeForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { FaCalendarAlt, FaTrophy, FaRegImage, FaSave, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import styles from './styles/CreateChallengeForm.module.css';

/**
 * טופס יצירת אתגר חדש - מיועד למנהלים בלבד
 */
function CreateChallengeForm() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  // בדיקה אם המשתמש הוא מנהל
  const isAdmin = userProfile?.role === 'admin';
  
  // טופס יצירת אתגר
  const [challengeData, setChallengeData] = useState({
    title: '',
    description: '',
    rules: '',
    start_date: '',
    end_date: '',
    target_value: '',
    metric: 'workouts',
    reward: '',
    image_url: ''
  });
  
  const [achievements, setAchievements] = useState([
    { title: '', description: '', level: 'bronze', category: '', required_value: '' },
    { title: '', description: '', level: 'silver', category: '', required_value: '' },
    { title: '', description: '', level: 'gold', category: '', required_value: '' }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // רשימת מטריקות זמינות
  const availableMetrics = [
    { value: 'workouts', label: 'אימונים' },
    { value: 'km', label: 'קילומטרים' },
    { value: 'minutes', label: 'דקות' },
    { value: 'steps', label: 'צעדים' },
    { value: 'calories', label: 'קלוריות' }
  ];
  
  // רשימת רמות הישגים
  const achievementLevels = [
    { value: 'bronze', label: 'ארד' },
    { value: 'silver', label: 'כסף' },
    { value: 'gold', label: 'זהב' },
    { value: 'platinum', label: 'פלטינה' },
    { value: 'diamond', label: 'יהלום' }
  ];
  
  // רשימת קטגוריות הישגים
  const achievementCategories = [
    { value: 'workouts', label: 'אימונים' },
    { value: 'running', label: 'ריצה' },
    { value: 'distance', label: 'מרחק' },
    { value: 'steps', label: 'צעדים' },
    { value: 'calories', label: 'קלוריות' },
    { value: 'streak', label: 'רצף' },
    { value: 'time', label: 'זמן' }
  ];
  
  // טיפול בשינויים בטופס
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setChallengeData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // טיפול בשינויים בהישגים
  const handleAchievementChange = (index, field, value) => {
    setAchievements(prev => 
      prev.map((achievement, i) => 
        i === index ? { ...achievement, [field]: value } : achievement
      )
    );
  };
  
  // טיפול בהעלאת תמונה
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // בדיקת סוג הקובץ
    if (!file.type.startsWith('image/')) {
      setError('יש להעלות קובץ תמונה בלבד');
      return;
    }
    
    // הצגת תצוגה מקדימה של התמונה
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // בפרויקט אמיתי, כאן נעלה את התמונה לסופאבייס סטורג'
    // וננהל את הקישור לתמונה
    
    // בדוגמה זו נשמור רק את שם הקובץ
    setChallengeData(prev => ({
      ...prev,
      image_url: `/challenges/${file.name}`
    }));
  };
  
  // שליחת הטופס
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!isAdmin) {
      setError('אין לך הרשאות מנהל ליצירת אתגר');
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
  
      // בדיקות תקינות
      if (!challengeData.title.trim()) throw new Error('יש להזין כותרת לאתגר');
      if (!challengeData.description.trim()) throw new Error('יש להזין תיאור לאתגר');
      if (!challengeData.start_date || !challengeData.end_date) throw new Error('יש להזין תאריכי התחלה וסיום');
      if (new Date(challengeData.start_date) >= new Date(challengeData.end_date)) throw new Error('תאריך ההתחלה חייב להיות לפני תאריך הסיום');
      if (!challengeData.target_value || isNaN(challengeData.target_value) || challengeData.target_value <= 0)
        throw new Error('יש להזין ערך יעד חיובי');
  
      const validAchievements = achievements
        .filter(a => a.title && a.description && a.required_value && a.category)
        .map(a => ({
          ...a,
          required_value: Number(a.required_value),
          level: a.level || 'bronze'
        }));
  
      // יצירת אתגר
      const { data: insertedChallenge, error: insertError } = await supabase
        .from('challenges')
        .insert([{
          ...challengeData,
          target_value: Number(challengeData.target_value),
          creator_id: userProfile.id, // שים לב: זה צריך להיות `id` ולא `user_id`
          participants_count: 0,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
  
      if (insertError) throw insertError;
  
      // שמירת הישגים
      if (validAchievements.length > 0) {
        const achievementsWithChallengeId = validAchievements.map(a => ({
          ...a,
          challenge_id: insertedChallenge.id
        }));
  
        const { error: achievementsInsertError } = await supabase
          .from('achievements')
          .insert(achievementsWithChallengeId);
  
        if (achievementsInsertError) throw achievementsInsertError;
      }
  
      alert('האתגר נוצר בהצלחה!');
      navigate('/challenges');
  
    } catch (error) {
      console.error('שגיאה ביצירת אתגר:', error);
      setError(error.message || 'שגיאה כללית ביצירת אתגר');
    } finally {
      setLoading(false);
    }
  };
  
  
  // אם המשתמש אינו מנהל, החזר הודעת שגיאה
  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.accessDenied}>
          <FaExclamationTriangle className={styles.accessDeniedIcon} />
          <h1>אין גישה</h1>
          <p>רק מנהלים יכולים ליצור אתגרים חדשים</p>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/challenges')}
          >
            חזרה לרשימת האתגרים
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/challenges')}
        >
          <FaTimes /> ביטול
        </button>
        <h1>יצירת אתגר חדש</h1>
      </div>
      
      {error && (
        <div className={styles.errorMessage}>
          <FaExclamationTriangle />
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formSection}>
          <h2>פרטי האתגר</h2>
          
          <div className={styles.formGroup}>
            <label htmlFor="title">כותרת האתגר</label>
            <input
              type="text"
              id="title"
              name="title"
              value={challengeData.title}
              onChange={handleInputChange}
              placeholder="לדוגמה: אתגר 30 ימי כושר"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="description">תיאור האתגר</label>
            <textarea
              id="description"
              name="description"
              value={challengeData.description}
              onChange={handleInputChange}
              placeholder="תאר את האתגר, מטרותיו וכיצד להשלים אותו"
              rows="4"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="rules">חוקי האתגר (אופציונלי)</label>
            <textarea
              id="rules"
              name="rules"
              value={challengeData.rules}
              onChange={handleInputChange}
              placeholder="פרט את החוקים ומה נחשב להשלמת האתגר"
              rows="3"
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="start_date">תאריך התחלה</label>
              <div className={styles.dateInputContainer}>
                <FaCalendarAlt className={styles.inputIcon} />
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={challengeData.start_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="end_date">תאריך סיום</label>
              <div className={styles.dateInputContainer}>
                <FaCalendarAlt className={styles.inputIcon} />
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={challengeData.end_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="target_value">ערך יעד</label>
              <input
                type="number"
                id="target_value"
                name="target_value"
                value={challengeData.target_value}
                onChange={handleInputChange}
                placeholder="לדוגמה: 30"
                min="1"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="metric">יחידת מדידה</label>
              <select
                id="metric"
                name="metric"
                value={challengeData.metric}
                onChange={handleInputChange}
                required
              >
                {availableMetrics.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="reward">פרס (אופציונלי)</label>
            <input
              type="text"
              id="reward"
              name="reward"
              value={challengeData.reward}
              onChange={handleInputChange}
              placeholder="לדוגמה: תג זהב ונקודות קהילה"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="image">תמונת האתגר</label>
            <div className={styles.imageUploadContainer}>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.fileInput}
              />
              <label htmlFor="image" className={styles.imageUploadBtn}>
                <FaRegImage /> בחר תמונה
              </label>
              
              {imagePreview ? (
                <div className={styles.imagePreviewContainer}>
                  <img 
                    src={imagePreview} 
                    alt="תצוגה מקדימה" 
                    className={styles.imagePreview} 
                  />
                  <button 
                    type="button" 
                    className={styles.removeImageBtn}
                    onClick={() => {
                      setImagePreview(null);
                      setChallengeData(prev => ({ ...prev, image_url: '' }));
                    }}
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <div className={styles.imagePlaceholder}>
                  <FaTrophy />
                  <span>אין תמונה</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className={styles.formSection}>
          <h2>הישגים ותגים</h2>
          <p className={styles.sectionDescription}>
            הוסף עד 3 תגי הישג שישתתפים יוכלו לקבל במהלך האתגר
          </p>
          
          {achievements.map((achievement, index) => (
            <div key={index} className={styles.achievementSection}>
              <h3>הישג {index + 1}</h3>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor={`achievement-title-${index}`}>כותרת</label>
                  <input
                    type="text"
                    id={`achievement-title-${index}`}
                    value={achievement.title}
                    onChange={(e) => handleAchievementChange(index, 'title', e.target.value)}
                    placeholder="לדוגמה: מתאמן מתחיל"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor={`achievement-level-${index}`}>רמה</label>
                  <select
                    id={`achievement-level-${index}`}
                    value={achievement.level}
                    onChange={(e) => handleAchievementChange(index, 'level', e.target.value)}
                  >
                    {achievementLevels.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor={`achievement-description-${index}`}>תיאור</label>
                <input
                  type="text"
                  id={`achievement-description-${index}`}
                  value={achievement.description}
                  onChange={(e) => handleAchievementChange(index, 'description', e.target.value)}
                  placeholder="לדוגמה: השלמת 5 אימונים"
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor={`achievement-required-${index}`}>ערך נדרש</label>
                  <input
                    type="number"
                    id={`achievement-required-${index}`}
                    value={achievement.required_value}
                    onChange={(e) => handleAchievementChange(index, 'required_value', e.target.value)}
                    placeholder="לדוגמה: 5"
                    min="1"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor={`achievement-category-${index}`}>קטגוריה</label>
                  <select
                    id={`achievement-category-${index}`}
                    value={achievement.category}
                    onChange={(e) => handleAchievementChange(index, 'category', e.target.value)}
                  >
                    <option value="">בחר קטגוריה</option>
                    {achievementCategories.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className={styles.formActions}>
          <button 
            type="button" 
            className={styles.cancelButton}
            onClick={() => navigate('/challenges')}
          >
            ביטול
          </button>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className={styles.spinner}></div>
                שומר...
              </>
            ) : (
              <>
                <FaSave /> שמור אתגר
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateChallengeForm;