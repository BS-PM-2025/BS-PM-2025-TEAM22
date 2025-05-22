// src/components/workouts/WorkoutPlan.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WorkoutPlan from '../workouts/WorkoutPlan';

// Mock workout data for testing
const mockWorkout = {
  name: 'אימון כוח כללי',
  duration: 45,
  intensity: 'medium',
  goal: 'strength',
  exercises: [
    {
      id: 'ex1',
      name: 'סקוואט',
      sets: 3,
      reps: 12,
      restSeconds: 60,
      description: 'תרגיל לחיזוק הרגליים',
      instructions: 'עמוד עם רגליים ברוחב הכתפיים, רד למטה כאילו אתה מתיישב על כיסא',
      muscleGroup: 'רגליים',
      secondaryMuscles: ['ישבן', 'ליבה'],
      videoUrl: '/exercises/squat-video'
    },
    {
      id: 'ex2',
      name: 'לחיצת חזה',
      sets: 3,
      reps: 10,
      restSeconds: 90,
      description: 'תרגיל לחיזוק החזה',
      instructions: 'שכב על הספסל, הורד את המוט לחזה והרם בחזרה',
      muscleGroup: 'חזה',
      secondaryMuscles: ['טרייספס', 'כתפיים'],
      videoUrl: '/exercises/bench-press-video'
    }
  ]
};

// Helper function to render the component with Router context
const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

describe('WorkoutPlan Component', () => {
  test('renders workout name and basic metrics', () => {
    renderWithRouter(<WorkoutPlan workout={mockWorkout} facilityId="facility1" />);
    
    // Check if workout name is rendered
    expect(screen.getByText('אימון כוח כללי')).toBeInTheDocument();
    
    // Check if metrics are rendered
    expect(screen.getByText('45 דקות')).toBeInTheDocument();
    expect(screen.getByText('עצימות בינונית')).toBeInTheDocument();
    expect(screen.getByText('מטרה: חיזוק')).toBeInTheDocument();
  });

  test('displays error message when no workout is provided', () => {
    renderWithRouter(<WorkoutPlan workout={null} facilityId="facility1" />);
    
    expect(screen.getByText('לא נמצאה תוכנית אימון')).toBeInTheDocument();
  });

  test('expands and collapses warmup section when clicked', () => {
    renderWithRouter(<WorkoutPlan workout={mockWorkout} facilityId="facility1" />);
    
    // Initially warmup exercises should not be visible
    expect(screen.queryByText('ריצה קלה במקום')).not.toBeInTheDocument();
    
    // Click on warmup header to expand
    fireEvent.click(screen.getByText('חימום'));
    
    // Now warmup exercises should be visible
    expect(screen.getByText('ריצה קלה במקום')).toBeInTheDocument();
    expect(screen.getByText('2 דקות')).toBeInTheDocument();
    
    // Click again to collapse
    fireEvent.click(screen.getByText('חימום'));
    
    // Exercises should be hidden again
    expect(screen.queryByText('ריצה קלה במקום')).not.toBeInTheDocument();
  });
});