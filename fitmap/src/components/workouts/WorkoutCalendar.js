// src/components/workouts/WorkoutCalendar.js
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/he"; // תמיכה בעברית
import { supabase } from "../../utils/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import {
  FaExclamationTriangle,
  FaPlus,
  FaInfoCircle,
  FaCalendar,
  FaCalendarWeek,
  FaCalendarDay,
  FaDownload,
  FaChartBar,
  FaFilter,
} from "react-icons/fa";
import AddWorkoutForm from "./AddWorkoutForm";
import WorkoutHistoryItem from "./WorkoutHistoryItem";
import WorkoutStatistics from "./WorkoutStatistics"; // קומפוננטה חדשה לסטטיסטיקות
import "react-big-calendar/lib/css/react-big-calendar.css";
import styles from "./styles/WorkoutCalendar.module.css";

// מגדיר את הלוקליזציה לעברית
moment.locale("he");
const localizer = momentLocalizer(moment);

/**
 * קומפוננטת לוח שנה לתצוגת אימונים לפי תאריכים - גרסה משודרגת
 */
function WorkoutCalendar() {
  const { user, userProfile } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewType, setViewType] = useState("month"); // 'month', 'week', 'day'
  const [showStatistics, setShowStatistics] = useState(false);
  const [filterWorkoutType, setFilterWorkoutType] = useState("all"); // מסנן חדש לסוג אימון
  const [isMobile, setIsMobile] = useState(false);

  // בדיקת גודל מסך להתאמה למובייל
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  // טעינת אימונים מ-Supabase
  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("user_workouts")
          .select("*")
          .eq("user_id", user.id)
          .order("workout_date", { ascending: false });

        if (error) {
          throw error;
        }

        // המרת האימונים לפורמט מתאים ללוח שנה
        const formattedWorkouts = data.map((workout) => ({
          id: workout.id,
          title: workout.workout_name,
          start: new Date(workout.workout_date),
          end: new Date(workout.workout_date),
          workout: workout, // שמירת כל המידע המקורי
          allDay: true, // אימונים מוצגים כאירועים יומיים מלאים
          workout_type: workout.workout_type, // שומר את סוג האימון לעיצוב
        }));

        setWorkouts(formattedWorkouts);
      } catch (err) {
        console.error("שגיאה בטעינת אימונים:", err.message);
        setError("לא ניתן היה לטעון את האימונים. אנא נסה שוב מאוחר יותר.");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [user]);

  // סינון אימונים לפי סוג (עם שימוש ב-useMemo לביצועים)
  const filteredWorkouts = useMemo(() => {
    if (filterWorkoutType === "all") {
      return workouts;
    }
    return workouts.filter(
      (workout) => workout.workout_type === filterWorkoutType
    );
  }, [workouts, filterWorkoutType]);

  // פונקציה לטיפול באימון שנבחר בלוח השנה
  const handleSelectEvent = useCallback((event) => {
    setSelectedWorkout(event.workout);
    setShowStatistics(false);

    // הודעה קולית לקורא מסך
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const announcement = `${event.title} `;
      const utterance = new SpeechSynthesisUtterance(announcement);
      utterance.lang = "he-IL";
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // פונקציה לטיפול בבחירת תאריך ריק בלוח השנה
  const handleSelectSlot = useCallback(({ start }) => {
    const formattedDate = moment(start).format("YYYY-MM-DD");
    setSelectedDate(formattedDate);
    setShowAddForm(true);
    setShowStatistics(false);

    // הודעה קולית לקורא מסך
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const announcement = `נבחר תאריך ${moment(start).format(
        "DD/MM/YYYY"
      )}         `;
      const utterance = new SpeechSynthesisUtterance(announcement);
      utterance.lang = "he-IL";
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // פונקציה לטיפול בשינוי תצוגת הלוח
  const handleViewChange = useCallback((view) => {
    setViewType(view);

    // עדכון לקוראי מסך
    const viewAnnouncement = document.getElementById("view-announcement");
    if (viewAnnouncement) {
      const viewNames = {
        month: "תצוגת חודש",
        week: "תצוגת שבוע",
        day: "תצוגת יום",
      };
      viewAnnouncement.textContent = `עברת ל${viewNames[view]}`;
    }
  }, []);

  // הוספת אימון חדש
  const addWorkout = async (newWorkout) => {
    try {
      // הוספה לרשימת האימונים המקומית
      const formattedWorkout = {
        id: newWorkout.id,
        title: newWorkout.workout_name,
        start: new Date(newWorkout.workout_date),
        end: new Date(newWorkout.workout_date),
        workout: newWorkout,
        allDay: true,
        workout_type: newWorkout.workout_type,
      };

      setWorkouts([formattedWorkout, ...workouts]);
      setShowAddForm(false);
      setSelectedDate(null);

      // עדכון לקוראי מסך
      const addAnnouncement = document.getElementById("add-announcement");
      if (addAnnouncement) {
        addAnnouncement.textContent = `נוסף אימון: ${
          newWorkout.workout_name
        } בתאריך ${moment(newWorkout.workout_date).format("DD/MM/YYYY")}`;
      }
    } catch (error) {
      console.error("שגיאה בהוספת אימון ללוח השנה:", error.message);
      setError("לא ניתן היה להוסיף את האימון ללוח השנה");
    }
  };

  // מחיקת אימון
  const deleteWorkout = async (workoutId) => {
    try {
      // מחיקה מ-Supabase
      const { error } = await supabase
        .from("user_workouts")
        .delete()
        .eq("id", workoutId);

      if (error) {
        throw error;
      }

      // עדכון הסטייט המקומי
      const deletedWorkout = workouts.find((w) => w.id === workoutId);
      const workoutName = deletedWorkout ? deletedWorkout.title : "";

      setWorkouts(workouts.filter((workout) => workout.id !== workoutId));
      setSelectedWorkout(null);

      // עדכון לקוראי מסך
      const deleteAnnouncement = document.getElementById("delete-announcement");
      if (deleteAnnouncement) {
        deleteAnnouncement.textContent = `האימון ${workoutName} נמחק בהצלחה`;
      }
    } catch (error) {
      console.error("שגיאה במחיקת אימון:", error.message);
      setError("לא ניתן היה למחוק את האימון");
    }
  };

  // פונקציה חדשה לגרירה ושחרור אימונים (שינוי תאריך)
  const moveWorkout = async ({ event, start, end }) => {
    try {
      const { id } = event;
      const updatedDate = moment(start).format("YYYY-MM-DD");

      // עדכון ב-Supabase
      const { error } = await supabase
        .from("user_workouts")
        .update({ workout_date: updatedDate })
        .eq("id", event.workout.id);

      if (error) throw error;

      // עדכון בסטייט המקומי
      setWorkouts((prevWorkouts) =>
        prevWorkouts.map((workout) =>
          workout.id === id
            ? {
                ...workout,
                start: new Date(start),
                end: new Date(end),
                workout: { ...workout.workout, workout_date: updatedDate },
              }
            : workout
        )
      );

      // עדכון לקוראי מסך
      const moveAnnouncement = document.getElementById("move-announcement");
      if (moveAnnouncement) {
        moveAnnouncement.textContent = `האימון ${
          event.title
        } הועבר לתאריך ${moment(start).format("DD/MM/YYYY")}`;
      }
    } catch (error) {
      console.error("שגיאה בעדכון תאריך האימון:", error.message);
      setError("לא ניתן היה לעדכן את תאריך האימון");
    }
  };

  // פונקציה לייצוא אימונים כקובץ CSV
  const exportToCSV = () => {
    try {
      // הכנת נתונים לייצוא
      const exportData = workouts.map((workout) => ({
        שם_אימון: workout.title,
        תאריך: moment(workout.start).format("DD/MM/YYYY"),
        סוג_אימון: translateWorkoutType(workout.workout_type),
        משך: workout.workout.duration || "",
        תיאור: workout.workout.description || "",
      }));

      // יצירת תוכן ה-CSV
      const headers = Object.keys(exportData[0]).join(",");
      const csvContent = [
        headers,
        ...exportData.map((row) => Object.values(row).join(",")),
      ].join("\n");

      // יצירת קובץ להורדה
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `אימונים_${moment().format("DD-MM-YYYY")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // הודעה לקוראי מסך
      const exportAnnouncement = document.getElementById("export-announcement");
      if (exportAnnouncement) {
        exportAnnouncement.textContent = `הנתונים יוצאו בהצלחה לקובץ CSV`;
      }
    } catch (error) {
      console.error("שגיאה בייצוא הנתונים:", error.message);
      setError("לא ניתן היה לייצא את נתוני האימונים");
    }
  };

  // פונקציית עזר לתרגום סוגי אימונים לעברית
  const translateWorkoutType = (type) => {
    const translations = {
      strength: "אימון חיזוק",
      cardio: "אימון סיבולת",
      flexibility: "אימון גמישות",
      mixed: "אימון משולב",
    };
    return translations[type] || type;
  };

  // התאמת לוח השנה לעברית ולכיוון RTL
  const messages = {
    today: "היום",
    previous: "הקודם",
    next: "הבא",
    month: "חודש",
    week: "שבוע",
    day: "יום",
    agenda: "סדר יום",
    date: "תאריך",
    time: "שעה",
    event: "אירוע",
    allDay: "כל היום",
    noEventsInRange: "אין אימונים בטווח הזמן שנבחר",
  };

  // קומפוננטה מותאמת אישית לתצוגת אירוע
  const CustomEvent = ({ event }) => {
    // מחלץ את סוג האימון מהאירוע
    const workoutType = event.workout_type || "";

    // שם רמז להצגה ב-tooltip
    const workoutTypesHebrew = {
      strength: "אימון חיזוק",
      cardio: "אימון סיבולת",
      flexibility: "אימון גמישות",
      mixed: "אימון משולב",
    };

    const tooltipText = workoutTypesHebrew[workoutType] || "";

    return (
      <div
        title={tooltipText}
        className={`${styles.calendarEvent} ${styles[`event${workoutType}`]}`}
        data-workout-type={workoutType}
      >
        <span>{event.title}</span>
      </div>
    );
  };

  // עיצוב מותאם אישית לאימונים בלוח
  const eventStyleGetter = (event) => {
    let backgroundColor = "#3b82f6"; // כחול רגיל
    let borderColor = "#2563eb";

    // צבע לפי סוג האימון
    if (event.workout && event.workout_type) {
      switch (event.workout_type) {
        case "strength":
          backgroundColor = "#9747FF"; // סגול - אימוני כוח
          borderColor = "#7e22ce";
          break;
        case "cardio":
          backgroundColor = "#f97316"; // כתום - אימוני סיבולת
          borderColor = "#ea580c";
          break;
        case "flexibility":
          backgroundColor = "#10b981"; // ירוק - אימוני גמישות
          borderColor = "#059669";
          break;
        case "mixed":
          backgroundColor = "#06b6d4"; // טורקיז - אימונים משולבים
          borderColor = "#0891b2";
          break;
        default:
          break;
      }
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderRadius: "6px",
        border: `2px solid ${borderColor}`,
        opacity: 0.9,
        color: "white",
        display: "block",
        fontWeight: "bold",
        textAlign: "right",
        padding: "4px 8px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        cursor: "pointer",
      },
    };
  };

  // פונקציה להתאמת פורמט תאריכים
  const formats = {
    dateFormat: "D",
    dayFormat: "ddd D/M",
    monthHeaderFormat: "MMMM YYYY",
    dayHeaderFormat: "dddd D MMMM",
    dayRangeHeaderFormat: ({ start, end }) =>
      `${moment(start).format("D")} - ${moment(end).format("D MMMM YYYY")}`,
  };

  // רכיב נגישות להודעות עדכון
  const AccessibilityAnnouncements = () => (
    <div className="sr-only" aria-live="polite">
      <div id="view-announcement"></div>
      <div id="add-announcement"></div>
      <div id="delete-announcement"></div>
      <div id="move-announcement"></div>
      <div id="export-announcement"></div>
    </div>
  );

  // מקרא צבעים משופר
  const WorkoutLegend = () => (
    <div className={styles.legendContainer} aria-label="מקרא סוגי אימונים">
      <div
        className={styles.legendItem}
        onClick={() => setFilterWorkoutType("all")}
      >
        <span
          className={`${styles.legendColor} ${
            filterWorkoutType === "all" ? styles.activeFilter : ""
          }`}
          style={{ backgroundColor: "#3b82f6" }}
          aria-hidden="true"
        ></span>
        <span>הכל</span>
      </div>
      <div
        className={styles.legendItem}
        onClick={() => setFilterWorkoutType("strength")}
      >
        <span
          className={`${styles.legendColor} ${
            filterWorkoutType === "strength" ? styles.activeFilter : ""
          }`}
          style={{ backgroundColor: "#9747FF" }}
          aria-hidden="true"
        ></span>
        <span>חיזוק</span>
      </div>
      <div
        className={styles.legendItem}
        onClick={() => setFilterWorkoutType("cardio")}
      >
        <span
          className={`${styles.legendColor} ${
            filterWorkoutType === "cardio" ? styles.activeFilter : ""
          }`}
          style={{ backgroundColor: "#f97316" }}
          aria-hidden="true"
        ></span>
        <span>סיבולת</span>
      </div>
      <div
        className={styles.legendItem}
        onClick={() => setFilterWorkoutType("flexibility")}
      >
        <span
          className={`${styles.legendColor} ${
            filterWorkoutType === "flexibility" ? styles.activeFilter : ""
          }`}
          style={{ backgroundColor: "#10b981" }}
          aria-hidden="true"
        ></span>
        <span>גמישות</span>
      </div>
      <div
        className={styles.legendItem}
        onClick={() => setFilterWorkoutType("mixed")}
      >
        <span
          className={`${styles.legendColor} ${
            filterWorkoutType === "mixed" ? styles.activeFilter : ""
          }`}
          style={{ backgroundColor: "#06b6d4" }}
          aria-hidden="true"
        ></span>
        <span>משולב</span>
      </div>
    </div>
  );

  // מידע על המסנן הפעיל
  const FilterInfo = () =>
    filterWorkoutType !== "all" && (
      <div className={styles.filterInfo}>
        <FaFilter /> מוצגים אימונים מסוג:{" "}
        {translateWorkoutType(filterWorkoutType)}
        <button
          className={styles.clearFilterButton}
          onClick={() => setFilterWorkoutType("all")}
          aria-label="נקה סינון"
        >
          נקה סינון
        </button>
      </div>
    );

  if (loading) {
    return (
      <div
        className={styles.loadingContainer}
        aria-busy="true"
        aria-live="polite"
      >
        <div className={styles.spinner} role="status"></div>
        <p>טוען נתוני אימונים...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.noUserContainer} role="alert">
        <FaExclamationTriangle
          className={styles.warningIcon}
          aria-hidden="true"
        />
        <h2>יש להתחבר כדי לצפות בלוח אימונים</h2>
        <p>אנא התחבר או הירשם כדי להשתמש בלוח האימונים</p>
      </div>
    );
  }

  return (
    <div className={styles.calendarContainer}>
      <AccessibilityAnnouncements />

      <div className={styles.headerSection}>
        <h2>לוח אימונים</h2>
        <div className={styles.headerButtons}>
          <button
            className={`${styles.actionButton} ${styles.statsButton}`}
            onClick={() => {
              setShowStatistics(!showStatistics);
              setSelectedWorkout(null);
            }}
            aria-label="הצג סטטיסטיקות אימונים"
            aria-pressed={showStatistics}
          >
            <FaChartBar aria-hidden="true" />{" "}
            {showStatistics ? "הסתר סטטיסטיקות" : "סטטיסטיקות"}
          </button>

          <button
            className={`${styles.actionButton} ${styles.exportButton}`}
            onClick={exportToCSV}
            aria-label="ייצא נתוני אימונים"
            disabled={workouts.length === 0}
          >
            <FaDownload aria-hidden="true" /> ייצוא
          </button>

          <button
            className={styles.addButton}
            onClick={() => {
              setSelectedDate(moment().format("YYYY-MM-DD"));
              setShowAddForm(true);
              setShowStatistics(false);
            }}
            aria-label="הוסף אימון חדש"
          >
            <FaPlus aria-hidden="true" /> הוסף אימון חדש
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage} role="alert">
          <FaExclamationTriangle aria-hidden="true" />
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className={styles.errorCloseButton}
            aria-label="סגור הודעת שגיאה"
          >
            סגור
          </button>
        </div>
      )}

      {/* תצוגת סטטיסטיקות */}
      {showStatistics && workouts.length > 0 && (
        <div className={styles.statisticsContainer}>
          <WorkoutStatistics workouts={workouts} />
        </div>
      )}

      <div className={styles.viewAndFilter}>
        <div
          className={styles.viewToggle}
          role="radiogroup"
          aria-label="בחירת תצוגת לוח שנה"
        >
          <button
            className={`${styles.viewButton} ${
              viewType === "month" ? styles.activeView : ""
            }`}
            onClick={() => handleViewChange("month")}
            aria-pressed={viewType === "month"}
            aria-label="תצוגת חודש"
          >
            <FaCalendar aria-hidden="true" className={styles.viewIcon} />{" "}
            {!isMobile && "חודש"}
          </button>
          <button
            className={`${styles.viewButton} ${
              viewType === "week" ? styles.activeView : ""
            }`}
            onClick={() => handleViewChange("week")}
            aria-pressed={viewType === "week"}
            aria-label="תצוגת שבוע"
          >
            <FaCalendarWeek aria-hidden="true" className={styles.viewIcon} />{" "}
            {!isMobile && "שבוע"}
          </button>
          <button
            className={`${styles.viewButton} ${
              viewType === "day" ? styles.activeView : ""
            }`}
            onClick={() => handleViewChange("day")}
            aria-pressed={viewType === "day"}
            aria-label="תצוגת יום"
          >
            <FaCalendarDay aria-hidden="true" className={styles.viewIcon} />{" "}
            {!isMobile && "יום"}
          </button>
        </div>

        <WorkoutLegend />
      </div>

      <FilterInfo />

      <div
        className={styles.calendarWrapper}
        aria-label={`לוח אימונים בתצוגת ${
          viewType === "month" ? "חודש" : viewType === "week" ? "שבוע" : "יום"
        }`}
      >
        <Calendar
          localizer={localizer}
          events={filteredWorkouts}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600, direction: "rtl" }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          onEventDrop={moveWorkout} // פונקציית גרירה חדשה
          draggableAccessor={() => true} // מאפשר גרירה של כל האימונים
          selectable={true}
          view={viewType}
          onView={handleViewChange}
          messages={messages}
          eventPropGetter={eventStyleGetter}
          components={{
            event: CustomEvent,
          }}
          popup={true}
          rtl={true}
          culture="he"
          formats={formats}
          // שיפור נגישות
          aria-label="לוח אימונים"
          longPressThreshold={250}
          tooltipAccessor={(event) =>
            `${event.title} בתאריך ${moment(event.start).format("DD/MM/YYYY")}`
          }
        />
      </div>

      {workouts.length === 0 && !loading && (
        <div className={styles.emptyState} role="status">
          <FaInfoCircle className={styles.infoIcon} aria-hidden="true" />
          <p>עדיין אין אימונים בלוח השנה שלך</p>
          <p>לחץ על "הוסף אימון חדש" או לחץ על תאריך בלוח כדי להוסיף אימון</p>
        </div>
      )}

      {filteredWorkouts.length === 0 && workouts.length > 0 && (
        <div className={styles.emptyFilterState} role="status">
          <FaInfoCircle className={styles.infoIcon} aria-hidden="true" />
          <p>אין אימונים מהסוג שנבחר</p>
          <button
            className={styles.clearFilterButton}
            onClick={() => setFilterWorkoutType("all")}
          >
            הצג את כל האימונים
          </button>
        </div>
      )}

      {selectedWorkout && (
        <div
          className={styles.workoutDetails}
          aria-labelledby="workout-details-title"
          role="dialog"
        >
          <div className={styles.workoutDetailsHeader}>
            <h3 id="workout-details-title">פרטי האימון</h3>
            <button
              className={styles.closeButton}
              onClick={() => setSelectedWorkout(null)}
              aria-label="סגור פרטי אימון"
            >
              סגור
            </button>
          </div>
          <WorkoutHistoryItem
            workout={selectedWorkout}
            onDelete={() => deleteWorkout(selectedWorkout.id)}
          />
        </div>
      )}

      {showAddForm && (
        <div
          className={styles.addFormOverlay}
          role="dialog"
          aria-labelledby="add-workout-title"
        >
          <AddWorkoutForm
            onSubmit={addWorkout}
            onCancel={() => {
              setShowAddForm(false);
              setSelectedDate(null);
            }}
            userProfile={userProfile}
            initialDate={selectedDate}
          />
        </div>
      )}
    </div>
  );
}

export default WorkoutCalendar;
