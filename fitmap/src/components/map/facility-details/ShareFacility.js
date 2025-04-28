import React, { useState } from 'react';
import styles from './ShareFacility.module.css';

const ShareFacility = ({ facility }) => {
  const [isShareOpen, setIsShareOpen] = useState(false);

  const toggleShare = () => {
    setIsShareOpen(!isShareOpen);
  };

  const shareUrl = `${window.location.origin}/facility/${facility.id}`;
  
  const shareOptions = [
    { 
      name: 'WhatsApp', 
      icon: 'fab fa-whatsapp', 
      color: '#25D366',
      url: `https://wa.me/?text=בדוק את המתקן הזה: ${facility.name} - ${shareUrl}`
    },
    { 
      name: 'Telegram', 
      icon: 'fab fa-telegram', 
      color: '#0088cc',
      url: `https://t.me/share/url?url=${shareUrl}&text=בדוק את המתקן הזה: ${facility.name}`
    },
    { 
      name: 'Facebook', 
      icon: 'fab fa-facebook', 
      color: '#1877F2',
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`
    },
    { 
      name: 'Twitter', 
      icon: 'fab fa-twitter', 
      color: '#1DA1F2',
      url: `https://twitter.com/intent/tweet?text=בדוק את המתקן הזה: ${facility.name}&url=${shareUrl}`
    },
    { 
      name: 'Email', 
      icon: 'fas fa-envelope', 
      color: '#D44638',
      url: `mailto:?subject=מתקן כושר מומלץ: ${facility.name}&body=היי, חשבתי שזה יעניין אותך:\n\n${facility.name}\n${facility.address}\n\nקישור: ${shareUrl}`
    }
  ];
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        alert('הקישור הועתק ללוח');
      })
      .catch(err => {
        console.error('שגיאה בהעתקה:', err);
      });
  };

  return (
    <div className={styles.shareContainer}>
      <button className={styles.shareButton} onClick={toggleShare}>
        <i className="fas fa-share-alt"></i> שתף
      </button>
      
      {isShareOpen && (
        <div className={styles.sharePopup}>
          <div className={styles.shareHeader}>
            <h4>שתף מתקן</h4>
            <button className={styles.closeShareButton} onClick={toggleShare}>×</button>
          </div>
          
          <div className={styles.shareUrl}>
            <input type="text" value={shareUrl} readOnly />
            <button onClick={copyToClipboard} aria-label="העתק קישור">
              <i className="fas fa-copy"></i>
            </button>
          </div>
          
          <div className={styles.sharePlatforms}>
            {shareOptions.map(option => (
              <a 
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shareOption}
                style={{ backgroundColor: option.color }}
                aria-label={`שתף ב-${option.name}`}
              >
                <i className={option.icon}></i>
                <span>{option.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareFacility;