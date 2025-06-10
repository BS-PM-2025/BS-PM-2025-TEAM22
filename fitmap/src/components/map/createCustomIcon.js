import ReactDOMServer from 'react-dom/server';
import {
  FaDumbbell, FaTree, FaSwimmer, FaSpa, FaRunning,
  FaBasketballBall, FaTableTennis, FaFutbol, FaSkating,
  FaOm, FaHeartbeat, FaQuestion
} from 'react-icons/fa';

// צבעים לפי סוגים (ל־gradient ואנימציה)
const gradientMap = {
  gym: ['#4a90e2', '#0052cc'],
  fitness_park: ['#1abc9c', '#16a085'],
  park: ['#2ecc71', '#27ae60'],
  pool: ['#00c6ff', '#0072ff'],
  spa: ['#a18cd1', '#fbc2eb'],
  stadium: ['#f12711', '#f5af19'],
  basketball_court: ['#f39c12', '#d35400'],
  tennis_court: ['#fceabb', '#f8b500'],
  soccer_field: ['#00b09b', '#96c93d'],
  skate_park: ['#8e44ad', '#2c3e50'],
  yoga_studio: ['#43cea2', '#185a9d'],
  seniorFitness: ['#95a5a6', '#7f8c8d'],
  flexibility: ['#bdc3c7', '#2c3e50'],
  cardio: ['#2980b9', '#6dd5fa'],
  strength: ['#2c3e50', '#4ca1af'],
  massage: ['#eecda3', '#ef629f'],
};

const iconMap = {
  gym: FaDumbbell,
  fitness_park: FaTree,
  park: FaTree,
  pool: FaSwimmer,
  spa: FaSpa,
  stadium: FaRunning,
  basketball_court: FaBasketballBall,
  tennis_court: FaTableTennis,
  soccer_field: FaFutbol,
  skate_park: FaSkating,
  yoga_studio: FaOm,
  seniorFitness: FaHeartbeat,
  flexibility: FaHeartbeat,
  cardio: FaHeartbeat,
  strength: FaDumbbell,
  massage: FaSpa,
};

export function createCustomIcon(type = 'gym') {
  const IconComponent = iconMap[type] || FaQuestion;
  const [colorStart, colorEnd] = gradientMap[type] || ['#888', '#444'];

  const iconHtml = ReactDOMServer.renderToString(
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colorStart} stopOpacity="1" />
          <stop offset="100%" stopColor={colorEnd} stopOpacity="0.3" />
        </radialGradient>
        <style>
          {`
            .pulse {
              animation: pulseAnimation 1.8s infinite ease-in-out;
              transform-origin: center;
            }
            @keyframes pulseAnimation {
              0% { r: 18; opacity: 0.8; }
              50% { r: 22; opacity: 0.3; }
              100% { r: 18; opacity: 0.8; }
            }
          `}
        </style>
      </defs>
      <circle className="pulse" cx="20" cy="20" r="18" fill="url(#glow)" />
      <foreignObject x="8" y="8" width="24" height="24">
        <div xmlns="http://www.w3.org/1999/xhtml"
             style={{
               width: '24px',
               height: '24px',
               background: `linear-gradient(135deg, ${colorStart}, ${colorEnd})`,
               borderRadius: '50%',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
             }}>
          <IconComponent size={14} color="#fff" />
        </div>
      </foreignObject>
    </svg>
  );

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(iconHtml),
    scaledSize: new window.google.maps.Size(40, 40),
    origin: new window.google.maps.Point(0, 0),
    anchor: new window.google.maps.Point(20, 40),
  };
}