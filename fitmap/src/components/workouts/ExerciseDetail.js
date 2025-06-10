// src/components/workouts/ExerciseDetail.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { 
  FaArrowRight, FaStar, FaRegStar, FaPlayCircle, FaDumbbell, 
  FaExclamationTriangle, FaTimes, FaBookmark, FaRegBookmark,
  FaShareAlt, FaHistory, FaInfoCircle, FaCheckCircle
} from 'react-icons/fa';
import styles from './styles/ExerciseDetail.module.css';

/**
 * דף פרטי תרגיל - מציג מידע מפורט על תרגיל כולל וידאו הדרכה, אפשרויות שמירה והוספה לאימון
 */
function ExerciseDetail() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const videoRef = useRef(null);
  
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [relatedExercises, setRelatedExercises] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTab, setSelectedTab] = useState('instructions');
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!exerciseId) {
      setError('מזהה תרגיל חסר');
      setLoading(false);
      return;
    }

    fetchExerciseDetails(exerciseId);
    
    // Check if exercise is in favorites
    if (userProfile) {
      checkFavoriteStatus(exerciseId);
      fetchExerciseHistory(exerciseId);
    }
  }, [exerciseId, userProfile]);

  // כאשר פותחים את מודל הוידאו, מכינים את ה-URL
  useEffect(() => {
    if (isVideoOpen && exercise?.videoUrl) {
      // וידוא שה-URL הוא בפורמט הטמעה
      prepareVideoUrl(exercise.videoUrl);
    }
  }, [isVideoOpen, exercise]);

  // טיפול בהודעות הצלחה
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // בדיקה אם התרגיל במועדפים
  const checkFavoriteStatus = async (id) => {
    try {
      // בפרויקט אמיתי, כאן נבדוק ב-Supabase
      const { data } = await supabase
        .from('user_favorite_exercises')
        .select('*')
        .eq('user_id', userProfile.user_id)
        .eq('exercise_id', id)
        .single();
      
      setIsFavorite(!!data);
    } catch (err) {
      console.error('שגיאה בבדיקת סטטוס מועדף:', err);
      // אל נציג הודעת שגיאה למשתמש בשביל זה
    }
  };

  // טעינת היסטוריית אימונים עם התרגיל
  const fetchExerciseHistory = async (id) => {
    try {
      // בפרויקט אמיתי, כאן נטען היסטוריה מ-Supabase
      const { data } = await supabase
        .from('workout_exercises')
        .select(`
          workout_id,
          workouts:workout_id (
            workout_name,
            workout_date,
            duration_minutes
          )
        `)
        .eq('exercise_id', id)
        .eq('user_id', userProfile.user_id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (data && data.length > 0) {
        setExerciseHistory(data.map(item => item.workouts));
      }
    } catch (err) {
      console.error('שגיאה בטעינת היסטוריית תרגיל:', err);
    }
  };

  // פונקציה לטיפול בקישור הוידאו
  const prepareVideoUrl = (url) => {
    if (!url) return;

    // אם זה כבר בפורמט הטמעה
    if (url.includes('/embed/')) {
      // הוספת פרמטרים שימושיים
      const separator = url.includes('?') ? '&' : '?';
      setVideoUrl(`${url}${separator}autoplay=1&rel=0`);
    } 
    // אם זה בפורמט רגיל של youtube
    else if (url.includes('youtube.com/watch')) {
      try {
        const videoId = new URL(url).searchParams.get('v');
        if (videoId) {
          setVideoUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`);
        } else {
          setVideoUrl(url);
        }
      } catch (e) {
        console.error('שגיאה בהמרת קישור YouTube:', e);
        setVideoUrl(url);
      }
    }
    // אם זה קישור קצר של youtube
    else if (url.includes('youtu.be/')) {
      try {
        const videoId = url.split('youtu.be/')[1].split('?')[0];
        setVideoUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`);
      } catch (e) {
        console.error('שגיאה בהמרת קישור YouTube מקוצר:', e);
        setVideoUrl(url);
      }
    }
    // כל קישור אחר
    else {
      setVideoUrl(url);
    }
  };

  // פונקציה לטעינת פרטי התרגיל
  const fetchExerciseDetails = async (id) => {
    try {
      setLoading(true);
      
      // שליפת התרגיל מ-Supabase
      const { data: selectedExercise, error: exerciseError } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', parseInt(id))
        .single();
      
      if (exerciseError) throw exerciseError;
      
      if (!selectedExercise) {
        throw new Error('התרגיל המבוקש לא נמצא');
      }
      
      // המרה משמות עמודות במסד הנתונים לשמות שדות בקומפוננטה
      const formattedExercise = {
        id: selectedExercise.id,
        name: selectedExercise.name,
        description: selectedExercise.description,
        muscleGroup: selectedExercise.muscle_group,
        secondaryMuscles: selectedExercise.secondary_muscles,
        difficulty: selectedExercise.difficulty,
        equipment: selectedExercise.equipment,
        image: selectedExercise.image,
        instructions: selectedExercise.instructions,
        videoUrl: selectedExercise.video_url,
        benefits: selectedExercise.benefits || [
          'חיזוק שרירים', 
          'שיפור יציבה', 
          'הגברת גמישות'
        ],
        common_mistakes: selectedExercise.common_mistakes || [
          'כיפוף הגב',
          'מהירות ביצוע גבוהה מדי',
          'טווח תנועה מוגבל'
        ]
      };
      
      setExercise(formattedExercise);
      
      // מצא תרגילים קשורים (אותה קבוצת שרירים)
      const { data: relatedData, error: relatedError } = await supabase
        .from('exercises')
        .select('*')
        .neq('id', parseInt(id))
        .eq('muscle_group', selectedExercise.muscle_group)
        .limit(5);
      
      if (relatedError) throw relatedError;
      
      // מיון אקראי ובחירת 3 תרגילים קשורים
      const shuffled = [...relatedData].sort(() => 0.5 - Math.random());
      const related = shuffled.slice(0, 3).map(ex => ({
        id: ex.id,
        name: ex.name,
        description: ex.description,
        muscleGroup: ex.muscle_group,
        secondaryMuscles: ex.secondary_muscles,
        difficulty: ex.difficulty,
        equipment: ex.equipment,
        image: ex.image
      }));
      
      setRelatedExercises(related);
      
    } catch (error) {
      console.error('שגיאה בטעינת פרטי תרגיל:', error.message);
      setError(error.message || 'שגיאה בטעינת פרטי התרגיל');
    } finally {
      setLoading(false);
    }
  };

  // פונקציה לטיפול בלחיצה על תרגיל קשור
  const handleRelatedExerciseClick = (id) => {
    navigate(`/exercises/${id}`);
  };

  // המרת רמת קושי למספר כוכבים
  const getDifficultyStars = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 1;
      case 'intermediate': return 2;
      case 'advanced': return 3;
      default: return 1;
    }
  };

  // המרת רמת קושי לעברית
  const translateDifficulty = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'מתחיל';
      case 'intermediate': return 'בינוני';
      case 'advanced': return 'מתקדם';
      default: return difficulty;
    }
  };

  // תרגום קודי ציוד לעברית
  const translateEquipment = (equipmentCodes) => {
    if (!equipmentCodes || !Array.isArray(equipmentCodes) || equipmentCodes.length === 0) {
      return 'אין צורך בציוד';
    }
    
    const equipmentTranslation = {
      'pullup_bars': 'מתח',
      'parallel_bars': 'מקבילים',
      'bench': 'ספסל',
      'weights': 'משקולות',
      'rope': 'חבל',
      'rings': 'טבעות',
      'bar': 'מוט'
    };
    
    return equipmentCodes.map(code => equipmentTranslation[code] || code).join(', ');
  };

  // פונקציה להוספה/הסרה ממועדפים
  const toggleFavorite = async () => {
    if (!userProfile) {
      navigate('/auth');
      return;
    }
    
    try {
      if (isFavorite) {
        // הסרה ממועדפים
        const { error } = await supabase
          .from('user_favorite_exercises')
          .delete()
          .eq('user_id', userProfile.user_id)
          .eq('exercise_id', exercise.id);
          
        if (error) throw error;
        
        setIsFavorite(false);
        displaySuccess('התרגיל הוסר מהמועדפים');
      } else {
        // הוספה למועדפים
        const { error } = await supabase
          .from('user_favorite_exercises')
          .insert({
            user_id: userProfile.user_id,
            exercise_id: exercise.id,
            added_at: new Date().toISOString()
          });
          
        if (error) throw error;
        
        setIsFavorite(true);
        displaySuccess('התרגיל נוסף למועדפים');
      }
    } catch (err) {
      console.error('שגיאה בעדכון מועדפים:', err);
      displaySuccess('שגיאה בעדכון מועדפים', true);
    }
  };

  // פונקציה להצגת הודעת הצלחה
  const displaySuccess = (message, isError = false) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
  };

  // פונקציה לשיתוף התרגיל
  const shareExercise = () => {
    if (navigator.share) {
      navigator.share({
        title: `תרגיל: ${exercise.name}`,
        text: `בדוק את התרגיל ${exercise.name} באפליקציית כושר בחוץ!`,
        url: window.location.href
      })
      .catch(error => console.error('שגיאה בשיתוף:', error));
    } else {
      // פתרון חלופי אם Web Share API לא נתמך
      const shareUrl = window.location.href;
      navigator.clipboard.writeText(shareUrl)
        .then(() => displaySuccess('הקישור הועתק ללוח'))
        .catch(err => console.error('שגיאה בהעתקה:', err));
    }
  };

  

  // פורמט תאריך לתצוגה
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>טוען פרטי תרגיל...</p>
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <p>{error || 'שגיאה לא ידועה'}</p>
          <button onClick={() => navigate('/exercises')} className={styles.backButton}>
            חזרה לרשימת התרגילים
          </button>
        </div>
      </div>
    );
  }

  const difficultyStarsCount = getDifficultyStars(exercise.difficulty);

  return (
    <div className={styles.container}>
      {/* הודעת הצלחה */}
      {showSuccessMessage && (
        <div className={styles.successMessage}>
          <FaCheckCircle className={styles.successIcon} />
          <span>{successMessage}</span>
        </div>
      )}
      
      <div className={styles.exerciseHeader}>
        <button onClick={() => navigate(-1)} className={styles.backLink}>
          <FaArrowRight className={styles.backIcon} /> חזרה
        </button>

        <h1>{exercise.name}</h1>
        
        <div className={styles.headerActions}>
          <button 
            className={styles.actionButton} 
            onClick={toggleFavorite}
            aria-label={isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}
          >
            {isFavorite ? <FaBookmark className={styles.actionIcon} /> : <FaRegBookmark className={styles.actionIcon} />}
          </button>
          
          <button 
            className={styles.actionButton} 
            onClick={shareExercise}
            aria-label="שתף תרגיל"
          >
            <FaShareAlt className={styles.actionIcon} />
          </button>
          
        
        </div>
        
        <div className={styles.difficulty}>
          {[...Array(3)].map((_, i) => (
            i < difficultyStarsCount 
              ? <FaStar key={i} className={styles.starFilled} />
              : <FaRegStar key={i} className={styles.starEmpty} />
          ))}
          <span className={styles.difficultyText}>
            רמת קושי: {translateDifficulty(exercise.difficulty)}
          </span>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.mediaSection}>
          {exercise.image ? (
            <div className={styles.imageContainer}>
              <img src={exercise.image} alt={exercise.name} className={styles.exerciseImage} />
              
              {exercise.videoUrl ? (
                <button 
                  className={styles.playButton}
                  onClick={() => setIsVideoOpen(true)}
                >
                  <FaPlayCircle className={styles.playIcon} />
                  <span>צפה בהדגמת וידאו</span>
                </button>
              ) : (
                <div className={styles.noVideoMessage}>
                  <FaExclamationTriangle className={styles.warningIcon} />
                  <span>אין סרטון זמין לתרגיל זה</span>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.imagePlaceholder}>
              <FaDumbbell className={styles.placeholderIcon} />
            </div>
          )}
          
          {isVideoOpen && videoUrl && (
            <div className={styles.videoModal} onClick={() => setIsVideoOpen(false)}>
              <div 
                className={styles.videoContainer} 
                onClick={(e) => e.stopPropagation()}
                ref={videoRef}
              >
                <button 
                  className={styles.closeVideoButton}
                  onClick={() => setIsVideoOpen(false)}
                >
                  <FaTimes />
                </button>
                
                <iframe
                  src={videoUrl}
                  title={`הדגמת ${exercise.name}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className={styles.videoFrame}
                ></iframe>
              </div>
            </div>
          )}
          
          <div className={styles.quickInfo}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>קבוצת שרירים עיקרית:</span>
              <span className={styles.detailValue}>{exercise.muscleGroup}</span>
            </div>
            
            {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>שרירים משניים:</span>
                <span className={styles.detailValue}>{exercise.secondaryMuscles.join(', ')}</span>
              </div>
            )}
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>ציוד נדרש:</span>
              <span className={styles.detailValue}>
                {translateEquipment(exercise.equipment)}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.tabsContainer}>
            <button 
              className={`${styles.tabButton} ${selectedTab === 'instructions' ? styles.activeTab : ''}`}
              onClick={() => setSelectedTab('instructions')}
            >
              הוראות
            </button>
            <button 
              className={`${styles.tabButton} ${selectedTab === 'tips' ? styles.activeTab : ''}`}
              onClick={() => setSelectedTab('tips')}
            >
              טיפים
            </button>
            <button 
              className={`${styles.tabButton} ${selectedTab === 'training' ? styles.activeTab : ''}`}
              onClick={() => setSelectedTab('training')}
            >
              המלצות אימון
            </button>
            {userProfile && (
              <button 
                className={`${styles.tabButton} ${selectedTab === 'history' ? styles.activeTab : ''}`}
                onClick={() => setSelectedTab('history')}
              >
                היסטוריה
              </button>
            )}
          </div>
          
          <div className={styles.tabContent}>
            {selectedTab === 'instructions' && (
              <div className={styles.instructionsTab}>
                <h2>הוראות ביצוע</h2>
                <p className={styles.instructions}>{exercise.instructions}</p>
                <p className={styles.description}>{exercise.description}</p>
              </div>
            )}
            
            {selectedTab === 'tips' && (
              <div className={styles.tipsTab}>
                <div className={styles.benefitsSection}>
                  <h2>יתרונות התרגיל</h2>
                  <ul className={styles.benefitsList}>
                    {exercise.benefits.map((benefit, idx) => (
                      <li key={idx} className={styles.benefitItem}>
                        <FaCheckCircle className={styles.benefitIcon} />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className={styles.mistakesSection}>
                  <h2>טעויות נפוצות</h2>
                  <ul className={styles.mistakesList}>
                    {exercise.common_mistakes.map((mistake, idx) => (
                      <li key={idx} className={styles.mistakeItem}>
                        <FaExclamationTriangle className={styles.mistakeIcon} />
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className={styles.generalTips}>
                  <h2>טיפים לביצוע נכון</h2>
                  <ul>
                    <li>שמור על נשימה מסודרת - שאיפה בנקודת המתיחה, נשיפה במאמץ</li>
                    <li>הקפד על יציבה נכונה לאורך כל התרגיל</li>
                    <li>התחל במשקל קל והגדל בהדרגה</li>
                    <li>אם אתה חש כאב (לא אי-נוחות), הפסק מיד</li>
                    <li>שמור על תנועה מבוקרת לאורך כל התרגיל</li>
                  </ul>
                </div>
              </div>
            )}
            
            {selectedTab === 'training' && (
              <div className={styles.trainingTab}>
                <h2>המלצות אימון</h2>
                
                <div className={styles.trainingRecommendations}>
                  <div className={styles.recommendationCard}>
                    <h3>למתחילים</h3>
                    <p><strong>סטים:</strong> 2-3</p>
                    <p><strong>חזרות:</strong> 8-10</p>
                    <p><strong>מנוחה:</strong> 60-90 שניות בין סטים</p>
                    <p><strong>תדירות:</strong> 1-2 פעמים בשבוע</p>
                    <div className={styles.additionalTip}>
                      <FaInfoCircle className={styles.tipIcon} />
                      <p>התחל עם משקל קל ותנועה איטית יותר</p>
                    </div>
                  </div>
                  
                  <div className={styles.recommendationCard}>
                    <h3>לרמה בינונית</h3>
                    <p><strong>סטים:</strong> 3-4</p>
                    <p><strong>חזרות:</strong> 10-12</p>
                    <p><strong>מנוחה:</strong> 45-60 שניות בין סטים</p>
                    <p><strong>תדירות:</strong> 2-3 פעמים בשבוע</p>
                    <div className={styles.additionalTip}>
                      <FaInfoCircle className={styles.tipIcon} />
                      <p>התמקד בטכניקה ובטווח תנועה מלא</p>
                    </div>
                  </div>
                  
                  <div className={styles.recommendationCard}>
                    <h3>למתקדמים</h3>
                    <p><strong>סטים:</strong> 4-5</p>
                    <p><strong>חזרות:</strong> 8-15 (תלוי במטרה)</p>
                    <p><strong>מנוחה:</strong> 30-60 שניות בין סטים</p>
                    <p><strong>תדירות:</strong> 2-4 פעמים בשבוע</p>
                    <div className={styles.additionalTip}>
                      <FaInfoCircle className={styles.tipIcon} />
                      <p>שקול להוסיף וריאציות או משקל נוסף</p>
                    </div>
                  </div>
                </div>
                
                <div className={styles.progressionTips}>
                  <h3>עצות להתקדמות</h3>
                  <ul>
                    <li>הגדל בהדרגה את מספר החזרות (עד 15)</li>
                    <li>הוסף סט נוסף כשאתה מרגיש מוכן</li>
                    <li>הפחת את זמני המנוחה בהדרגה</li>
                    <li>הוסף משקל או התנגדות (אם רלוונטי)</li>
                    <li>נסה וריאציות מאתגרות יותר של התרגיל</li>
                  </ul>
                </div>
              </div>
            )}
            
            {selectedTab === 'history' && (
              <div className={styles.historyTab}>
                <h2>היסטוריית אימונים עם תרגיל זה</h2>
                
                {exerciseHistory.length > 0 ? (
                  <div className={styles.historyList}>
                    {exerciseHistory.map((workout, idx) => (
                      <div key={idx} className={styles.historyItem}>
                        <Link to={`/workouts/${workout.workout_id}`} className={styles.historyLink}>
                          <div className={styles.historyItemContent}>
                            <span className={styles.workoutName}>{workout.workout_name}</span>
                            <span className={styles.workoutDate}>{formatDate(workout.workout_date)}</span>
                            <span className={styles.workoutDuration}>{workout.duration_minutes} דקות</span>
                          </div>
                          <FaArrowRight className={styles.historyArrow} />
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noHistory}>
                    <FaHistory className={styles.noHistoryIcon} />
                    <p>עדיין לא השתמשת בתרגיל זה באימונים שלך.</p>
                
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {relatedExercises.length > 0 && (
        <div className={styles.relatedSection}>
          <h2>תרגילים דומים שעשויים לעניין אותך</h2>
          
          <div className={styles.relatedCards}>
            {relatedExercises.map(related => (
              <div 
                key={related.id} 
                className={styles.relatedCard}
                onClick={() => handleRelatedExerciseClick(related.id)}
              >
                <div className={styles.relatedImageContainer}>
                  {related.image ? (
                    <img 
                      src={related.image} 
                      alt={related.name} 
                      className={styles.relatedImage} 
                    />
                  ) : (
                    <div className={styles.relatedImagePlaceholder}>
                      <FaDumbbell />
                    </div>
                  )}
                </div>
                <div className={styles.relatedInfo}>
                  <h3>{related.name}</h3>
                  <p>{related.description}</p>
                  <div className={styles.relatedDifficulty}>
                    {[...Array(getDifficultyStars(related.difficulty))].map((_, i) => (
                      <FaStar key={i} className={styles.relatedStar} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* הוספת כפתורי פעולה בחלק התחתון של הדף */}
      <div className={styles.bottomActions}>
     
        <Link 
          to="/exercises" 
          className={styles.bottomActionButton}
        >
          <FaDumbbell className={styles.bottomActionIcon} />
          לספריית התרגילים
        </Link>
      </div>
    </div>
  );
}


export default ExerciseDetail;