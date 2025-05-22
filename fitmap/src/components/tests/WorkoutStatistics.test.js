// src/components/workouts/WorkoutStatistics.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import WorkoutStatistics from '../workouts/WorkoutStatistics';

// Mock the ResponsiveContainer because it doesn't render well in tests
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  };
});

// Sample workout data for testing
const mockWorkouts = [
  {
    id: 'workout1',
    start: '2025-04-01T09:00:00',
    workout_type: 'strength',
    workout: { duration: 45 }
  },
  {
    id: 'workout2',
    start: '2025-04-15T10:00:00',
    workout_type: 'cardio',
    workout: { duration: 30 }
  },
  {
    id: 'workout3',
    start: '2025-05-01T08:00:00',
    workout_type: 'strength',
    workout: { duration: 50 }
  },
  {
    id: 'workout4',
    start: '2025-05-08T17:00:00',
    workout_type: 'flexibility',
    workout: { duration: 40 }
  }
];

describe('WorkoutStatistics Component', () => {
  test('renders empty state message when no workouts are provided', () => {
    render(<WorkoutStatistics workouts={[]} />);
    
    // Check if empty state message is displayed
    expect(screen.getByText('אין נתוני אימונים להצגת סטטיסטיקות')).toBeInTheDocument();
    
    // The charts should not be rendered
    expect(screen.queryByText('אימונים ב-6 חודשים אחרונים')).not.toBeInTheDocument();
  });

  test('displays correct general statistics for the provided workouts', () => {
    render(<WorkoutStatistics workouts={mockWorkouts} />);
    
    // Check if the total number of workouts is displayed correctly
    expect(screen.getByText('4')).toBeInTheDocument();
    
    // Check if average workout duration is calculated and displayed correctly
    // (45 + 30 + 50 + 40) / 4 = 41.25 rounded to 41
    expect(screen.getByText('41 דקות')).toBeInTheDocument();
    
    // Check if the main statistics sections are rendered
    expect(screen.getByText('סה"כ אימונים')).toBeInTheDocument();
    expect(screen.getByText('ב-30 ימים אחרונים')).toBeInTheDocument();
    expect(screen.getByText('ממוצע שבועי')).toBeInTheDocument();
    expect(screen.getByText('אורך אימון ממוצע')).toBeInTheDocument();
  });

  test('renders all chart sections with correct titles', () => {
    render(<WorkoutStatistics workouts={mockWorkouts} />);
    
    // Check if all chart titles are rendered
    expect(screen.getByText('אימונים ב-6 חודשים אחרונים')).toBeInTheDocument();
    expect(screen.getByText('התפלגות סוגי אימונים')).toBeInTheDocument();
    expect(screen.getByText('אימונים לפי ימים בשבוע')).toBeInTheDocument();
    
    // Check if responsive containers are rendered for the charts
    const chartContainers = screen.getAllByTestId('responsive-container');
    expect(chartContainers.length).toBe(3); // Should have 3 charts
  });

  test('displays additional info section with active day', () => {
    render(<WorkoutStatistics workouts={mockWorkouts} />);
    
    // Check if the additional info section is rendered
    const additionalInfoSection = screen.getByText(/היום הפעיל ביותר:/);
    expect(additionalInfoSection).toBeInTheDocument();
    
    // Check if the tip is displayed
    expect(screen.getByText(/התמדה באימונים קבועים 3-4 פעמים בשבוע/)).toBeInTheDocument();
  });
});