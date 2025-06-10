// src/hooks/useBottomNavbar.js
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useBottomNavbar = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();

  // דפים שבהם לא להציג את הבר התחתון
  const hiddenPaths = [
    '/auth',
    '/signup',
    '/pending-approval',
    '/admin',
    '/facility'
  ];

  // דפים מיוחדים שבהם להציג תמיד את הבר (ללא הסתרה בגלילה)
  const alwaysVisiblePaths = [
    '/chats',
    '/chat'
  ];

  // בדיקה אם צריך להסתיר את הבר בדף הנוכחי
  const shouldHide = hiddenPaths.some(path => 
    location.pathname.startsWith(path)
  );

  // בדיקה אם הדף הנוכחי דורש תצוגה קבועה של הבר
  const shouldAlwaysShow = alwaysVisiblePaths.some(path => 
    location.pathname.startsWith(path)
  );

  // ניהול הצגה/הסתרה בגלילה
  useEffect(() => {
    // אם הדף דורש תצוגה קבועה, אל תטפל בגלילה
    if (shouldAlwaysShow) {
      setIsVisible(true);
      return;
    }

    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        
        // אם גוללים למטה והחלק העליון לא נראה - הסתר
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
        } else {
          // אם גוללים למעלה או בתחילת העמוד - הצג
          setIsVisible(true);
        }
        
        setLastScrollY(currentScrollY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      
      // ניקוי
      return () => {
        window.removeEventListener('scroll', controlNavbar);
      };
    }
  }, [lastScrollY, shouldAlwaysShow]);

  // איפוס מצב בשינוי דף
  useEffect(() => {
    setIsVisible(true);
    setLastScrollY(0);
  }, [location.pathname]);

  return {
    isVisible: (isVisible || shouldAlwaysShow) && !shouldHide,
    shouldShow: !shouldHide,
    shouldAlwaysShow
  };
};