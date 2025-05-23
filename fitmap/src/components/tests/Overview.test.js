import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Overview from '../user/Profile/Overview';

// Mock the child components
jest.mock('../workouts/StatCard', () => {
  return function MockStatCard({ title, value, icon, color }) {
    return (
      <div data-testid="stat-card">
        <div data-testid="stat-title">{title}</div>
        <div data-testid="stat-value">{value}</div>
        <div data-testid="stat-color" style={{ color }}>{icon}</div>
      </div>
    );
  };
});

jest.mock('../workouts/ProgressCharts', () => {
  return function MockProgressCharts({ workoutHistory }) {
    return (
      <div data-testid="progress-charts">
        Charts for {workoutHistory.length} workouts
      </div>
    );
  };
});

jest.mock('../workouts/WorkoutHistoryItem', () => {
  return function MockWorkoutHistoryItem({ workout, showActions }) {
    return (
      <div data-testid="workout-history-item">
        Workout: {workout.name} - Actions: {showActions ? 'true' : 'false'}
      </div>
    );
  };
});

jest.mock('../challenges/UserProgressBar', () => {
  return function MockUserProgressBar({ currentValue, targetValue, metric }) {
    return (
      <div data-testid="user-progress-bar">
        Progress: {currentValue}/{targetValue} {metric}
      </div>
    );
  };
});

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaDumbbell: () => <span data-testid="dumbbell-icon">🏋️</span>,
  FaClock: () => <span data-testid="clock-icon">⏰</span>,
  FaFire: () => <span data-testid="fire-icon">🔥</span>,
  FaHeartbeat: () => <span data-testid="heartbeat-icon">💗</span>,
  FaRunning: () => <span data-testid="running-icon">🏃</span>,
  FaMedal: () => <span data-testid="medal-icon">🏅</span>,
  FaTrophy: () => <span data-testid="trophy-icon">🏆</span>,
  FaCalendarAlt: () => <span data-testid="calendar-icon">📅</span>,
}));

// Mock CSS modules
jest.mock('./Profile.module.css', () => ({
  overviewContent: 'overviewContent',
  statsGrid: 'statsGrid',
  chartsSection: 'chartsSection',
  sectionTitle: 'sectionTitle',
  recentWorkoutsSection: 'recentWorkoutsSection',
  sectionHeader: 'sectionHeader',
  viewAllButton: 'viewAllButton',
  recentWorkoutsList: 'recentWorkoutsList',
  activeChallengesSection: 'activeChallengesSection',
  challengesProgress: 'challengesProgress',
  challengeProgressItem: 'challengeProgressItem',
  challengeTitle: 'challengeTitle',
  emptyState: 'emptyState',
  loadingData: 'loadingData',
  loadingSpinner: 'loadingSpinner'
}));

