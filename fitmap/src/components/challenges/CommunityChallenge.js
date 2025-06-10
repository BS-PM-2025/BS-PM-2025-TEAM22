// src/components/challenges/CommunityChallenge.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import ChallengeCard from './ChallengeCard';
import { FaTrophy, FaFilter, FaSearch, FaExclamationTriangle, FaPlus, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import styles from './styles/CommunityChallenge.module.css';

function CommunityChallenge() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [challenges, setChallenges] = useState([]);
  const [userChallenges, setUserChallenges] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChallenges, setFilteredChallenges] = useState([]);
  const [showUserChallenges, setShowUserChallenges] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, [userProfile]);

  useEffect(() => {
    if (!challenges.length) return;
    let filtered = [...challenges];
    const now = new Date();

    if (filter === 'active') {
      filtered = filtered.filter(c => new Date(c.start_date) <= now && new Date(c.end_date) >= now);
    } else if (filter === 'upcoming') {
      filtered = filtered.filter(c => new Date(c.start_date) > now);
    } else if (filter === 'completed') {
      filtered = filtered.filter(c => new Date(c.end_date) < now);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => c.title.toLowerCase().includes(term) || c.description.toLowerCase().includes(term));
    }

    filtered.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    setFilteredChallenges(filtered);
  }, [challenges, filter, searchTerm]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .order('start_date', { ascending: false });

      if (challengesError) throw challengesError;
      setChallenges(challengesData || []);

      if (userProfile) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_challenge_progress')
          .select('*')
          .eq('user_id', userProfile.id);

        if (progressError) throw progressError;

        const progressMap = {};
        const joinedChallenges = [];
        for (const row of progressData) {
          progressMap[row.challenge_id] = row;
          const challenge = challengesData.find(c => c.id === row.challenge_id);
          if (challenge) joinedChallenges.push(challenge);
        }
        setUserProgress(progressMap);
        setUserChallenges(joinedChallenges);
      }
    } catch (err) {
      console.error('שגיאה בטעינת אתגרים:', err);
      setError('לא ניתן היה לטעון את רשימת האתגרים');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    if (!userProfile) return navigate('/auth');
    try {
      const { error } = await supabase.from('user_challenge_progress').insert([
        {
          user_id: userProfile.id,
          challenge_id: challengeId,
          current_value: 0,
          last_updated: new Date().toISOString(),
          has_joined: true
        }
      ]);
      if (error) throw error;

      const challenge = challenges.find(c => c.id === challengeId);
      setUserChallenges(prev => [...prev, challenge]);
      setUserProgress(prev => ({
        ...prev,
        [challengeId]: {
          challenge_id: challengeId,
          user_id: userProfile.id,
          current_value: 0,
          hasJoined: true,
          last_updated: new Date().toISOString()
        }
      }));
      alert('נרשמת בהצלחה לאתגר!');
    } catch (err) {
      console.error('שגיאה בהצטרפות לאתגר:', err);
      setError('לא ניתן היה להצטרף לאתגר');
    }
  };

  const toggleUserChallenges = () => {
    setShowUserChallenges(!showUserChallenges);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>אתגרי קהילה</h1>
          <p>שפר את כושרך עם הקהילה והצטרף לאתגרים</p>
        </div>
        {userProfile?.is_admin && (
          <button className={styles.createButton} onClick={() => navigate('/challenges/create')}>
            <FaPlus /> צור אתגר חדש
          </button>
        )}
      </div>

      <div className={styles.filterSection}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="חפש אתגרים..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <FaSearch className={styles.searchIcon} />
        </div>

        <div className={styles.filterButtons}>
          {['all', 'active', 'upcoming', 'completed'].map(type => (
            <button
              key={type}
              className={`${styles.filterButton} ${filter === type ? styles.activeFilter : ''}`}
              onClick={() => setFilter(type)}
            >
              {type === 'all' && <FaFilter />} {type === 'active' ? 'פעילים' : type === 'upcoming' ? 'עתידיים' : type === 'completed' ? 'הסתיימו' : 'הכל'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <FaExclamationTriangle />
          <p>{error}</p>
        </div>
      )}

      {userChallenges.length > 0 && (
        <div className={styles.userChallengesSection}>
          <div className={styles.sectionHeader}>
            <button 
              className={styles.toggleButton} 
              onClick={toggleUserChallenges}
              aria-expanded={showUserChallenges}
              aria-label={showUserChallenges ? "הסתר את האתגרים שלי" : "הצג את האתגרים שלי"}
            >
              <h2>האתגרים שלי</h2>
              <span className={styles.toggleIcon}>
                {showUserChallenges ? <FaChevronUp /> : <FaChevronDown />}
              </span>
            </button>
            <div className={styles.challengeCount}>
              {userChallenges.length} אתגרים
            </div>
          </div>
          
          <div className={`${styles.challengesGrid} ${showUserChallenges ? styles.expanded : styles.collapsed}`}>
            {userChallenges.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userProgress={userProgress[challenge.id]}
                onJoin={handleJoinChallenge}
                onViewDetails={() => navigate(`/challenges/${challenge.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      <div className={styles.allChallengesSection}>
        <h2>כל האתגרים</h2>
        {loading ? (
          <div className={styles.loading}><div className={styles.spinner}></div><p>טוען...</p></div>
        ) : filteredChallenges.length === 0 ? (
          <div className={styles.emptyChallenges}>
            <FaTrophy className={styles.emptyIcon} />
            <h3>לא נמצאו אתגרים</h3>
            <button className={styles.resetFilterButton} onClick={() => { setFilter('all'); setSearchTerm(''); }}>
              הצג הכל
            </button>
          </div>
        ) : (
          <div className={styles.challengesGrid}>
            {filteredChallenges.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userProgress={userProgress[challenge.id]}
                onJoin={() => handleJoinChallenge(challenge.id)}
                onViewDetails={() => navigate(`/challenges/${challenge.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityChallenge;