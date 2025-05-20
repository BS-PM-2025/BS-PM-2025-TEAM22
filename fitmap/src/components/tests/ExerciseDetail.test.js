// src/components/workouts/__tests__/ExerciseDetail.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ExerciseDetail from '../workouts/ExerciseDetail';
import * as supabaseClient from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

// Mock the required modules
jest.mock('../../utils/supabaseClient', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn()
  };
  
  return {
    supabase: mockSupabase
  };
});

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock styles to avoid CSS module issues
jest.mock('../styles/ExerciseDetail.module.css', () => ({
  container: 'container',
  loading: 'loading',
  spinner: 'spinner',
  errorMessage: 'errorMessage',
  errorIcon: 'errorIcon',
  backButton: 'backButton',
  exerciseHeader: 'exerciseHeader',
  backLink: 'backLink',
  backIcon: 'backIcon',
  headerActions: 'headerActions',
  actionButton: 'actionButton',
  actionIcon: 'actionIcon',
  difficulty: 'difficulty',
  starFilled: 'starFilled',
  starEmpty: 'starEmpty',
  difficultyText: 'difficultyText',
  contentGrid: 'contentGrid',
  mediaSection: 'mediaSection',
  imageContainer: 'imageContainer',
  exerciseImage: 'exerciseImage',
  playButton: 'playButton',
  playIcon: 'playIcon',
  noVideoMessage: 'noVideoMessage',
  warningIcon: 'warningIcon',
  imagePlaceholder: 'imagePlaceholder',
  placeholderIcon: 'placeholderIcon',
  videoModal: 'videoModal',
  videoContainer: 'videoContainer',
  closeVideoButton: 'closeVideoButton',
  videoFrame: 'videoFrame',
  quickInfo: 'quickInfo',
  detailItem: 'detailItem',
  detailLabel: 'detailLabel',
  detailValue: 'detailValue',
  infoSection: 'infoSection',
  tabsContainer: 'tabsContainer',
  tabButton: 'tabButton',
  activeTab: 'activeTab',
  tabContent: 'tabContent',
  instructionsTab: 'instructionsTab',
  instructions: 'instructions',
  description: 'description',
  tipsTab: 'tipsTab',
  trainingTab: 'trainingTab',
  historyTab: 'historyTab',
  relatedSection: 'relatedSection',
  relatedCards: 'relatedCards',
  relatedCard: 'relatedCard',
  successMessage: 'successMessage',
  successIcon: 'successIcon',
  benefitsSection: 'benefitsSection',
  benefitsList: 'benefitsList',
  benefitItem: 'benefitItem',
  benefitIcon: 'benefitIcon',
  mistakesSection: 'mistakesSection',
  mistakesList: 'mistakesList',
  mistakeItem: 'mistakeItem',
  mistakeIcon: 'mistakeIcon',
  bottomActions: 'bottomActions',
  bottomActionButton: 'bottomActionButton',
  bottomActionIcon: 'bottomActionIcon',
  historyLink: 'historyLink',
  historyList: 'historyList',
  historyItem: 'historyItem',
  noHistory: 'noHistory',
  noHistoryIcon: 'noHistoryIcon',
  generalTips: 'generalTips'
}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaArrowRight: () => <span data-testid="icon-arrow-right" />,
  FaStar: () => <span data-testid="icon-star-filled" />,
  FaRegStar: () => <span data-testid="icon-star-empty" />,
  FaPlayCircle: () => <span data-testid="icon-play" />,
  FaDumbbell: () => <span data-testid="icon-dumbbell" />,
  FaExclamationTriangle: () => <span data-testid="icon-warning" />,
  FaTimes: () => <span data-testid="icon-close" />,
  FaBookmark: () => <span data-testid="icon-bookmark-filled" />,
  FaRegBookmark: () => <span data-testid="icon-bookmark-outline" />,
  FaShareAlt: () => <span data-testid="icon-share" />,
  FaHistory: () => <span data-testid="icon-history" />,
  FaInfoCircle: () => <span data-testid="icon-info" />,
  FaCheckCircle: () => <span data-testid="icon-check" />
}));