describe('Overview Component', () => {
  const mockNavigate = jest.fn();
  const mockFormatMinutes = jest.fn((minutes) => `${minutes} דקות`);

  const sampleStats = {
    totalWorkouts: 25,
    totalMinutes: 1500,
    totalCalories: 3000,
    favoriteWorkoutType: 'ריצה',
    currentStreak: 5,
    longestStreak: 10,
    completedChallenges: 3,
    achievementCount: 8
  };

  const sampleWorkoutHistory = [
    { id: 1, name: 'אימון ריצה', date: '2023-01-01' },
    { id: 2, name: 'אימון כוח', date: '2023-01-02' },
    { id: 3, name: 'אימון יוגה', date: '2023-01-03' }
  ];

  const sampleChallenges = [
    {
      id: 1,
      title: 'אתגר ריצה',
      current_value: '5',
      target_value: '10',
      metric: 'km'
    },
    {
      id: 2,
      name: 'אתגר כוח',
      current_value: '15',
      target_value: '30',
      metric: 'workouts'
    }
  ];

  const defaultUserData = {
    stats: sampleStats,
    workoutHistory: sampleWorkoutHistory,
    challenges: sampleChallenges,
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Unit Test 1: Loading State Display
  test('displays loading state when loading is true', () => {
    const loadingUserData = { ...defaultUserData, loading: true };
    
    render(
      <Overview
        userData={loadingUserData}
        formatMinutes={mockFormatMinutes}
        navigate={mockNavigate}
      />
    );

    expect(screen.getByText('טוען נתונים...')).toBeInTheDocument();
    expect(screen.getByText('טוען נתונים...')).toBeInTheDocument();
  });

  // Unit Test 3: Empty State Display
  test('displays empty state when no workout history exists', () => {
    const emptyUserData = {
      stats: sampleStats,
      workoutHistory: [],
      challenges: [],
      loading: false
    };

    render(
      <Overview
        userData={emptyUserData}
        formatMinutes={mockFormatMinutes}
        navigate={mockNavigate}
      />
    );

    expect(screen.getByText('אין היסטוריית אימונים להצגה')).toBeInTheDocument();
  });

  // Integration Test 1: Complete Data Display and Navigation
  test('displays all sections with complete data and handles navigation', async () => {
    render(
      <Overview
        userData={defaultUserData}
        formatMinutes={mockFormatMinutes}
        navigate={mockNavigate}
      />
    );

    // Check stats section
    const statCards = screen.getAllByTestId('stat-card');
    expect(statCards).toHaveLength(8);

    // Check workout history section
    expect(screen.getByText('אימונים אחרונים')).toBeInTheDocument();
    const workoutItems = screen.getAllByTestId('workout-history-item');
    expect(workoutItems).toHaveLength(3);

    // Check challenges section
    expect(screen.getByText('אתגרים פעילים')).toBeInTheDocument();
    const progressBars = screen.getAllByTestId('user-progress-bar');
    expect(progressBars).toHaveLength(2);

    // Test navigation buttons
    const viewAllButtons = screen.getAllByText('הצג הכל');
    expect(viewAllButtons).toHaveLength(2);

    // Click workouts "view all" button
    fireEvent.click(viewAllButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/workouts');

    // Click challenges "view all" button
    fireEvent.click(viewAllButtons[1]);
    expect(mockNavigate).toHaveBeenCalledWith('/challenges');
  });

  // Integration Test 2: Progress Charts Conditional Rendering
  test('renders progress charts only when sufficient workout data exists', () => {
    // Test with insufficient data (1 workout)
    const insufficientData = {
      ...defaultUserData,
      workoutHistory: [{ id: 1, name: 'אימון יחיד', date: '2023-01-01' }]
    };

    const { rerender } = render(
      <Overview
        userData={insufficientData}
        formatMinutes={mockFormatMinutes}
        navigate={mockNavigate}
      />
    );

    // Should not render progress charts
    expect(screen.queryByTestId('progress-charts')).not.toBeInTheDocument();
    expect(screen.queryByText('נתוני התקדמות')).not.toBeInTheDocument();

    // Test with sufficient data (2+ workouts)
    rerender(
      <Overview
        userData={defaultUserData}
        formatMinutes={mockFormatMinutes}
        navigate={mockNavigate}
      />
    );

    // Should render progress charts
    expect(screen.getByTestId('progress-charts')).toBeInTheDocument();
    expect(screen.getByText('נתוני התקדמות')).toBeInTheDocument();
    expect(screen.getByText('Charts for 3 workouts')).toBeInTheDocument();
  });
});

// Test data exports for potential reuse
export const testData = {
  sampleStats: {
    totalWorkouts: 25,
    totalMinutes: 1500,
    totalCalories: 3000,
    favoriteWorkoutType: 'ריצה',
    currentStreak: 5,
    longestStreak: 10,
    completedChallenges: 3,
    achievementCount: 8
  },
  sampleWorkoutHistory: [
    { id: 1, name: 'אימון ריצה', date: '2023-01-01' },
    { id: 2, name: 'אימון כוח', date: '2023-01-02' },
    { id: 3, name: 'אימון יוגה', date: '2023-01-03' }
  ],
  sampleChallenges: [
    {
      id: 1,
      title: 'אתגר ריצה',
      current_value: '5',
      target_value: '10',
      metric: 'km'
    },
    {
      id: 2,
      name: 'אתגר כוח',
      current_value: '15',
      target_value: '30',
      metric: 'workouts'
    }
  ]
};