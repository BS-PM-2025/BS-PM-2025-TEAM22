class StarMarkerManager {
  /**
   * יוצר מופע חדש של מנהל סמני כוכבים
   */
  constructor() {
    // מערכי ניהול סמנים
    this.markers = [];
    this.activeMarkers = {};

    // הגדרות ביצועים
    this.lastRefresh = 0;
    this.refreshInterval = 100; // מילישניות בין רענונים ויזואליים
    this.performanceMode = false; // מתג אוטומטי לפי מספר סמנים
    this.maxVisibleMarkers = 50; // הגבלת מספר סמנים מוצגים לביצועים

    // הגדרות תצוגה
    this.discoveryMode = false; // מצב חקר - מציג את כל הכוכבים
    this.audioEnabled = true; // האם צלילים מופעלים

    // מטמון מזהים אקראיים
    this.randomCubes = [];
    for (let i = 0; i < 110; i++) {
      this.randomCubes.push(Math.random().toString(36).substring(2, 8));
    }

    // אתחול הגדרות ויזואליות לסוגי כוכבים
    this.starTypeConfigs = this._initStarTypeConfigs();

    // מערך לניהול חלקיקים
    this.particles = [];
    this.visibleStarsList = [];
  }

  /**
   * אתחול הגדרות ויזואליות לסוגי כוכבים
   * @private
   * @returns {Object} הגדרות הכוכבים
   */
  _initStarTypeConfigs() {
    return {
      regular: {
        color: "#FFD700", // צהוב
        glowColor: "#FFA500", // כתום
        size: 60,
        pulseSpeed: 1.0,
        hasGlow: true,
        points: [1, 3],
        xpValue: [5, 10],
        coinValue: [1, 3],
        rarity: 0.6, // שכיחות
        collectSound: "star-collect.mp3",
        particlesOnCollect: 10,
      },
      silver: {
        color: "#C0C0C0", // כסף
        glowColor: "#808080", // אפור
        size: 65,
        pulseSpeed: 1.0,
        hasGlow: true,
        points: [3, 6],
        xpValue: [10, 20],
        coinValue: [3, 6],
        rarity: 0.2,
        collectSound: "star-silver.mp3",
        particlesOnCollect: 15,
      },
      gold: {
        color: "#FFD700", // זהב
        glowColor: "#FF8C00", // כתום כהה
        size: 70,
        pulseSpeed: 1.2,
        hasGlow: true,
        points: [5, 10],
        xpValue: [20, 30],
        coinValue: [5, 10],
        rarity: 0.1,
        collectSound: "star-gold.mp3",
        particlesOnCollect: 20,
      },
      bronze: {
        color: "#CD7F32", // ארד
        glowColor: "#8B4513", // חום
        size: 60,
        pulseSpeed: 0.9,
        hasGlow: true,
        points: [2, 4],
        xpValue: [8, 15],
        coinValue: [2, 4],
        rarity: 0.3,
        collectSound: "star-bronze.mp3",
        particlesOnCollect: 12,
      },
      platinum: {
        color: "#E5E4E2", // פלטינום
        glowColor: "#9EB1CD", // כסוף-כחלחל
        size: 75,
        pulseSpeed: 1.2,
        hasGlow: true,
        points: [10, 15],
        xpValue: [30, 50],
        coinValue: [10, 15],
        rarity: 0.05,
        collectSound: "star-platinum.mp3",
        particlesOnCollect: 25,
      },
      diamond: {
        color: "#B9F2FF", // יהלום
        glowColor: "#0099CC", // כחול
        size: 80,
        pulseSpeed: 1.3,
        hasGlow: true,
        points: [15, 25],
        xpValue: [50, 80],
        coinValue: [20, 30],
        rarity: 0.02,
        collectSound: "star-diamond.mp3",
        particlesOnCollect: 30,
      },
      ruby: {
        color: "#E0115F", // אדום רובי
        glowColor: "#B0022D", // אדום כהה
        size: 75,
        pulseSpeed: 1.2,
        hasGlow: true,
        points: [12, 20],
        xpValue: [40, 70],
        coinValue: [15, 25],
        rarity: 0.03,
        collectSound: "star-ruby.mp3",
        particlesOnCollect: 25,
      },
      // סוגים נושאיים
      culture: {
        color: "#9C27B0", // סגול
        glowColor: "#7B1FA2", // סגול כהה
        size: 75,
        pulseSpeed: 1.1,
        hasGlow: true,
        points: [8, 15],
        xpValue: [30, 50],
        coinValue: [8, 15],
        rarity: 0.05,
        collectSound: "star-culture.mp3",
        particlesOnCollect: 20,
        shape: "culture", // צורה מיוחדת
      },
      history: {
        color: "#3F51B5", // כחול אינדיגו
        glowColor: "#303F9F", // כחול כהה
        size: 75,
        pulseSpeed: 1.0,
        hasGlow: true,
        points: [8, 15],
        xpValue: [30, 50],
        coinValue: [8, 15],
        rarity: 0.05,
        collectSound: "star-history.mp3",
        particlesOnCollect: 20,
        shape: "history",
      },
      nature: {
        color: "#4CAF50", // ירוק
        glowColor: "#388E3C", // ירוק כהה
        size: 75,
        pulseSpeed: 1.1,
        hasGlow: true,
        points: [8, 15],
        xpValue: [30, 50],
        coinValue: [8, 15],
        rarity: 0.05,
        collectSound: "star-nature.mp3",
        particlesOnCollect: 20,
        shape: "nature",
      },
      event: {
        color: "#FF4081", // ורוד
        glowColor: "#D81B60", // ורוד כהה
        size: 80,
        pulseSpeed: 1.4,
        hasGlow: true,
        points: [20, 30],
        xpValue: [100, 150],
        coinValue: [30, 50],
        rarity: 0.01,
        collectSound: "star-event.mp3",
        particlesOnCollect: 35,
        shape: "event",
      },
      landmark: {
        color: "#E91E63", // ורוד
        glowColor: "#C2185B", // ורוד כהה
        size: 80, // גדול יותר לציוני דרך
        pulseSpeed: 1.3,
        hasGlow: true,
        points: [15, 25],
        xpValue: [50, 80],
        coinValue: [15, 30],
        rarity: 0.01,
        collectSound: "star-landmark.mp3",
        particlesOnCollect: 30,
        shape: "landmark",
      },
      wonder: {
        color: "#FFC107", // צהוב-כתום
        glowColor: "#FFA000", // כתום
        size: 85, // הגדול ביותר לפלאי עולם
        pulseSpeed: 1.5,
        hasGlow: true,
        points: [25, 40],
        xpValue: [80, 120],
        coinValue: [25, 40],
        rarity: 0.005,
        collectSound: "star-wonder.mp3",
        particlesOnCollect: 40,
        shape: "wonder",
      },
    };
  }

  /**
   * ניקוי כל הסמנים ממפת Street View
   */
  clearMarkers() {
    this.markers.forEach((marker) => {
      // ניקוי פונקציות אנימציה קודמות
      if (marker._pulseAnimation) {
        clearInterval(marker._pulseAnimation);
      }
      if (marker._glowEffect) {
        clearInterval(marker._glowEffect);
      }
      // הסרת הסמן מהמפה
      marker.setMap(null);
    });

    // איפוס מערכי המידע
    this.markers = [];
    this.activeMarkers = {};
  }

  /**
   * הוספת כוכבים למפת Street View
   * @param {Object} panorama - אובייקט פנורמת Street View
   * @param {Array} starsArray - מערך כוכבים להוספה
   * @param {Function} onStarClick - פונקציית לחיצה על כוכב
   */
  addStarsToStreetView(panorama, starsArray, onStarClick) {
    if (!panorama || !starsArray) {
      console.warn("Cannot add stars - missing panorama or stars data");
      return;
    }

    console.log(`Adding ${starsArray.length} stars to Street View`);

    // ניקוי סמנים קודמים
    this.clearMarkers();

    // קביעת מצב ביצועים לפי מספר כוכבים
    this.performanceMode = starsArray.length > 100;

    // יצירת סמנים לכוכבים
    starsArray.forEach((star) => {
      if (star.collected) {
        return; // דילוג על כוכבים שכבר נאספו
      }

      try {
        // יצירת סמן עבור כוכב זה
        const starMarker = this._createStarMarker(panorama, star, onStarClick);

        if (starMarker) {
          // שמירת הפניה לסמן עם המזהה שלו לגישה מהירה
          this.activeMarkers[star.id] = starMarker;
          this.markers.push(starMarker);
        }
      } catch (error) {
        console.error(`Error creating marker for star ${star.id}:`, error);
      }
    });

    console.log(`Added ${this.markers.length} star markers`);

    // הגדרת בדיקת נראות בשינוי פנורמה
    if (panorama && this.markers.length > 0) {
      panorama.addListener("position_changed", () => {
        this._updateMarkersVisibility(panorama);
      });

      panorama.addListener("pov_changed", () => {
        this._updateMarkersVisibility(panorama);
      });

      // עדכון נראות ראשוני
      this._updateMarkersVisibility(panorama);
    }
  }

  /**
   * יצירת סמן כוכב בודד
   * @private
   * @param {Object} panorama - אובייקט פנורמת Street View
   * @param {Object} star - נתוני הכוכב
   * @param {Function} onStarClick - פונקציית לחיצה על כוכב
   * @returns {Object} סמן Google Maps
   */
  _createStarMarker(panorama, star, onStarClick) {
    // קביעת תצורה לפי סוג הכוכב
    let starConfig =
      this.starTypeConfigs[star.type] || this.starTypeConfigs.regular;

    // יצירת SVG עבור הכוכב על פי סוגו
    const svgContent = this._generateStarSVG(star, starConfig);

    // יצירת סמן Google Maps
    const starMarker = new window.google.maps.Marker({
      position: { lat: star.lat, lng: star.lng },
      map: panorama,
      title: this._generateStarTitle(star),
      icon: {
        url:
          "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svgContent),
        scaledSize: new window.google.maps.Size(
          starConfig.size,
          starConfig.size
        ),
        anchor: new window.google.maps.Point(
          starConfig.size / 2,
          starConfig.size / 2
        ),
      },
      optimized: this.performanceMode, // true לביצועים, false לאנימציות טובות יותר
      clickable: true,
      zIndex: this._getStarZIndex(star),
      opacity: 0.9,
      visible: false, // נסתר עד לבדיקת נראות
    });

    // הוספת אנימציות במצב לא-מופטמז בלבד
    if (!this.performanceMode) {
      // הגדרת אנימציית פעימה עם מהירות דינמית
      this._setupPulseAnimation(starMarker, starConfig.pulseSpeed);

      // הוספת זוהר נוסף לכוכבים מיוחדים
      if (
        star.type === "landmark" ||
        star.type === "wonder" ||
        star.type === "event"
      ) {
        this._setupGlowEffect(starMarker);
      }
    }

    // טיפול בלחיצה על כוכב
    starMarker.addListener("click", () => {
      // עצירת אנימציות
      if (starMarker._pulseAnimation) {
        clearInterval(starMarker._pulseAnimation);
      }
      if (starMarker._glowEffect) {
        clearInterval(starMarker._glowEffect);
      }

      // ניגון אנימציית איסוף לפני הסרה
      this._playCollectionAnimation(starMarker);

      // הסרת סמן מהמפה
      setTimeout(() => {
        starMarker.setMap(null);

        // הסרה מההפניות הפנימיות
        delete this.activeMarkers[star.id];
        const index = this.markers.indexOf(starMarker);
        if (index > -1) {
          this.markers.splice(index, 1);
        }

        // קריאה למטפל הלחיצה עם נתוני הכוכב
        if (onStarClick) {
          onStarClick(star);
        }
      }, 100);
    });

    return starMarker;
  }

  /**
   * יצירת SVG לכוכב
   * @private
   * @param {Object} star - נתוני הכוכב
   * @param {Object} starConfig - תצורת הכוכב
   * @returns {string} תוכן SVG
   */
  _generateStarSVG(star, starConfig) {
    // מזהה ייחודי למניעת התנגשויות
    const uniqueId = `star_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const starColor = starConfig.color;
    const glowColor = starConfig.glowColor;
    const hasGlow = starConfig.hasGlow;

    // צורות שונות לסוגי כוכבים שונים
    let starPath = "";
    let viewBox = "0 0 60 60";

    // כוכב 5 קודקודים רגיל
    starPath =
      "M 30,10 L 37,24 L 52,26 L 41,37 L 43,52 L 30,45 L 17,52 L 19,37 L 8,26 L 23,24 Z";

    // עבור סוגי כוכבים מיוחדים, השתמש בצורות שונות
    if (star.type === "landmark") {
      // צורת ציון דרך (מעין יהלום עם נקודה נוספת למעלה)
      starPath =
        "M 30,5 L 40,20 L 50,30 L 40,40 L 30,55 L 20,40 L 10,30 L 20,20 Z";
    } else if (star.type === "wonder") {
      // כוכב בעל 8 קודקודים לפלאי עולם
      starPath =
        "M 30,5 L 34,19 L 45,10 L 42,25 L 55,30 L 42,35 L 45,50 L 34,41 L 30,55 L 26,41 L 15,50 L 18,35 L 5,30 L 18,25 L 15,10 L 26,19 Z";
    } else if (star.type === "culture") {
      // צורת פרח לכוכבי תרבות
      viewBox = "0 0 100 100";
      starPath =
        "M 50,20 C 60,10 70,10 80,20 C 90,30 90,40 80,50 C 90,60 90,70 80,80 C 70,90 60,90 50,80 C 40,90 30,90 20,80 C 10,70 10,60 20,50 C 10,40 10,30 20,20 C 30,10 40,10 50,20 Z";
    } else if (star.type === "history") {
      // צורת מגילה לכוכבי היסטוריה
      viewBox = "0 0 100 100";
      starPath =
        "M 25,25 L 75,25 L 75,75 Q 50,60 25,75 L 25,25 Z M 25,25 Q 40,35 50,35 Q 60,35 75,25";
    } else if (star.type === "nature") {
      // צורת עלה לכוכבי טבע
      viewBox = "0 0 100 100";
      starPath =
        "M 50,20 Q 85,20 80,80 Q 20,75 20,40 Q 20,20 50,20 Z M 50,40 Q 60,60 65,80";
    }

    // יצירת SVG עם פילטרים ואפקטים מתאימים
    let filterDef = "";
    if (hasGlow) {
      filterDef = `
        <filter id="glow_${uniqueId}">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      `;
    }

    // סגנון שונה לסוגי כוכבים שונים
    let extraStyling = "";
    if (
      star.type === "landmark" ||
      star.type === "wonder" ||
      star.type === "event"
    ) {
      extraStyling = `
        <circle cx="30" cy="30" r="25" fill="${starColor}" fill-opacity="0.3" />
        <circle cx="30" cy="30" r="22" fill="${starColor}" fill-opacity="0.1" />
      `;
    }

    // הוספת טקסט נקודות ל-SVG
    const pointsDisplay =
      star.points && star.points > 0
        ? `<text x="30" y="34" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#FFFFFF">${star.points}</text>`
        : "";

    // SVG מלא
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="${viewBox}">
        <defs>
          ${filterDef}
          <radialGradient id="starGrad_${uniqueId}" cx="50%" cy="50%" r="70%" fx="30%" fy="30%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="40%" stop-color="${starColor}" />
            <stop offset="90%" stop-color="${glowColor}" />
            <stop offset="100%" stop-color="${glowColor}" stop-opacity="0.7" />
          </radialGradient>
        </defs>
        ${extraStyling}
        <path d="${starPath}" 
              fill="url(#starGrad_${uniqueId})" 
              stroke="${glowColor}" 
              stroke-width="1.5"
              ${hasGlow ? `filter="url(#glow_${uniqueId})"` : ""}
        />
        ${pointsDisplay}
      </svg>
    `;
  }

  /**
   * יצירת כותרת לטיפ של הכוכב
   * @private
   * @param {Object} star - נתוני הכוכב
   * @returns {string} כותרת מפורמטת לטיפ
   */
  _generateStarTitle(star) {
    let typeName = "";
    switch (star.type) {
      case "gold":
        typeName = "זהב";
        break;
      case "silver":
        typeName = "כסף";
        break;
      case "bronze":
        typeName = "ארד";
        break;
      case "culture":
        typeName = "תרבות";
        break;
      case "history":
        typeName = "היסטוריה";
        break;
      case "nature":
        typeName = "טבע";
        break;
      case "landmark":
        typeName = "אתר מפורסם";
        break;
      case "wonder":
        typeName = "פלא עולם";
        break;
      case "platinum":
        typeName = "פלטינה";
        break;
      case "diamond":
        typeName = "יהלום";
        break;
      case "ruby":
        typeName = "אודם";
        break;
      case "event":
        typeName = "אירוע";
        break;
      default:
        typeName = "רגיל";
    }

    let title = `כוכב ${typeName} - ${star.points} נקודות`;

    // הוספת שם מיקום אם זמין
    if (star.locationName) {
      title = `${star.locationName} - ${title}`;
    }

    return title;
  }

  /**
   * קבלת z-index לסמן כוכב לפי סוגו
   * @private
   * @param {Object} star - נתוני הכוכב
   * @returns {number} ערך z-index
   */
  _getStarZIndex(star) {
    // ערכים גבוהים יותר מופיעים מעל לנמוכים
    switch (star.type) {
      case "wonder":
        return 150;
      case "landmark":
        return 140;
      case "gold":
        return 130;
      case "diamond":
        return 125;
      case "platinum":
        return 123;
      case "ruby":
        return 122;
      case "culture":
      case "history":
      case "nature":
        return 120;
      case "event":
        return 115;
      case "silver":
        return 110;
      case "bronze":
        return 105;
      default:
        return 100;
    }
  }

  /**
   * הגדרת אנימציית פעימה לכוכב
   * @private
   * @param {Object} marker - סמן Google Maps
   * @param {number} speedFactor - מהירות האנימציה
   */
 _setupPulseAnimation(marker, speedFactor = 1) {
  if (!marker || typeof marker.setIcon !== 'function') return;

  let scale = 1;
  let growing = true;
  const pulseSpeed = 0.00005 * speedFactor; // עדין יותר עם requestAnimationFrame
  const minScale = 0.85;
  const maxScale = 1.15;
  let lastTimestamp = null;

  const originalIcon = marker.getIcon();
  if (!originalIcon || !originalIcon.scaledSize) return;

  const baseWidth = originalIcon.scaledSize.width;
  const baseHeight = originalIcon.scaledSize.height;

  const animate = (timestamp) => {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    const deltaScale = pulseSpeed * delta;

    scale += (growing ? 1 : -1) * deltaScale;
    if (scale >= maxScale) {
      scale = maxScale;
      growing = false;
    } else if (scale <= minScale) {
      scale = minScale;
      growing = true;
    }

    try {
      marker.setIcon({
        ...originalIcon,
        scaledSize: new window.google.maps.Size(
          baseWidth * scale,
          baseHeight * scale
        ),
      });

      marker._pulseAnimation = requestAnimationFrame(animate);
    } catch (e) {
      console.warn("Pulse animation error:", e);
      cancelAnimationFrame(marker._pulseAnimation);
    }
  };

  marker.originalScale = scale;
  marker._pulseAnimation = requestAnimationFrame(animate);
}

  /**
   * הגדרת אפקט זוהר לכוכבים מיוחדים
   * @private
   * @param {Object} marker - סמן Google Maps
   */
  _setupGlowEffect(marker) {
    let opacity = 1;
    let decreasing = true;

    const glowEffect = setInterval(() => {
      try {
        if (decreasing) {
          opacity -= 0.03;
          if (opacity <= 0.7) decreasing = false;
        } else {
          opacity += 0.03;
          if (opacity >= 1) decreasing = true;
        }

        marker.setOpacity(opacity);
      } catch (e) {
        console.warn("Error in glow effect:", e);
        clearInterval(glowEffect);
      }
    }, 100);

    marker._glowEffect = glowEffect;
  }

  /**
   * ניגון אנימציית איסוף לכוכב
   * @private
   * @param {Object} marker - סמן Google Maps
   */
  _playCollectionAnimation(marker) {
    // אפקט דעיכה פשוט
    const fadeOut = setInterval(() => {
      const opacity = marker.getOpacity();
      if (opacity > 0.1) {
        marker.setOpacity(opacity - 0.1);
      } else {
        clearInterval(fadeOut);
      }
    }, 10);
  }

  /**
   * יצירת התפרצות חלקיקים סביב כוכב
   * @param {string} starId - מזהה הכוכב
   * @param {number} count - מספר חלקיקים
   * @param {string} color - צבע החלקיקים
   */
  createParticleBurst(starId, count = 20, color = "#FFD700") {
    const marker = this.activeMarkers[starId];
    if (!marker) return;

    const position = marker.getPosition();
    for (let i = 0; i < count; i++) {
      const particle = {
        id: `particle_${Date.now()}_${i}`,
        position: {
          lat: position.lat(),
          lng: position.lng(),
        },
        velocity: {
          x: (Math.random() - 0.5) * 0.00001,
          y: (Math.random() - 0.5) * 0.00001,
        },
        size: Math.random() * 5 + 2,
        color: color,
        alpha: 1,
        life: 1, // 0-1
      };

      this.particles.push(particle);
    }

    // אם אין עדיין אנימציית חלקיקים, הפעל אותה
    if (!this._particleAnimation) {
      this._animateParticles();
    }
  }

  /**
   * אנימציית חלקיקים
   * @private
   */
  _animateParticles() {
    this._particleAnimation = setInterval(() => {
      // עדכון חלקיקים
      this.particles.forEach((particle) => {
        // עדכון מיקום
        particle.position.lat += particle.velocity.y;
        particle.position.lng += particle.velocity.x;

        // עדכון חיים
        particle.life -= 0.02;
        particle.alpha = particle.life;
        particle.size *= 0.98;
      });

      // סינון חלקיקים שהסתיימו
      this.particles = this.particles.filter((p) => p.life > 0);

      // עצירת האנימציה אם אין חלקיקים
      if (this.particles.length === 0) {
        clearInterval(this._particleAnimation);
        this._particleAnimation = null;
      }
    }, 50);
  }

  /**
   * עדכון סמנים על סמך נתוני כוכבים מעודכנים
   * @param {Object} panorama - אובייקט פנורמת Street View
   * @param {Array} updatedStars - מערך כוכבים מעודכן
   * @param {Function} onStarClick - פונקציית לחיצה על כוכב
   */
  updateMarkers(panorama, updatedStars, onStarClick) {
    if (!panorama || !updatedStars) return;

    // עדכון יעיל שממזער ציורים מחדש

    // 1. מצא כוכבים שנאספו
    const collectedStarIds = new Set();
    updatedStars
      .filter((star) => star.collected)
      .forEach((star) => {
        collectedStarIds.add(star.id);
      });

    // 2. הסר סמני כוכבים שנאספו
    collectedStarIds.forEach((id) => {
      if (this.activeMarkers[id]) {
        const marker = this.activeMarkers[id];

        // עצירת אנימציות
        if (marker._pulseAnimation) {
          clearInterval(marker._pulseAnimation);
        }
        if (marker._glowEffect) {
          clearInterval(marker._glowEffect);
        }

        // הסרה מהמפה
        marker.setMap(null);

        // הסרה מהאוספים שלנו
        delete this.activeMarkers[id];
        const index = this.markers.indexOf(marker);
        if (index > -1) {
          this.markers.splice(index, 1);
        }
      }
    });

    // 3. מצא כוכבים חדשים שצריכים סמנים
    const existingStarIds = new Set(Object.keys(this.activeMarkers));
    const newStars = updatedStars.filter(
      (star) => !star.collected && !existingStarIds.has(star.id)
    );

    // 4. הוסף סמנים לכוכבים חדשים
    if (newStars.length > 0) {
      newStars.forEach((star) => {
        try {
          const starMarker = this._createStarMarker(
            panorama,
            star,
            onStarClick
          );
          if (starMarker) {
            this.activeMarkers[star.id] = starMarker;
            this.markers.push(starMarker);
          }
        } catch (error) {
          console.error(
            `Error creating marker for new star ${star.id}:`,
            error
          );
        }
      });
    }

    // 5. עדכן נראות על סמך התצוגה הנוכחית
    this._updateMarkersVisibility(panorama);
  }

  /**
   * עדכון תכונות ספציפיות של כוכב
   * @param {string} starId - מזהה הכוכב לעדכון
   * @param {Object} properties - תכונות חדשות להחלה
   */
  updateStarProperties(starId, properties) {
    const marker = this.activeMarkers[starId];
    if (!marker) return;

    // עדכון אייקון אם סוג או תכונות ויזואליות אחרות השתנו
    if (properties.type || properties.points) {
      // נדרש האובייקט כוכב המלא, שלא קיים כאן
      console.log(`Would update star ${starId} with properties:`, properties);
    }

    // עדכון מיקום אם lat/lng השתנו
    if (properties.lat !== undefined && properties.lng !== undefined) {
      marker.setPosition(
        new window.google.maps.LatLng(properties.lat, properties.lng)
      );
    }
  }

  /**
   * עדכון נראות סמנים על סמך מרחק ותצוגה
   * @private
   * @param {Object} panorama - אובייקט Street View Panorama
   */
  _updateMarkersVisibility(panorama) {
    // ויסות עדכונים לביצועים
    const now = Date.now();
    if (now - this.lastRefresh < this.refreshInterval) {
      return;
    }
    this.lastRefresh = now;

    if (!panorama || this.markers.length === 0) return;

    try {
      // קבל מיקום ונקודת מבט נוכחיים
      const position = panorama.getPosition();
      const pov = panorama.getPov();
      const heading = pov.heading || 0;
      const pitch = pov.pitch || 0;
      const fov = 90; // שדה ראייה במעלות (הערכה)

      // עקוב אחר כוכבים נראים לדיווח חיצוני
      const visibleStars = [];
      let visibleCount = 0;

      // התאם נראות סמנים
      for (let i = 0; i < this.markers.length; i++) {
        const marker = this.markers[i];
        const starPosition = marker.getPosition();

        // דלג אם מיקום לא חוקי
        if (!position || !starPosition) continue;

        try {
          // חשב מרחק לכוכב
          const distance =
            window.google.maps.geometry.spherical.computeDistanceBetween(
              position,
              starPosition
            );

          // דלג על כוכבים שרחוקים מדי
          const maxDistance = 300; // מטרים
          if (distance > maxDistance && !this.discoveryMode) {
            marker.setVisible(false);
            continue;
          }

          // חשב כיוון לכוכב
          const starHeading =
            window.google.maps.geometry.spherical.computeHeading(
              position,
              starPosition
            );

          // חשב זווית אנכית (בקירוב)
          const verticalDistance = 0; // בהנחה שכוכבים באותו גובה, אבל אפשר לחשב
          const starPitch =
            Math.atan2(verticalDistance, distance) * (180 / Math.PI);

          // חשב הפרש זוויתי בכיוון
          let headingDiff = Math.abs(starHeading - heading);
          if (headingDiff > 180) headingDiff = 360 - headingDiff;

          // חשב הפרש זוויתי בנטייה
          const pitchDiff = Math.abs(starPitch - pitch);

          // קבע אם הכוכב בשדה הראייה
          const inHorizontalFOV = headingDiff < fov / 2;
          const inVerticalFOV = pitchDiff < fov / 2;
          const inView = inHorizontalFOV && inVerticalFOV;

          // הגבל סמנים נראים לביצועים
          let isVisible =
            (inView || this.discoveryMode) &&
            visibleCount < this.maxVisibleMarkers;

          // עדכן נראות
          marker.setVisible(isVisible);

          // אם נראה, הוסף למערך המעקב שלנו
          if (isVisible) {
            visibleCount++;
            visibleStars.push({
              id: marker.get("starId") || "",
              marker: marker,
              distance: Math.round(distance),
              angle: Math.round(headingDiff),
            });
          }
        } catch (e) {
          console.warn("Error calculating star visibility:", e);
          marker.setVisible(false);
        }
      }

      // עדכן רשימת כוכבים נראים (ניתן לגשת חיצונית)
      this.visibleStarsList = visibleStars;
    } catch (e) {
      console.error("Error updating marker visibility:", e);
    }
  }

  /**
   * קבל כוכבים נראים בתצוגה הנוכחית
   * @param {Object} position - מיקום המצלמה הנוכחי
   * @param {number} heading - זווית המצפן הנוכחית
   * @returns {Array} מערך של מידע על כוכבים נראים
   */
  getVisibleStars(position = null, heading = null) {
    return this.visibleStarsList || [];
  }

  /**
   * בדיקה אם קיימים סמנים כלשהם
   * @returns {boolean} האם יש סמנים
   */
  hasMarkers() {
    return this.markers.length > 0;
  }

  /**
   * קבלת מספר כולל של סמנים
   * @returns {number} ספירת סמנים
   */
  getMarkerCount() {
    return this.markers.length;
  }

  /**
   * הפעלת/כיבוי מצב גילוי שמדגיש את כל הכוכבים
   * @param {boolean} enabled - האם מצב גילוי מופעל
   */
  setDiscoveryMode(enabled) {
    this.discoveryMode = enabled;

    this.markers.forEach((marker) => {
      // הצג את כל הכוכבים ללא קשר לתצוגה כאשר במצב גילוי
      if (this.discoveryMode) {
        marker.setVisible(true);
        marker.setOpacity(0.7);
      } else {
        // בעת כיבוי, אפס נראות על סמך תצוגה
        if (marker._lastVisibility !== undefined) {
          marker.setVisible(marker._lastVisibility);
          delete marker._lastVisibility;
        }
        marker.setOpacity(1.0);
      }
    });
  }

  /**
   * חשוף זמנית את כל הכוכבים בטווח מסוים
   * @param {Object} position - מיקום מרכזי
   * @param {number} range - טווח במטרים
   */
  revealAllStarsInRange(position, range) {
    if (!position) return;

    this.markers.forEach((marker) => {
      try {
        const starPosition = marker.getPosition();
        const distance =
          window.google.maps.geometry.spherical.computeDistanceBetween(
            position,
            starPosition
          );

        // שמור מצב נראות נוכחי
        marker._lastVisibility = marker.getVisible();

        // הצג אם בטווח
        if (distance <= range) {
          marker.setVisible(true);
          // הוסף אפקט פעימה
          marker.setAnimation(window.google.maps.Animation.BOUNCE);
          setTimeout(() => {
            marker.setAnimation(null);
          }, 2000);
        }
      } catch (e) {
        console.warn("Error in revealAllStarsInRange:", e);
      }
    });
  }

  /**
   * אפס נראות כוכבים לרגילה
   */
  resetStarVisibility() {
    this.markers.forEach((marker) => {
      // הסר מצב נראות שמור
      if (marker._lastVisibility !== undefined) {
        marker.setVisible(marker._lastVisibility);
        delete marker._lastVisibility;
      }

      // הסר אנימציות זמניות
      marker.setAnimation(null);
    });

    // אפס מצב גילוי
    this.discoveryMode = false;
  }

  /**
   * הפעל אפקט מיוחד על כוכב (למשל - פעימה, סיבוב, וכו')
   * @param {string} starId - מזהה הכוכב
   * @param {string} effectType - סוג האפקט
   */
  applySpecialEffectToStar(starId, effectType) {
    const marker = this.activeMarkers[starId];
    if (!marker) return;

    switch (effectType) {
      case "pulse":
        // אפקט פעימה מוגבר
        this._applyPulseEffect(marker, 2.0);
        break;
      case "rotate":
        // אפקט סיבוב
        this._applyRotateEffect(marker);
        break;
      case "bounce":
        // אפקט קפיצה
        this._applyBounceEffect(marker);
        break;
      case "glow":
        // אפקט זוהר מוגבר
        this._applyGlowEffect(marker, 2.0);
        break;
      default:
        // ברירת מחדל - אפקט פעימה רגיל
        this._applyPulseEffect(marker, 1.0);
    }
  }

  /**
   * החל אפקט סיבוב על סמן
   * @private
   * @param {Object} marker - הסמן
   */
  _applyRotateEffect(marker) {
    if (!marker || marker._rotateAnimation) return;

    let angle = 0;
    const rotateSpeed = 2; // מעלות לפריים

    const rotateAnimation = setInterval(() => {
      try {
        angle = (angle + rotateSpeed) % 360;

        if (marker.getIcon()) {
          const currentIcon = marker.getIcon();
          marker.setIcon({
            ...currentIcon,
            rotation: angle,
          });
        }
      } catch (e) {
        console.warn("Error in rotate animation:", e);
        clearInterval(rotateAnimation);
      }
    }, 50);

    marker._rotateAnimation = rotateAnimation;
  }

  /**
   * החל אפקט קפיצה על סמן
   * @private
   * @param {Object} marker - הסמן
   */
  _applyBounceEffect(marker) {
    if (!marker) return;

    // אנימציית קפיצה מובנית של Google Maps
    marker.setAnimation(window.google.maps.Animation.BOUNCE);

    // עצירת האנימציה אחרי 3 שניות
    setTimeout(() => {
      marker.setAnimation(null);
    }, 3000);
  }

  /**
   * יצירת כוכבים אקראיים חדשים בדפוסים וקבוצות
   * @param {Object} center - מיקום מרכזי
   * @param {string} patternType - סוג הדפוס
   * @param {number} count - מספר כוכבים
   * @param {number} radius - רדיוס במטרים
   * @param {Set} collectedIds - מזהים של כוכבים שכבר נאספו
   * @returns {Array} מערך של כוכבים חדשים
   */
  generatePatternedStars(
    center,
    patternType,
    count,
    radius = 300,
    collectedIds = new Set()
  ) {
    const stars = [];

    // בחירת סוגי כוכבים לפי שכיחות
    const starTypes = Object.keys(this.starTypeConfigs);
    const rarityWeighted = starTypes.flatMap((type) =>
      Array(Math.ceil(this.starTypeConfigs[type].rarity * 100)).fill(type)
    );

    const patterns = {
      // מסלול מעגלי עם כוכבים
      circle: () => {
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const distance = radius * 0.7; // 70% מהרדיוס

          const latOffset = Math.sin(angle) * distance * 0.000009;
          const lngOffset = Math.cos(angle) * distance * 0.000009;

          stars.push(
            this._createStarObject(center, latOffset, lngOffset, rarityWeighted)
          );
        }
      },

      // פיזור רדיאלי של כוכבים מהמרכז
      radial: () => {
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          // מרחקים גדלים ככל שמתרחקים מהמרכז
          const distance = radius * 0.3 + (i / count) * radius * 0.7;

          const latOffset = Math.sin(angle) * distance * 0.000009;
          const lngOffset = Math.cos(angle) * distance * 0.000009;

          stars.push(
            this._createStarObject(center, latOffset, lngOffset, rarityWeighted)
          );
        }
      },

      // כוכבים בצורת אות או מילה
      text: () => {
        // פשוט ניצור צורת אות "כ" כדוגמה
        const letterPoints = [
          { x: -0.5, y: 0.5 },
          { x: -0.5, y: -0.5 },
          { x: 0, y: 0 },
          { x: 0.5, y: 0.5 },
          { x: 0.5, y: -0.5 },
        ];

        // כפיל נקודות כדי להגיע למספר הנדרש
        let pointsToUse = [];
        while (pointsToUse.length < count) {
          pointsToUse = [...pointsToUse, ...letterPoints];
        }
        pointsToUse = pointsToUse.slice(0, count);

        // צור כוכבים
        for (let i = 0; i < count; i++) {
          const point = pointsToUse[i];
          const latOffset = point.y * radius * 0.000009;
          const lngOffset = point.x * radius * 0.000009;

          stars.push(
            this._createStarObject(center, latOffset, lngOffset, rarityWeighted)
          );
        }
      },

      // כוכבים בזיגזג
      zigzag: () => {
        const rows = Math.ceil(Math.sqrt(count));
        const cols = Math.ceil(count / rows);

        let idx = 0;
        for (let row = 0; row < rows && idx < count; row++) {
          const isEvenRow = row % 2 === 0;

          for (let col = 0; col < cols && idx < count; col++) {
            // לשורות זוגיות, כיוון אחד. לשורות אי-זוגיות, הכיוון ההפוך
            const colPos = isEvenRow ? col : cols - 1 - col;

            const latOffset = (row / rows - 0.5) * radius * 0.000018;
            const lngOffset = (colPos / cols - 0.5) * radius * 0.000018;

            stars.push(
              this._createStarObject(
                center,
                latOffset,
                lngOffset,
                rarityWeighted
              )
            );
            idx++;
          }
        }
      },

      // פיזור אקראי
      random: () => {
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * radius;

          const latOffset = Math.sin(angle) * distance * 0.000009;
          const lngOffset = Math.cos(angle) * distance * 0.000009;

          stars.push(
            this._createStarObject(center, latOffset, lngOffset, rarityWeighted)
          );
        }
      },

      // אשכולות של כוכבים
      clusters: () => {
        const clusterCount = Math.min(5, Math.ceil(count / 10));
        const starsPerCluster = Math.floor(count / clusterCount);

        for (let c = 0; c < clusterCount; c++) {
          // מיקום אקראי של האשכול בתוך הרדיוס
          const clusterAngle = Math.random() * Math.PI * 2;
          const clusterDistance = Math.random() * (radius * 0.7);

          const clusterLatOffset =
            Math.sin(clusterAngle) * clusterDistance * 0.000009;
          const clusterLngOffset =
            Math.cos(clusterAngle) * clusterDistance * 0.000009;

          const clusterCenter = {
            lat: center.lat + clusterLatOffset,
            lng: center.lng + clusterLngOffset,
          };

          // יצירת כוכבים סביב מרכז האשכול
          for (let i = 0; i < starsPerCluster; i++) {
            const starAngle = Math.random() * Math.PI * 2;
            const starDistance = Math.random() * (radius * 0.2); // אשכול קטן יותר

            const starLatOffset = Math.sin(starAngle) * starDistance * 0.000009;
            const starLngOffset = Math.cos(starAngle) * starDistance * 0.000009;

            stars.push(
              this._createStarObject(
                clusterCenter,
                starLatOffset,
                starLngOffset,
                rarityWeighted
              )
            );
          }
        }

        // אם נשארו כוכבים להוסיף
        const remaining = count - starsPerCluster * clusterCount;
        if (remaining > 0) {
          for (let i = 0; i < remaining; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;

            const latOffset = Math.sin(angle) * distance * 0.000009;
            const lngOffset = Math.cos(angle) * distance * 0.000009;

            stars.push(
              this._createStarObject(
                center,
                latOffset,
                lngOffset,
                rarityWeighted
              )
            );
          }
        }
      },
    };

    // אם קיימת התבנית, הפעל אותה, אחרת השתמש באקראי
    if (patterns[patternType]) {
      patterns[patternType]();
    } else {
      patterns.random();
    }

    // סינון כוכבים שכבר נאספו
    const filteredStars = stars.filter((star) => !collectedIds.has(star.id));

    return filteredStars;
  }

  /**
   * יצירת אובייקט כוכב יחיד
   * @private
   * @param {Object} center - מיקום מרכזי
   * @param {number} latOffset - היסט בקו רוחב
   * @param {number} lngOffset - היסט בקו אורך
   * @param {Array} rarityWeighted - מערך של סוגי כוכבים לפי שכיחות
   * @returns {Object} אובייקט כוכב חדש
   */
  _createStarObject(center, latOffset, lngOffset, rarityWeighted) {
    // בחירת סוג כוכב אקראי לפי שכיחות
    const starType =
      rarityWeighted[Math.floor(Math.random() * rarityWeighted.length)];

    // מאפייני הכוכב
    const config = this.starTypeConfigs[starType];

    // אקראיות לערכים
    const pointsRange = config.points || [1, 3];
    const points =
      Math.floor(Math.random() * (pointsRange[1] - pointsRange[0] + 1)) +
      pointsRange[0];

    const xpRange = config.xpValue || [5, 10];
    const xpEarned =
      Math.floor(Math.random() * (xpRange[1] - xpRange[0] + 1)) + xpRange[0];

    const coinRange = config.coinValue || [1, 3];
    const coinsEarned =
      Math.floor(Math.random() * (coinRange[1] - coinRange[0] + 1)) +
      coinRange[0];

    // אם רוצים ליצור כוחות מיוחדים לכוכבים
    const hasPowerUp = Math.random() < 0.05; // 5% סיכוי
    const powerUp = hasPowerUp ? this._generateRandomPowerUp() : null;

    return {
      id: `star_${Date.now()}_${Math.floor(Math.random() * 10000)}_${
        this.randomCubes[Math.floor(Math.random() * this.randomCubes.length)]
      }`,
      lat: center.lat + latOffset,
      lng: center.lng + lngOffset,
      points: points,
      type: starType,
      collected: false,
      shape: config.shape || "star",
      animationState: "idle",
      xp_earned: xpEarned,
      coins_earned: coinsEarned,
      powerUp: powerUp,
      // מאפיינים נוספים לגיוון
      createdAt: new Date().toISOString(),
      expires:
        Math.random() < 0.2
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : null, // 20% זמניים
      difficulty:
        Math.random() < 0.7 ? "easy" : Math.random() < 0.5 ? "medium" : "hard",
    };
  }

  /**
   * יצירת כוח מיוחד רנדומלי לכוכב
   * @private
   * @returns {Object} אובייקט כוח מיוחד
   */
  _generateRandomPowerUp() {
    const powerUps = [
      { type: "magnet", name: "מגנט כוכבים", duration: 30, icon: "🧲" },
      { type: "radar", name: "רדאר כוכבים", duration: 20, icon: "📡" },
      { type: "speed", name: "מהירות כפולה", duration: 15, icon: "⚡" },
      { type: "bonus", name: "בונוס X2", duration: 60, icon: "✨" },
      { type: "shield", name: "מגן", duration: 45, icon: "🛡️" },
    ];

    return powerUps[Math.floor(Math.random() * powerUps.length)];
  }

  /**
   * הגדרת אזורי כוכבים - סוגי כוכבים שונים יופיעו באזורים מסוימים
   * @param {Object} map - אובייקט המפה
   * @param {Array} zones - מערך אזורים
   */
  setupStarZones(map, zones) {
    this.starZones = zones || [
      {
        name: "אזור תרבות",
        center: map.getCenter(),
        radius: 500,
        types: ["culture", "history"],
        density: 1.5, // מכפיל צפיפות
      },
      {
        name: "אזור טבע",
        center: {
          lat: map.getCenter().lat() + 0.002,
          lng: map.getCenter().lng() - 0.003,
        },
        radius: 400,
        types: ["nature", "regular", "silver"],
        density: 1.2,
      },
      {
        name: "אזור אוצרות",
        center: {
          lat: map.getCenter().lat() - 0.003,
          lng: map.getCenter().lng() + 0.002,
        },
        radius: 300,
        types: ["gold", "diamond", "ruby"],
        density: 0.6, // פחות כוכבים, אבל יקרים יותר
      },
    ];

    // ציור האזורים על המפה (אופציונלי)
    this.zoneCircles = [];
    this.starZones.forEach((zone) => {
      if (window.google && window.google.maps) {
        const circle = new window.google.maps.Circle({
          strokeColor: this._getZoneColor(zone.types[0]),
          strokeOpacity: 0.3,
          strokeWeight: 1,
          fillColor: this._getZoneColor(zone.types[0]),
          fillOpacity: 0.1,
          map: map,
          center: zone.center,
          radius: zone.radius,
          clickable: false,
        });

        this.zoneCircles.push(circle);
      }
    });
  }

  /**
   * קבלת צבע לאזור כוכבים
   * @private
   * @param {string} type - סוג כוכב
   * @returns {string} קוד צבע HEX
   */
  _getZoneColor(type) {
    if (this.starTypeConfigs[type]) {
      return this.starTypeConfigs[type].color;
    }
    return "#4285F4"; // צבע ברירת מחדל - כחול של גוגל
  }

  /**
   * יצירת כוכבים באזורים מוגדרים
   * @param {Set} collectedIds - מזהים של כוכבים שכבר נאספו
   * @returns {Array} מערך של כוכבים שנוצרו
   */
  generateStarsInZones(collectedIds = new Set()) {
    if (!this.starZones) return [];

    let allStars = [];

    this.starZones.forEach((zone) => {
      // חישוב כמות כוכבים לאזור - מבוסס על שטח ומכפיל צפיפות
      const areaFactor = Math.PI * Math.pow(zone.radius / 1000, 2); // שטח בקמ"ר
      const baseDensity = 10; // כוכבים לקמ"ר בסיסי
      const starCount = Math.round(
        areaFactor * baseDensity * (zone.density || 1)
      );

      // יצירת כוכבים עם התמקדות בסוגים הרלוונטיים לאזור
      for (let i = 0; i < starCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * zone.radius;

        const latOffset = Math.sin(angle) * distance * 0.000009;
        const lngOffset = Math.cos(angle) * distance * 0.000009;

        // בחירת סוג כוכב מתוך הרשימה המוגדרת לאזור
        const starType =
          zone.types[Math.floor(Math.random() * zone.types.length)];
        const config = this.starTypeConfigs[starType];

        // ערכים לכוכב
        const pointsRange = config.points || [1, 3];
        const points =
          Math.floor(Math.random() * (pointsRange[1] - pointsRange[0] + 1)) +
          pointsRange[0];

        const xpRange = config.xpValue || [5, 10];
        const xpEarned =
          Math.floor(Math.random() * (xpRange[1] - xpRange[0] + 1)) +
          xpRange[0];

        const coinRange = config.coinValue || [1, 3];
        const coinsEarned =
          Math.floor(Math.random() * (coinRange[1] - coinRange[0] + 1)) +
          coinRange[0];

        const star = {
          id: `zone_star_${Date.now()}_${Math.floor(
            Math.random() * 10000
          )}_${zone.name.substring(0, 3)}`,
          lat: zone.center.lat + latOffset,
          lng: zone.center.lng + lngOffset,
          points: points,
          type: starType,
          collected: false,
          shape: config.shape || "star",
          animationState: "idle",
          xp_earned: xpEarned,
          coins_earned: coinsEarned,
          zone_id: zone.name,
          createdAt: new Date().toISOString(),
        };

        // אם הכוכב כבר נאסף, נדלג עליו
        if (!collectedIds.has(star.id)) {
          allStars.push(star);
        }
      }
    });

    return allStars;
  }
}

export default StarMarkerManager;
