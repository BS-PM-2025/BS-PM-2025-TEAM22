import React, { useState, useEffect, useCallback } from 'react';
import { FaCrown, FaCircle, FaEllipsisV, FaUser, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import styles from './styles/ParticipantsList.module.css';

function ParticipantsList({
  workoutId,
  creatorId,
  onlineUsers = [],
  removeParticipant,
  sendMessage
}) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // פונקציה לטעינת המשתתפים - דומה לגישה בקובץ GroupWorkouts
  const fetchParticipants = useCallback(async () => {
    if (!workoutId || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('מתחיל טעינת משתתפים עבור אימון:', workoutId);
      
      // שלב 1: בדיקה שהאימון קיים
      const { data: workoutData, error: workoutError } = await supabase
        .from('group_workouts')
        .select('id, title')
        .eq('id', workoutId)
        .single();
      
      if (workoutError) {
        console.error('שגיאה בטעינת פרטי האימון:', workoutError);
        if (workoutError.code === 'PGRST116') {
          setError('האימון המבוקש לא נמצא');
        } else {
          setError(`שגיאה בטעינת פרטי האימון: ${workoutError.message}`);
        }
        setLoading(false);
        return;
      }
      
      console.log('נמצא אימון:', workoutData.title);
      
      // שלב 2: טעינת המשתתפים באימון
      const { data: participantsData, error: participantsError } = await supabase
        .from('group_participants')
        .select('id, user_id, status, registered_at')
        .eq('workout_id', workoutId);
      
      if (participantsError) {
        console.error('שגיאה בטעינת משתתפים:', participantsError);
        setError(`שגיאה בטעינת משתתפים: ${participantsError.message}`);
        setLoading(false);
        return;
      }
      
      console.log(`נמצאו ${participantsData?.length || 0} משתתפים באימון`);
      
      if (!participantsData || participantsData.length === 0) {
        setParticipants([]);
        setLoading(false);
        return;
      }
      
      // שלב 3: טעינת פרופילים של המשתתפים
      const userIds = [...new Set(participantsData.map(p => p.user_id))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, role, avatar_url')
        .in('user_id', userIds);
      
      if (profilesError) {
        console.error('שגיאה בטעינת פרופילים:', profilesError);
        setError(`שגיאה בטעינת פרופילים: ${profilesError.message}`);
        setLoading(false);
        return;
      }
      
      console.log(`נטענו ${profilesData?.length || 0} פרופילים`);
      
      // שלב 4: בניית מיפוי בין משתמשים לפרופילים
      const profileMap = {};
      (profilesData || []).forEach(profile => {
        if (profile.user_id) {
          profileMap[profile.user_id] = profile;
        }
      });

      // שלב 5: שילוב הנתונים והחזרת רשימת משתתפים מועשרת
      const enrichedParticipants = participantsData.map((participant) => {
        const profile = profileMap[participant.user_id] || {};
        
        return {
          id: participant.id,
          user_id: participant.user_id,
          name: profile.name || 'משתמש לא ידוע',
          status: participant.status,
          role: profile.role || 'user',
          avatarUrl: profile.avatar_url,
          registeredAt: participant.registered_at,
          isCurrentUser: participant.user_id === user.id,
          isCreator: participant.user_id === creatorId
        };
      });
      
      console.log('רשימת משתתפים מועשרת מוכנה:', enrichedParticipants.length);
      setParticipants(enrichedParticipants);
      
    } catch (err) {
      console.error('שגיאה כללית בטעינת משתתפים:', err);
      setError(`שגיאה בטעינת המשתתפים: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [workoutId, user, creatorId]);

  // טעינה ראשונית של הנתונים
  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // בדיקה אם משתמש מחובר
  const isOnline = (userId) => {
    return Array.isArray(onlineUsers) && onlineUsers.includes(userId);
  };

  // פונקציה לפתיחה/סגירה של תפריט אפשרויות
  const toggleMenu = (userId) => {
    setOpenMenuId(prev => prev === userId ? null : userId);
  };

  // כשיש טעינה
  if (loading) {
    return (
      <div className={styles.loadingContainer || styles.loadingSpinner}>
        <FaSpinner className={styles.spinnerIcon} />
        <p>טוען משתתפים...</p>
      </div>
    );
  }

  // כשיש שגיאה
  if (error) {
    return (
      <div className={styles.errorContainer || styles.empty}>
        <FaExclamationTriangle className={styles.errorIcon} />
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.retryButton} 
          onClick={fetchParticipants}
        >
          נסה שוב
        </button>
      </div>
    );
  }

  // כשאין משתתפים
  if (!participants || participants.length === 0) {
    return (
      <div className={styles.emptyContainer || styles.empty}>
        <FaUser className={styles.emptyIcon} />
        <p>לא נמצאו משתתפים בקבוצה זו</p>
      </div>
    );
  }

  // תצוגה רגילה - עם משתתפים
  return (
    <div className={styles.participantsList}>
      <h3 className={styles.listTitle}>
        <FaUser className={styles.titleIcon} />
        רשימת משתתפים ({participants.length})
      </h3>
      
      <div className={styles.list}>
        {participants.map((participant) => (
          <div
            key={participant.id}
            className={`${styles.participant} 
                      ${participant.isCreator ? styles.creator : ''} 
                      ${participant.isCurrentUser ? styles.currentUser : ''}`}
          >
            <div className={styles.userInfo}>
              {participant.avatarUrl ? (
                <img 
                  src={participant.avatarUrl} 
                  alt={participant.name} 
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {participant.name.charAt(0)}
                </div>
              )}
              
              <div className={styles.userDetails}>
                <span className={styles.name}>
                  {participant.name}
                  {participant.isCurrentUser && " (אני)"}
                </span>
                
                <span className={styles.joinedAt}>
                  הצטרף: {new Date(participant.registeredAt).toLocaleDateString('he-IL')}
                </span>
              </div>
              
              <div className={styles.status}>
                {participant.isCreator && (
                  <FaCrown className={styles.creatorIcon} title="מארגן" />
                )}
                
                <FaCircle
                  className={isOnline(participant.user_id) ? styles.onlineDot : styles.offlineDot}
                  title={isOnline(participant.user_id) ? "מחובר" : "לא מחובר"}
                />
              </div>
            </div>

            {!participant.isCurrentUser && (
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => toggleMenu(participant.user_id)}
                  className={styles.actionMenuButton}
                  aria-label="אפשרויות"
                >
                  <FaEllipsisV />
                </button>

                {openMenuId === participant.user_id && (
                  <div className={styles.actionMenu}>
                    <div
                      className={styles.actionMenuItem}
                      onClick={() => {
                        sendMessage(participant.user_id);
                        setOpenMenuId(null);
                      }}
                    >
                      שלח הודעה
                    </div>

                    {user?.id === creatorId && (
                      <div
                        className={styles.actionMenuItem}
                        onClick={() => {
                          removeParticipant(participant.user_id);
                          setOpenMenuId(null);
                        }}
                      >
                        הסר משתתף
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ParticipantsList;