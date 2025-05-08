// src/components/tests/ExerciseLibrary.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ExerciseLibrary from '../workouts/workouts/ExerciseLibrary';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../../utils/supabaseClient';

// Mock dependencies
jest.mock('../../hooks/useAuth');
jest.mock('../../utils/supabaseClient');
jest.mock('../workouts/workouts/ExerciseCard', () => 
  require('../workouts/workouts/__mocks__/ExerciseCard')
);
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

const mockExercises = [
  {
    id: 1,
    name: 'פול אפ',
    description: 'תרגיל מתח בסיסי',
    muscle_group: 'גב',
    secondary_muscles: ['זרועות'],
    difficulty: 'intermediate',
    equipment: ['pullup_bars'],
    image: 'pullup.jpg',
    video_url: 'https://example.com/pullup.mp4'
  },
  {
    id: 2,
    name: 'פוש אפ',
    description: 'שכיבות שמיכה',
    muscle_group: 'חזה',
    secondary_muscles: ['זרועות', 'כתפיים'],
    difficulty: 'beginner',
    equipment: [],
    image: 'pushup.jpg',
    video_url: 'https://example.com/pushup.mp4'
  },
  {
    id: 3,
    name: 'סקוואט',
    description: 'תרגיל רגליים בסיסי',
    muscle_group: 'רגליים',
    secondary_muscles: [],
    difficulty: 'beginner',
    equipment: [],
    image: 'squat.jpg',
    video_url: 'https://example.com/squat.mp4'
  },
  {
    id: 4,
    name: 'מקבילים',
    description: 'תרגיל זרועות מתקדם',
    muscle_group: 'זרועות',
    secondary_muscles: ['חזה', 'כתפיים'],
    difficulty: 'advanced',
    equipment: ['parallel_bars'],
    image: 'dips.jpg',
    video_url: 'https://example.com/dips.mp4'
  }
];

const mockFavorites = [1, 3];

