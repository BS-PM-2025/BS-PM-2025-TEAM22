import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import ParticipantsList from "./ParticipantsList";
import GroupChat from "./GroupChat";
import styles from "./styles/WorkoutDetailPage.module.css";
import {
  FaArrowRight,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaDumbbell,
  FaChartLine,
  FaComments,
  FaClock,
  FaShareAlt,
  FaWhatsapp,
  FaTelegram,
  FaClipboard,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaUserPlus,
  FaUserMinus,
  FaTimes,
  FaAngleDown,
  FaAngleUp,
  FaInfoCircle,
  FaDirections,
  FaEdit,
} from "react-icons/fa";

function WorkoutDetailPage() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const chatSectionRef = useRef(null);

  const [workout, setWorkout] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareSuccess, setShareSuccess] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [remainingSpots, setRemainingSpots] = useState(0);
  const [isWorkoutPast, setIsWorkoutPast] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // עטיפת fetchWorkoutDetails ב-useCallback כדי למנוע יצירה מחדש בכל רינדור
  const fetchWorkoutDetails = useCallback(async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      console.log("טוען פרטי אימון:", workoutId);

      // שלב 1: פרטי האימון עצמו
      const { data: workoutData, error: workoutError } = await supabase
        .from("group_workouts")
        .select("*")
        .eq("id", workoutId)
        .single();

      if (workoutError || !workoutData) {
        setError("האימון לא נמצא או שאירעה שגיאה בטעינת הנתונים");
        setLoading(false);
        return;
      }

      console.log("נטען אימון:", workoutData.title);
      setWorkout(workoutData);

      // בדיקה אם האימון כבר התקיים
      const now = new Date();
      const workoutDate = new Date(workoutData.start_time);
      setIsWorkoutPast(now > workoutDate);

      // חישוב מקומות התחלתי
      if (workoutData.max_participants) {
        setRemainingSpots(workoutData.max_participants);
      }

      // שלב 2: טעינת המשתתפים הרשומים לאימון
      const { data: participantsData, error: participantsError } =
        await supabase
          .from("group_participants")
          .select("user_id, status, registered_at")
          .eq("workout_id", workoutId);

      if (participantsError) {
        console.error("שגיאה בטעינת משתתפים:", participantsError.message);
        setParticipants([]);
      } else {
        console.log(`נמצאו ${participantsData?.length || 0} משתתפים`);

        // שלב 3: טעינת פרטי הפרופיל לכל משתתף
        const formatted = await Promise.all(
          participantsData.map(async (p) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("name, avatar_url")
              .eq("id", p.user_id) // שמירה על דפוס העבודה הקיים
              .single();
            return {
              ...p,
              name: profile?.name || "משתמש",
              avatar_url: profile?.avatar_url || null,
            };
          })
        );

        setParticipants(formatted);

        // בדיקה אם המשתמש הנוכחי רשום לאימון
        setIsRegistered(
          formatted.some((p) => p.user_id === userProfile.user_id)
        );

        // עדכון מספר המקומות הנותרים
        if (workoutData.max_participants) {
          setRemainingSpots(workoutData.max_participants - formatted.length);
        }

        setOnlineUsers([userProfile.user_id]);
      }

      // בדיקה אם המשתמש הנוכחי הוא יוצר האימון
      setIsCreator(workoutData.creator_id === userProfile.user_id);
    } catch (err) {
      console.error("שגיאה בטעינת פרטי האימון:", err);
      setError("שגיאה בטעינת פרטי האימון");
    } finally {
      setLoading(false);
    }
  }, [workoutId, userProfile]);

  // טעינה ראשונית
  useEffect(() => {
    if (userProfile) fetchWorkoutDetails();
  }, [workoutId, userProfile, fetchWorkoutDetails]);

  // טיימר להודעות הצלחה
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // טיימר להודעות שיתוף
  useEffect(() => {
    if (shareSuccess) {
      const timer = setTimeout(() => {
        setShareSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [shareSuccess]);

  // חזרה לדף הקודם
  const goBack = () => {
    navigate("/group-workouts");
  };

  // הרשמה לאימון
  const handleRegister = async () => {
    console.log("נלחץ!");

    if (!userProfile) return navigate("/auth");

    // בדיקה שהאימון לא התקיים עדיין
    if (isWorkoutPast) {
      setError("לא ניתן להירשם לאימון שכבר התקיים");
      return;
    }

    // בדיקת מקומות פנויים
    if (
      workout.max_participants &&
      participants.length >= workout.max_participants
    ) {
      setError("האימון מלא, לא ניתן להירשם");
      return;
    }

    try {
      setIsRegistering(true);
      setError(null);

      const { error } = await supabase.from("group_participants").insert({
        workout_id: workout.id,
        user_id: userProfile.user_id,
        status: "registered",
        registered_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === "23505") {
          // קוד שגיאה לרשומה כפולה
          throw new Error("כבר נרשמת לאימון זה");
        }
        throw error;
      }

      setSuccess("נרשמת לאימון בהצלחה!");
      await fetchWorkoutDetails();
    } catch (err) {
      console.error("שגיאה בהרשמה:", err);
      setError(err.message || "אירעה שגיאה בהרשמה לאימון");
    } finally {
      setIsRegistering(false);
    }
  };

  // ביטול הרשמה
  const handleCancelRegistration = async () => {
    if (isCreator) {
      setError("מארגן האימון לא יכול לבטל את ההרשמה");
      return;
    }

    // בדיקה שהאימון לא התקיים עדיין
    if (isWorkoutPast) {
      setError("לא ניתן לבטל הרשמה לאימון שכבר התקיים");
      return;
    }

    try {
      setIsCanceling(true);
      setError(null);

      const { error } = await supabase
        .from("group_participants")
        .delete()
        .eq("workout_id", workout.id)
        .eq("user_id", userProfile.user_id);

      if (error) {
        throw error;
      }

      setSuccess("הרשמתך בוטלה בהצלחה");
      await fetchWorkoutDetails();
    } catch (err) {
      console.error("שגיאה בביטול הרשמה:", err);
      setError("אירעה שגיאה בביטול ההרשמה");
    } finally {
      setIsCanceling(false);
    }
  };

  // שיתוף האימון
  const handleShare = (platform) => {
    if (!workout) return;

    const text = `הצטרפו אליי לאימון "${workout.title}" בתאריך ${formatDate(
      workout.start_time
    )} ב${workout.facility_name}`;
    const url = window.location.href;

    try {
      if (platform === "whatsapp") {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`
        );
        setShareSuccess("האימון שותף בהצלחה דרך WhatsApp");
      } else if (platform === "telegram") {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(
            url
          )}&text=${encodeURIComponent(text)}`
        );
        setShareSuccess("האימון שותף בהצלחה דרך Telegram");
      } else if (platform === "copy") {
        navigator.clipboard.writeText(text + " " + url);
        setShareSuccess("הקישור הועתק ללוח");
      }
    } catch (error) {
      console.error("שגיאה בשיתוף:", error);
      setError("אירעה שגיאה בשיתוף האימון");
    }

    setShowShareOptions(false);
  };

  // עריכת אימון (למנהל אימון)
  const handleEditWorkout = () => {
    if (!isCreator) return;
    navigate(`/group-workouts/edit/${workout.id}`);
  };

  // מחיקת משתתף (למנהל אימון)
  const handleRemoveParticipant = async (participantId) => {
    if (!isCreator) return;

    try {
      const { error } = await supabase
        .from("group_participants")
        .delete()
        .eq("workout_id", workout.id)
        .eq("user_id", participantId);

      if (error) throw error;

      setSuccess("המשתתף הוסר בהצלחה");
      await fetchWorkoutDetails();
    } catch (err) {
      console.error("שגיאה בהסרת משתתף:", err);
      setError("אירעה שגיאה בהסרת המשתתף");
    }
  };

  // שליחת הודעה פרטית למשתתף
  const handleSendMessage = (participantId) => {
    // פונקציה לדוגמה - במערכת אמיתית זה יפתח צ'אט פרטי
    console.log("שולח הודעה למשתתף:", participantId);
    // פתיחת הצ'אט הקבוצתי
    setShowChat(true);
    setTimeout(() => {
      if (chatSectionRef.current) {
        chatSectionRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // פורמט תאריך
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("he-IL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // תרגום סוג אימון
  const translateWorkoutType = (type) => {
    const translations = {
      strength: "חיזוק",
      cardio: "סיבולת",
      flexibility: "גמישות",
      mixed: "משולב",
      hiit: "אימון אינטרוולים",
      yoga: "יוגה",
      pilates: "פילאטיס",
      running: "ריצה",
      swimming: "שחייה",
      cycling: "רכיבה על אופניים",
    };
    return translations[type] || type;
  };

  // תרגום רמת קושי
  const translateDifficulty = (difficulty) => {
    const translations = {
      beginner: "מתחיל",
      intermediate: "בינוני",
      advanced: "מתקדם",
      all: "כל הרמות",
    };
    return translations[difficulty] || difficulty;
  };

  // חישוב זמן שנותר עד לאימון
  const getTimeRemaining = () => {
    if (!workout) return null;

    const now = new Date();
    const workoutDate = new Date(workout.start_time);

    if (now > workoutDate) {
      return null; // האימון כבר התקיים
    }

    const diff = workoutDate - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `עוד ${days} ימים ו-${hours} שעות`;
    } else if (hours > 0) {
      return `עוד ${hours} שעות`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `עוד ${minutes} דקות`;
    }
  };

  const timeRemaining = getTimeRemaining();

  // תצוגת טעינה
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.loadingSpinner || styles.loadingIcon} />
        <p>טוען פרטי אימון...</p>
      </div>
    );
  }

  // תצוגת שגיאה
  if (error && !workout) {
    return (
      <div className={styles.errorContainer}>
        <FaExclamationTriangle className={styles.errorIcon} />
        <h2>שגיאה בטעינת פרטי האימון</h2>
        <p>{error}</p>
        <button className={styles.backButton} onClick={goBack}>
          חזרה לרשימת האימונים
        </button>
      </div>
    );
  }

  // תצוגת אימון לא נמצא
  if (!workout) {
    return (
      <div className={styles.notFoundContainer}>
        <h2>האימון המבוקש לא נמצא</h2>
        <button className={styles.backButton} onClick={goBack}>
          חזרה לרשימת האימונים
        </button>
      </div>
    );
  }

  // תצוגה ראשית - כאשר יש אימון
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={goBack}
          aria-label="חזרה"
        >
          <FaArrowRight className={styles.backIcon} /> חזרה לרשימת האימונים
        </button>

        <div className={styles.headerActions || styles.shareContainer}>
          {/* תפריט אפשרויות למארגן */}
          {isCreator && (
            <button
              className={styles.editButton || styles.actionButton}
              onClick={handleEditWorkout}
              aria-label="ערוך אימון"
            >
              <FaEdit /> ערוך אימון
            </button>
          )}

          {/* אפשרויות שיתוף */}
          <div className={styles.shareContainer}>
            <button
              className={styles.shareButton}
              onClick={() => setShowShareOptions(!showShareOptions)}
              aria-label="שיתוף"
            >
              <FaShareAlt /> שתף
            </button>

            {showShareOptions && (
              <div className={styles.shareMenu}>
                <button
                  onClick={() => handleShare("whatsapp")}
                  aria-label="שתף בוואטסאפ"
                >
                  <FaWhatsapp className={styles.whatsappIcon} /> WhatsApp
                </button>
                <button
                  onClick={() => handleShare("telegram")}
                  aria-label="שתף בטלגרם"
                >
                  <FaTelegram className={styles.telegramIcon} /> Telegram
                </button>
                <button
                  onClick={() => handleShare("copy")}
                  aria-label="העתק קישור"
                >
                  <FaClipboard className={styles.clipboardIcon} /> העתק קישור
                </button>
              </div>
            )}

            {shareSuccess && (
              <div className={styles.shareSuccess}>
                <FaCheckCircle /> {shareSuccess}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* הודעות הצלחה ושגיאה */}
      {success && (
        <div className={styles.successMessage} role="alert">
          <FaCheckCircle className={styles.successIcon} />
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage} role="alert">
          <FaExclamationTriangle className={styles.errorIcon} />
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className={styles.errorCloseButton}
            aria-label="סגור הודעת שגיאה"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* כותרת ופרטי האימון */}
      <div className={styles.workoutHeader}>
        <div className={styles.workoutHeaderContent}>
          <h1>{workout.title}</h1>

          {/* אם האימון כבר התקיים */}
          {isWorkoutPast && (
            <div className={styles.pastWorkoutBadge || styles.warningBadge}>
              <FaExclamationTriangle /> האימון כבר התקיים
            </div>
          )}

          {/* הזמן שנותר לאימון */}
          {timeRemaining && (
            <div className={styles.timeRemaining}>
              <FaClock className={styles.timeIcon} />
              <span>{timeRemaining}</span>
            </div>
          )}

          {/* פרטי האימון */}
          <div className={styles.workoutDetails}>
            <div className={styles.workoutDetail}>
              <FaCalendarAlt className={styles.detailIcon} />
              <span>{formatDate(workout.start_time)}</span>
            </div>

            <div className={styles.workoutDetail}>
              <FaMapMarkerAlt className={styles.detailIcon} />
              <span>
                {workout.facility_name}
                {workout.facility_address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      workout.facility_address
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.directionsLink || styles.mapLink}
                  >
                    <FaDirections /> הוראות הגעה
                  </a>
                )}
              </span>
            </div>

            <div className={styles.workoutDetail}>
              <FaUsers className={styles.detailIcon} />
              <span>
                {participants.length} /{" "}
                {workout.max_participants || "ללא הגבלה"}
                {workout.max_participants && remainingSpots > 0 && (
                  <span className={styles.remainingSpots}>
                    (נותרו {remainingSpots} מקומות)
                  </span>
                )}
              </span>
            </div>

            <div className={styles.workoutDetail}>
              <FaDumbbell className={styles.detailIcon} />
              <span>{translateWorkoutType(workout.workout_type)}</span>
            </div>

            <div className={styles.workoutDetail}>
              <FaChartLine className={styles.detailIcon} />
              <span>{translateDifficulty(workout.difficulty)}</span>
            </div>
          </div>
        </div>

        {/* כרטיס הרשמה */}
        <div className={styles.registrationCard}>
          <h3 className={styles.registrationTitle}>
            {isRegistered ? "נרשמת לאימון זה" : "הרשמה לאימון"}
          </h3>

          <div className={styles.registrationStatus}>
            {isWorkoutPast ? (
              <div className={styles.pastBadge || styles.fullBadge}>
                <FaExclamationTriangle className={styles.fullIcon} />
                <span>האימון כבר התקיים</span>
              </div>
            ) : isRegistered ? (
              <div className={styles.registeredBadge}>
                <FaCheckCircle className={styles.registeredIcon} />
                <span>רשום לאימון</span>
              </div>
            ) : workout.max_participants &&
              participants.length >= workout.max_participants ? (
              <div className={styles.fullBadge}>
                <FaExclamationTriangle className={styles.fullIcon} />
                <span>האימון מלא</span>
              </div>
            ) : (
              <div className={styles.spotsAvailable}>
                <span>
                  {workout.max_participants
                    ? `נותרו ${remainingSpots} מקומות`
                    : "מקומות פתוחים לרישום"}
                </span>
              </div>
            )}
          </div>

          {/* כפתורי פעולה */}
          <div className={styles.registrationActions}>
            {isWorkoutPast ? (
              <div className={styles.pastWorkoutMessage || styles.infoMessage}>
                <FaInfoCircle /> לא ניתן להירשם לאימון שכבר התקיים
              </div>
            ) : isRegistered ? (
              <button
                className={styles.cancelRegistrationButton}
                onClick={handleCancelRegistration}
                disabled={isCreator || isCanceling}
                aria-label="ביטול הרשמה"
              >
                {isCanceling ? (
                  <>
                    <FaSpinner className={styles.loadingIcon} /> מבטל...
                  </>
                ) : (
                  <>
                    <FaUserMinus />{" "}
                    {isCreator ? "לא ניתן לבטל (מארגן)" : "בטל הרשמה"}
                  </>
                )}
              </button>
            ) : (
              <button
                className={styles.registerButton}
                onClick={handleRegister}
                aria-label="הירשם לאימון"
              >
                {isRegistering ? (
                  <>
                    <FaSpinner className={styles.loadingIcon} /> נרשם...
                  </>
                ) : (
                  <>
                    <FaUserPlus /> הירשם לאימון
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* תוכן האימון */}
      <div className={styles.workoutContent}>
        {/* תיאור האימון */}
        <div className={styles.descriptionSection}>
          <h2>תיאור האימון</h2>
          <div className={styles.descriptionContent}>
            <p>{workout.description || "לא צוין תיאור לאימון זה."}</p>
          </div>
        </div>

        {/* רשימת משתתפים */}
        <div className={styles.participantsSection}>
          <div
            className={styles.participantsHeader}
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <h2>משתתפים ({participants.length})</h2>
            {showParticipants ? (
              <FaAngleUp className={styles.toggleIcon} />
            ) : (
              <FaAngleDown className={styles.toggleIcon} />
            )}
          </div>

          {showParticipants && (
            <ParticipantsList
              workoutId={workoutId}
              creatorId={workout.creator_id}
              onlineUsers={onlineUsers}
              removeParticipant={handleRemoveParticipant}
              sendMessage={handleSendMessage}
            />
          )}
        </div>
      </div>

      {/* צ'אט קבוצתי */}
      <div className={styles.chatSection}>
        <button
          className={`${styles.chatToggleButton} ${
            showChat ? styles.activeChatButton : ""
          }`}
          onClick={() => setShowChat(!showChat)}
          disabled={!isRegistered && !isCreator}
          aria-label={showChat ? "הסתר צ'אט" : "הצג צ'אט"}
        >
          <FaComments className={styles.chatIcon} />
          {showChat ? "הסתר צ'אט קבוצתי" : "צ'אט קבוצתי"}
          {!isRegistered && !isCreator && (
            <span className={styles.chatRestriction}>(למשתתפים בלבד)</span>
          )}
        </button>

        <div ref={chatSectionRef}>
          {showChat && (isRegistered || isCreator) && (
            <div className={styles.chatContainer}>
              <GroupChat
                workoutId={workout.id}
                userId={userProfile.user_id}
                userName={userProfile.name}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkoutDetailPage;
