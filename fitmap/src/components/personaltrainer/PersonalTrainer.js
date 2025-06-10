// src/components/workouts/PersonalTrainer.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import { fetchResponses, fallbackResponses } from "./responsesData";
import {
  FaPaperPlane,
  FaSpinner,
  FaExclamationTriangle,
  FaTimes,
  FaToggleOn,
  FaToggleOff,
  FaHistory,
  FaMicrophone,
  FaUser,
  FaRobot,
  FaDumbbell,
  FaRunning,
  FaAppleAlt,
  FaBrain,
  FaImage,
  FaDownload,
  FaShare,
  FaEllipsisH,
} from "react-icons/fa";
import styles from "./PersonalTrainer.module.css";

/**
 * מאמן אישי - רכיב המספק הדרכה וייעוץ מותאם אישית באמצעות תשובות מובנות או AI
 */
function PersonalTrainer() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [useGPT, setUseGPT] = useState(false);
  const [responses, setResponses] = useState([]);
  const [isTyping, setIsTyping] = useState(false); // אינדיקטור להקלדת המאמן
  const [selectedCoachStyle, setSelectedCoachStyle] = useState("motivating"); // סגנון מאמן ברירת מחדל
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [lastResponseType, setLastResponseType] = useState(null); // לזיהוי סוג התשובה האחרונה

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // סגנונות מאמן אפשריים
  const coachStyles = [
    { id: "motivating", name: "מעודד ותומך", icon: "🤗" },
    { id: "strict", name: "תקיף ודורש", icon: "💪" },
    { id: "professional", name: "מקצועי ועובדתי", icon: "🧠" },
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      const scrollContainer =
        messagesEndRef.current.closest(".messages-container") ||
        messagesEndRef.current.parentElement;

      if (scrollContainer) {
        const footerHeight = 60;
        const scrollPosition = messagesEndRef.current.offsetTop - footerHeight;

        scrollContainer.scrollTo({
          top: scrollPosition,
          behavior: "smooth",
        });
      } else {
        messagesEndRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });

        setTimeout(() => {
          window.scrollBy(0, -80);
        }, 100);
      }
    }
  }, [messages]);

  // טעינת התשובות מ-Supabase
  useEffect(() => {
    const loadResponses = async () => {
      try {
        setLoading(true);
        const responseData = await fetchResponses(supabase);
        setResponses(responseData);
      } catch (err) {
        console.error("שגיאה בטעינת התשובות:", err);
        setResponses(fallbackResponses);
      } finally {
        setLoading(false);
      }
    };

    loadResponses();
  }, []);

  // טעינה ראשונית והודעת פתיחה
  useEffect(() => {
    if (!userProfile || loading) {
      return;
    }

    // הוספת הודעת פתיחה מהמאמן
    const welcomeMessage = {
      id: "welcome",
      sender: "trainer",
      text: `שלום ${
        userProfile?.name || "מתאמן יקר"
      }, אני המאמן האישי הדיגיטלי שלך. אני כאן כדי לעזור לך להשיג את יעדי הכושר שלך! אני יכול לענות על שאלות, להציע תרגילים או תוכניות אימון אישיות. במה אוכל לעזור לך היום?`,
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);

    // טעינת סגנון המאמן המועדף מהפרופיל (אם קיים)
    if (userProfile?.preferred_coach_style) {
      setSelectedCoachStyle(userProfile.preferred_coach_style);
    }
  }, [userProfile, loading]);

  // שליחת הודעה ל-API של GPT
  const sendMessageToGPT = async (message, retryCount = 0) => {
    try {
      const response = await fetch("https://sfitmap.vercel.app/api/gpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          userProfile,
          coachStyle: selectedCoachStyle || "תומך ומקצועי",
        }),
      });

      // טיפול בשגיאות רשת וניסיון מחדש
      if (!response.ok) {
        // ניסיון חוזר במקרה של הגבלת קצב (rate limit)
        if (response.status === 429 && retryCount < 4) {
          // המתנה אקספוננציאלית עם ג'יטר
          const delay = (Math.pow(2, retryCount) + Math.random()) * 1000;
          await new Promise((res) => setTimeout(res, delay));
          return sendMessageToGPT(message, retryCount + 1);
        }

        throw new Error(`שגיאת API: ${response.status}`);
      }

      // פענוח התשובה
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error("❌ שגיאה בפרוקסי:", error);
      setUseGPT(false);
      return getPredefinedResponse(message); // תשובה ברירת מחדל במקרה של כישלון
    }
  };
  // תשובות מוכנות מראש לשאלות שכיחות
  const getPredefinedResponse = (userMessage) => {
    // המרה לאותיות קטנות לצורך חיפוש ללא תלות ברישיות
    const message = userMessage.toLowerCase();

    // בדיקה אם המערך של התשובות נטען בהצלחה
    if (responses.length === 0) {
      return `מצטער, לא הצלחתי לטעון את מאגר התשובות. אנסה לעזור לך בהמשך.`;
    }

    // חיפוש תשובה מתאימה
    for (const item of responses) {
      // בדיקה אם לפחות מילת מפתח אחת מופיעה בהודעה
      const matchCount = item.keywords.filter((keyword) =>
        message.includes(keyword)
      ).length;
      if (matchCount >= 1) {
        // בדיקת סוג התשובה לפי תוכן
        if (
          item.response.includes("תוכנית") ||
          item.response.includes("אימון")
        ) {
          setLastResponseType("workout");
        } else if (
          item.response.includes("תזונה") ||
          item.response.includes("לאכול")
        ) {
          setLastResponseType("nutrition");
        } else {
          setLastResponseType("general");
        }

        // התאמת התשובה לסגנון המאמן הנבחר
        let styledResponse = item.response;

        if (selectedCoachStyle === "motivating") {
          styledResponse += "\n\nאתה יכול לעשות את זה! אני מאמין בך! 💪✨";
        } else if (selectedCoachStyle === "strict") {
          styledResponse +=
            "\n\nאין תירוצים! תתחיל עכשיו ותתמיד. אין דרך אחרת להצליח. 🔥💯";
        } else if (selectedCoachStyle === "professional") {
          styledResponse +=
            "\n\nהמחקרים מראים שעקביות ומדידה הם המפתחות להתקדמות אמיתית. 📊📈";
        }

        return styledResponse;
      }
    }

    // תשובת ברירת מחדל אם לא נמצאה התאמה
    setLastResponseType("general");
    return `תודה על השאלה! כמאמן כושר אישי, אני שמח להציע לך ייעוץ מותאם אישית.

בהתבסס על הפרופיל שלך ורמת הכושר ${
      userProfile?.fitness_level || "הנוכחית"
    } שלך, אני ממליץ להתמקד באימונים ${
      userProfile?.preferred_workouts?.length
        ? "בסגנון " + userProfile.preferred_workouts.join(", ")
        : "מגוונים"
    }.

אשמח לענות על שאלות ספציפיות יותר בנושאי:
1. תוכניות אימון מותאמות אישית
2. תרגילים ספציפיים לקבוצות שרירים שונות
3. המלצות תזונה לשיפור ביצועים
4. טיפים לשיפור טכניקה ומניעת פציעות

אנא שאל שאלה ספציפית יותר ואשמח לעזור!`;
  };

  // שמירת השיחה בטבלת ai_conversations ב-Supabase
  const saveConversation = async (userMessage, aiResponse) => {
    try {
      if (!userProfile) {
        console.warn("לא ניתן לשמור שיחה - אין userProfile");
        return;
      }

      const conversationData = {
        user_id: userProfile.user_id || userProfile.id,
        user_message: userMessage,
        ai_response: aiResponse,
        ai_model: useGPT ? "gpt-3.5-turbo" : "fallback-responses",
        coach_style: selectedCoachStyle,
        response_type: lastResponseType,
        created_at: new Date().toISOString(),
      };

      console.log("🔄 שומר שיחה ל־Supabase:", conversationData);

      const { error } = await supabase
        .from("ai_conversations")
        .insert([conversationData]);

      if (error) {
        console.error("❌ שגיאה בשמירת השיחה:", error.message, error.details);
      } else {
        console.log("✅ השיחה נשמרה בהצלחה");
      }
    } catch (error) {
      console.error("🛑 שגיאה כללית בשמירת השיחה:", error);
    }
  };

  // הגשת שאלה/הודעה למאמן
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // הוספת ההודעה של המשתמש לצ'אט
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: newMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");
    setIsThinking(true);

    try {
      // דימוי אפקט הקלדה לפני שליפת התשובה
      setIsTyping(true);

      // דימוי השהייה קצרה לאפקט הקלדה
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let response;

      // אם אנחנו משתמשים ב-GPT, ננסה לקבל תשובה ממנו
      if (useGPT) {
        try {
          response = await sendMessageToGPT(newMessage);
        } catch (error) {
          console.log("נכשל חיבור ל-GPT, משתמש בתשובות מוכנות מראש", error);
          response = getPredefinedResponse(newMessage);
        }
      } else {
        response = getPredefinedResponse(newMessage);
      }

      setIsTyping(false);

      const trainerMessage = {
        id: `trainer-${Date.now()}`,
        sender: "trainer",
        text: response,
        timestamp: new Date().toISOString(),
        responseType: lastResponseType, // שמירת סוג התשובה
      };

      setMessages((prev) => [...prev, trainerMessage]);

      // שמירת השיחה ב-Supabase
      saveConversation(newMessage, response);

      // בדיקה האם צריך להציג אפשרויות נוספות בהמשך למה שהתקבל
      checkForFollowUpOptions(newMessage, response);
    } catch (err) {
      console.error("שגיאה בקבלת תשובה מהמאמן האישי:", err);
      setError("לא ניתן היה לקבל תשובה מהמאמן. אנא נסה שנית.");
      setIsTyping(false);

      const errorMessage = {
        id: `error-${Date.now()}`,
        sender: "trainer",
        text: "מצטער, נתקלתי בבעיה בעיבוד השאלה שלך. אנא נסה שוב או שאל שאלה אחרת.",
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  // בדיקה האם להציג אפשרויות נוספות בהתאם לשאלה ולתשובה
  const checkForFollowUpOptions = (question, response) => {
    // לדוגמה - אם התשובה הייתה על תוכנית אימון, הצע אפשרות להוריד או לשתף אותה
    if (lastResponseType === "workout") {
      const followUpMessage = {
        id: `follow-up-${Date.now()}`,
        sender: "system",
        text: "האם תרצה לקבל את התוכנית במייל, להוסיף אותה ללוח השנה או לשתף אותה?",
        timestamp: new Date().toISOString(),
        options: [
          { label: "הורד PDF", action: "download", icon: "download" },
          { label: "הוסף ללוח שנה", action: "calendar", icon: "calendar" },
          { label: "שתף", action: "share", icon: "share" },
        ],
      };

      setTimeout(() => {
        setMessages((prev) => [...prev, followUpMessage]);
      }, 1000);
    }
  };

  // טיפול בבחירת אפשרות מתוך הודעת מערכת עם אפשרויות
  const handleOptionClick = (action) => {
    switch (action) {
      case "download":
        // לוגיקה להורדת PDF
        alert("מוריד תוכנית אימון...");
        break;
      case "calendar":
        // לוגיקה להוספה ללוח שנה
        alert("מוסיף תוכנית אימון ללוח השנה...");
        break;
      case "share":
        // לוגיקה לשיתוף
        alert("פותח אפשרויות שיתוף...");
        break;
      default:
        break;
    }
  };

  // הצעות לשאלות מהירות
  const suggestions = [
    { text: "תוכנית אימון לשריפת שומן", icon: <FaRunning /> },
    { text: "תרגילים לחיזוק הגב", icon: <FaDumbbell /> },
    { text: "כמה זמן להתאמן בשבוע?", icon: <FaHistory /> },
    { text: "תזונה לפני ואחרי אימון", icon: <FaAppleAlt /> },
    { text: "איך לשפר את הסיבולת", icon: <FaRunning /> },
    { text: "התמודדות עם חוסר מוטיבציה", icon: <FaBrain /> },
  ];

  // שימוש בהצעה
  const handleSuggestionClick = (suggestion) => {
    setNewMessage(suggestion.text);
    // התמקדות בשדה הקלט אחרי בחירת הצעה
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // החלפת מצב API
  const toggleAPIMode = () => {
    setUseGPT(!useGPT);
  };

  // טיפול בהקלטת הודעה קולית (placeholder)
  const handleVoiceRecording = () => {
    alert("הקלטת הודעה קולית - יכולת זו תהיה זמינה בקרוב!");
  };

  // טיפול בבחירת סגנון מאמן
  const handleCoachStyleChange = (styleId) => {
    setSelectedCoachStyle(styleId);
    setShowStyleSelector(false);

    // שמירת העדפת סגנון המאמן בפרופיל המשתמש
    if (userProfile?.user_id) {
      supabase
        .from("profiles")
        .update({ preferred_coach_style: styleId })
        .eq("user_id", userProfile.user_id)
        .then(({ error }) => {
          if (error)
            console.error("Error saving coach style preference:", error);
        });
    }

    // הודעת אישור על שינוי הסגנון
    const styleChangedMessage = {
      id: `style-change-${Date.now()}`,
      sender: "system",
      text: `סגנון המאמן שונה ל${
        coachStyles.find((style) => style.id === styleId).name
      }. המאמן ישתמש בסגנון זה מעתה והלאה.`,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, styleChangedMessage]);
  };

  // רינדור של קומפוננטת המאמן האישי
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.spinnerIcon} />
        <p>טוען את המאמן האישי...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className={styles.notLoggedIn}>
        <FaExclamationTriangle className={styles.warningIcon} />
        <h2>יש להתחבר כדי להשתמש במאמן האישי</h2>
        <p>אנא התחבר כדי לקבל הדרכה אישית מהמאמן הווירטואלי</p>
        <button
          className={styles.loginButton}
          onClick={() => navigate("/auth")}
        >
          התחברות / הרשמה
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          <FaDumbbell className={styles.headerIcon} />
          מאמן אישי
        </h1>
        <p>קבל הדרכה אישית, טיפים ותוכניות אימון מותאמות אישית</p>

        <div
          className={styles.coachStyleButton}
          onClick={() => setShowStyleSelector(!showStyleSelector)}
        >
          <span className={styles.coachStyleIcon}>
            {coachStyles.find((style) => style.id === selectedCoachStyle)?.icon}
          </span>
          <span className={styles.coachStyleLabel}>
            {coachStyles.find((style) => style.id === selectedCoachStyle)?.name}
          </span>
        </div>

        {showStyleSelector && (
          <div className={styles.coachStyleSelector}>
            <h3>בחר את סגנון המאמן שלך:</h3>
            <div className={styles.styleOptions}>
              {coachStyles.map((style) => (
                <div
                  key={style.id}
                  className={`${styles.styleOption} ${
                    selectedCoachStyle === style.id ? styles.selectedStyle : ""
                  }`}
                  onClick={() => handleCoachStyleChange(style.id)}
                >
                  <div className={styles.styleIcon}>{style.icon}</div>
                  <div className={styles.styleName}>{style.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.headerActions}>
          <button
            className={styles.historyBtn}
            onClick={() => navigate("/conversation-history")}
          >
            <FaHistory className={styles.historyIcon} />
            היסטוריית שיחות
          </button>

          <div className={styles.apiStatusContainer}>
            <div
              className={styles.apiToggle}
              onClick={toggleAPIMode}
              title={
                useGPT
                  ? "לחץ למעבר למצב תשובות מוכנות מראש"
                  : "לחץ לנסות להשתמש ב-AI"
              }
            >
              {useGPT ? (
                <FaToggleOn className={styles.toggleIcon} />
              ) : (
                <FaToggleOff className={styles.toggleIcon} />
              )}
            </div>
            <div className={styles.apiStatus}>
              {useGPT ? (
                <span className={styles.apiActive}>מנסה להשתמש ב-AI</span>
              ) : (
                <span className={styles.apiInactive}>
                  משתמש בתשובות מוכנות מראש
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.chatContainer} ref={chatContainerRef}>
        <div className={styles.messagesContainer}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.message} 
                ${msg.sender === "user" ? styles.userMessage : ""} 
                ${msg.sender === "trainer" ? styles.trainerMessage : ""} 
                ${msg.sender === "system" ? styles.systemMessage : ""} 
                ${msg.isError ? styles.errorMessage : ""}`}
            >
              {msg.sender !== "system" && (
                <div className={styles.messageHeader}>
                  <div className={styles.avatar}>
                    {msg.sender === "user" ? (
                      <FaUser className={styles.avatarIcon} />
                    ) : (
                      <FaRobot className={styles.avatarIcon} />
                    )}
                    {msg.sender === "user" ? "אתה" : "מאמן אישי"}
                  </div>
                  <div className={styles.timestamp}>
                    {new Date(msg.timestamp).toLocaleTimeString("he-IL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              )}

              <div className={styles.messageContent}>
                {msg.text}

                {/* הצגת אייקון רלוונטי בהתאם לסוג התשובה */}
                {msg.responseType === "workout" && (
                  <div className={styles.responseBadge}>
                    <FaDumbbell className={styles.responseBadgeIcon} />
                    <span>תוכנית אימון</span>
                  </div>
                )}

                {msg.responseType === "nutrition" && (
                  <div className={styles.responseBadge}>
                    <FaAppleAlt className={styles.responseBadgeIcon} />
                    <span>תזונה</span>
                  </div>
                )}

                {/* הצגת אפשרויות פעולה אם יש */}
                {msg.options && (
                  <div className={styles.messageOptions}>
                    {msg.options.map((option, index) => (
                      <button
                        key={index}
                        className={styles.messageOptionButton}
                        onClick={() => handleOptionClick(option.action)}
                      >
                        {option.icon === "download" && <FaDownload />}
                        {option.icon === "calendar" && <FaHistory />}
                        {option.icon === "share" && <FaShare />}
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* פעולות נוספות על הודעה */}
              {msg.sender === "trainer" && !msg.isError && (
                <div className={styles.messageActions}>
                  <button
                    className={styles.messageActionButton}
                    title="הורד כקובץ"
                  >
                    <FaDownload />
                  </button>
                  <button className={styles.messageActionButton} title="שתף">
                    <FaShare />
                  </button>
                  <button
                    className={styles.messageActionButton}
                    title="אפשרויות נוספות"
                  >
                    <FaEllipsisH />
                  </button>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className={styles.typingIndicator}>
              <div className={styles.typingDot}></div>
              <div className={styles.typingDot}></div>
              <div className={styles.typingDot}></div>
            </div>
          )}

          {isThinking && (
            <div className={styles.thinkingIndicator}>
              <FaSpinner className={styles.spinnerIcon} />
              <span>המאמן חושב...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className={styles.suggestionChips}>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className={styles.suggestionChip}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span className={styles.suggestionIcon}>{suggestion.icon}</span>
              <span className={styles.suggestionText}>{suggestion.text}</span>
            </button>
          ))}
        </div>

        <form className={styles.inputForm} onSubmit={handleSubmit}>
          <button
            type="button"
            className={styles.voiceButton}
            onClick={handleVoiceRecording}
            title="הקלט הודעה קולית"
          >
            <FaMicrophone />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="שאל את המאמן האישי שלך..."
            className={styles.messageInput}
            disabled={isThinking || isTyping}
          />

          <button
            type="button"
            className={styles.attachButton}
            onClick={() => alert("העלאת תמונה - יכולת זו תהיה זמינה בקרוב!")}
            title="צרף תמונה"
          >
            <FaImage />
          </button>

          <button
            type="submit"
            className={styles.sendButton}
            disabled={!newMessage.trim() || isThinking || isTyping}
          >
            {isThinking ? (
              <FaSpinner className={styles.spinnerIcon} />
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <span>{error}</span>
          <button
            className={styles.dismissErrorButton}
            onClick={() => setError(null)}
          >
            <FaTimes />
          </button>
        </div>
      )}
    </div>
  );
}

export default PersonalTrainer;
