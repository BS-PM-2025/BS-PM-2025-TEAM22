// src/components/workouts/__tests__/WorkoutTracker.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import WorkoutTracker from '../WorkoutTracker';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn()
  }
}));

// Mock child components to simplify testing
jest.mock('../StatCard', () => ({ title, value, icon }) => (
  <div data-testid="stat-card">
    <div data-testid="stat-title">{title}</div>
    <div data-testid="stat-value">{value}</div>
    {icon}
  </div>
));

jest.mock('../ProgressCharts', () => ({ workoutHistory }) => (
  <div data-testid="progress-charts">
    Workouts: {workoutHistory.length}
  </div>
));

jest.mock('../WorkoutHistoryItem', () => ({ workout, onDelete, onEdit, onDuplicate }) => (
  <div data-testid={`workout-item-${workout.id}`}>
    <div>{workout.workout_name}</div>
    <button onClick={onDelete} data-testid={`delete-workout-${workout.id}`}>Delete</button>
    <button onClick={onEdit} data-testid={`edit-workout-${workout.id}`}>Edit</button>
    <button onClick={onDuplicate} data-testid={`duplicate-workout-${workout.id}`}>Duplicate</button>
  </div>
));

jest.mock('../AddWorkoutForm', () => ({ onSubmit, onCancel }) => (
  <div data-testid="add-workout-form">
    <button onClick={() => onSubmit({
      id: 'new-workout-id',
      workout_name: 'Test Workout',
      workout_date: '2025-05-09',
      workout_type: 'strength',
      duration_minutes: 45,
      user_id: 'test-user'
    })} data-testid="submit-workout">
      Add Workout
    </button>
    <button onClick={onCancel} data-testid="cancel-add-workout">Cancel</button>
  </div>
));

jest.mock('../WorkoutCalendar', () => () => (
  <div data-testid="workout-calendar">Calendar Mock</div>
));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Sample workout data
const mockWorkouts = [
  {
    id: '1',
    workout_name: 'Morning Run',
    workout_date: '2025-05-08',
    workout_type: 'cardio',
    duration_minutes: 30,
    user_id: 'test-user',
    facility_name: 'Park',
    notes: 'Good pace'
  },
  {
    id: '2',
    workout_name: 'Weight Training',
    workout_date: '2025-05-06',
    workout_type: 'strength',
    duration_minutes: 45,
    user_id: 'test-user',
    facility_name: 'Gym',
    notes: 'Increased weights'
  }
];

describe('WorkoutTracker Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('overview');
    
    // Mock supabase responses
    supabase.from().select().eq().order.mockResolvedValue({
      data: mockWorkouts,
      error: null
    });
    
    supabase.from().delete().eq.mockResolvedValue({
      error: null
    });
    
    supabase.from().insert().select().single.mockResolvedValue({
      data: {
        id: 'new-workout-id',
        workout_name: 'Test Workout',
        workout_date: '2025-05-09',
        workout_type: 'strength',
        duration_minutes: 45,
        user_id: 'test-user'
      },
      error: null
    });
    
    // Mock navigate function
    useNavigate.mockReturnValue(jest.fn());
  });

  // Test 1: Renders login prompt when user is not authenticated
  test('renders login prompt when user is not authenticated', () => {
    useAuth.mockReturnValue({ user: null, userProfile: null });
    
    render(<WorkoutTracker />);
    
    expect(screen.getByText('יש להתחבר כדי לעקוב אחר אימונים')).toBeInTheDocument();
    expect(screen.getByText('התחברות / הרשמה')).toBeInTheDocument();
  });

  // Test 2: Displays loading state while fetching data
  test('displays loading state while fetching workout data', () => {
    useAuth.mockReturnValue({ 
      user: { id: 'test-user' }, 
      userProfile: { name: 'Test User' } 
    });
    
    // Don't resolve the promise yet to keep loading state
    supabase.from().select().eq().order.mockReturnValue(new Promise(() => {}));
    
    render(<WorkoutTracker />);
    
    expect(screen.getByText('טוען נתוני אימונים...')).toBeInTheDocument();
  });

  // Test 3: Renders workout statistics when data is loaded
  test('renders workout statistics when data is loaded', async () => {
    useAuth.mockReturnValue({ 
      user: { id: 'test-user' }, 
      userProfile: { name: 'Test User' } 
    });
    
    await act(async () => {
      render(<WorkoutTracker />);
    });
    
    expect(screen.getByText('סך הכל אימונים')).toBeInTheDocument();
    expect(screen.getByText('זמן אימון כולל')).toBeInTheDocument();
    expect(screen.getByText('סוג אימון מועדף')).toBeInTheDocument();
    expect(screen.getByTestId('progress-charts')).toBeInTheDocument();
  });

  // Test 4: Switches between tabs correctly
  test('switches between tabs correctly', async () => {
    useAuth.mockReturnValue({ 
      user: { id: 'test-user' }, 
      userProfile: { name: 'Test User' } 
    });
    
    await act(async () => {
      render(<WorkoutTracker />);
    });
    
    // Default tab should be 'overview'
    expect(screen.getByText('המלצות מותאמות אישית')).toBeInTheDocument();
    
    // Click on history tab
    await act(async () => {
      fireEvent.click(screen.getByText('היסטוריית אימונים'));
    });
    
    // Should now show history content
    expect(screen.getByTestId('workout-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('workout-item-2')).toBeInTheDocument();
    
    // Click on calendar tab
    await act(async () => {
      fireEvent.click(screen.getByText('לוח שנה'));
    });
    
    // Should now show calendar content
    expect(screen.getByTestId('workout-calendar')).toBeInTheDocument();
  });

  // Test 5: Opens and submits workout form correctly
  test('opens and submits add workout form correctly', async () => {
    useAuth.mockReturnValue({ 
      user: { id: 'test-user' }, 
      userProfile: { name: 'Test User' } 
    });
    
    await act(async () => {
      render(<WorkoutTracker />);
    });
    
    // Click add workout button
    fireEvent.click(screen.getByText('הוסף אימון חדש'));
    
    // Form should be visible
    expect(screen.getByTestId('add-workout-form')).toBeInTheDocument();
    
    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-workout'));
    });
    
    // Should show success message
    expect(screen.getByText('האימון "Test Workout" נוסף בהצלחה!')).toBeInTheDocument();
  });

  // Test 6: Deletes a workout correctly
  test('deletes a workout correctly', async () => {
    useAuth.mockReturnValue({ 
      user: { id: 'test-user' }, 
      userProfile: { name: 'Test User' } 
    });
    
    await act(async () => {
      render(<WorkoutTracker />);
    });
    
    // Switch to history tab
    fireEvent.click(screen.getByText('היסטוריית אימונים'));
    
    // Click delete on the first workout item
    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-workout-1'));
    });
    
    // Should show success message
    expect(screen.getByText('האימון "Morning Run" נמחק בהצלחה!')).toBeInTheDocument();
    
    // Verify supabase was called with correct params
    expect(supabase.from).toHaveBeenCalledWith('user_workouts');
    expect(supabase.from().delete).toHaveBeenCalled();
    expect(supabase.from().delete().eq).toHaveBeenCalledWith('id', '1');
  });
});