// src/utils/geoUtils.js - גרסה משודרגת
import {
  FaDumbbell,
  FaTree,
  FaSwimmer,
  FaSpa,
  FaRunning,
  FaBasketballBall,
  FaTableTennis,
  FaFutbol,
  FaSkating,
  FaOm,
  FaHeartbeat,
  FaQuestion,
  FaBicycle,
  FaVolleyballBall,
  FaGolfBall,
  FaHorse,
  FaSkiing,
  FaMountain,
  FaWater,
  FaFistRaised,
  FaChild,
  FaWheelchair,
  FaHiking,
  FaBaseballBall,
  FaHockeyPuck,
  FaGamepad,
  FaSchool,
  FaMedkit,
  FaUtensils,
  FaCoffee,
  FaShoppingCart,
  FaGasPump,
  FaParking,
  FaBuilding,
  FaHospital,
  FaChurch,
} from "react-icons/fa";

// מיפוי מורחב של סוגי מקומות לסוגי מתקנים
const PLACE_TYPE_MAPPING = {
  // מתקני כושר וספורט
  gym: "gym",
  fitness_center: "gym",
  health: "gym",
  physiotherapist: "rehabilitation",
  spa: "spa",
  beauty_salon: "spa",

  // מתקני מים
  swimming_pool: "pool",
  aquarium: "aquatic_center",
  water_park: "water_park",

  // מתקני ספורט
  stadium: "stadium",
  bowling_alley: "bowling",
  golf_course: "golf",
  tennis_court: "tennis_court",
  soccer_field: "soccer_field",
  basketball_court: "basketball_court",
  volleyball_court: "volleyball_court",
  baseball_field: "baseball_field",
  hockey_rink: "hockey_rink",

  // מתקני חוצות וטבע
  park: "park",
  national_park: "nature_park",
  campground: "camping",
  hiking_area: "hiking_trail",
  beach: "beach",
  marina: "marina",
  zoo: "zoo",
  amusement_park: "amusement_park",

  // מתקני אקסטרים
  skate_park: "skate_park",
  rock_climbing_area: "climbing",
  ski_resort: "ski_resort",
  bicycle_store: "bike_shop",

  // מתקני לחימה ואמנויות לחימה
  martial_arts_school: "martial_arts",
  boxing_gym: "boxing",

  // מתקנים חברתיים ומשפחתיים
  playground: "playground",
  community_center: "community_center",
  youth_center: "youth_center",
  senior_center: "senior_center",

  // מתקני רכיבה
  horseback_riding: "horseback_riding",
  bicycle_rental: "bike_rental",
  car_rental: "car_rental",

  // מתקני פנאי
  movie_theater: "cinema",
  arcade: "arcade",
  casino: "casino",
  night_club: "nightclub",
  bar: "bar",

  // מתקני אוכל ושתייה
  restaurant: "restaurant",
  cafe: "cafe",
  food_court: "food_court",
  meal_takeaway: "takeaway",

  // מתקני שירותים
  hospital: "hospital",
  pharmacy: "pharmacy",
  gas_station: "gas_station",
  parking: "parking",
  shopping_mall: "shopping_mall",
  supermarket: "supermarket",

  // מתקני חינוך ותרבות
  school: "school",
  university: "university",
  library: "library",
  museum: "museum",
  art_gallery: "art_gallery",

  // מתקני דת
  synagogue: "synagogue",
  mosque: "mosque",
  church: "church",
  temple: "temple",

  // מתקני לינה
  lodging: "hotel",

  doctor: "doctor",
  dentist: "dentist",

  veterinary_care: "veterinary_care",
};

