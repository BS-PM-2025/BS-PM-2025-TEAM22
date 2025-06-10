// src/components/map/Navigation/utils/AnimationUtils.js - שדרוג ושיפור אנימציות
/**
 * ניהול הסאונד במערכת האנימציות
 * @type {Object}
 */
const SoundManager = {
  // מטמון סאונדים כדי למנוע טעינות מיותרות
  audioCache: {},
  
  // הגדרת עוצמת קול ברירת מחדל
  defaultVolume: 0.4,
  
  /**
   * הפעלת סאונד עם תמיכה במטמון
   * @param {string} src - מקור הסאונד
   * @param {number} volume - עוצמת קול (0-1)
   * @returns {Promise} הבטחה להפעלת הסאונד
   */
  play: function(src, volume = this.defaultVolume) {
    return new Promise((resolve, reject) => {
      try {
        // שימוש בסאונד ממטמון אם קיים
        if (!this.audioCache[src]) {
          this.audioCache[src] = new Audio(src);
        }
        
        const audio = this.audioCache[src];
        audio.volume = volume;
        
        // איפוס הסאונד אם כבר הופעל בעבר
        if (audio.currentTime > 0) {
          audio.currentTime = 0;
        }
        
        audio.play()
          .then(resolve)
          .catch(err => {
            console.log("Sound play prevented:", err);
            resolve(); // ממשיכים למרות שגיאות
          });
      } catch (e) {
        console.warn("Failed to play sound:", e);
        resolve(); // ממשיכים למרות שגיאות
      }
    });
  }
};

/**
 * יצירת מזהה ייחודי לשימוש באלמנטי SVG
 * @returns {string} מזהה ייחודי
 */
