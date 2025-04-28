import React from 'react';
import { 
  FaMapMarkerAlt, 
  FaUsers, 
  FaDumbbell, 
  FaStar, 
  FaHeartbeat, 
  FaStreetView, 
  FaHandsHelping, 
  FaEnvelope, 
  FaMapSigns
} from 'react-icons/fa';
import styles from '../../styles/About.module.css';

const About = () => (
  <div className={styles.container}>
    <header className={styles.heroSection}>
      <div className={styles.heroContent}>
        <h1>אודות מתקני כושר עירוניים</h1>
        <p className={styles.heroSubtitle}>מחברים אנשים למרחבי כושר פתוחים ברחבי ישראל</p>
      </div>
    </header>
    
    <section className={styles.missionSection}>
      <div className={styles.sectionContent}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleDecoration}></span>
          החזון שלנו
        </h2>
        <div className={styles.missionDescription}>
          <p>
            <strong>מתקני כושר עירוניים</strong> נוסדה מתוך אמונה פשוטה: אימון גופני איכותי צריך להיות 
            נגיש לכולם, ללא תלות במקום מגורים או יכולת כלכלית. 
          </p>
          <p>
            אנו פועלים להפוך את המרחב הציבורי למזמין יותר עבור פעילות גופנית, 
            ולבנות קהילה מלוכדת של אנשים המחויבים לאורח חיים בריא ופעיל במרחב הציבורי.
          </p>
        </div>
      </div>
    </section>
    
    <section className={styles.valuesSection}>
      <div className={styles.sectionContent}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleDecoration}></span>
          העקרונות המנחים אותנו
        </h2>
        <div className={styles.valuesGrid}>
          <div className={styles.valueCard}>
            <div className={styles.valueIcon}><FaHeartbeat /></div>
            <h3>נגישות לכל</h3>
            <p>אנו מאמינים שלכל אדם מגיעה גישה חופשית ופשוטה למתקני כושר איכותיים, ללא קשר למיקום או אמצעים כלכליים.</p>
          </div>
          <div className={styles.valueCard}>
            <div className={styles.valueIcon}><FaStreetView /></div>
            <h3>קהילתיות</h3>
            <p>הפעילות הגופנית היא הזדמנות ליצירת קשרים חברתיים משמעותיים והזדמנות לחיזוק הקהילה המקומית.</p>
          </div>
          <div className={styles.valueCard}>
            <div className={styles.valueIcon}><FaHandsHelping /></div>
            <h3>שיתוף ידע</h3>
            <p>אנו מעודדים שיתוף של טיפים, תוכניות אימון וחוויות בין המשתמשים כדי להעצים את כולם.</p>
          </div>
        </div>
      </div>
    </section>
    
    <section className={styles.featuresSection}>
      <div className={styles.sectionContent}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleDecoration}></span>
          הכלים שאנחנו מציעים
        </h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><FaMapMarkerAlt /></div>
            <h3>מפה אינטראקטיבית</h3>
            <p>איתור מדויק של מתקני כושר בקרבתכם עם פילוח לפי סוג מתקן, רמת תחזוקה, וסינון לפי מאפייני נגישות מתקדמים.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><FaUsers /></div>
            <h3>קהילה פעילה</h3>
            <p>פלטפורמה לתיאום אימונים משותפים, אירועי ספורט קהילתיים, ושיתוף הישגים אישיים עם מתאמנים מרחבי הארץ.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><FaDumbbell /></div>
            <h3>מדריכי אימון</h3>
            <p>ספריית תרגילים מקיפה המותאמת לכל סוגי המתקנים, כולל סרטוני הדרכה, תוכניות אימון מובנות ועצות מקצועיות.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><FaStar /></div>
            <h3>התאמה אישית</h3>
            <p>מעקב אחר התקדמות האימונים, שמירת מתקנים מועדפים, והמלצות מותאמות אישית על בסיס הרגלי האימון שלכם.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><FaMapSigns /></div>
            <h3>הוספת מתקנים</h3>
            <p>אפשרות לדווח על מתקנים חדשים, לעדכן פרטים על מתקנים קיימים ולהשתתף ביצירת מאגר המידע המקיף ביותר בישראל.</p>
          </div>
        </div>
      </div>
    </section>
    
    <section className={styles.impactSection}>
      <div className={styles.sectionContent}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleDecoration}></span>
          ההשפעה שלנו
        </h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>2,800+</span>
            <p>מתקני כושר מופו</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>X</span>
            <p>יישובים בפריסה ארצית</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>Y</span>
            <p>משתמשים פעילים</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>Z</span>
            <p>קבוצות אימון נוצרו</p>
          </div>
        </div>
      </div>
    </section>
    
    <section className={styles.teamSection}>
      <div className={styles.sectionContent}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleDecoration}></span>
          הצוות שלנו
        </h2>
        <div className={styles.teamDescription}>
          <p>
            מאחורי <strong>מתקני כושר עירוניים</strong> עומד צוות רב-תחומי של מפתחים, מעצבים, מומחי UX, מאמני כושר מוסמכים ומומחי בריאות הציבור.
            כולנו חולקים אהבה לספורט וחזון משותף - להפוך את הפעילות הגופנית לנגישה יותר עבור כל אזרחי ישראל.
          </p>
          <p>
            הפרויקט שלנו נולד מתוך אתגר אישי שחווה המייסד כשניסה למצוא מתקני כושר באזור מגוריו, והתפתח לכדי יוזמה ארצית 
            הפועלת בשיתוף פעולה עם רשויות מקומיות, מוסדות חינוך וארגוני בריאות הציבור.
          </p>
        </div>
      </div>
    </section>
    
    <section className={styles.contactSection}>
      <div className={styles.sectionContent}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleDecoration}></span>
          דברו איתנו
        </h2>
        <div className={styles.contactInfo}>
          <p>
            אנחנו תמיד מחפשים דרכים לשפר ולהרחיב את השירות שלנו. אם יש לכם שאלות, רעיונות לשיפור, או רצון לדווח על מתקן חדש, 
            נשמח לשמוע מכם!
          </p>
          <div className={styles.contactButtons}>
            <a href="/contact" className={styles.primaryButton}>
              <FaEnvelope /> צרו קשר
            </a>
            <a href="/contribute" className={styles.secondaryButton}>
              הצטרפו למאמץ
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default About;