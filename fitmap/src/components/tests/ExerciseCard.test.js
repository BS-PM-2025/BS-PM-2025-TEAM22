// src/components/workouts/__tests__/ExerciseCard.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExerciseCard from '../workouts/ExerciseCard';

// Mock the styles to avoid CSS module issues in tests
jest.mock('../styles/ExerciseLibrary.module.css', () => ({
  libraryItem: 'libraryItem',
  mediaSection: 'mediaSection',
  videoWrapper: 'videoWrapper',
  cardVideo: 'cardVideo',
  videoLoading: 'videoLoading',
  loadingIcon: 'loadingIcon',
  exerciseImage: 'exerciseImage',
  exerciseInfo: 'exerciseInfo',
  favoriteButton: 'favoriteButton'
}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaStar: () => <span data-testid="star-icon" />,
  FaHeart: () => <span data-testid="heart-filled-icon" />,
  FaRegHeart: () => <span data-testid="heart-outline-icon" />,
  FaPlayCircle: () => <span data-testid="play-icon" />
}));

describe('ExerciseCard Component', () => {
  const mockExercise = {
    id: '1',
    name: 'שכיבות סמיכה',
    description: 'תרגיל לחיזוק חזה וזרועות',
    difficulty: 'intermediate',
    muscleGroup: 'חזה',
    image: 'test-image.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4'
  };

  const mockOnClick = jest.fn();
  const mockOnToggleFavorite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Tests favorite toggle functionality
  test('toggles favorite status correctly', () => {
    // First test with isFavorite=false
    const { rerender } = render(
      <ExerciseCard 
        exercise={mockExercise} 
        onClick={mockOnClick} 
        isFavorite={false} 
        onToggleFavorite={mockOnToggleFavorite} 
      />
    );
    
    expect(screen.getByTestId('heart-outline-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('heart-filled-icon')).not.toBeInTheDocument();
    
    // Click the favorite button
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnToggleFavorite).toHaveBeenCalledTimes(1);
    
    // Rerender with isFavorite=true
    rerender(
      <ExerciseCard 
        exercise={mockExercise} 
        onClick={mockOnClick} 
        isFavorite={true} 
        onToggleFavorite={mockOnToggleFavorite} 
      />
    );
    
    expect(screen.getByTestId('heart-filled-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('heart-outline-icon')).not.toBeInTheDocument();
  });

  // Test 2: Tests click event on card
  test('calls onClick when card is clicked', () => {
    render(
      <ExerciseCard 
        exercise={mockExercise} 
        onClick={mockOnClick} 
        isFavorite={false} 
        onToggleFavorite={mockOnToggleFavorite} 
      />
    );
    
    fireEvent.click(screen.getByText('שכיבות סמיכה').closest('div.libraryItem'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  // Test 3: Tests difficulty star rendering for different levels
  test('renders correct number of stars based on difficulty', () => {
    // Test beginner difficulty (1 star)
    const beginnerExercise = { ...mockExercise, difficulty: 'beginner' };
    const { rerender } = render(
      <ExerciseCard 
        exercise={beginnerExercise} 
        onClick={mockOnClick} 
        isFavorite={false} 
        onToggleFavorite={mockOnToggleFavorite} 
      />
    );
    
    let stars = screen.getAllByTestId('star-icon');
    expect(stars.length).toBe(1);
    expect(screen.getByText(/מתחיל/i)).toBeInTheDocument();
    
    // Test advanced difficulty (3 stars)
    const advancedExercise = { ...mockExercise, difficulty: 'advanced' };
    rerender(
      <ExerciseCard 
        exercise={advancedExercise} 
        onClick={mockOnClick} 
        isFavorite={false} 
        onToggleFavorite={mockOnToggleFavorite} 
      />
    );
    
    stars = screen.getAllByTestId('star-icon');
    expect(stars.length).toBe(3);
    expect(screen.getByText(/מתקדם/i)).toBeInTheDocument();
  });
});