const generateUniqueId = () => `id_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

/**
 * הוספת אלמנט למסמך עם ניהול מחזור חיים בטוח
 * @param {HTMLElement} element - האלמנט להוספה
 * @param {number} duration - משך הזמן בms להצגה
 * @param {number} fadeOutDuration - משך אנימציית ה-fadeOut בms 
 * @param {Function} onComplete - קולבק לביצוע בסיום
 * @returns {Object} אובייקט עם פונקציית cleanup
 */
const addElementWithLifecycle = (element, duration, fadeOutDuration = 300, onComplete = null) => {
  // מונע כפילויות בקריאות מרובות
  const elementId = `anim_${generateUniqueId()}`;
  element.id = elementId;
  
  // הוספה למסמך
  document.body.appendChild(element);
  
  // הפעלת אנימציית כניסה (אם מוגדרת בסגנונות)
  setTimeout(() => element.classList.add('active'), 10);
  
  // פונקציית ניקוי מסודרת
  const cleanup = () => {
    try {
      const el = document.getElementById(elementId);
      if (el) {
        el.classList.add('fadeOut');
        
        setTimeout(() => {
          if (el && el.parentNode) {
            el.parentNode.removeChild(el);
          }
          
          // קריאה לקולבק השלמה
          if (typeof onComplete === 'function') {
            onComplete();
          }
        }, fadeOutDuration);
      }
    } catch (e) {
      console.warn(`❌ Failed to remove element safely (${elementId}):`, e);
      
      // קריאה לקולבק השלמה במקרה של שגיאה
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }
  };
  
  // הגדרת טיימר לניקוי אוטומטי
  const timer = setTimeout(cleanup, duration);
  
  // החזרת אובייקט עם פונקצית ניקוי ידנית
  return {
    cleanup: () => {
      clearTimeout(timer);
      cleanup();
    }
  };
};

/**
 * הצגת אנימציית איסוף כוכב משודרגת
 * @param {Object} star - הכוכב שנאסף
 * @param {Object} styles - סגנונות CSS
 * @param {Function} onComplete - קולבק לביצוע בסיום האנימציה
 */
export const showCollectAnimation = (star, styles, onComplete) => {
  // יצירת אלמנט האנימציה
  const collectDiv = document.createElement("div");
  collectDiv.className = `${styles.collectAnimation} ${styles.enterAnimation}`;

  // מזהים ייחודיים לאנימציה זו
  const uniqueId = generateUniqueId();
  const starGradientId = `starGradient${uniqueId}`;
  const glowId = `glow${uniqueId}`;

  // קביעת צבע לפי סוג הכוכב
  let starColor = "#FFD700"; // צהוב ברירת מחדל
  let glowColor = "#FFA500"; // כתום ברירת מחדל
  let pointValue = star.points || 1;
  let soundSrc = "/assets/sounds/star-collect.mp3";

  // קביעת צבעים לפי סוג הכוכב
  if (star.type === "gold") {
    starColor = "#FFD700"; // זהב
    glowColor = "#FFA500"; // כתום
    soundSrc = "/assets/sounds/star-gold.mp3";
  } else if (star.type === "silver") {
    starColor = "#C0C0C0"; // כסף
    glowColor = "#808080"; // אפור
    soundSrc = "/assets/sounds/star-silver.mp3";
  } else if (star.type === "bronze") {
    starColor = "#CD7F32"; // ברונזה
    glowColor = "#8B4513"; // חום
    soundSrc = "/assets/sounds/star-bronze.mp3";
  } else if (star.type === "diamond") {
    // אפשרות חדשה - כוכב יהלום
    starColor = "#B9F2FF"; // תכלת בהיר
    glowColor = "#0099CC"; // כחול
    soundSrc = "/assets/sounds/star-diamond.mp3";
  }

  // הוספת תוכן האנימציה - אנימציה משודרגת עם שילוב של חלקיקים
  collectDiv.innerHTML = `
    <div class="${styles.starCollect}">
      <div class="${styles.starCollectInner}">
        <span class="${styles.points}">+${pointValue}</span>
        <svg width="100" height="100" viewBox="0 0 100 100">
          <defs>
            <filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="glow"/>
              <feComposite in="glow" in2="SourceGraphic" operator="over"/>
              <feMerge>
                <feMergeNode in="glow"/>
                <feMergeNode in="glow"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <radialGradient id="${starGradientId}" cx="50%" cy="50%" r="70%" fx="30%" fy="30%">
              <stop offset="0%" stop-color="#FFFFFF" />
              <stop offset="40%" stop-color="${starColor}" />
              <stop offset="90%" stop-color="${glowColor}" />
              <stop offset="100%" stop-color="${glowColor}" stop-opacity="0.7" />
            </radialGradient>
            <linearGradient id="pointsGradient${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFFFFF" />
              <stop offset="100%" stop-color="${starColor}" />
            </linearGradient>
          </defs>
          
          <!-- פיצוץ חלקיקים מאחורי הכוכב -->
          <g class="${styles.particles}">
            ${Array.from({length: 8}, (_, i) => {
              const angle = (i * 45) * Math.PI / 180;
              const delay = i * 0.05;
              return `
                <circle class="${styles.particle}" 
                        cx="50" cy="50" r="2" 
                        fill="${starColor}" 
                        opacity="0.9"
                        transform="translate(0,0)">
                  <animate attributeName="cx" from="50" to="${50 + Math.cos(angle) * 60}" dur="0.7s" begin="${delay}s" fill="freeze" />
                  <animate attributeName="cy" from="50" to="${50 + Math.sin(angle) * 60}" dur="0.7s" begin="${delay}s" fill="freeze" />
                  <animate attributeName="opacity" from="0.9" to="0" dur="0.7s" begin="${delay}s" fill="freeze" />
                  <animate attributeName="r" from="2" to="0.5" dur="0.7s" begin="${delay}s" fill="freeze" />
                </circle>
              `;
            }).join('')}
          </g>
          
          <!-- טבעת הילה מאחורי הכוכב -->
          <circle class="${styles.starRing}" cx="50" cy="50" r="35" 
                  stroke="${glowColor}"
                  stroke-width="3"
                  fill="none"
                  opacity="0"
                  stroke-dasharray="220"
                  stroke-dashoffset="220">
            <animate attributeName="opacity" from="0" to="0.7" dur="0.2s" begin="0s" fill="freeze" />
            <animate attributeName="opacity" from="0.7" to="0" dur="0.5s" begin="0.4s" fill="freeze" />
            <animate attributeName="stroke-dashoffset" from="220" to="0" dur="0.6s" begin="0s" fill="freeze" />
            <animate attributeName="r" from="35" to="55" dur="0.6s" begin="0s" fill="freeze" />
          </circle>
          
          <!-- הכוכב עצמו -->
          <path class="${styles.starPath}" 
                d="M50,10 L61,38 L92,38 L67,56 L78,84 L50,66 L22,84 L33,56 L8,38 L39,38 Z" 
                fill="url(#${starGradientId})" 
                stroke="${glowColor}" 
                stroke-width="2"
                filter="url(#${glowId})"
                opacity="0"
                transform="scale(0.2)">
            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0s" fill="freeze" />
            <animate attributeName="transform" from="scale(0.2)" to="scale(1.2)" dur="0.3s" begin="0s" fill="freeze" />
            <animate attributeName="transform" from="scale(1.2)" to="scale(1)" dur="0.2s" begin="0.3s" fill="freeze" />
          </path>
          
          <!-- הבזק אור -->
          <circle class="${styles.starBurst}" cx="50" cy="50" r="0" fill="#FFFFFF" opacity="0.8">
            <animate attributeName="r" from="0" to="70" dur="0.6s" begin="0s" fill="freeze" />
            <animate attributeName="opacity" from="0.8" to="0" dur="0.6s" begin="0s" fill="freeze" />
          </circle>
        </svg>
      </div>
    </div>
  `;

  // אפקט חלקיקים נפרד עם קנבס (לביצועים טובים יותר)
  const particlesCanvas = document.createElement('canvas');
  particlesCanvas.className = styles.particlesCanvas;
  particlesCanvas.width = 200;
  particlesCanvas.height = 200;
  collectDiv.appendChild(particlesCanvas);

  // הוספה למסמך וניהול מחזור חיים
  const { cleanup } = addElementWithLifecycle(collectDiv, 1200, 300, onComplete);

  // הוספת סאונד איסוף כוכב
  SoundManager.play(soundSrc);

  // אנימציית חלקיקים נוספת (אופציונלי - מומלץ לבדוק ביצועים)
  const ctx = particlesCanvas.getContext('2d');
  if (ctx) {
    let particles = [];
    const numParticles = 15;
    
    // יצירת חלקיקים
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: particlesCanvas.width / 2,
        y: particlesCanvas.height / 2,
        size: Math.random() * 5 + 2,
        speedX: (Math.random() - 0.5) * 8,
        speedY: (Math.random() - 0.5) * 8,
        color: starColor,
        alpha: 1
      });
    }
    
    // פונקציית אנימציה לחלקיקים
    const animateParticles = () => {
      ctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
      
      particles.forEach((p, index) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.size -= 0.1;
        p.alpha -= 0.02;
        
        if (p.size <= 0.2 || p.alpha <= 0) {
          particles.splice(index, 1);
          return;
        }
        
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      
      if (particles.length > 0) {
        requestAnimationFrame(animateParticles);
      }
    };
    
    animateParticles();
  }

  return { cleanup }; // מאפשר לסיים את האנימציה מבחוץ במידת הצורך
};

/**
 * הצגת אנימציית השגת הישג משודרגת
 * @param {Object} achievement - ההישג שהושג
 * @param {Object} styles - סגנונות CSS
 * @param {Function} onComplete - קולבק לביצוע בסיום האנימציה
 */
export const showAchievementAnimation = (achievement, styles, onComplete) => {
  // יצירת אלמנט האנימציה
  const achievementDiv = document.createElement("div");
  achievementDiv.className = `${styles.achievementAnimation} ${styles.enterAnimation}`;
  
  // מזהה ייחודי לאנימציה זו
  const uniqueId = generateUniqueId();

  // קביעת צבעים וסגנונות לפי רמת ההישג
  let achievementLevel = achievement.level || "bronze";
  let bgColor = "#CD7F32"; // ברונזה ברירת מחדל
  let glowColor = "#8B4513"; // חום ברירת מחדל
  let bgGradient = "linear-gradient(135deg, #A5682A 0%, #CD7F32 40%, #EEBA64 60%, #CD7F32 100%)";
  let soundVolume = 0.5;
  
  if (achievementLevel === "silver") {
    bgColor = "#C0C0C0";
    glowColor = "#808080";
    bgGradient = "linear-gradient(135deg, #A8A9AD 0%, #C0C0C0 40%, #EAECEE 60%, #C0C0C0 100%)";
  } else if (achievementLevel === "gold") {
    bgColor = "#FFD700";
    glowColor = "#FFA500";
    bgGradient = "linear-gradient(135deg, #E5BC4E 0%, #FFD700 40%, #FFF380 60%, #FFD700 100%)";
    soundVolume = 0.6;
  } else if (achievementLevel === "platinum") {
    bgColor = "#E5E4E2";
    glowColor = "#9EB1CD";
    bgGradient = "linear-gradient(135deg, #D5D6D8 0%, #E5E4E2 40%, #F7F7F7 60%, #E5E4E2 100%)";
    soundVolume = 0.7;
  }

  // הוספת תוכן האנימציה - עיצוב משודרג עם אנימציות מתקדמות
  achievementDiv.innerHTML = `
    <div class="${styles.achievementUnlock}" style="background: ${bgGradient};">
      <div class="${styles.achievementIconContainer}">
        <svg class="${styles.achievementBadge}" width="80" height="80" viewBox="0 0 100 100">
          <defs>
            <filter id="iconGlow${uniqueId}" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow"/>
              <feMerge>
                <feMergeNode in="glow"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="badgeGradient${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFFFFF" />
              <stop offset="50%" stop-color="${bgColor}" />
              <stop offset="100%" stop-color="${glowColor}" />
            </linearGradient>
          </defs>
          
          <!-- רקע עיגול -->
          <circle cx="50" cy="50" r="40" fill="url(#badgeGradient${uniqueId})" 
                  stroke="${glowColor}" stroke-width="2" filter="url(#iconGlow${uniqueId})" />
          
          <!-- קו מסגרת חיצונית מעוטרת -->
          <circle cx="50" cy="50" r="45" fill="none" 
                  stroke="${glowColor}" stroke-width="1.5" 
                  stroke-dasharray="8,4" filter="url(#iconGlow${uniqueId})" opacity="0.8">
            <animateTransform attributeName="transform" type="rotate" 
                              from="0 50 50" to="360 50 50" 
                              dur="20s" repeatCount="indefinite" />
          </circle>
          
          <!-- הוספת האייקון במרכז -->
          <foreignObject x="25" y="25" width="50" height="50">
            <div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; font-size: 30px;">
              ${achievement.icon}
            </div>
          </foreignObject>
          
          <!-- אפקט ניצוצות סביב האייקון -->
          ${Array.from({length: 6}, (_, i) => {
            const angle = i * 60 * Math.PI / 180;
            const cx = 50 + Math.cos(angle) * 40;
            const cy = 50 + Math.sin(angle) * 40;
            const delay = i * 0.2;
            return `
              <circle class="${styles.sparkle}" cx="${cx}" cy="${cy}" r="2" fill="#FFFFFF" opacity="0">
                <animate attributeName="opacity" from="0" to="0.8" dur="0.3s" begin="${delay}s" fill="freeze" />
                <animate attributeName="opacity" from="0.8" to="0" dur="0.5s" begin="${delay + 0.3}s" fill="freeze" />
                <animate attributeName="r" from="0" to="3" dur="0.3s" begin="${delay}s" fill="freeze" />
                <animate attributeName="r" from="3" to="0" dur="0.5s" begin="${delay + 0.3}s" fill="freeze" />
              </circle>
            `;
          }).join('')}
        </svg>
      </div>
      
      <div class="${styles.achievementContent}">
        <div class="${styles.achievementBanner}">
          <svg width="150" height="30" viewBox="0 0 150 30">
            <defs>
              <linearGradient id="bannerGradient${uniqueId}" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="${glowColor}" stop-opacity="0.3" />
                <stop offset="50%" stop-color="${glowColor}" stop-opacity="0.8" />
                <stop offset="100%" stop-color="${glowColor}" stop-opacity="0.3" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="150" height="30" fill="url(#bannerGradient${uniqueId})" rx="5" ry="5" />
            <text x="75" y="20" font-family="Arial, sans-serif" font-weight="bold" font-size="14" 
                  fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">
              הישג חדש!
            </text>
          </svg>
        </div>
        <div class="${styles.achievementTitle}">${achievement.title}</div>
        <div class="${styles.achievementDescription}">${achievement.description}</div>
        
        <div class="${styles.achievementReward}">
          ${achievement.reward ? `
            <div class="${styles.rewardContainer}">
              <div class="${styles.rewardIcon}">🎁</div>
              <div class="${styles.rewardText}">${achievement.reward}</div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
    
    <!-- אפקט חלקיקים עבור רקע חגיגי -->
    <div class="${styles.confetti}">
      ${Array.from({length: 20}, (_, i) => {
        const size = Math.random() * 8 + 4;
        const left = Math.random() * 100;
        const animDuration = Math.random() * 3 + 2;
        const delay = Math.random() * 1;
        const color = ['#FFD700', '#C0C0C0', '#CD7F32', '#FFFFFF'][Math.floor(Math.random() * 4)];
        const rotation = Math.random() * 360;
        const shape = Math.random() > 0.5 ? 
          `<div class="${styles.confettiParticle}" style="width:${size}px; height:${size}px; background-color:${color}; left:${left}%; animation-duration:${animDuration}s; animation-delay:${delay}s; transform:rotate(${rotation}deg);"></div>` : 
          `<div class="${styles.confettiParticle}" style="width:${size}px; height:${size}px; border-radius:50%; background-color:${color}; left:${left}%; animation-duration:${animDuration}s; animation-delay:${delay}s;"></div>`;
        return shape;
      }).join('')}
    </div>
  `;

  // הוספה למסמך וניהול מחזור חיים
  const { cleanup } = addElementWithLifecycle(achievementDiv, 4000, 500, onComplete);

  // הוספת סאונד השגת הישג
  SoundManager.play("/assets/sounds/achievement.mp3", soundVolume);

  return { cleanup }; // מאפשר לסיים את האנימציה מבחוץ במידת הצורך
};

