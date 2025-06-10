// src/components/challenges/ChallengeDetail.js
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import LeaderboardSection from "./LeaderboardSection";
import UserProgressBar from "./UserProgressBar";
import AchievementBadge from "./AchievementBadge";
import {
  FaTrophy,
  FaUsers,
  FaCalendarAlt,
  FaMedal,
  FaChartLine,
  FaArrowLeft,
  FaShareAlt,
  FaSignInAlt,
  FaExclamationTriangle,
  FaSpinner,
  FaInfoCircle,
  FaBell,
  FaCheckCircle,
  FaLock,
 
  FaClipboard,
  FaFacebook,
  FaWhatsapp,
  FaTelegram,
  FaRegClock,
  FaRunning,
  FaCheck,
  FaPlus,
  FaStar,
  FaHistory,
  FaDumbbell,
  FaFire
} from "react-icons/fa";
import styles from "./styles/ChallengeDetail.module.css";

function ChallengeDetail() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const progressInputRef = useRef(null);

  const [challenge, setChallenge] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [progressInput, setProgressInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("about"); // about, achievements, leaderboard
  const [newAchievements, setNewAchievements] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shareSuccess, setShareSuccess] = useState("");
  const [, setVisibleSection] = useState(null);
  const sectionRefs = useRef({});

  useEffect(() => {
    fetchChallengeDetails();
    window.scrollTo(0, 0);
    
    // Intersection Observer to add nice scrolling effects
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSection(entry.target.id);
            entry.target.classList.add(styles.sectionVisible);
          }
        });
      },
      { threshold: 0.2 }
    );

    // Observe all section refs
    setTimeout(() => {
      Object.values(sectionRefs.current).forEach((ref) => {
        if (ref) observer.observe(ref);
      });
    }, 500);

    return () => {
      observer.disconnect();
    };
  }, [challengeId, userProfile]);

  // Handle success message fade out
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Handle share success fade out
  useEffect(() => {
    if (shareSuccess) {
      const timer = setTimeout(() => {
        setShareSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [shareSuccess]);

  // Handle confetti animation
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const fetchChallengeDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // שליפת פרטי האתגר
      const { data: challengeData, error: challengeError } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();

      if (challengeError || !challengeData) {
        console.error("שגיאה בטעינת אתגר:", challengeError?.message);
        setError("האתגר לא נמצא או שגיאה בטעינה");
        return;
      }

      // שליפת הישגים
      const { data: achievementsData, error: achievementsError } =
        await supabase
          .from("achievements")
          .select("*")
          .eq("challenge_id", challengeId)
          .order("required_value", { ascending: true });

      if (achievementsError) {
        console.error("שגיאה בטעינת הישגים:", achievementsError?.message);
        setError("לא ניתן לטעון את הישגים של האתגר");
        return;
      }

      // שילוב הישגים באתגר
      challengeData.achievements = achievementsData || [];
      setChallenge(challengeData);

      // שליפת משתתפים כולל שם ותמונה
      const { data: leaderboard, error: leaderboardError } = await supabase
        .from("user_challenge_progress")
        .select(
          `
          user_id,
          current_value,
          profiles (
            name,
            avatar_url
          )
        `
        )
        .eq("challenge_id", challengeId)
        .order("current_value", { ascending: false });

      if (leaderboardError) {
        console.error("שגיאה בלוח המובילים:", leaderboardError?.message);
        setError("שגיאה בטעינת לוח המובילים");
        return;
      }

      // המרה ידנית של current_value ל-value
      const formattedParticipants = leaderboard.map((p) => ({
        user_id: p.user_id,
        value: p.current_value,
        name: p.profiles?.name || "משתמש",
        avatar_url: p.profiles?.avatar_url || null,
      }));

      setParticipants(formattedParticipants);

      // האם המשתמש משתתף?
      if (userProfile) {
        const existing = leaderboard.find((p) => p.user_id === userProfile.id);
        if (existing) {
          setUserProgress({
            challenge_id: challengeId,
            user_id: userProfile.id,
            current_value: existing.current_value,
            hasJoined: true,
          });
        }
      }
    } catch (err) {
      console.error("שגיאה כללית בטעינה:", err);
      setError("לא ניתן לטעון את פרטי האתגר");
    } finally {
      setLoading(false);
    }
  };

  // הצטרפות לאתגר
  const handleJoinChallenge = async () => {
    if (!userProfile) {
      navigate("/auth");
      return;
    }

    try {
      setIsJoining(true);
      
      const now = new Date();
      const startDate = new Date(challenge.start_date);
      const endDate = new Date(challenge.end_date);

      if (now < startDate) {
        setError("האתגר טרם התחיל");
        return;
      }

      if (now > endDate) {
        setError("האתגר כבר הסתיים");
        return;
      }

      // בדיקה אם המשתמש כבר נרשם
      const { data: existingProgress, error: checkError } = await supabase
        .from("user_challenge_progress")
        .select("id")
        .eq("user_id", userProfile.id)
        .eq("challenge_id", challenge.id)
        .maybeSingle();

      if (checkError) {
        console.error("שגיאה בבדיקת הצטרפות:", checkError.message);
        setError("לא ניתן לבדוק את מצב ההשתתפות");
        return;
      }

      if (existingProgress) {
        setError("כבר נרשמת לאתגר הזה");
        return;
      }

      // הכנסת רשומה חדשה
      const { error: insertError } = await supabase
        .from("user_challenge_progress")
        .insert({
          challenge_id: challenge.id,
          user_id: userProfile.id,
          current_value: 0,
          last_updated: new Date().toISOString(),
        });

      if (insertError) {
        console.error("שגיאה בהכנסה למסד:", insertError.message);
        setError("לא ניתן היה להצטרף לאתגר");
        return;
      }

      // עדכון participants_count באתגר
      const { error: updateError } = await supabase
        .from("challenges")
        .update({ participants_count: challenge.participants_count + 1 })
        .eq("id", challenge.id);

      if (updateError) {
        console.error("שגיאה בעדכון אתגר:", updateError.message);
        setError("ההרשמה הצליחה אך לא עודכן מספר המשתתפים");
      }

      // עדכון מצב מקומי
      const newProgress = {
        challenge_id: challenge.id,
        user_id: userProfile.id,
        current_value: 0,
        last_updated: new Date().toISOString(),
        hasJoined: true,
      };
      setUserProgress(newProgress);

      const newParticipant = {
        user_id: userProfile.id,
        name: userProfile.name || "משתמש",
        avatar_url: userProfile.avatar_url || "",
        value: 0,
      };
      setParticipants((prev) => [...prev, newParticipant]);

      setChallenge((prev) => ({
        ...prev,
        participants_count: prev.participants_count + 1,
      }));

      setSuccess("נרשמת בהצלחה לאתגר! אתה יכול להתחיל לעדכן את ההתקדמות שלך כעת.");
      
      // Focus on the progress input field after joining
      setTimeout(() => {
        if (progressInputRef.current) {
          progressInputRef.current.focus();
        }
      }, 1000);
      
    } catch (error) {
      console.error("שגיאה כללית בהצטרפות:", error);
      setError("אירעה שגיאה בלתי צפויה");
    } finally {
      setIsJoining(false);
    }
  };

  // שיתוף האתגר
  const handleShare = (platform) => {
    if (!challenge) return;

    const shareText = `הצטרפו אליי לאתגר "${challenge.title}" באפליקציית הכושר שלנו!`;
    const shareUrl = window.location.href;

    try {
      if (platform === "whatsapp") {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`
        );
        setShareSuccess("האתגר שותף בהצלחה דרך WhatsApp");
      } else if (platform === "telegram") {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(
            shareUrl
          )}&text=${encodeURIComponent(shareText)}`
        );
        setShareSuccess("האתגר שותף בהצלחה דרך Telegram");
      } else if (platform === "facebook") {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareUrl
          )}`
        );
        setShareSuccess("האתגר שותף בהצלחה דרך Facebook");
      } else if (platform === "copy") {
        navigator.clipboard.writeText(shareText + " " + shareUrl);
        setShareSuccess("הקישור הועתק ללוח");
      }
    } catch (error) {
      console.error("שגיאה בשיתוף:", error);
      setError("אירעה שגיאה בשיתוף האתגר");
    }

    setShowShareMenu(false);
  };

  // עדכון התקדמות
  const handleUpdateProgress = async () => {
    if (!userProfile || !challenge || !progressInput) return;

    const valueToAdd = Number(progressInput);
    if (isNaN(valueToAdd) || valueToAdd <= 0) {
      setError("נא להזין מספר תקין");
      return;
    }

    try {
      setIsUpdating(true);
      
      const { data: existing, error: fetchError } = await supabase
        .from("user_challenge_progress")
        .select("id, current_value")
        .eq("challenge_id", challenge.id)
        .eq("user_id", userProfile.id)
        .single();

      if (fetchError) throw fetchError;

      const previousValue = existing.current_value;
      const updatedValue = previousValue + valueToAdd;

      const { error: updateError } = await supabase
        .from("user_challenge_progress")
        .update({
          current_value: updatedValue,
          last_updated: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) throw updateError;

      setUserProgress((prev) => ({
        ...prev,
        current_value: updatedValue,
      }));

      // Update user in participants array
      setParticipants(prev => 
        prev.map(p => 
          p.user_id === userProfile.id 
            ? { ...p, value: updatedValue } 
            : p
        )
      );

      // Check if the user unlocked new achievements
      const newUnlockedAchievements = [];
      
      if (challenge.achievements) {
        challenge.achievements.forEach(achievement => {
          // Was locked before and is now unlocked
          if (
            previousValue < achievement.required_value && 
            updatedValue >= achievement.required_value
          ) {
            newUnlockedAchievements.push(achievement);
          }
        });
      }
      
      setProgressInput("");
      
      if (newUnlockedAchievements.length > 0) {
        setNewAchievements(newUnlockedAchievements);
        setShowConfetti(true);
        setTimeout(() => {
          setActiveTab("achievements");
        }, 500);
        setSuccess(`התקדמת ב-${valueToAdd} ${getMetricName()} ופתחת ${newUnlockedAchievements.length} הישגים חדשים!`);
      } else {
        setSuccess(`התקדמות עודכנה בהצלחה! הוספת ${valueToAdd} ${getMetricName()} לסך ההתקדמות שלך.`);
      }
    } catch (err) {
      console.error("שגיאה בעדכון ההתקדמות:", err);
      setError("לא ניתן היה לעדכן את ההתקדמות");
    } finally {
      setIsUpdating(false);
    }
  };

  // פורמט תאריך לתצוגה
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  };

  // בדיקה אם האתגר פעיל
  const isActive = () => {
    if (!challenge) return false;

    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);

    return now >= startDate && now <= endDate;
  };

  // בדיקה אם האתגר עתידי
  const isFuture = () => {
    if (!challenge) return false;

    const now = new Date();
    const startDate = new Date(challenge.start_date);

    return now < startDate;
  };

  // בדיקה אם האתגר הסתיים
  const isCompleted = () => {
    if (!challenge) return false;

    const now = new Date();
    const endDate = new Date(challenge.end_date);

    return now > endDate;
  };

  // חישוב ימים שנותרו לסיום האתגר
  const getDaysRemaining = () => {
    if (!challenge || isCompleted()) return 0;

    const now = new Date();
    const endDate = new Date(challenge.end_date);

    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  // חישוב ימים שנותרו לתחילת האתגר
  const getDaysUntilStart = () => {
    if (!challenge || !isFuture()) return 0;

    const now = new Date();
    const startDate = new Date(challenge.start_date);

    const diffTime = startDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  // האם המשתמש משתתף באתגר
  const isParticipating = () => {
    return userProgress && userProgress.hasJoined;
  };

  // האם המשתמש השלים את האתגר
  const hasCompletedChallenge = () => {
    if (!isParticipating() || !challenge) return false;
    return userProgress.current_value >= challenge.target_value;
  };

  // עיצוב של מחרוזת מטריקה
  const formatMetric = (value, metric) => {
    // שימוש בפונקצית lovalString כדי לפרמט מספרים עם פסיקים
    const formattedValue = value.toLocaleString("he-IL");

    // התאמת יחידות המדידה
    switch (metric) {
      case "km":
        return `${formattedValue} ק"מ`;
      case "minutes":
        return `${formattedValue} דקות`;
      case "workouts":
        return `${formattedValue} אימונים`;
      case "steps":
        return `${formattedValue} צעדים`;
      case "calories":
        return `${formattedValue} קלוריות`;
      default:
        return `${formattedValue} ${metric}`;
    }
  };

  // קבלת שם המטריקה בעברית
  const getMetricName = () => {
    if (!challenge) return "";
    
    switch (challenge.metric) {
      case "km":
        return "ק\"מ";
      case "minutes":
        return "דקות";
      case "workouts":
        return "אימונים";
      case "steps":
        return "צעדים";
      case "calories":
        return "קלוריות";
      default:
        return challenge.metric;
    }
  };

  // קבלת אייקון למטריקה
  const getMetricIcon = () => {
    if (!challenge) return <FaTrophy />;
    
    switch (challenge.metric) {
      case "km":
        return <FaRunning />;
      case "minutes":
        return <FaRegClock />;
      case "workouts":
        return <FaDumbbell />;
      case "steps":
        return <FaRunning />;
      case "calories":
        return <FaFire />;
      default:
        return <FaTrophy />;
    }
  };

  // מידע על מצב האתגר
  const getChallengeStatusInfo = () => {
    if (isFuture()) {
      return {
        text: `מתחיל בעוד ${getDaysUntilStart()} ימים`,
        icon: <FaRegClock />,
        class: styles.futureBadge
      };
    } else if (isActive()) {
      return {
        text: `פעיל (נותרו ${getDaysRemaining()} ימים)`,
        icon: <FaRunning />,
        class: styles.activeBadge
      };
    } else if (isCompleted()) {
      return {
        text: "הסתיים",
        icon: <FaCheck />,
        class: styles.completedBadge
      };
    }
    
    return {
      text: "לא זמין",
      icon: <FaLock />,
      class: styles.unavailableBadge
    };
  };

  // הסרת התדובבות בכפתור הצטרפות
  const joinButtonText = () => {
    if (isFuture()) return "האתגר יתחיל בקרוב";
    return "הצטרף לאתגר";
  };

  // בדיקת איזה הישגים נפתחו
  const isAchievementUnlocked = (achievement) => {
    if (!isParticipating() || !userProgress) return false;
    return userProgress.current_value >= achievement.required_value;
  };

  // מידע רנדומלי מעניין על האתגר
  const getInterestingFact = () => {
    if (!challenge) return "";
    
    // כמה משתתפים כבר השלימו את האתגר
    const completedCount = participants.filter(p => p.value >= challenge.target_value).length;
    
    const facts = [
      `${(completedCount / Math.max(participants.length, 1) * 100).toFixed(1)}% מהמשתתפים כבר השלימו את האתגר`,
      `בממוצע, המשתתפים השלימו ${participants.length > 0 ? 
        (participants.reduce((sum, p) => sum + p.value, 0) / (participants.length * challenge.target_value) * 100).toFixed(1) : 0}% מהיעד`,
      `זהו אתגר ${challenge.metric === "km" ? "מרחק" : 
                 challenge.metric === "minutes" ? "זמן" : 
                 challenge.metric === "workouts" ? "אימונים" : 
                 challenge.metric === "steps" ? "צעדים" : 
                 challenge.metric === "calories" ? "קלוריות" : "יחודי"}`,
      `יעד להשלמה: ${formatMetric(challenge.target_value, challenge.metric)}`
    ];
    
    // בחירה רנדומלית של עובדה
    return facts[Math.floor(Math.random() * facts.length)];
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>טוען פרטי אתגר...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <h2>שגיאה בטעינת פרטי האתגר</h2>
          <p>{error}</p>
          <button
            className={styles.backButton}
            onClick={() => navigate("/challenges")}
          >
            חזרה לרשימת האתגרים
          </button>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className={styles.container}>
        <div className={styles.notFoundContainer}>
          <h2>האתגר המבוקש לא נמצא</h2>
          <button
            className={styles.backButton}
            onClick={() => navigate("/challenges")}
          >
            חזרה לרשימת האתגרים
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getChallengeStatusInfo();

  return (
    <div className={styles.container}>
      {showConfetti && (
        <div className={styles.confetti}>
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={i} 
              className={styles.confettiPiece}
              style={{ 
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: [
                  '#9747FF', '#f97316', '#10b981', '#06b6d4', '#3b82f6'
                ][Math.floor(Math.random() * 5)]
              }}
            />
          ))}
        </div>
      )}

      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/challenges")}
          aria-label="חזרה לרשימת האתגרים"
        >
          <FaArrowLeft /> חזרה לרשימת האתגרים
        </button>

        <div className={styles.shareContainer}>
          <button
            className={styles.shareButton}
            onClick={() => setShowShareMenu(!showShareMenu)}
            aria-label="שתף אתגר"
          >
            <FaShareAlt /> שתף
          </button>

          {showShareMenu && (
            <div className={styles.shareMenu}>
              <button onClick={() => handleShare("whatsapp")} aria-label="שתף בוואטסאפ">
                <FaWhatsapp className={styles.whatsappIcon} /> WhatsApp
              </button>
              <button onClick={() => handleShare("telegram")} aria-label="שתף בטלגרם">
                <FaTelegram className={styles.telegramIcon} /> Telegram
              </button>
              <button onClick={() => handleShare("facebook")} aria-label="שתף בפייסבוק">
                <FaFacebook className={styles.facebookIcon} /> Facebook
              </button>
              <button onClick={() => handleShare("copy")} aria-label="העתק קישור">
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
            &times;
          </button>
        </div>
      )}

      <div 
        className={styles.challengeHeader}
        ref={el => sectionRefs.current.header = el}
        id="challenge-header"
      >
        <div className={styles.challengeImage}>
          {challenge.image_url ? (
            <img src={challenge.image_url} alt={challenge.title} />
          ) : (
            <div className={styles.imagePlaceholder}>
              <FaTrophy />
            </div>
          )}

          <div className={styles.statusBadge}>
            <span className={statusInfo.class}>
              {statusInfo.icon} {statusInfo.text}
            </span>
          </div>
          
          {isParticipating() && hasCompletedChallenge() && (
            <div className={styles.completionBadge}>
              <FaCheckCircle /> השלמת את האתגר!
            </div>
          )}
        </div>

        <div className={styles.challengeInfo}>
          <h1>{challenge.title}</h1>
          
          <div className={styles.interestingFact}>
            <FaInfoCircle className={styles.factIcon} />
            <p>{getInterestingFact()}</p>
          </div>

          <div className={styles.challengeDetails}>
            <div className={styles.detailItem}>
              <FaCalendarAlt className={styles.detailIcon} />
              <span>
                {formatDate(challenge.start_date)} -{" "}
                {formatDate(challenge.end_date)}
              </span>
            </div>

            <div className={styles.detailItem}>
              <FaUsers className={styles.detailIcon} />
              <span>{challenge.participants_count} משתתפים</span>
            </div>

            {isActive() && (
              <div className={styles.detailItem}>
                <FaChartLine className={styles.detailIcon} />
                <span>נותרו {getDaysRemaining()} ימים</span>
              </div>
            )}

            {challenge.reward && (
              <div className={styles.detailItem}>
                <FaMedal className={styles.detailIcon} />
                <span>פרס: {challenge.reward}</span>
              </div>
            )}
            
            <div className={styles.targetItem}>
              {getMetricIcon()}
              <span>יעד: {formatMetric(challenge.target_value, challenge.metric)}</span>
            </div>
          </div>

          {!isCompleted() && !isParticipating() && (
            <button
              className={styles.joinButton}
              onClick={handleJoinChallenge}
              disabled={isFuture() || isJoining}
              aria-label="הצטרף לאתגר"
            >
              {isJoining ? (
                <><FaSpinner className={styles.loadingIcon} /> מצטרף...</>
              ) : (
                <><FaSignInAlt /> {joinButtonText()}</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tabButton} ${activeTab === "about" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("about")}
            aria-label="מידע על האתגר"
          >
            <FaInfoCircle /> מידע
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === "achievements" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("achievements")}
            aria-label="הישגים"
          >
            <FaStar /> הישגים
            {newAchievements.length > 0 && (
              <span className={styles.newBadge}>{newAchievements.length}</span>
            )}
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === "leaderboard" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("leaderboard")}
            aria-label="לוח מובילים"
          >
            <FaTrophy /> מובילים
          </button>
          {isParticipating() && (
            <button 
              className={`${styles.tabButton} ${activeTab === "progress" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("progress")}
              aria-label="ההתקדמות שלי"
            >
              <FaChartLine /> התקדמות
            </button>
          )}
        </div>
      </div>

      {/* User Progress Section */}
      {isParticipating() && userProgress && (activeTab === "progress" || !activeTab) && (
        <div 
          className={styles.progressSection}
          ref={el => sectionRefs.current.progress = el}
          id="progress-section"
        >
          <h2>ההתקדמות שלך</h2>
          <div className={styles.progressCard}>
            <UserProgressBar
              currentValue={userProgress.current_value}
              targetValue={challenge.target_value}
              metric={challenge.metric}
            />
            
            <div className={styles.progressStats}>
              <div className={styles.progressStat}>
                <span className={styles.statLabel}>מצב נוכחי:</span>
                <span className={styles.statValue}>{formatMetric(userProgress.current_value, challenge.metric)}</span>
              </div>
              <div className={styles.progressStat}>
                <span className={styles.statLabel}>יעד:</span>
                <span className={styles.statValue}>{formatMetric(challenge.target_value, challenge.metric)}</span>
              </div>
              <div className={styles.progressStat}>
                <span className={styles.statLabel}>נותר:</span>
                <span className={styles.statValue}>
                  {formatMetric(
                    Math.max(0, challenge.target_value - userProgress.current_value), 
                    challenge.metric
                  )}
                </span>
              </div>
            </div>

            {!isCompleted() && (
              <div className={styles.updateProgressForm}>
                <label htmlFor="progressInput" className={styles.progressInputLabel}>
                  כמה {getMetricName()} להוסיף?
                </label>
                <div className={styles.progressInputGroup}>
                  <input
                    id="progressInput"
                    type="number"
                    min="1"
                    placeholder={`למשל: 5 ${getMetricName()}`}
                    value={progressInput}
                    onChange={(e) => setProgressInput(e.target.value)}
                    className={styles.progressInput}
                    ref={progressInputRef}
                    disabled={isUpdating}
                  />
                  <button
                    onClick={handleUpdateProgress}
                    className={styles.updateProgressButton}
                    disabled={isUpdating || !progressInput}
                    aria-label="עדכן התקדמות"
                  >
                    {isUpdating ? (
                      <><FaSpinner className={styles.loadingIcon} /> מעדכן...</>
                    ) : (
                      <><FaPlus /> עדכן</>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {hasCompletedChallenge() && (
              <div className={styles.completionMessage}>
                <FaCheckCircle className={styles.completionIcon} />
                <p>כל הכבוד! השלמת את האתגר בהצלחה!</p>
              </div>
            )}
          </div>
          
          <div className={styles.progressHistory}>
            <h3><FaHistory /> היסטוריית אתגרים</h3>
            <p>כאן תוכל לראות את ההתקדמות שלך לאורך זמן</p>
          </div>
        </div>
      )}

      {/* About Section */}
      {activeTab === "about" && (
        <div 
          className={styles.descriptionSection}
          ref={el => sectionRefs.current.about = el}
          id="about-section"
        >
          <h2>אודות האתגר</h2>
          <div className={styles.descriptionCard}>
            <p className={styles.descriptionText}>{challenge.description}</p>

            <div className={styles.targetContainer}>
              <div className={styles.targetLabel}>יעד להשלמה:</div>
              <div className={styles.targetValue}>
                {formatMetric(challenge.target_value, challenge.metric)}
              </div>
            </div>

            {challenge.rules && (
              <div className={styles.rules}>
                <h3>חוקי האתגר:</h3>
                <p>{challenge.rules}</p>
              </div>
            )}
            
            <div className={styles.joinSection}>
              {!isParticipating() && !isCompleted() && (
                <button
                  className={styles.joinButtonLarge}
                  onClick={handleJoinChallenge}
                  disabled={isFuture() || isJoining}
                >
                  {isJoining ? (
                    <><FaSpinner className={styles.loadingIcon} /> מצטרף...</>
                  ) : (
                    <><FaSignInAlt /> {joinButtonText()}</>
                  )}
                </button>
              )}
              
              {isCompleted() && !isParticipating() && (
                <div className={styles.endedMessage}>
                  <FaInfoCircle className={styles.infoIcon} />
                  <p>האתגר הסתיים. לא ניתן להצטרף אליו.</p>
                </div>
              )}
              
              {isFuture() && (
                <div className={styles.comingSoonMessage}>
                  <FaBell className={styles.bellIcon} />
                  <p>האתגר יתחיל בעוד {getDaysUntilStart()} ימים. ניתן להירשם בתאריך {formatDate(challenge.start_date)}.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Achievements Section */}
      {activeTab === "achievements" && challenge.achievements && challenge.achievements.length > 0 && (
        <div 
          className={styles.achievementsSection}
          ref={el => sectionRefs.current.achievements = el}
          id="achievements-section"
        >
          <h2>הישגים ותגים</h2>
          {newAchievements.length > 0 && (
            <div className={styles.newAchievementsMessage}>
              <FaStar className={styles.starIcon} />
              <p>שחררת {newAchievements.length} הישגים חדשים!</p>
            </div>
          )}
          <div className={styles.achievementsGrid}>
            {challenge.achievements.map((achievement, index) => (
              <AchievementBadge
                key={index}
                achievement={achievement}
                isLocked={!isAchievementUnlocked(achievement)}
                isNew={newAchievements.some(a => a.id === achievement.id)}
                metric={challenge.metric}
              />
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Section */}
      {activeTab === "leaderboard" && (
        <div 
          className={styles.leaderboardSection}
          ref={el => sectionRefs.current.leaderboard = el}
          id="leaderboard-section"
        >
          <h2>לוח מובילים</h2>
          {participants.length > 0 ? (
            <LeaderboardSection
              participants={participants}
              userId={userProfile?.id}
              metric={challenge.metric}
              targetValue={challenge.target_value}
              isCollapsible={false}
            />
          ) : (
            <div className={styles.emptyLeaderboard}>
              <p>אין עדיין משתתפים באתגר זה. היה הראשון!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChallengeDetail;