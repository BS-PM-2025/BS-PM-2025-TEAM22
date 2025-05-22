import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaWhatsapp,
  FaTimes,
  FaStar,
} from "react-icons/fa";
import styles from "./styles/Footer.module.css";

function Footer() {
  const currentYear = new Date().getFullYear();
  const [showWhatsapp, setShowWhatsapp] = useState(true);

  return (
    <>
      <footer className={styles.footer}>
        {/* תוכן הפוטר */}
        <div className={styles.container}>
          {/* מידע כללי */}
          <div className={styles.footerSection}>
            <h3>FitMap</h3>
            <p>
              מציאת מתקני ספורט ציבוריים ובניית שגרת אימונים בקרבת מקום מגוריך.
            </p>
            <div className={styles.socialLinks}>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <FaFacebookF className={styles.socialIcon} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <FaInstagram className={styles.socialIcon} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <FaTwitter className={styles.socialIcon} />
              </a>
            </div>
          </div>

          {/* קישורים */}
          <div className={styles.footerSection}>
            <h3>ניווט מהיר</h3>
            <div className={styles.linksGrid}>
              <Link to="/fitness-map">מפת מתקנים</Link>
              <Link to="/community">קהילה</Link>
              <Link to="/personal-trainer">מאמן אישי</Link>
              <Link to="/challenges">אתגרים</Link>
              <Link to="/about">אודות</Link>
              <Link to="/contact">צור קשר</Link>
            </div>
          </div>

          {/* צור קשר */}
          <div className={styles.footerSection}>
            <h3>צור קשר</h3>
            <address>
              <p className={styles.contactItem}>
                <FaMapMarkerAlt className={styles.addressIcon} />
                <span className={styles.contactGradient}>
                  מכללת סמי שמעון, באר שבע
                </span>
              </p>
              <p className={styles.contactItem}>
                <FaPhone className={styles.addressIcon} />
                <a href="tel:+972528985233" className={styles.contactGradient}>
                  052-8985233
                </a>
              </p>
              <p className={styles.contactItem}>
                <FaEnvelope className={styles.addressIcon} />
                <a
                  href="mailto:fitmapinfo@gmail.com"
                  className={styles.contactGradient}
                >
                  fitmapinfo@gmail.com
                </a>
              </p>
            </address>
          </div>
        </div>
        {/* תחתית */}
        <div className={styles.footerBottom}>
          <div className={styles.copyright}>
            <span>&copy; {currentYear}</span>
            <span>Dray.Apps</span>
            <span>| FitMap Group 22:</span>

            <span className={styles.nameWithIcon}>
              <FaStar className={styles.starIcon} /> Yakir
            </span>
            <span className={styles.nameWithIcon}>
              <FaStar className={styles.starIcon} /> Matan
            </span>
            <span className={styles.nameWithIcon}>
              <FaStar className={styles.starIcon} /> Tomer
            </span>
            <span className={styles.nameWithIcon}>
              <FaStar className={styles.starIcon} /> Alon
            </span>
          </div>

          <div className={styles.legalLinks}>
            <Link to="/privacy">מדיניות פרטיות</Link>
            <Link to="/terms">תנאי שימוש</Link>
          </div>
        </div>
      </footer>

      {/* כפתור וואטסאפ עם טוגל */}
      {showWhatsapp && (
        <a
          href="https://wa.me/972528985233"
          className={`${styles.whatsappButton} ${styles.whatsappEnter}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaWhatsapp />
          <button
            className={styles.closeButton}
            onClick={(e) => {
              e.preventDefault();
              setShowWhatsapp(false);
            }}
            aria-label="סגור וואטסאפ"
          >
            <FaTimes />
          </button>
        </a>
      )}
    </>
  );
}

export default Footer;
