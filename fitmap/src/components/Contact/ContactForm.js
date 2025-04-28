import React, { useState } from 'react';
import { 
  FaEnvelope, 
  FaUser, 
  FaPhone, 
  FaComment, 
  FaPaperPlane, 
  FaCheck, 
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';
import { supabase } from '../../utils/supabaseClient';
import styles from '../../styles/Contact.module.css';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({
    success: false,
    error: null,
    showMessage: false
  });
  
  // מצב חדש לתיקוף טופס
  const [validationErrors, setValidationErrors] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // נקה שגיאות תיקוף בזמן הקלדה
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // פונקציה לתיקוף טופס
  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    // בדיקת שם
    if (!formData.name.trim()) {
      errors.name = 'נא להזין שם מלא';
      isValid = false;
    }
    
    // בדיקת אימייל
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'נא להזין כתובת דוא"ל';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'כתובת דוא"ל אינה תקינה';
      isValid = false;
    }
    
    // בדיקת נושא
    if (!formData.subject) {
      errors.subject = 'נא לבחור נושא לפנייה';
      isValid = false;
    }
    
    // בדיקת הודעה
    if (!formData.message.trim()) {
      errors.message = 'נא להזין את תוכן ההודעה';
      isValid = false;
    } else if (formData.message.trim().length < 10) {
      errors.message = 'ההודעה קצרה מדי, נא להוסיף פרטים';
      isValid = false;
    }
    
    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // תיקוף הטופס לפני שליחה
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setSubmitStatus({ success: false, error: null, showMessage: false });

    try {
      // שמירת הנתונים בטבלת contact_requests ב-Supabase
      const { error: supabaseError } = await supabase
        .from('contact_requests')
        .insert([
          { 
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            subject: formData.subject,
            message: formData.message,
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ]);
      
      if (supabaseError) {
        throw supabaseError;
      }

      // שליחת הטופס ל-Formspree
      const formspreeResponse = await fetch("https://formspree.io/f/xwplzbyz", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          _replyto: formData.email,
          _subject: `פנייה חדשה מהאתר: ${formData.subject}`
        })
      });
      
      if (!formspreeResponse.ok) {
        throw new Error('תקלה בשליחת המייל');
      }

      // אם הכל עבר בהצלחה, נציג הודעת הצלחה
      setSubmitStatus({
        success: true,
        error: null,
        showMessage: true
      });
      
      // איפוס הטופס
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      
      // גלילה לראש הטופס להצגת הודעת ההצלחה
      document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
      
    } catch (error) {
      console.error('שגיאה בשליחת הטופס:', error);
      setSubmitStatus({
        success: false,
        error: error.message || 'אירעה שגיאה בשליחת הטופס. אנא נסה שוב מאוחר יותר.',
        showMessage: true
      });
    } finally {
      setSubmitting(false);
      
      // הסתרת ההודעה אחרי 8 שניות
      if (submitStatus.showMessage) {
        setTimeout(() => {
          setSubmitStatus(prev => ({ ...prev, showMessage: false }));
        }, 8000);
      }
    }
  };

  return (
    <div className={styles.contactContainer}>
      <div className={styles.contactHeader}>
        <div className={styles.iconWrapper}>
          <FaEnvelope className={styles.headerIcon} />
        </div>
        <h2>יצירת קשר</h2>
        <p className={styles.headerDescription}>
          מלאו את הטופס ונחזור אליכם בהקדם האפשרי
        </p>
      </div>

      {submitStatus.showMessage && (
        <div 
          className={submitStatus.success ? styles.successMessage : styles.errorMessage}
          role="alert"
          aria-live="assertive"
        >
          {submitStatus.success ? (
            <>
              <FaCheck className={styles.messageIcon} />
              <div className={styles.messageContent}>
                <h3>הפנייה נשלחה בהצלחה!</h3>
                <p>קיבלנו את פנייתך ונחזור אליך בהקדם. תודה שפנית אלינו!</p>
              </div>
            </>
          ) : (
            <>
              <FaExclamationTriangle className={styles.messageIcon} />
              <div className={styles.messageContent}>
                <h3>שגיאה בשליחת הטופס</h3>
                <p>{submitStatus.error}</p>
              </div>
            </>
          )}
        </div>
      )}

      <form 
        className={styles.contactForm} 
        onSubmit={handleSubmit}
        noValidate
        aria-label="טופס יצירת קשר"
      >
        <div className={styles.formGrid}>
          <div className={`${styles.formGroup} ${validationErrors.name ? styles.hasError : ''}`}>
            <label htmlFor="name">
              <FaUser className={styles.inputIcon} />
              <span>שם מלא <span className={styles.requiredMark}>*</span></span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="ישראל ישראלי"
              required
              aria-required="true"
              aria-invalid={!!validationErrors.name}
              aria-describedby={validationErrors.name ? "name-error" : undefined}
            />
            {validationErrors.name && (
              <div className={styles.errorFeedback} id="name-error">
                <FaInfoCircle /> {validationErrors.name}
              </div>
            )}
          </div>

          <div className={`${styles.formGroup} ${validationErrors.email ? styles.hasError : ''}`}>
            <label htmlFor="email">
              <FaEnvelope className={styles.inputIcon} />
              <span>דוא"ל <span className={styles.requiredMark}>*</span></span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              required
              aria-required="true"
              aria-invalid={!!validationErrors.email}
              aria-describedby={validationErrors.email ? "email-error" : undefined}
            />
            {validationErrors.email && (
              <div className={styles.errorFeedback} id="email-error">
                <FaInfoCircle /> {validationErrors.email}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone">
              <FaPhone className={styles.inputIcon} />
              <span>טלפון (אופציונלי)</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="050-1234567"
              aria-describedby="phone-hint"
            />
            <div className={styles.fieldHint} id="phone-hint">
              נשתמש במספר הטלפון רק אם לא נצליח ליצור איתך קשר בדוא"ל
            </div>
          </div>

          <div className={`${styles.formGroup} ${validationErrors.subject ? styles.hasError : ''}`}>
            <label htmlFor="subject">
              <FaComment className={styles.inputIcon} />
              <span>נושא <span className={styles.requiredMark}>*</span></span>
            </label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              aria-required="true"
              aria-invalid={!!validationErrors.subject}
              aria-describedby={validationErrors.subject ? "subject-error" : undefined}
            >
              <option value="" disabled>בחר נושא</option>
              <option value="שאלה כללית">שאלה כללית</option>
              <option value="דיווח על מתקן חדש">דיווח על מתקן חדש</option>
              <option value="עדכון פרטי מתקן">עדכון פרטי מתקן</option>
              <option value="תקלה באתר">תקלה באתר</option>
              <option value="אחר">אחר</option>
            </select>
            {validationErrors.subject && (
              <div className={styles.errorFeedback} id="subject-error">
                <FaInfoCircle /> {validationErrors.subject}
              </div>
            )}
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth} ${validationErrors.message ? styles.hasError : ''}`}>
            <label htmlFor="message">
              <FaComment className={styles.inputIcon} />
              <span>הודעה <span className={styles.requiredMark}>*</span></span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="נשמח לשמוע במה נוכל לעזור..."
              rows="5"
              required
              aria-required="true"
              aria-invalid={!!validationErrors.message}
              aria-describedby={validationErrors.message ? "message-error" : undefined}
            ></textarea>
            {validationErrors.message && (
              <div className={styles.errorFeedback} id="message-error">
                <FaInfoCircle /> {validationErrors.message}
              </div>
            )}
          </div>
        </div>

        <div className={styles.formPrivacy}>
          <p>
            שליחת הטופס מהווה הסכמה למדיניות הפרטיות שלנו. 
            אנו מתחייבים לשמור על פרטיותך ולא נעביר את המידע לגורמים חיצוניים.
          </p>
        </div>

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? (
            <span className={styles.spinnerContainer}>
              <span className={styles.spinner} aria-hidden="true"></span>
              שולח...
            </span>
          ) : (
            <>
              <FaPaperPlane className={styles.buttonIcon} />
              שלח הודעה
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;