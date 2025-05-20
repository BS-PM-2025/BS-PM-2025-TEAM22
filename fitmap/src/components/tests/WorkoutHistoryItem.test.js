// src/components/workouts/__tests__/WorkoutHistoryItem.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkoutHistoryItem from '../workouts/WorkoutHistoryItem';
import '@testing-library/jest-dom';

const mockWorkout = {
  id: 1,
  workout_name: 'אימון חיזוק',
  workout_date: '2024-05-01',
  duration_minutes: 45,
  workout_type: 'strength',
  difficulty_rating: 4,
  calories_burned: 350,
  weight: 80,
  facility_name: 'חדר כושר ראשי',
  notes: 'בדיקה https://example.com',
  exercises_performed: [
    { name: 'שכיבות סמיכה', sets: 3, reps: 12 }
  ]
};

describe('WorkoutHistoryItem', () => {
  test('renders workout title', () => {
    render(<WorkoutHistoryItem workout={mockWorkout} />);
    expect(screen.getByText('אימון חיזוק')).toBeInTheDocument();
  });

  test('renders duration and date info', () => {
    render(<WorkoutHistoryItem workout={mockWorkout} />);
    expect(screen.getByText(/45 דקות/)).toBeInTheDocument();
    expect(screen.getByText(/01\/05\/2024/)).toBeInTheDocument();
  });

  test('renders workout type in Hebrew', () => {
    render(<WorkoutHistoryItem workout={mockWorkout} />);
    expect(screen.getByText('חיזוק')).toBeInTheDocument();
  });

  test('shows delete confirmation when delete clicked', () => {
    const mockDelete = jest.fn();
    render(<WorkoutHistoryItem workout={mockWorkout} onDelete={mockDelete} />);
    fireEvent.click(screen.getByLabelText('מחק אימון'));
    expect(screen.getByText('האם אתה בטוח שברצונך למחוק?')).toBeInTheDocument();
  });
});
