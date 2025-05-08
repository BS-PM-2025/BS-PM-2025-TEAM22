// src/components/workouts/__tests__/ExerciseDetail.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ExerciseDetail from '../workouts/workouts/ExerciseDetail';
import { supabase } from '../../../utils/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';

// Mock the required modules
jest.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn()
  }
}));

jest.mock('../../../hooks/useAuth', () => ({
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

  // Test 2: Favorite toggle functionality
  test('toggles favorite status correctly when logged in', async () => {
    // Mock user profile
    const mockUserProfile = {
      user_id: 'user123',
      name: 'Test User'
    };
    
    // Mock fetch exercise data
    supabase.single
      .mockResolvedValueOnce({ data: mockExercise, error: null })
      .mockResolvedValueOnce({ data: null, error: null });  // For favorite check
    
    // Mock related exercises
    supabase.limit.mockResolvedValueOnce({ 
      data: mockRelatedExercises, 
      error: null 
    });
    
    // Mock successful favorite toggle
    supabase.insert.mockResolvedValueOnce({ error: null });

    renderWithRouter(1, mockUserProfile);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('שכיבות סמיכה')).toBeInTheDocument();
    });

    // Verify favorite button shows outline (not filled)
    expect(screen.getByTestId('icon-bookmark-outline')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-bookmark-filled')).not.toBeInTheDocument();
    
    // Click the favorite button
    const favoriteButton = screen.getByRole('button', { name: /הוסף למועדפים/i });
    fireEvent.click(favoriteButton);
    
    // Verify the supabase insert was called for adding to favorites
    expect(supabase.insert).toHaveBeenCalledWith({
      user_id: 'user123',
      exercise_id: 1,
      added_at: expect.any(String)
    });
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('התרגיל נוסף למועדפים')).toBeInTheDocument();
    });
  });

  // Test 3: Tab switching functionality
  test('switches between tabs correctly', async () => {
    // Mock exercise data
    supabase.single
      .mockResolvedValueOnce({ data: mockExercise, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    
    supabase.limit.mockResolvedValueOnce({ 
      data: mockRelatedExercises, 
      error: null 
    });

    renderWithRouter(1);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('שכיבות סמיכה')).toBeInTheDocument();
    });

    // By default, instructions tab should be active
    expect(screen.getByText('הוראות ביצוע')).toBeInTheDocument();
    expect(screen.getByText('הוראות לביצוע התרגיל')).toBeInTheDocument();
    
    // Click on Tips tab
    const tipsTab = screen.getByRole('button', { name: 'טיפים' });
    fireEvent.click(tipsTab);
    
    // Tips content should be visible
    expect(screen.getByText('יתרונות התרגיל')).toBeInTheDocument();
    expect(screen.getByText('טעויות נפוצות')).toBeInTheDocument();
    expect(screen.getByText('חיזוק שרירי החזה')).toBeInTheDocument();
    
    // Click on Training tab
    const trainingTab = screen.getByRole('button', { name: 'המלצות אימון' });
    fireEvent.click(trainingTab);
    
    // Training content should be visible
    expect(screen.getByText('המלצות אימון')).toBeInTheDocument();
    expect(screen.getByText('למתחילים')).toBeInTheDocument();
    expect(screen.getByText('לרמה בינונית')).toBeInTheDocument();
    expect(screen.getByText('למתקדמים')).toBeInTheDocument();
  });

  // Test 4: Video modal functionality
  test('opens and closes video modal correctly', async () => {
    // Mock exercise data
    supabase.single
      .mockResolvedValueOnce({ data: mockExercise, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    
    supabase.limit.mockResolvedValueOnce({ 
      data: mockRelatedExercises, 
      error: null 
    });

    renderWithRouter(1);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('שכיבות סמיכה')).toBeInTheDocument();
    });

    // Video modal should not be visible initially
    expect(screen.queryByTitle('הדגמת שכיבות סמיכה')).not.toBeInTheDocument();
    
    // Click on the play button
    const playButton = screen.getByRole('button', { name: /צפה בהדגמת וידאו/i });
    fireEvent.click(playButton);
    
    // Video modal should now be visible
    await waitFor(() => {
      const iframe = screen.getByTitle('הדגמת שכיבות סמיכה');
      expect(iframe).toBeInTheDocument();
      // Check that URL was properly transformed to embed format
      expect(iframe.src).toContain('https://www.youtube.com/embed/IODxDxX7oi4');
      expect(iframe.src).toContain('autoplay=1');
    });
    
    // Close the video modal
    const closeButton = screen.getByTestId('icon-close').closest('button');
    fireEvent.click(closeButton);
    
    // Video modal should be closed
    await waitFor(() => {
      expect(screen.queryByTitle('הדגמת שכיבות סמיכה')).not.toBeInTheDocument();
    });
  });

  // Test 5: Exercise history display for logged-in users
  test('displays exercise history for logged-in users', async () => {
    // Mock user profile
    const mockUserProfile = {
      user_id: 'user123',
      name: 'Test User'
    };
    
    // Mock exercise data
    supabase.single
      .mockResolvedValueOnce({ data: mockExercise, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    
    supabase.limit
      .mockResolvedValueOnce({ data: mockRelatedExercises, error: null })
      .mockResolvedValueOnce({ data: mockHistoryWorkouts, error: null });

    renderWithRouter(1, mockUserProfile);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('שכיבות סמיכה')).toBeInTheDocument();
    });

    // History tab should be visible for logged-in users
    const historyTab = screen.getByRole('button', { name: 'היסטוריה' });
    expect(historyTab).toBeInTheDocument();
    
    // Click on History tab
    fireEvent.click(historyTab);
    
    // Should show history content
    expect(screen.getByText('היסטוריית אימונים עם תרגיל זה')).toBeInTheDocument();
    
    // If there's no history, it should show the "no history" message
    if (mockHistoryWorkouts.length === 0) {
      expect(screen.getByText('עדיין לא השתמשת בתרגיל זה באימונים שלך.')).toBeInTheDocument();
    } else {
      // Should show workout history items
      expect(screen.getByText('אימון חזה')).toBeInTheDocument();
      expect(screen.getByText('אימון כח')).toBeInTheDocument();
      expect(screen.getByText('45 דקות')).toBeInTheDocument();
      expect(screen.getByText('60 דקות')).toBeInTheDocument();
    }
  });
});