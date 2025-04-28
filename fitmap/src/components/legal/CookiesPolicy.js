import React, { useEffect } from 'react';
import { FaCookieBite, FaCheck } from 'react-icons/fa';
import styles from '../../styles/LegalPages.module.css';

const CookiesPolicy = () => {
  useEffect(() => {
    // גלילה לראש העמוד בטעינה
    window.scrollTo(0, 0);
    
    // עדכון כותרת העמוד
    document.title = 'מדיניות עוגיות | מתקני כושר עירוניים';
  }, []);

  return (
    <div className={styles.legalContainer}>
      <div className={styles.legalHeader}>
        <div className={styles.iconWrapper}>
          <FaCookieBite className={styles.headerIcon} />
        </div>
        <h1>מדיניות עוגיות</h1>
      </div>

      
      <div className={styles.legalContent}>
        <section className={styles.introduction}>
          <p>
            מדיניות עוגיות זו מסבירה כיצד "מתקני כושר עירוניים" והשירותים הקשורים אליו (יחד "האתר" או "אנחנו") 
            משתמשים בעוגיות ובטכנולוגיות מעקב דומות כדי לזהות אותך כאשר אתה מבקר באתר שלנו או משתמש 
            בשירותים שלנו.
          </p>
          <p>
            מדיניות זו מסבירה מהן עוגיות, אילו סוגים של עוגיות אנו משתמשים בהן, למה אנחנו משתמשים בהן, 
            וכיצד אתה יכול לשלוט בהעדפות העוגיות שלך.
          </p>
        </section>

        <section>
          <h2>1. מהן עוגיות?</h2>
          <p>
            עוגיות הן קבצי טקסט קטנים המאוחסנים בדפדפן האינטרנט שלך כאשר אתה מבקר באתר. הן משמשות להכרת המכשיר 
            שלך בביקורים חוזרים, לשיפור חוויית המשתמש, לניתוח השימוש באתר, ולהתאמה אישית של תוכן ומודעות.
          </p>
          <p>
            בנוסף לעוגיות, אנו עשויים להשתמש בטכנולוגיות מעקב אחרות כגון:
          </p>
          <ul>
            <li>
              <strong>פיקסלים/תגי מעקב:</strong> תמונות גרפיות זעירות המוטמעות בעמודי אינטרנט או הודעות דוא"ל 
              כדי לעקוב אחר פעילות המשתמש ולאסוף נתונים סטטיסטיים.
            </li>
            <li>
              <strong>Local Storage/Session Storage:</strong> טכנולוגיות אחסון בדפדפן המאפשרות לאתרים לאחסן נתונים 
              במכשיר שלך.
            </li>
            <li>
              <strong>SDK (ערכות פיתוח תוכנה):</strong> באפליקציה שלנו, אנו עשויים להשתמש ב-SDK כדי לאסוף נתונים על 
              השימוש שלך באפליקציה.
            </li>
          </ul>
        </section>

        <section>
          <h2>2. סוגי העוגיות שאנו משתמשים בהן</h2>
          <p>
            אנו משתמשים בסוגי העוגיות הבאים:
          </p>

          <div className={styles.cookieTypesTable}>
            <div className={styles.cookieType}>
              <h3>עוגיות הכרחיות</h3>
              <p>
                עוגיות אלה נחוצות לתפקוד בסיסי של האתר. הן מאפשרות לך לנווט באתר ולהשתמש בתכונותיו. 
                ללא עוגיות אלה, האתר לא יכול לתפקד כראוי.
              </p>
              <p className={styles.cookieExample}>
                <strong>דוגמאות:</strong> עוגיות המאפשרות התחברות, שמירת פריטים בסל קניות, או שמירת העדפות שפה.
              </p>
              <p className={styles.cookieExpiry}>
                <strong>תקופת שמירה:</strong> עד סגירת הדפדפן (עוגיות session) או עד שנה (עוגיות persistent).
              </p>
            </div>

            <div className={styles.cookieType}>
              <h3>עוגיות אנליטיקה וביצועים</h3>
              <p>
                עוגיות אלה מאפשרות לנו למדוד את מספר המבקרים באתר ולראות כיצד הם מנווטים בו. 
                הן עוזרות לנו לשפר את האתר על ידי מעקב אחר ביצועיו ואיתור בעיות.
              </p>
              <p className={styles.cookieExample}>
                <strong>דוגמאות:</strong> Google Analytics, Hotjar.
              </p>
              <p className={styles.cookieExpiry}>
                <strong>תקופת שמירה:</strong> בין 24 שעות לשנתיים, בהתאם לסוג העוגייה.
              </p>
            </div>

            <div className={styles.cookieType}>
              <h3>עוגיות פונקציונליות</h3>
              <p>
                עוגיות אלה מאפשרות לאתר לזכור בחירות שעשית (כמו שם המשתמש שלך, העדפות שפה או האזור שבו אתה נמצא) 
                ומספקות תכונות מתקדמות ומותאמות אישית יותר.
              </p>
              <p className={styles.cookieExample}>
                <strong>דוגמאות:</strong> עוגיות לשמירת העדפות תצוגה, היסטוריית חיפוש, או מצב התחברות.
              </p>
              <p className={styles.cookieExpiry}>
                <strong>תקופת שמירה:</strong> עד שנה.
              </p>
            </div>

            <div className={styles.cookieType}>
              <h3>עוגיות פרסום וטרגוט</h3>
              <p>
                עוגיות אלה משמשות להצגת פרסומות רלוונטיות יותר לך ולתחומי העניין שלך. הן גם משמשות להגביל את מספר 
                הפעמים שאתה רואה מודעה מסוימת ולמדוד את האפקטיביות של קמפיינים פרסומיים.
              </p>
              <p className={styles.cookieExample}>
                <strong>דוגמאות:</strong> Google Ads, Facebook Pixel.
              </p>
              <p className={styles.cookieExpiry}>
                <strong>תקופת שמירה:</strong> עד 13 חודשים.
              </p>
            </div>

            <div className={styles.cookieType}>
              <h3>עוגיות צד שלישי</h3>
              <p>
                אלה הן עוגיות המוצבות על ידי שירותים חיצוניים שאנו משתמשים בהם באתר. הן יכולות לשמש למגוון מטרות, 
                כולל אנליטיקה, פרסום או שילוב תכונות מדיה חברתית.
              </p>
              <p className={styles.cookieExample}>
                <strong>דוגמאות:</strong> YouTube, Twitter, Facebook, Google Maps.
              </p>
              <p className={styles.cookieExpiry}>
                <strong>תקופת שמירה:</strong> משתנה בהתאם לספק. לעתים מגיעה לשנתיים.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2>3. למה אנחנו משתמשים בעוגיות</h2>
          <p>
            אנו משתמשים בעוגיות למגוון מטרות, כולל:
          </p>
          <ul>
            <li>לאפשר לאתר לפעול כראוי ולספק את השירותים שאתה מבקש.</li>
            <li>להבין כיצד אתה משתמש באתר כדי שנוכל לשפר את חוויית המשתמש שלך.</li>
            <li>לזכור את העדפותיך ובחירותיך לצורך התאמה אישית של החוויה שלך.</li>
            <li>לספק תכונות מתקדמות ופונקציונליות נוספת.</li>
            <li>למדוד את האפקטיביות של הפרסומות שלנו ולהתאים אותן לתחומי העניין שלך.</li>
            <li>לשפר את האבטחה ולמנוע הונאות.</li>
            <li>לנתח את הביצועים של האתר ולזהות בעיות שדורשות שיפור.</li>
          </ul>
        </section>

        <section>
          <h2>4. ניהול העדפות העוגיות שלך</h2>
          <p>
            רוב הדפדפנים מאפשרים לך לנהל את העדפות העוגיות שלך. אתה יכול להגדיר את הדפדפן שלך לחסום או למחוק עוגיות.
            עם זאת, אם תחסום את כל העוגיות, חלק מהתכונות והשירותים באתר שלנו עלולים שלא לפעול כראוי.
          </p>
          <p>
            באפשרותך לשנות את הגדרות הדפדפן שלך בכל עת. הנה כיצד לעשות זאת בדפדפנים הנפוצים:
          </p>
          <ul>
            <li><strong>Google Chrome:</strong> הגדרות → פרטיות ואבטחה → עוגיות ונתוני אתר אחרים.</li>
            <li><strong>Mozilla Firefox:</strong> אפשרויות → פרטיות והגנה → עוגיות ונתוני אתר.</li>
            <li><strong>Safari:</strong> העדפות → פרטיות → עוגיות ונתוני אתר.</li>
            <li><strong>Microsoft Edge:</strong> הגדרות → פרטיות, חיפוש וכלים → פרטיות → עוגיות.</li>
          </ul>
          <p>
            בנוסף, אנו מציעים לך אפשרות לנהל את העדפות העוגיות שלך דרך בנר העוגיות שלנו, שמופיע כאשר אתה מבקר באתר 
            בפעם הראשונה.
          </p>
          <p>
            עבור עוגיות צד שלישי המשמשות לפרסום, תוכל לבקר בפלטפורמות הבאות כדי לבטל הסכמה לעוגיות מבוססות-עניין:
          </p>
          <ul>
            <li><a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance</a></li>
            <li><a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer">Your Online Choices (EU)</a></li>
            <li><a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer">Network Advertising Initiative</a></li>
          </ul>
        </section>

      
        <section>
          <h2>6. עדכונים למדיניות העוגיות</h2>
          <p>
            אנו עשויים לעדכן את מדיניות העוגיות שלנו מעת לעת. שינויים משמעותיים יפורסמו באתר שלנו ונעדכן את 
            תאריך ה"עודכן לאחרונה" בראש מדיניות זו.
          </p>
          <p>
            אנו ממליצים לבדוק באופן תקופתי את מדיניות העוגיות שלנו כדי להישאר מעודכנים לגבי כיצד אנו משתמשים בעוגיות.
          </p>
        </section>

        <section>
          <h2>7. יצירת קשר</h2>
          <p>
            אם יש לך שאלות כלשהן לגבי השימוש שלנו בעוגיות, אנא צור איתנו קשר:
          </p>
          <div className={styles.contactInfo}>
            <p>שם החברה:FitMap</p>
            <p>כתובת:מכללת סמי שמעון באר שבע</p>
            <p>דוא"ל: <a href="mailto:privacy@fitness-finder.co.il">privacy@fitness-finder.co.il</a></p>
            <p>טלפון: 0528985233</p>
          </div>
        </section>

        <div className={styles.acceptanceBox}>
          <FaCheck className={styles.checkIcon} />
          <p>
            המשך השימוש באתר מהווה הסכמה למדיניות העוגיות המפורטת לעיל.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CookiesPolicy;