/**
 * יצירת אנימציית התקדמות בהליכה משודרגת
 * @param {number} distance - המרחק שהולך במטרים
 * @param {number} steps - מספר הצעדים
 * @param {Object} styles - סגנונות CSS
 */
export const showWalkingAnimation = (distance, steps, styles) => {
  // יצירת אנימציה רק אם המרחק משמעותי
  if (distance < 5) return null;

  const walkDiv = document.createElement("div");
  walkDiv.className = `${styles.walkAnimation} ${styles.slideInAnimation}`;

  // תצוגה משופרת עם אנימציית הליכה
  walkDiv.innerHTML = `
    <div class="${styles.walkMessage}">
      <div class="${styles.walkIconContainer}">
        <div class="${styles.walkIcon}">
          <svg width="40" height="40" viewBox="0 0 40 40">
            <defs>
              <linearGradient id="footprintGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#1E88E5" />
                <stop offset="100%" stop-color="#0D47A1" />
              </linearGradient>
            </defs>
            
            <!-- אייקון עקבות משופר -->
            <path d="M8,16 C10,10 15,8 18,10 C21,12 21,16 19,21 C17,26 14,28 11,26 C8,24 6,22 8,16 Z" 
                  fill="url(#footprintGradient)" opacity="0.85" />
            <path d="M28,12 C30,6 35,4 38,6 C41,8 41,12 39,17 C37,22 34,24 31,22 C28,20 26,18 28,12 Z" 
                  fill="url(#footprintGradient)" opacity="0.85" transform="translate(-8, 8)" />
          </svg>
        </div>
      </div>
      
      <div class="${styles.walkText}">
        <span class="${styles.walkDistance}">+${distance.toFixed(1)} מטר</span>
        <div class="${styles.walkProgressContainer}">
          <div class="${styles.walkProgressBar}" style="width: 0%"></div>
          <span class="${styles.walkSteps}">+${steps} צעדים</span>
        </div>
      </div>
    </div>
  `;

  // הוספה למסמך וניהול מחזור חיים
  const { cleanup } = addElementWithLifecycle(walkDiv, 2500, 400);

  // אנימציית התקדמות הפס
  setTimeout(() => {
    const progressBar = walkDiv.querySelector(`.${styles.walkProgressBar}`);
    if (progressBar) {
      progressBar.style.width = '100%';
    }
  }, 100);

  // הפעלת סאונד צעדים אם המרחק גדול
  if (distance > 10) {
    SoundManager.play("/assets/sounds/walking.mp3", 0.2);
  }

  return { cleanup }; // מאפשר לסיים את האנימציה מבחוץ במידת הצורך
};

