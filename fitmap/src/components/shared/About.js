import React, { useState, useEffect } from "react";
import {
  FaMapMarkerAlt,
  FaUsers,
  FaDumbbell,
  FaHeartbeat,
  FaBrain,
  FaTrophy,
  FaCalendarAlt,
  FaComments,
  FaPlus,
  FaMinus,
  FaChevronDown,
  FaEnvelope,
  FaExternalLinkAlt
} from "react-icons/fa";
import styles from "./styles/About.module.css";

const About = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [quickNavVisible, setQuickNavVisible] = useState(false);

  // טיפול בתצוגת ניווט מהיר בעת גלילה
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setQuickNavVisible(true);
      } else {
        setQuickNavVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // טיפול ב-FAQ
  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // ניווט מהיר לסקציות
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  };

  // נתוני שאלות נפוצות
  const faqData = [
    {
      question: "האם אפשר למצוא מתקנים בכל העולם?",
      answer:
        "בהחלט! FitMap פועלת גלובלית ומכילה מידע על מתקני כושר, פארקים ומכוני ספא בערים מרכזיות ברחבי העולם. המפה מתעדכנת באופן רציף על ידי המשתמשים שלנו מכל קצוות תבל, כך שכל יום נוספים מתקנים חדשים.",
    },
    {
      question: "איך עובד המאמן האישי המבוסס בינה מלאכותית?",
      answer:
        "המאמן האישי שלנו משתמש בטכנולוגיית GPT מתקדמת שמנתחת את הפרופיל שלך, הכולל את רמת הכושר, מטרות האימון, מגבלות גופניות והעדפות אישיות. הוא מתאים עבורך תוכניות אימון, מספק הנחיות בזמן אמת, ומתאים את עצמו לצרכים המשתנים שלך ככל שאתה מתקדם.",
    },
    {
      question: "מה מיוחד בפיד החברתי של FitMap?",
      answer:
        "הפיד החברתי שלנו מתמקד בקהילת הכושר בלבד, ומאפשר לך לשתף תמונות, הישגים וחוויות מהאימונים שלך. בניגוד לרשתות חברתיות רגילות, אצלנו התוכן מאורגן לפי נושאים, סוגי אימונים ומיקומים, מה שמאפשר לך להתחבר לאנשים עם תחומי עניין דומים.",
    },
    {
      question: "איך האתגרים והפרסים עובדים?",
      answer:
        "אנחנו מציעים מגוון אתגרים יומיים, שבועיים ועונתיים. אלה יכולים להיות אתגרי עקביות (כמו התמדה באימונים), אתגרי ביצועים (שיפור זמנים או משקלים), או אתגרים חברתיים. השלמת אתגרים מזכה בנקודות, תגים וירטואליים, ואף בפרסים אמיתיים מחברות שותפות.",
    },
    {
      question: "איך אני יכול להוסיף מתקן או ספא חדש שמצאתי?",
      answer:
        "זה פשוט מאוד! במסך המפה, הקש על כפתור '+' ובחר 'הוסף מקום חדש'. תוכל לצלם את המקום, לסמן את מיקומו המדויק במפה, ולהוסיף פרטים כמו סוגי ציוד, שעות פעילות, ועלויות (אם יש). הוספת מקומות חדשים מזכה אותך בנקודות בונוס ובתגי תורם פעיל.",
    },
    {
      question: "האם המידע על הפלטפורמה מאובטח?",
      answer:
        "אבטחת המידע שלך היא בעדיפות עליונה עבורנו. אנו משתמשים בהצפנה מתקדמת לכל המידע האישי, ומאפשרים לך לשלוט במה שאתה חולק עם הקהילה. מידע בריאותי רגיש נשמר באופן מאובטח ומוגן בסטנדרטים הגבוהים ביותר בתעשייה.",
    },
    {
      question: "כיצד פועל הסנכרון עם מכשירים לבישים?",
      answer:
        "FitMap מתממשקת עם מגוון רחב של מכשירים לבישים ואפליקציות בריאות כמו Fitbit, Garmin, Apple Health, Google Fit ועוד. המידע מסונכרן באופן אוטומטי ומשתלב בסטטיסטיקות האימון שלך, מה שמאפשר מעקב מקיף אחר הפעילות הגופנית והמדדים הבריאותיים שלך לאורך זמן.",
    },
    {
      question: "איך אני יכול לתקשר עם משתמשים אחרים?",
      answer:
        "האפליקציה כוללת מערכת צ'אט מתקדמת המאפשרת תקשורת מיידית עם משתמשים אחרים. תוכל לשלוח הודעות פרטיות, להצטרף לקבוצות דיון נושאיות, או ליצור קבוצת צ'אט משלך עם חברי האימון שלך. בנוסף, תוכל לעקוב אחר משתמשים שמעניינים אותך ולקבל עדכונים על פעילותם בפיד האישי שלך.",
    },
  ];

  // נתוני סטטיסטיקות
  const statsData = [
    { value: "X+", label: "משתמשים פעילים" },
    { value: "Y+", label: "מתקני כושר" },
    { value: "Z+", label: "מדינות" },
    { value: "W%", label: "שביעות רצון" },
    { value: "24/7", label: "תמיכה" },
  ];

  // נתוני תכונות
  const featuresData = [
    {
      icon: <FaMapMarkerAlt />,
      title: "מפה גלובלית חכמה",
      description: "גלו מתקני כושר, פארקים ומכוני ספא בכל מקום בעולם, עם ניווט מדויק, סינון מתקדם וחוויות משתמשים בזמן אמת."
    },
    {
      icon: <FaDumbbell />,
      title: "ספריית תרגילים עשירה",
      description: "אלפי תרגילים עם הסברים מפורטים, סרטוני הדגמה באיכות HD, והנחיות מותאמות לכל רמת כושר ולכל סוג מתקן."
    },
    {
      icon: <FaUsers />,
      title: "קהילות אימון גלובליות",
      description: "התחברו לקבוצות אימון מקומיות או בינלאומיות, תיאום אימונים משותפים וצ'אט קבוצתי לשיתוף טיפים והתייעצויות בזמן אמת."
    },
    {
      icon: <FaHeartbeat />,
      title: "פיד חברתי מתקדם",
      description: "פלטפורמה חברתית ייעודית לשיתוף הישגים, תמונות מאימונים ורגעי השראה, עם אפשרות ליצירת פרופיל אישי ורשת חברתית של אוהבי כושר."
    },
    {
      icon: <FaBrain />,
      title: "מאמן AI אישי",
      description: "מאמן וירטואלי מבוסס בינה מלאכותית המתחבר ל-GPT, לומד את ההעדפות, היכולות והמטרות שלכם, ויוצר תוכניות אימון מותאמות אישית."
    },
    {
      icon: <FaTrophy />,
      title: "אתגרים ופרסים",
      description: "אתגרים יומיים, שבועיים ועונתיים בנושאים מגוונים, עם אפשרות לזכייה בפרסים אמיתיים וירטואליים ובתגי הישג ייחודיים."
    },
    {
      icon: <FaCalendarAlt />,
      title: "ניהול אימונים מתקדם",
      description: "לוח שנה אינטואיטיבי לתכנון אימונים עתידיים, מעקב אחר הישגים, וסטטיסטיקות מפורטות עם ויזואליזציה מתקדמת של התקדמות לאורך זמן."
    },
    {
      icon: <FaComments />,
      title: "צ'אט פרטי וקבוצתי",
      description: "מערכת מסרים מתקדמת המאפשרת תקשורת ישירה עם משתמשים אחרים, יצירת קשרים וחברויות חדשות, וניהול שיחות פרטיות או קבוצתיות."
    },
  ];

  return (
    <div className={styles.container}>
      {/* ניווט מהיר */}
      <div className={`${styles.quickNav} ${quickNavVisible ? styles.visible : ''}`}>
        <ul>
          <li><button className={styles.active} onClick={() => scrollToSection('vision')}>החזון שלנו</button></li>
          <li><button onClick={() => scrollToSection('stats')}>נתונים</button></li>
          <li><button onClick={() => scrollToSection('features')}>תכונות</button></li>
          <li><button onClick={() => scrollToSection('faq')}>שאלות נפוצות</button></li>
          <li><button onClick={() => scrollToSection('contact')}>צור קשר</button></li>
        </ul>
      </div>

      {/* כותרת ראשית */}
      <header className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1>
            אודות <span>FitMap</span>
          </h1>
          <div className={styles.heroSubtitle}>
            מחברים אנשים למרחבי כושר ופנאי ברחבי העולם
          </div>
          
          <div className={styles.scrollIndicator} onClick={() => scrollToSection('vision')}>
            <span>גלה עוד</span>
            <FaChevronDown />
          </div>
        </div>
      </header>

      {/* סטטיסטיקות */}
      <div className={styles.statsContainer} id="stats">
        {statsData.map((stat, index) => (
          <div className={styles.statItem} key={index}>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* חזון */}
      <section className={`${styles.section} ${styles.missionSection}`} id="vision">
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>החזון שלנו</h2>
          <div className={styles.missionDescription}>
            <p>
              <strong>FitMap</strong> נוצרה מתוך הרצון להנגיש אימונים איכותיים
              לכל אחד, בכל מקום בעולם. אנחנו מאמינים שאורח חיים בריא צריך להיות
              נגיש לכולם, ללא מחסום כלכלי או גיאוגרפי.
            </p>
          </div>
        </div>
      </section>

      {/* תכונות עיקריות */}
      <section className={styles.featuresSection} id="features">
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>מה באפליקציה</h2>
          <div className={styles.featuresGrid}>
            {featuresData.map((feature, index) => (
              <div className={styles.featureCard} key={index} style={{"--index": index}}>
                <div className={styles.featureIcon}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* שאלות נפוצות */}
      <section className={styles.faqSection} id="faq">
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>שאלות נפוצות</h2>
          <div className={styles.faqContainer}>
            {faqData.map((item, index) => (
              <div
                key={index}
                className={`${styles.faqItem} ${activeFaq === index ? styles.activeFaq : ""}`}
              >
                <button
                  className={styles.faqQuestion}
                  onClick={() => toggleFaq(index)}
                  aria-expanded={activeFaq === index}
                >
                  <span>{item.question}</span>
                  <div className={styles.faqIcon}>
                    {activeFaq === index ? <FaMinus /> : <FaPlus />}
                  </div>
                </button>
                <div
                  className={styles.faqAnswer}
                  aria-hidden={activeFaq !== index}
                >
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* צור קשר */}
      <section id="contact" className={styles.contactSection}>
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>דברו איתנו</h2>
          <div className={styles.contactInfo}>
            <p>נשמח לשמוע מכם: שאלות והצעות לשיפור.</p>
            <div className={styles.contactButtons}>
              <a href="/contact" className={styles.primaryButton}>
                <FaEnvelope /> צרו קשר
              </a>
              <a href="/community" className={styles.secondaryButton}>
                <FaExternalLinkAlt /> הצטרפו FidMap
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;