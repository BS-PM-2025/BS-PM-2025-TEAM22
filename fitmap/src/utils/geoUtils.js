// src/utils/geoUtils.js
// קובץ מאוחד לפונקציות עזר גיאוגרפיות

export const calculateDistance = (lat1, lng1, lat2, lng2) => {
    lat1 = parseFloat(lat1);
    lng1 = parseFloat(lng1);
    lat2 = parseFloat(lat2);
    lng2 = parseFloat(lng2);
  
    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
      console.warn('ערכי קואורדינטות לא תקפים בחישוב מרחק');
      return 99999;
    }
  
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
  
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  export const getMarkerIconForType = (type, source = 'database') => {
    let color = 'red';
  
    switch (type) {
      case 'calisthenics':
      case 'fitness_park':
      case 'park':
      case 'skate_park':
        color = 'green';
        break;
      case 'gym':
      case 'cardio':
      case 'strength':
      case 'crossfit':
        color = 'blue';
        break;
      case 'seniorFitness':
      case 'flexibility':
      case 'yoga_studio':
        color = 'purple';
        break;
      case 'pool':
      case 'stadium':
      case 'basketball_court':
      case 'tennis_court':
      case 'soccer_field':
        color = 'orange';
        break;
      default:
        color = 'red';
    }
  
    const iconUrl = `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`;
  
    return source === 'google'
      ? {
          url: iconUrl,
          scaledSize: new window.google.maps.Size(38, 38),
          origin: new window.google.maps.Point(0, 0),
          anchor: new window.google.maps.Point(19, 38),
        }
      : {
          url: iconUrl,
          scaledSize: new window.google.maps.Size(32, 32),
          origin: new window.google.maps.Point(0, 0),
          anchor: new window.google.maps.Point(16, 32),
        };
  };
  
  export const mapGoogleTypeToLocalType = (googleTypes) => {
    if (!Array.isArray(googleTypes) || googleTypes.length === 0) return 'gym';
  
    if (googleTypes.includes('gym') ||
        googleTypes.includes('health') ||
        googleTypes.includes('fitness_center')) return 'gym';
    if (googleTypes.includes('stadium')) return 'stadium';
    if (googleTypes.includes('swimming_pool')) return 'pool';
    if (googleTypes.includes('park')) return 'fitness_park';
    if (googleTypes.includes('spa')) return 'spa';
    if (googleTypes.includes('yoga')) return 'yoga_studio';
    if (googleTypes.includes('crossfit')) return 'crossfit';
    if (googleTypes.includes('skatepark')) return 'skate_park';
    if (googleTypes.includes('basketball_court')) return 'basketball_court';
    if (googleTypes.includes('tennis_court')) return 'tennis_court';
    if (googleTypes.includes('soccer_field')) return 'soccer_field';
  
    return 'gym';
  };
  
  export const extractFeaturesFromGooglePlace = (place) => {
    const features = [];
  
    if (place.business_status === 'OPERATIONAL') {
      features.push('accessible', 'lit');
    }
  
    if (place.rating >= 4.0) {
      features.push('benches');
    }
  
    if (place.opening_hours) {
      features.push('restrooms');
    }
  
    if (place.types?.includes('park') || place.types?.includes('fitness_center')) {
      features.push('water_fountain', 'shaded');
    }
  
    return features;
  };
  
  export const extractEquipmentFromGooglePlace = (place) => {
    const equipment = [];
  
    if (place.types?.some(type => ['gym', 'health', 'fitness_center'].includes(type))) {
      equipment.push('cardio_machines', 'weight_machines');
    }
  
    if (place.types?.some(type => ['park', 'recreation'].includes(type))) {
      equipment.push('pullup_bars', 'parallel_bars');
    }
  
    return equipment;
  };
  
  export const extractImagesFromGooglePlace = (place) => {
    const images = [];
  
    if (place.photos?.length > 0) {
      const photosToUse = place.photos.slice(0, 3);
      photosToUse.forEach(photo => {
        try {
          const photoUrl = photo.getUrl({ maxWidth: 500, maxHeight: 300 });
          if (photoUrl) images.push(photoUrl);
        } catch (e) {
          console.warn('שגיאה בהשגת URL של תמונה מגוגל:', e);
        }
      });
    }
  
    return images;
  };
  
  export const createFacilityFromGooglePlace = (place) => {
    if (!place?.geometry?.location) {
      console.warn('מקום לא תקף מגוגל:', place);
      return null;
    }
  
    try {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
  
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        console.warn('מקום ללא קואורדינטות תקפות:', place.name);
        return null;
      }
  
      return {
        id: 'google_' + place.place_id,
        name: place.name || 'מתקן כושר',
        address: place.vicinity || '',
        latitude: lat,
        longitude: lng,
        type: mapGoogleTypeToLocalType(place.types || []),
        rating: place.rating || 0,
        review_count: place.user_ratings_total || 0,
        source: 'google',
        google_place_id: place.place_id,
        features: extractFeaturesFromGooglePlace(place),
        equipment: extractEquipmentFromGooglePlace(place),
        images: extractImagesFromGooglePlace(place),
        description: place.types ? `סוג מתקן: ${place.types.join(', ')}` : ''
      };
    } catch (err) {
      console.error('שגיאה ביצירת מתקן ממקום בגוגל:', err);
      return null;
    }
  };
  