// מיפוי אייקונים מורחב
const FACILITY_ICONS = {
  // כושר וספורט מסורתיים
  gym: FaDumbbell,
  crossfit: FaDumbbell,
  yoga_studio: FaOm,
  pilates: FaOm,
  spa: FaSpa,
  massage: FaSpa,
  rehabilitation: FaMedkit,

  // מתקני מים
  pool: FaSwimmer,
  aquatic_center: FaSwimmer,
  water_park: FaWater,
  beach: FaWater,
  marina: FaWater,

  // ספורט כדור
  basketball_court: FaBasketballBall,
  soccer_field: FaFutbol,
  tennis_court: FaTableTennis,
  volleyball_court: FaVolleyballBall,
  baseball_field: FaBaseballBall,
  hockey_rink: FaHockeyPuck,

  // ספורט אקסטרים
  skate_park: FaSkating,
  climbing: FaMountain,
  ski_resort: FaSkiing,

  // מתקני חוצות
  park: FaTree,
  fitness_park: FaTree,
  nature_park: FaTree,
  hiking_trail: FaHiking,
  camping: FaMountain,

  // רכיבה ותחבורה
  bike_rental: FaBicycle,
  bike_shop: FaBicycle,
  horseback_riding: FaHorse,

  // אמנויות לחימה
  martial_arts: FaFistRaised,
  boxing: FaFistRaised,

  // מתקנים חברתיים
  playground: FaChild,
  community_center: FaBuilding,
  youth_center: FaChild,
  senior_center: FaWheelchair,

  // בידור ופנאי
  bowling: FaGamepad,
  golf: FaGolfBall,
  arcade: FaGamepad,
  cinema: FaGamepad,
  casino: FaGamepad,
  amusement_park: FaChild,
  zoo: FaChild,

  // אוכל ושתייה
  restaurant: FaUtensils,
  cafe: FaCoffee,
  bar: FaCoffee,
  food_court: FaUtensils,

  // שירותים
  hospital: FaHospital,
  pharmacy: FaMedkit,
  gas_station: FaGasPump,
  parking: FaParking,
  shopping_mall: FaShoppingCart,
  supermarket: FaShoppingCart,

  // חינוך ותרבות
  school: FaSchool,
  university: FaSchool,
  library: FaBuilding,
  museum: FaBuilding,

  // דת
  synagogue: FaChurch,
  mosque: FaChurch,
  church: FaChurch,
  temple: FaChurch,

  // ברירת מחדל
  default: FaQuestion,

  // סוגי פעילות (מהמערכת המקורית)
  cardio: FaHeartbeat,
  strength: FaDumbbell,
  flexibility: FaOm,
  seniorFitness: FaWheelchair,
  stadium: FaRunning,
};

// מיפוי אימוג'י מורחב
const FACILITY_EMOJIS = {
  // כושר וספורט מסורתיים
  gym: "💪",
  crossfit: "🏋️",
  yoga_studio: "🧘",
  pilates: "🧘‍♀️",
  spa: "💆",
  massage: "💆‍♂️",
  rehabilitation: "🏥",

  // מתקני מים
  pool: "🏊",
  aquatic_center: "🏊‍♀️",
  water_park: "🌊",
  beach: "🏖️",
  marina: "⛵",

  // ספורט כדור
  basketball_court: "🏀",
  soccer_field: "⚽",
  tennis_court: "🎾",
  volleyball_court: "🏐",
  baseball_field: "⚾",
  hockey_rink: "🏒",

  // ספורט אקסטרים
  skate_park: "🛹",
  climbing: "🧗",
  ski_resort: "⛷️",

  // מתקני חוצות
  park: "🌳",
  fitness_park: "🏞️",
  nature_park: "🌲",
  hiking_trail: "🥾",
  camping: "⛺",

  // רכיבה ותחבורה
  bike_rental: "🚴",
  bike_shop: "🚲",
  horseback_riding: "🐎",

  // אמנויות לחימה
  martial_arts: "🥋",
  boxing: "🥊",

  // מתקנים חברתיים
  playground: "🎪",
  community_center: "🏛️",
  youth_center: "👦",
  senior_center: "👴",

  // בידור ופנאי
  bowling: "🎳",
  golf: "⛳",
  arcade: "🎮",
  cinema: "🎬",
  casino: "🎰",
  amusement_park: "🎢",
  zoo: "🦁",

  // אוכל ושתייה
  restaurant: "🍽️",
  cafe: "☕",
  bar: "🍺",
  food_court: "🍕",

  // שירותים
  hospital: "🏥",
  pharmacy: "💊",
  gas_station: "⛽",
  parking: "🅿️",
  shopping_mall: "🛍️",
  supermarket: "🛒",

  // חינוך ותרבות
  school: "🏫",
  university: "🎓",
  library: "📚",
  museum: "🏛️",

  // דת
  synagogue: "🕍",
  mosque: "🕌",
  church: "⛪",
  temple: "🛕",

  // ברירת מחדל
  default: "📍",

  // סוגי פעילות
  cardio: "❤️",
  strength: "💪",
  flexibility: "🤸",
  seniorFitness: "👴",
  stadium: "🏟️",
};

// צבעים לסוגי מתקנים
const FACILITY_COLORS = {
  // כושר וספורט - כחול/סגול
  gym: "#8b5cf6",
  crossfit: "#7c3aed",
  yoga_studio: "#a855f7",
  spa: "#ec4899",

  // מתקני מים - כחול
  pool: "#0ea5e9",
  aquatic_center: "#0284c7",
  water_park: "#06b6d4",
  beach: "#22d3ee",

  // ספורט - כתום/אדום
  basketball_court: "#f97316",
  soccer_field: "#22c55e",
  tennis_court: "#eab308",

  // מתקני חוצות - ירוק
  park: "#16a34a",
  fitness_park: "#15803d",
  nature_park: "#166534",

  // בידור - ורוד/סגול
  bowling: "#d946ef",
  arcade: "#c026d3",
  cinema: "#a21caf",

  // שירותים - אפור/כחול
  hospital: "#dc2626",
  pharmacy: "#059669",
  gas_station: "#ea580c",

  // ברירת מחדל
  default: "#6b7280",
};

// חישוב מרחק בין 2 נקודות קואורדינטה (בק"מ)
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  lat1 = parseFloat(lat1);
  lng1 = parseFloat(lng1);
  lat2 = parseFloat(lat2);
  lng2 = parseFloat(lng2);

  if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
    console.warn("ערכי קואורדינטות לא תקפים בחישוב מרחק");
    return 99999;
  }

  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// החזרת אייקון React לפי סוג
export const getMarkerIconForType = (type) => {
  return FACILITY_ICONS[type] || FACILITY_ICONS.default;
};

// החזרת אימוג'י לפי סוג מתקן
export const getMarkerEmojiForType = (type) => {
  return FACILITY_EMOJIS[type] || FACILITY_EMOJIS.default;
};

// החזרת צבע לפי סוג מתקן
export const getMarkerColorForType = (type) => {
  return FACILITY_COLORS[type] || FACILITY_COLORS.default;
};

// מיפוי סוג מקום של גוגל לסוג באפליקציה - מורחב
export const mapGoogleTypeToLocalType = (googleTypes) => {
  if (!Array.isArray(googleTypes) || googleTypes.length === 0) return "gym";

  // חיפוש התאמה מדויקת
  for (const googleType of googleTypes) {
    if (PLACE_TYPE_MAPPING[googleType]) {
      return PLACE_TYPE_MAPPING[googleType];
    }
  }

  // התאמות מיוחדות על בסיס מילות מפתח
  const typesString = googleTypes.join(" ").toLowerCase();

  if (typesString.includes("fitness") || typesString.includes("gym"))
    return "gym";
  if (typesString.includes("yoga") || typesString.includes("pilates"))
    return "yoga_studio";
  if (
    typesString.includes("martial") ||
    typesString.includes("karate") ||
    typesString.includes("judo")
  )
    return "martial_arts";
  if (typesString.includes("dance")) return "dance_studio";
  if (typesString.includes("climbing")) return "climbing";
  if (typesString.includes("bike") || typesString.includes("bicycle"))
    return "bike_rental";

  return "gym"; // ברירת מחדל
};

// חילוץ מאפיינים ממקום מגוגל - מורחב
export const extractFeaturesFromGooglePlace = (place) => {
  const features = [];

  // מאפיינים בסיסיים
  if (place.business_status === "OPERATIONAL") {
    features.push("accessible");
  }

  if (place.rating >= 4.0) {
    features.push("high_rated");
  }

  if (place.rating >= 4.5) {
    features.push("excellent_rated");
  }

  if (place.user_ratings_total >= 100) {
    features.push("popular");
  }

  if (place.opening_hours) {
    features.push("restrooms");
    if (place.opening_hours.open_now) {
      features.push("open_now");
    }
  }

  if (place.price_level === 0) {
    features.push("free");
  } else if (place.price_level === 1) {
    features.push("budget_friendly");
  } else if (place.price_level >= 3) {
    features.push("premium");
  }

  // מאפיינים על בסיס סוג המקום
  const types = place.types || [];

  if (
    types.some((type) =>
      ["park", "recreation_area", "tourist_attraction"].includes(type)
    )
  ) {
    features.push("outdoor", "shaded", "benches", "water_fountain");
  }

  if (
    types.some((type) => ["gym", "fitness_center", "health"].includes(type))
  ) {
    features.push("indoor", "changing_rooms", "showers", "lockers");
  }

  if (types.some((type) => ["swimming_pool", "spa"].includes(type))) {
    features.push("indoor", "changing_rooms", "showers");
  }

  if (types.some((type) => ["hospital", "pharmacy"].includes(type))) {
    features.push("accessible", "parking");
  }

  if (types.some((type) => ["restaurant", "cafe", "food"].includes(type))) {
    features.push("indoor", "outdoor_seating");
  }

  return [...new Set(features)]; // הסרת כפילויות
};

// חילוץ ציוד ממקום בגוגל - מורחב
export const extractEquipmentFromGooglePlace = (place) => {
  const equipment = [];
  const types = place.types || [];
  const name = (place.name || "").toLowerCase();

  // ציוד על בסיס סוג המקום
  if (
    types.some((type) => ["gym", "fitness_center", "health"].includes(type))
  ) {
    equipment.push("cardio_machines", "weight_machines", "free_weights");

    if (name.includes("crossfit")) {
      equipment.push("kettlebells", "battle_ropes", "pull_up_bars");
    }
  }

  if (types.some((type) => ["park", "recreation_area"].includes(type))) {
    equipment.push("pullup_bars", "parallel_bars", "horizontal_ladder");
  }

  if (types.includes("swimming_pool")) {
    equipment.push("swimming_lanes", "diving_board");
  }

  if (types.includes("tennis_court")) {
    equipment.push("tennis_net", "tennis_court_surface");
  }

  if (types.includes("basketball_court")) {
    equipment.push("basketball_hoop");
  }

  if (types.includes("soccer_field")) {
    equipment.push("soccer_goals", "soccer_field_grass");
  }

  // ציוד על בסיס שם המקום
  if (name.includes("yoga") || name.includes("pilates")) {
    equipment.push("yoga_mats", "yoga_blocks", "stretching_area");
  }

  if (
    name.includes("martial") ||
    name.includes("karate") ||
    name.includes("judo")
  ) {
    equipment.push("martial_arts_mats", "punching_bags");
  }

  return [...new Set(equipment)];
};

// חילוץ תמונות ממקום בגוגל
export const extractImagesFromGooglePlace = (place) => {
  const images = [];

  if (place.photos?.length > 0) {
    const photosToUse = place.photos.slice(0, 5); // הגדלנו ל5 תמונות
    photosToUse.forEach((photo) => {
      try {
        const photoUrl = photo.getUrl({ maxWidth: 800, maxHeight: 600 }); // רזולוציה גבוהה יותר
        if (photoUrl) images.push(photoUrl);
      } catch (e) {
        console.warn("שגיאה בהשגת URL של תמונה מגוגל:", e);
      }
    });
  }

  return images;
};

// יצירת מתקן מגוגל Place - מורחב
export const createFacilityFromGooglePlace = (place) => {
  if (!place?.geometry?.location) {
    console.warn("מקום לא תקף מגוגל:", place);
    return null;
  }

  try {
    const lat =
      typeof place.geometry.location.lat === "function"
        ? place.geometry.location.lat()
        : place.geometry.location.lat;
    const lng =
      typeof place.geometry.location.lng === "function"
        ? place.geometry.location.lng()
        : place.geometry.location.lng;

    if (typeof lat !== "number" || typeof lng !== "number") {
      console.warn("מקום ללא קואורדינטות תקפות:", place.name);
      return null;
    }

    const facilityType = mapGoogleTypeToLocalType(place.types || []);

    return {
      id: "google_" + place.place_id,
      name: place.name || "מתקן כושר",
      address: place.vicinity || place.formatted_address || "",
      latitude: lat,
      longitude: lng,
      type: facilityType,
      rating: place.rating || 0,
      review_count: place.user_ratings_total || 0,
      price_level: place.price_level || null,
      source: "google",
      google_place_id: place.place_id,
      features: extractFeaturesFromGooglePlace(place),
      equipment: extractEquipmentFromGooglePlace(place),
      images: extractImagesFromGooglePlace(place),
      description: place.types ? `סוג מתקן: ${place.types.join(", ")}` : "",
      phone: place.formatted_phone_number || null,
      website: place.website || null,
      opening_hours: place.opening_hours || null,
      business_status: place.business_status || null,
      google_types: place.types || [],
    };
  } catch (err) {
    console.error("שגיאה ביצירת מתקן ממקום בגוגל:", err);
    return null;
  }
};

// פונקציה להחזרת רשימת כל סוגי המתקנים הזמינים
export const getAllFacilityTypes = () => {
  return Object.keys(FACILITY_ICONS).filter((type) => type !== "default");
};

// פונקציה לבדיקה האם מתקן פתוח עכשיו
export const isFacilityOpenNow = (facility) => {
  if (facility.opening_hours?.open_now !== undefined) {
    return facility.opening_hours.open_now;
  }

  // אם אין מידע - נניח שמתקני חוצות פתוחים תמיד
  const outdoorTypes = [
    "park",
    "fitness_park",
    "basketball_court",
    "soccer_field",
    "tennis_court",
  ];
  return outdoorTypes.includes(facility.type);
};

// פונקציה לקבלת תיאור מתקן
export const getFacilityDescription = (facility) => {
  const emoji = getMarkerEmojiForType(facility.type);
  const typeNames = {
    gym: "חדר כושר",
    pool: "בריכת שחייה",
    park: "פארק",
    spa: "ספא",
    // ועוד...
  };

  return `${emoji} ${typeNames[facility.type] || "מתקן"} • ${
    facility.source === "google" ? "Google" : "מקומי"
  }`;
};
