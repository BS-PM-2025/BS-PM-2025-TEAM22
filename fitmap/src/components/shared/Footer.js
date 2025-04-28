import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";
import styles from "../../styles/Footer.module.css";

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerSection}>
          <h3>מתקני כושר עירוניים</h3>
          <p>
            אפליקציה למציאת מתקני כושר ציבוריים בקרבתך. חפש, התאמן והצטרף
            לקהילה.
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

        <div className={styles.footerSection}>
          <h3>קישורים מהירים</h3>
          <ul className={styles.footerLinks}>
            <li>
              <Link to="/fitness-map">מפת מתקנים</Link>
            </li>
            <li>
              <Link to="/community">קהילה</Link>
            </li>
            <li>
              <Link to="/about">אודות</Link>
            </li>
            <li>
              <Link to="/contact">צור קשר</Link>
            </li>
            <li>
              <Link to="/terms">תנאי שימוש</Link>
            </li>
            <li>
              <Link to="/privacy">מדיניות פרטיות</Link>
            </li>
            <li>
              <Link to="/cookies">מדיניות עוגיות</Link>
            </li>
          </ul>
        </div>

        <div className={styles.footerSection}>
          <h3>צור קשר</h3>
          <address>
            <p>
              <span className={styles.addressIcon}>
                <FaMapMarkerAlt />
              </span>
              מכללת סמי שמעון{" "}
            </p>
            <p>
              <span className={styles.addressIcon}>
                <FaPhone />
              </span>
              <a href="tel:+972-3-1234567">0528985233</a>
            </p>
            <p>
              <span className={styles.addressIcon}>
                <FaEnvelope />
              </span>
              <a href="mailto:Fitmapinfo@gmail.com">Fitmapinfo@gmail.com </a>
            </p>
          </address>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p className={styles.copyright}>
          &copy; {new Date().getFullYear()} Dray.apps. כל הזכויות שמורות.
        </p>
        <div className={styles.legalLinks}>
          <Link to="/privacy">מדיניות פרטיות</Link>
          <Link to="/terms">תנאי שימוש</Link>
          <Link to="/cookies">מדיניות עוגיות</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
