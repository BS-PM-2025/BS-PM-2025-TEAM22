import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import styles from "./styles/WorkoutDetailPage.module.css";
import {
  FaArrowRight,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaDumbbell,
  FaChartLine,
  FaSave,
  FaSpinner,
  FaTrash,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
  FaInfoCircle,
  FaClock,
} from "react-icons/fa";

function EditWorkoutPage() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // מצבי טופס - בדיוק לפי מבנה הטבלה
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [facilityName, setFacilityName] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [workoutType, setWorkoutType] = useState("mixed");
  const [difficulty, setDifficulty] = useState("all");
  const [isPublic, setIsPublic] = useState(true);

  // מצבי תצוגה
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isWorkoutPast, setIsWorkoutPast] = useState(false);
  const [creatorId, setCreatorId] = useState(null);

  // טעינת פרטי האימון
  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      if (!userProfile) return;

      setLoading(true);
      try {
        console.log("טוען פרטי אימון לעריכה:", workoutId);

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

        console.log("נתוני האימון הנטענים:", workoutData);
        console.log("יוצר האימון:", workoutData.creator_id);
        console.log("משתמש נוכחי:", userProfile.user_id);

        // שמירת מזהה היוצר לשימוש בהמשך
        setCreatorId(workoutData.creator_id);

        // בדיקה אם המשתמש הוא יוצר האימון
        const userIsCreator = workoutData.creator_id === userProfile.user_id;
        console.log("האם המשתמש הוא יוצר האימון:", userIsCreator);

        if (!userIsCreator) {
          setError("אין לך הרשאות לערוך אימון זה");
          setIsCreator(false);
          setLoading(false);
          return;
        }

        setIsCreator(true);

        // מילוי הטופס בנתונים
        setTitle(workoutData.title || "");
        setDescription(workoutData.description || "");

        // עיצוב התאריך והשעה לפורמט המתאים ל-input מסוג datetime-local
        if (workoutData.start_time) {
          const date = new Date(workoutData.start_time);
          // יצירת מחרוזת בפורמט YYYY-MM-DDTHH:MM
          const formattedDate = date.toISOString().slice(0, 16);
          setStartTime(formattedDate);
        }

        // טיפול בערכים מספריים - וידוא שהם לא NaN
        const duration =
          typeof workoutData.duration_minutes === "number"
            ? workoutData.duration_minutes
            : 60;
        setDurationMinutes(duration);

        const maxPart =
          typeof workoutData.max_participants === "number"
            ? workoutData.max_participants
            : 10;
        setMaxParticipants(maxPart);

        setFacilityName(workoutData.facility_name || "");
        setWorkoutType(workoutData.workout_type || "mixed");
        setDifficulty(workoutData.difficulty || "all");
        setIsPublic(workoutData.is_public === true);

        // בדיקה אם האימון כבר התקיים
        const now = new Date();
        const workoutDate = new Date(workoutData.start_time);
        const isPast = now > workoutDate;
        setIsWorkoutPast(isPast);

        if (isPast) {
          setError("שים לב: האימון כבר התקיים אך ניתן לערוך את פרטיו");
        }
      } catch (err) {
        console.error("שגיאה בטעינת פרטי האימון:", err);
        setError("שגיאה בטעינת פרטי האימון");
      } finally {
        setLoading(false);
        setIsDirty(false);
      }
    };

    fetchWorkoutDetails();
  }, [workoutId, userProfile]);

  // פונקציות עזר לטיפול בשינויים בשדות מספריים
  const handleDurationChange = (e) => {
    const val = parseInt(e.target.value);
    setDurationMinutes(isNaN(val) ? 60 : val);
  };

  const handleMaxParticipantsChange = (e) => {
    const val = parseInt(e.target.value);
    setMaxParticipants(isNaN(val) ? 10 : val);
  };

  // מעקב אחרי שינויים בטופס
  useEffect(() => {
    if (loading) return;
    setIsDirty(true);
  }, [
    title,
    description,
    startTime,
    durationMinutes,
    facilityName,
    maxParticipants,
    workoutType,
    difficulty,
    isPublic,
    loading,
  ]);

  // טיימר להודעות הצלחה
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // חזרה לדף הקודם
  const goBack = () => {
    if (isDirty) {
      if (
        window.confirm("יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לצאת?")
      ) {
        navigate(`/group-workouts/${workoutId}`);
      }
    } else {
      navigate(`/group-workouts/${workoutId}`);
    }
  };

  // שמירת האימון
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isCreator) {
      setError("אין לך הרשאות לערוך אימון זה");
      return;
    }

    if (!title.trim()) {
      setError("יש להזין כותרת לאימון");
      return;
    }

    if (!startTime) {
      setError("יש לבחור תאריך ושעה");
      return;
    }

    if (new Date(startTime) < new Date() && !isWorkoutPast) {
      if (!window.confirm("האימון שהגדרת כבר עבר. האם להמשיך בכל זאת?")) {
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);

      // וידוא שהערכים המספריים תקינים
      const validDuration = isNaN(durationMinutes) ? 60 : durationMinutes;
      const validMaxParticipants = isNaN(maxParticipants)
        ? 10
        : maxParticipants;

      const updatedWorkout = {
        title,
        description,
        start_time: new Date(startTime).toISOString(),
        duration_minutes: validDuration,
        facility_name: facilityName,
        max_participants: validMaxParticipants,
        workout_type: workoutType,
        difficulty,
        is_public: isPublic,
      };

      console.log("שולח לעדכון:", updatedWorkout);
      console.log("מזהה אימון:", workoutId);
      console.log("מזהה משתמש:", userProfile.user_id);
      console.log("מזהה יוצר האימון:", creatorId);

      // נסה לעדכן בשלוש דרכים שונות כדי למצוא מה עובד

      // 1. עדכון עם select - להחזרת נתונים
      console.log("מנסה עדכון עם select:");
      const { data: updateData1, error: updateError1 } = await supabase
        .from("group_workouts")
        .update(updatedWorkout)
        .eq("id", workoutId)
        .select();

      console.log("תוצאת עדכון 1:", updateData1, updateError1);

      if (updateError1) {
        console.error("שגיאה בעדכון 1:", updateError1);
      }

      // 2. עדכון עם תנאי creator_id
      console.log("מנסה עדכון עם תנאי creator_id:");
      const { data: updateData2, error: updateError2 } = await supabase
        .from("group_workouts")
        .update(updatedWorkout)
        .eq("id", workoutId)
        .eq("creator_id", userProfile.user_id);

      console.log("תוצאת עדכון 2:", updateData2, updateError2);

      if (updateError2) {
        console.error("שגיאה בעדכון 2:", updateError2);
      }

      // 3. עדכון פשוט לפי id בלבד
      console.log("מנסה עדכון פשוט לפי id:");
      const { data: updateData3, error: updateError3 } = await supabase
        .from("group_workouts")
        .update(updatedWorkout)
        .eq("id", workoutId);

      console.log("תוצאת עדכון 3:", updateData3, updateError3);

      if (updateError3) {
        console.error("שגיאה בעדכון 3:", updateError3);
        throw updateError3;
      }

      // בדיקה מיד אחרי העדכון האם הנתונים השתנו
      const { data: checkData, error: checkError } = await supabase
        .from("group_workouts")
        .select("*")
        .eq("id", workoutId)
        .single();

      if (checkError) {
        console.error("שגיאה בבדיקה אחרי עדכון:", checkError);
      } else {
        console.log("נתוני אימון אחרי עדכון:", checkData);
        console.log("האם הכותרת עודכנה:", checkData.title === title);
      }

      setSuccess("האימון עודכן בהצלחה!");
      setIsDirty(false);

      // חזרה לדף האימון לאחר עיכוב קצר
      setTimeout(() => {
        navigate(`/group-workouts/${workoutId}`);
      }, 1500);
    } catch (err) {
      console.error("שגיאה בשמירת האימון:", err);
      setError(err.message || "אירעה שגיאה בשמירת האימון");
    } finally {
      setSaving(false);
    }
  };

  // מחיקת האימון
  const handleDeleteWorkout = async () => {
    if (!isCreator) {
      setError("אין לך הרשאות למחוק אימון זה");
      return;
    }

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      // מחיקת כל המשתתפים ברישום לאימון
      const { error: participantsError } = await supabase
        .from("group_participants")
        .delete()
        .eq("workout_id", workoutId);

      if (participantsError) {
        console.error("שגיאה במחיקת משתתפים:", participantsError);
      }

      // מחיקת הודעות הצ'אט של האימון (אם יש)
      const { error: messagesError } = await supabase
        .from("group_chat")
        .delete()
        .eq("workout_id", workoutId);

      if (messagesError) {
        console.error("שגיאה במחיקת הודעות צ'אט:", messagesError);
      }

      // לבסוף, מחיקת האימון עצמו
      const { error } = await supabase
        .from("group_workouts")
        .delete()
        .eq("id", workoutId)
        .eq("creator_id", userProfile.user_id);

      if (error) {
        throw error;
      }

      setSuccess("האימון נמחק בהצלחה!");

      // חזרה לדף האימונים הראשי לאחר עיכוב קצר
      setTimeout(() => {
        navigate("/group-workouts");
      }, 1500);
    } catch (err) {
      console.error("שגיאה במחיקת האימון:", err);
      setError(err.message || "אירעה שגיאה במחיקת האימון");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
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

  // תצוגת טעינה
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.loadingSpinner || styles.loadingIcon} />
        <p>טוען פרטי אימון...</p>
      </div>
    );
  }

  // תצוגת שגיאת הרשאות
  if (!isCreator && !loading) {
    return (
      <div className={styles.errorContainer}>
        <FaExclamationTriangle className={styles.errorIcon} />
        <h2>אין הרשאה</h2>
        <p>אין לך הרשאות לערוך אימון זה.</p>
        <button
          className={styles.backButton}
          onClick={() => navigate(`/group-workouts/${workoutId}`)}
        >
          <FaArrowRight className={styles.backIcon} /> חזרה לפרטי האימון
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={goBack}
          aria-label="חזרה"
        >
          <FaArrowRight className={styles.backIcon} /> חזרה לפרטי האימון
        </button>
        <h1>עריכת אימון</h1>
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

      {/* טופס עריכה */}
      <div className={styles.editFormContainer || styles.workoutHeader}>
        <form onSubmit={handleSubmit} className={styles.editForm}>
          <div className={styles.formGroup}>
            <label htmlFor="title">כותרת האימון *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="הזן כותרת לאימון"
              required
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">תיאור האימון</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="הזן תיאור מפורט של האימון, כולל מה להביא, למי מתאים וכו'"
              rows={5}
              className={styles.formTextarea}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="startTime">
                <FaCalendarAlt className={styles.formIcon} /> תאריך ושעה *
              </label>
              <input
                type="datetime-local"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className={styles.formInput}
              />
              {startTime && (
                <div className={styles.datePreview}>
                  <FaInfoCircle /> {formatDate(startTime)}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="durationMinutes">
                <FaClock className={styles.formIcon} /> משך (בדקות) *
              </label>
              <input
                type="number"
                id="durationMinutes"
                value={durationMinutes}
                onChange={handleDurationChange}
                min={10}
                max={180}
                required
                className={styles.formInput}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="facilityName">
                <FaMapMarkerAlt className={styles.formIcon} /> שם המקום *
              </label>
              <input
                type="text"
                id="facilityName"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="לדוגמה: פארק הירקון, מתחם הכושר"
                required
                className={styles.formInput}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="maxParticipants">
                <FaUsers className={styles.formIcon} /> מספר משתתפים מקסימלי
              </label>
              <input
                type="number"
                id="maxParticipants"
                value={maxParticipants}
                onChange={handleMaxParticipantsChange}
                min={1}
                max={100}
                className={styles.formInput}
              />
              <div className={styles.inputHint}>
                השאר ריק לאימון ללא הגבלת משתתפים
              </div>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="workoutType">
                <FaDumbbell className={styles.formIcon} /> סוג האימון
              </label>
              <select
                id="workoutType"
                value={workoutType}
                onChange={(e) => setWorkoutType(e.target.value)}
                className={styles.formSelect}
              >
                <option value="mixed">משולב</option>
                <option value="strength">חיזוק</option>
                <option value="cardio">סיבולת</option>
                <option value="flexibility">גמישות</option>
                <option value="hiit">אימון אינטרוולים</option>
                <option value="yoga">יוגה</option>
                <option value="pilates">פילאטיס</option>
                <option value="running">ריצה</option>
                <option value="swimming">שחייה</option>
                <option value="cycling">רכיבה על אופניים</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="difficulty">
                <FaChartLine className={styles.formIcon} /> רמת קושי
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className={styles.formSelect}
              >
                <option value="all">כל הרמות</option>
                <option value="beginner">מתחילים</option>
                <option value="intermediate">בינוני</option>
                <option value="advanced">מתקדם</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="isPublic">הצג אימון ברשימה הציבורית</label>
              <div className={styles.formCheckbox || styles.switchContainer}>
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className={styles.formCheckboxInput}
                />
                <span className={styles.checkboxLabel}>
                  {isPublic ? "כן, הצג אימון לכולם" : "לא, הסתר אימון"}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.saveButton || styles.registerButton}
              disabled={saving || !isDirty}
            >
              {saving ? (
                <>
                  <FaSpinner className={styles.loadingIcon} /> שומר שינויים...
                </>
              ) : (
                <>
                  <FaSave /> שמור שינויים
                </>
              )}
            </button>

            <button
              type="button"
              className={styles.deleteButton || styles.cancelRegistrationButton}
              onClick={handleDeleteWorkout}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <FaSpinner className={styles.loadingIcon} /> מוחק...
                </>
              ) : confirmDelete ? (
                <>
                  <FaExclamationTriangle /> לחץ שוב למחיקה
                </>
              ) : (
                <>
                  <FaTrash /> מחק אימון
                </>
              )}
            </button>

            <button
              type="button"
              className={styles.cancelButton || styles.backButton}
              onClick={goBack}
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditWorkoutPage;