/**
 * אנימציית מעבר בין מיקומים משודרגת
 * @param {Object} targetPosition - המיקום אליו עוברים
 * @param {string} locationName - שם המיקום
 * @param {Object} styles - סגנונות CSS
 * @param {Function} onComplete - קולבק לביצוע בסיום האנימציה
 */
export const showTransitionAnimation = (targetPosition, locationName, styles, onComplete) => {
  // יצירת שכבת האנימציה
  const transitionDiv = document.createElement("div");
  transitionDiv.className = `${styles.transitionAnimation} ${styles.fullscreen}`;
  
  // מזהה ייחודי לאנימציה זו
  const uniqueId = generateUniqueId();

  // אפקט מעבר דינמי המבוסס על מיקומים
  const entranceDirection = Math.random() > 0.5 ? 'right' : 'left';
  const entranceClass = styles[`enterFrom${entranceDirection.charAt(0).toUpperCase() + entranceDirection.slice(1)}`] || '';

  // הוספת תוכן האנימציה
  transitionDiv.innerHTML = `
    <div class="${styles.transitionContent} ${entranceClass}">
      <div class="${styles.transitionLoader}">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="loaderGradient${uniqueId}" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#3498db" />
              <stop offset="50%" stop-color="#9b59b6" />
              <stop offset="100%" stop-color="#3498db" />
              <animate attributeName="x1" from="0%" to="100%" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="x2" from="100%" to="200%" dur="1.5s" repeatCount="indefinite" />
            </linearGradient>
            <filter id="loaderBlur${uniqueId}" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          <!-- טבעת טעינה חיצונית -->
          <circle cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="url(#loaderGradient${uniqueId})" 
                  stroke-width="5"
                  stroke-linecap="round"
                  stroke-dasharray="251.2"
                  stroke-dashoffset="0"
                  filter="url(#loaderBlur${uniqueId})">
            <animateTransform attributeName="transform"
                              type="rotate"
                              from="0 50 50"
                              to="360 50 50"
                              dur="3s"
                              repeatCount="indefinite"/>
          </circle>
          
          <!-- טבעת טעינה פנימית (בכיוון הפוך) -->
          <circle cx="50" cy="50" r="25" 
                  fill="none" 
                  stroke="url(#loaderGradient${uniqueId})" 
                  stroke-width="4"
                  stroke-linecap="round"
                  stroke-dasharray="157"
                  stroke-dashoffset="0"
                  opacity="0.8"
                  filter="url(#loaderBlur${uniqueId})">
            <animateTransform attributeName="transform"
                              type="rotate"
                              from="360 50 50"
                              to="0 50 50"
                              dur="2s"
                              repeatCount="indefinite"/>
          </circle>
                    
          <!-- אייקון מיקום במרכז שמופיע בהדרגה -->
          <g opacity="0">
            <animate attributeName="opacity" from="0" to="1" begin="0.5s" dur="0.5s" fill="freeze" />
            <path d="M50,25 C38.954,25 30,33.954 30,45 C30,60 50,75 50,75 C50,75 70,60 70,45 C70,33.954 61.046,25 50,25 Z" 
                  fill="#FFFFFF" />
            <circle cx="50" cy="45" r="5" fill="#3498db" />
          </g>
        </svg>
      </div>
      
      <div class="${styles.transitionText}">
        <h3>מעבר אל</h3>
        <h2 class="${styles.locationName}">${locationName || 'מיקום חדש'}</h2>
        
        <!-- סמן טעינה -->
        <div class="${styles.loadingDots}">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      
      <!-- אפקט גלים -->
      <div class="${styles.transitionWaves}">
        ${Array.from({length: 3}, (_, i) => {
          const delay = i * 0.3;
          return `<div class="${styles.wave}" style="animation-delay: ${delay}s;"></div>`;
        }).join('')}
      </div>
    </div>
  `;}