describe('ExerciseLibrary Component', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock the Supabase query responses
    supabase.from.mockImplementation((table) => {
      if (table === 'exercises') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ 
            data: mockExercises, 
            error: null 
          })
        };
      } else if (table === 'exercise_favorites') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: mockFavorites.map(id => ({ exercise_id: id })),
            error: null
          }),
          delete: jest.fn().mockReturnThis(),
          insert: jest.fn().mockResolvedValue({ error: null })
        };
      }
    });
  });

  test('renders loading state initially', () => {
    // Mock user as logged in
    useAuth.mockReturnValue({ user: { id: 'user123' } });
    
    render(
      <BrowserRouter>
        <ExerciseLibrary />
      </BrowserRouter>
    );
    
    expect(screen.getByText('טוען תרגילים...')).toBeInTheDocument();
  });

  test('renders exercise cards after loading', async () => {
    // Mock user as logged in
    useAuth.mockReturnValue({ user: { id: 'user123' } });
    
    render(
      <BrowserRouter>
        <ExerciseLibrary />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('טוען תרגילים...')).not.toBeInTheDocument();
    });
    
    // Check that exercises are rendered
    expect(screen.getByText('פול אפ')).toBeInTheDocument();
    expect(screen.getByText('פוש אפ')).toBeInTheDocument();
    expect(screen.getByText('סקוואט')).toBeInTheDocument();
    expect(screen.getByText('מקבילים')).toBeInTheDocument();
  });

  test('filters exercises by search term', async () => {
    // Mock user as logged in
    useAuth.mockReturnValue({ user: { id: 'user123' } });
    
    render(
      <BrowserRouter>
        <ExerciseLibrary />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('טוען תרגילים...')).not.toBeInTheDocument();
    });
    
    // Search for 'פול'
    const searchInput = screen.getByPlaceholderText('חפש תרגילים...');
    fireEvent.change(searchInput, { target: { value: 'פול' } });
    
    // Wait for the filtering to apply
    await waitFor(() => {
      // Should show פול אפ but not the others
      expect(screen.getByText('פול אפ')).toBeInTheDocument();
      expect(screen.queryByText('פוש אפ')).not.toBeInTheDocument();
      expect(screen.queryByText('סקוואט')).not.toBeInTheDocument();
      expect(screen.queryByText('מקבילים')).not.toBeInTheDocument();
    });
  });

  test('filters exercises by muscle group', async () => {
    // Mock user as logged in
    useAuth.mockReturnValue({ user: { id: 'user123' } });
    
    render(
      <BrowserRouter>
        <ExerciseLibrary />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('טוען תרגילים...')).not.toBeInTheDocument();
    });
    
    // Show filters
    fireEvent.click(screen.getByText(/סנן תרגילים/i));
    
    // Select muscle group 'חזה'
    const muscleGroupSelect = screen.getByLabelText('קבוצת שרירים');
    fireEvent.change(muscleGroupSelect, { target: { value: 'חזה' } });
    
    // Should show פוש אפ but not the others
    expect(screen.queryByText('פול אפ')).not.toBeInTheDocument();
    expect(screen.getByText('פוש אפ')).toBeInTheDocument();
    expect(screen.queryByText('סקוואט')).not.toBeInTheDocument();
    expect(screen.getByText('מקבילים')).toBeInTheDocument(); // This one has חזה as secondary muscle
  });

  test('filters exercises by difficulty', async () => {
    // Mock user as logged in
    useAuth.mockReturnValue({ user: { id: 'user123' } });
    
    render(
      <BrowserRouter>
        <ExerciseLibrary />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('טוען תרגילים...')).not.toBeInTheDocument();
    });
    
    // Show filters
    fireEvent.click(screen.getByText(/סנן תרגילים/i));
    
    // Select difficulty 'advanced'
    const difficultySelect = screen.getByLabelText('רמת קושי');
    fireEvent.change(difficultySelect, { target: { value: 'advanced' } });
    
    // Should show מקבילים but not the others
    expect(screen.queryByText('פול אפ')).not.toBeInTheDocument();
    expect(screen.queryByText('פוש אפ')).not.toBeInTheDocument();
    expect(screen.queryByText('סקוואט')).not.toBeInTheDocument();
    expect(screen.getByText('מקבילים')).toBeInTheDocument();
  });

  test('filters exercises by equipment', async () => {
    // Mock user as logged in
    useAuth.mockReturnValue({ user: { id: 'user123' } });
    
    render(
      <BrowserRouter>
        <ExerciseLibrary />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('טוען תרגילים...')).not.toBeInTheDocument();
    });
    
    // Show filters
    fireEvent.click(screen.getByText(/סנן תרגילים/i));
    
    // Select equipment 'ללא ציוד'
    const equipmentSelect = screen.getByLabelText('ציוד נדרש');
    fireEvent.change(equipmentSelect, { target: { value: 'ללא ציוד' } });
    
    // Should show פוש אפ and סקוואט but not the others
    expect(screen.queryByText('פול אפ')).not.toBeInTheDocument();
    expect(screen.getByText('פוש אפ')).toBeInTheDocument();
    expect(screen.getByText('סקוואט')).toBeInTheDocument();
    expect(screen.queryByText('מקבילים')).not.toBeInTheDocument();
  });

  test('filters exercises by favorites only', async () => {
    // Mock user as logged in
    useAuth.mockReturnValue({ user: { id: 'user123' } });
    
    render(
      <BrowserRouter>
        <ExerciseLibrary />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('טוען תרגילים...')).not.toBeInTheDocument();
    });
    
    // Show only favorites
    fireEvent.click(screen.getByText(/הצג רק מועדפים/i));
    
    // Should show favorites only (פול אפ and סקוואט based on mockFavorites)
    expect(screen.getByText('פול אפ')).toBeInTheDocument();
    expect(screen.queryByText('פוש אפ')).not.toBeInTheDocument();
    expect(screen.getByText('סקוואט')).toBeInTheDocument();
    expect(screen.queryByText('מקבילים')).not.toBeInTheDocument();
  });

  test('toggles favorite status', async () => {
    // Mock user as logged in
    useAuth.mockReturnValue({ user: { id: 'user123' } });
    
    render(
      <BrowserRouter>
        <ExerciseLibrary />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('טוען תרגילים...')).not.toBeInTheDocument();
    });
    
    // Find favorite buttons
    const favoriteButtons = screen.getAllByTestId('favorite-button');
    
    // Toggle favorite for פוש אפ (which is not a favorite initially)
    // We need to find the button near the פוש אפ card
    const pushupCardIndex = mockExercises.findIndex(ex => ex.name === 'פוש אפ');
    fireEvent.click(favoriteButtons[pushupCardIndex]);
    
    // Check that supabase.from('exercise_favorites').insert was called
    expect(supabase.from).toHaveBeenCalledWith('exercise_favorites');
  });

  test('resets filters when clicking reset button', async () => {
    // Mock user as logged in
    useAuth.mockReturnValue({ user: { id: 'user123' } });
    
    render(
      <BrowserRouter>
        <ExerciseLibrary />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('טוען תרגילים...')).not.toBeInTheDocument();
    });
    
    // Show filters
    fireEvent.click(screen.getByText(/סנן תרגילים/i));
    
    // Apply some filters
    const muscleGroupSelect = screen.getByLabelText('קבוצת שרירים');
    fireEvent.change(muscleGroupSelect, { target: { value: 'חזה' } });
    
    // Only פוש אפ and מקבילים should be visible now
    expect(screen.queryByText('פול אפ')).not.toBeInTheDocument();
    expect(screen.getByText('פוש אפ')).toBeInTheDocument();
    
    // Reset filters
    fireEvent.click(screen.getByText('איפוס פילטרים'));
    
    // All exercises should be visible again
    expect(screen.getByText('פול אפ')).toBeInTheDocument();
    expect(screen.getByText('פוש אפ')).toBeInTheDocument();
    expect(screen.getByText('סקוואט')).toBeInTheDocument();
    expect(screen.getByText('מקבילים')).toBeInTheDocument();
  });

  test('shows no results message when no exercises match filters', async () => {
    // Mock user as logged in
    useAuth.mockReturnValue({ user: { id: 'user123' } });
    
    render(
      <BrowserRouter>
        <ExerciseLibrary />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('טוען תרגילים...')).not.toBeInTheDocument();
    });
    
    // Search for a term that won't match any exercises
    const searchInput = screen.getByPlaceholderText('חפש תרגילים...');
    fireEvent.change(searchInput, { target: { value: 'תרגיל שלא קיים' } });
    
    // Should show no results message
    expect(screen.getByText('לא נמצאו תרגילים')).toBeInTheDocument();
  });

  test('handles error in fetching exercises', async () => {
    // Mock error response
    supabase.from.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      })
    }));
    
    // Mock console.error to prevent test output pollution
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Mock user as logged in
    useAuth.mockReturnValue({ user: { id: 'user123' } });
    
    render(
      <BrowserRouter>
        <ExerciseLibrary />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('טוען תרגילים...')).not.toBeInTheDocument();
    });
    
    // Should show no results since fetching failed
    expect(screen.getByText('לא נמצאו תרגילים')).toBeInTheDocument();
    expect(console.error).toHaveBeenCalledWith('שגיאה בטעינת תרגילים:', 'Database error');
    
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  test('handles unauthenticated user', async () => {
    // Mock user as not logged in
    useAuth.mockReturnValue({ user: null });
    
    render(
      <BrowserRouter>
        <ExerciseLibrary />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('טוען תרגילים...')).not.toBeInTheDocument();
    });
    
    // Should still show exercises but favorites functionality should be limited
    expect(screen.getByText('פול אפ')).toBeInTheDocument();
    
    // Find favorite buttons
    const favoriteButtons = screen.getAllByTestId('favorite-button');
    
    // Toggle favorite for an exercise
    fireEvent.click(favoriteButtons[0]);
    
    // Check that supabase was not called to update favorites
    expect(supabase.from).not.toHaveBeenCalledWith('exercise_favorites');
  });
});