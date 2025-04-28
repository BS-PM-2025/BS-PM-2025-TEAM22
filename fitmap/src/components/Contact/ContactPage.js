/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect } from "react";
import ContactForm from "./ContactForm";
import { 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope, 
  FaFacebookSquare, 
  FaInstagram, 
  FaTwitter, 
  FaWhatsapp,
  FaQuestionCircle,
  FaHeadset,
  FaMapMarkedAlt,
  FaAccessibleIcon,
  FaRegClock
} from "react-icons/fa";
import styles from "../../styles/Contact.module.css";

const ContactPage = () => {
  useEffect(() => {
    // גלילה לראש העמוד בטעינה
    window.scrollTo(0, 0);
    
    // עדכון כותרת העמוד
    document.title = "צור קשר | מתקני כושר עירוניים";
  }, []);

  // פונקציית סיוע לניווט
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* החלק העליון עם כותרת ומידע */}
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.iconWrapper}>
            <FaHeadset className={styles.headerIcon} />
          </div>
          <h1>צור איתנו קשר</h1>
          <p>אנחנו כאן כדי לעזור לך בכל שאלה, בקשה או עדכון לגבי מתקני כושר עירוניים</p>
          
          <div className={styles.contactCards}>
            <div className={styles.contactCard} onClick={() => scrollToSection('contact-form')}>
              <div className={styles.cardIcon}>
                <FaEnvelope />
              </div>
              <h3>שלח הודעה</h3>
              <p>מלא את הטופס ונחזור אליך בהקדם</p>
            </div>
            
            <div className={styles.contactCard} onClick={() => scrollToSection('map-section')}>
              <div className={styles.cardIcon}>
                <FaMapMarkedAlt />
              </div>
              <h3>בקר אותנו</h3>
              <p>הגע למשרדינו בשעות הפעילות</p>
            </div>
            
            <div className={styles.contactCard} onClick={() => scrollToSection('contact-info')}>
              <div className={styles.cardIcon}>
                <FaPhone />
              </div>
              <h3>התקשר אלינו</h3>
              <p>צור קשר ישיר עם נציג שירות</p>
            </div>
          </div>
        </div>
      </div>

      {/* טופס צור קשר */}
      <div id="contact-form" className={styles.formSection}>
        <ContactForm />
      </div>
      
      {/* מידע יצירת קשר */}
      <div id="contact-info" className={styles.contactInfoSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.smallIconWrapper}>
            <FaPhone className={styles.sectionIcon} />
          </div>
          <h2>דרכי התקשרות ישירות</h2>
          <p>מעדיפים ליצור קשר באופן ישיר? הנה כל הפרטים שתצטרכו</p>
        </div>
        
        <div className={styles.contactDetails}>
          <div className={styles.contactMethod}>
            <div className={styles.contactIcon}>
              <FaEnvelope />
            </div>
            <div className={styles.contactText}>
              <h3>דוא"ל</h3>
              <p><a href="mailto:info@fitness-facilities.co.il">info@fitness-facilities.co.il</a></p>
            </div>
          </div>
          
          <div className={styles.contactMethod}>
            <div className={styles.contactIcon}>
              <FaPhone />
            </div>
            <div className={styles.contactText}>
              <h3>טלפון</h3>
              <p><a href="tel:0528985233">052-898-5233</a></p>
            </div>
          </div>
          
          <div className={styles.contactMethod}>
            <div className={styles.contactIcon}>
              <FaWhatsapp />
            </div>
            <div className={styles.contactText}>
              <h3>וואטסאפ</h3>
              <p><a href="https://wa.me/972528985233">שלח הודעה מיידית</a></p>
            </div>
          </div>
          
          <div className={styles.contactMethod}>
            <div className={styles.contactIcon}>
              <FaRegClock />
            </div>
            <div className={styles.contactText}>
              <h3>שעות פעילות</h3>
              <p>ראשון-חמישי: 9:00-17:00</p>
              <p>שישי: 9:00-13:00</p>
            </div>
          </div>
        </div>
        
        <div className={styles.socialLinks}>
          <h3>עקבו אחרינו</h3>
          <div className={styles.socialIcons}>
            <a href="#" aria-label="פייסבוק" className={styles.socialIcon}>
              <FaFacebookSquare />
            </a>
            <a href="#" aria-label="אינסטגרם" className={styles.socialIcon}>
              <FaInstagram />
            </a>
            <a href="#" aria-label="טוויטר" className={styles.socialIcon}>
              <FaTwitter />
            </a>
          </div>
        </div>
      </div>

      {/* מפה ומידע על המשרד */}
      <div id="map-section" className={styles.mapSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.smallIconWrapper}>
            <FaMapMarkerAlt className={styles.sectionIcon} />
          </div>
          <h2>המשרד שלנו</h2>
          <p>אנחנו נמצאים במכללת סמי שמעון (SCE) בבאר שבע. מוזמנים לבקר אותנו!</p>
        </div>
        
        <div className={styles.mapInfo}>
          <div className={styles.mapInfoDetails}>
            <div className={styles.mapInfoItem}>
              <FaMapMarkerAlt className={styles.mapInfoIcon} />
              <p>רחוב ביאליק 56, באר שבע, מכללת סמי שמעון (SCE)</p>
            </div>
            <div className={styles.mapInfoItem}>
              <FaRegClock className={styles.mapInfoIcon} />
              <p>שעות קבלת קהל: א'-ה' 9:00-17:00, שישי 9:00-13:00</p>
            </div>
            <div className={styles.mapInfoItem}>
              <FaAccessibleIcon className={styles.mapInfoIcon} />
              <p>המשרד נגיש לבעלי מוגבלויות</p>
            </div>
            
            <a 
              href="https://www.google.com/maps/dir//SCE+-+Shamoon+College+of+Engineering/data=!4m8!4m7!1m0!1m5!1m1!1s0x1502660065d539af:0xbd1f43f92d696090!2m2!1d34.8008209!2d31.49893" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.directionsButton}
            >
              הוראות הגעה <FaMapMarkedAlt />
            </a>
          </div>
          <div className={styles.mapWrapper}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3402.217170124446!2d34.79824387624693!3d31.49893487418125!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1502660065d539af%3A0xbd1f43f92d696090!2sSCE%20-%20Shamoon%20College%20of%20Engineering!5e0!3m2!1sen!2sil!4v1713533407747!5m2!1sen!2sil"
              width="100%"
              height="400"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="מפת מכללת סמי שמעון באר שבע"
            ></iframe>
          </div>
        </div>
      </div>

      {/* שאלות נפוצות */}
      <div className={styles.faqSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.smallIconWrapper}>
            <FaQuestionCircle className={styles.sectionIcon} />
          </div>
          <h2>שאלות נפוצות</h2>
          <p>מצאנו את השאלות הנפוצות ביותר שאנשים שואלים אותנו</p>
        </div>
        
        <div className={styles.faqList}>
          <div className={styles.faqItem}>
            <h3>כיצד אני יכול להוסיף מתקן כושר חדש למפה?</h3>
            <p>
              ניתן לדווח על מתקן חדש באמצעות טופס "צור קשר" או בחשבון אישי תחת
              "הוספת מתקן". צוות האתר יבדוק את הפרטים ויוסיף את המתקן למפה
              בהקדם.
            </p>
          </div>
          
          <div className={styles.faqItem}>
            <h3>איך אני יכול להפוך למנהל מתקן?</h3>
            <p>
              בעת ההרשמה לאתר יש לבחור באפשרות "מנהל מתקן". לאחר מכן עליך למלא
              את הפרטים הנדרשים, וצוות האתר יבחן את הבקשה ויצור איתך קשר לפרטים
              נוספים.
            </p>
          </div>
          
          <div className={styles.faqItem}>
            <h3>האם השימוש באפליקציה הוא בחינם?</h3>
            <p>
              כן, השימוש באפליקציה "מתקני כושר עירוניים" הוא חינמי לחלוטין. אנו
              מאמינים בהנגשת מידע על מתקני כושר ציבוריים לכל האוכלוסייה ללא
              עלות.
            </p>
          </div>
          
          <div className={styles.faqItem}>
            <h3>איך ניתן לדווח על מתקן כושר שאינו תקין?</h3>
            <p>
              ניתן לדווח על מתקן שאינו תקין באמצעות הכפתור "דווח על תקלה" בעמוד
              המתקן הספציפי, או באמצעות טופס "צור קשר". אנו נעביר את הדיווח
              לגורמים הרלוונטיים ברשות המקומית.
            </p>
          </div>
          
          <div className={styles.faqItem}>
            <h3>כמה זמן לוקח להוסיף מתקן חדש למערכת?</h3>
            <p>
              הוספת מתקן חדש למערכת אורכת בין 2-5 ימי עבודה. אנו בודקים את כל הפרטים
              ומוודאים שהמידע מדויק לפני הוספת המתקן למפה.
            </p>
          </div>
          
          <div className={styles.faqItem}>
            <h3>האם אפשר להזמין סיור מודרך במתקנים?</h3>
            <p>
              כן, אנו מציעים סיורים מודרכים לקבוצות וארגונים. ניתן ליצור קשר דרך
              טופס "צור קשר" ולציין את הבקשה לסיור מודרך, ונחזור אליכם עם מידע מפורט.
            </p>
          </div>
        </div>
        
        <div className={styles.moreQuestionsContainer}>
          <p>לא מצאת תשובה לשאלה שלך?</p>
          <button 
            className={styles.scrollToContactButton} 
            onClick={() => scrollToSection('contact-form')}
          >
            צור קשר ישירות <FaEnvelope />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;