// Test data
const mockExercise = {
  id: 1,
  name: 'שכיבות סמיכה',
  description: 'תרגיל לחיזוק חזה וזרועות',
  muscle_group: 'חזה',
  secondary_muscles: ['כתפיים', 'טרייספס'],
  difficulty: 'intermediate',
  equipment: ['pullup_bars', 'bench'],
  image: 'test-image.jpg',
  instructions: 'הוראות לביצוע התרגיל',
  video_url: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
  benefits: ['חיזוק שרירי החזה', 'שיפור יציבה'],
  common_mistakes: ['כיפוף הגב', 'מהירות ביצוע גבוהה מדי']
};

const mockRelatedExercises = [
  {
    id: 2,
    name: 'לחיצת חזה',
    description: 'תרגיל חזה עם ספסל',
    muscle_group: 'חזה',
    difficulty: 'beginner',
    image: 'related-image-1.jpg'
  },
  {
    id: 3,
    name: 'פרפר',
    description: 'תרגיל לחיזוק שרירי החזה החיצוניים',
    muscle_group: 'חזה',
    difficulty: 'advanced',
    image: 'related-image-2.jpg'
  }
];

const mockHistoryWorkouts = [
  {
    workout_id: 101,
    workouts: {
      workout_name: 'אימון חזה',
      workout_date: '2025-04-01',
      duration_minutes: 45
    }
  },
  {
    workout_id: 102,
    workouts: {
      workout_name: 'אימון כח',
      workout_date: '2025-03-25',
      duration_minutes: 60
    }
  }
];

// Helper function to set up the component with router
const renderWithRouter = (exerciseId, userProfile = null) => {
  // Mock useAuth hook to return user profile if provided
  useAuth.mockReturnValue({ userProfile });

  return render(
    <MemoryRouter initialEntries={[`/exercises/${exerciseId}`]}>
      <Routes>
        <Route path="/exercises/:exerciseId" element={<ExerciseDetail />} />
        <Route path="/exercises" element={<div>Exercises Library</div>} />
        <Route path="/auth" element={<div>Auth Page</div>} />
        <Route path="/workouts/:workoutId" element={<div>Workout Detail</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ExerciseDetail Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the Supabase client mock
    const { supabase } = supabaseClient;
    supabase.from.mockReturnThis();
    supabase.select.mockReturnThis();
    supabase.eq.mockReturnThis();
    supabase.neq.mockReturnThis();
    supabase.limit.mockReturnThis();
    supabase.order.mockReturnThis();
    supabase.single.mockResolvedValue({ data: null, error: null });
  });

  // Test 1: Loading state and successful data fetching
  test('shows loading state and then displays exercise data', async () => {
    const { supabase } = supabaseClient;
    
    // Mock the Supabase response for the main exercise
    supabase.single
      .mockResolvedValueOnce({ data: mockExercise, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    
    // Mock the response for related exercises
    supabase.limit.mockResolvedValueOnce({ 
      data: mockRelatedExercises, 
      error: null 
    });

    renderWithRouter(1);

    // Should show loading first
    expect(screen.getByText('טוען פרטי תרגיל...')).toBeInTheDocument();
    
    // Wait for data to load and verify exercise info is displayed
    await waitFor(() => {
      expect(screen.getByText('שכיבות סמיכה')).toBeInTheDocument();
      expect(screen.getByText('תרגיל לחיזוק חזה וזרועות')).toBeInTheDocument();
      expect(screen.getByText('הוראות לביצוע התרגיל')).toBeInTheDocument();
      expect(screen.getByText(/רמת קושי: בינוני/i)).toBeInTheDocument();
    });
    
    // Verify related exercises are displayed
    expect(screen.getByText('תרגילים דומים שעשויים לעניין אותך')).toBeInTheDocument();
    expect(screen.getByText('לחיצת חזה')).toBeInTheDocument();
    expect(screen.getByText('פרפר')).toBeInTheDocument();
    
    // Verify difficulty stars (intermediate = 2 stars)
    const filledStars = screen.getAllByTestId('icon-star-filled');
    expect(filledStars.length).toBeGreaterThanOrEqual(2);
  });
});