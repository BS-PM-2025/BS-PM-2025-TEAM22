// src/components/workouts/__tests__/WorkoutGenerator.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import WorkoutGenerator from '../workouts/WorkoutGenerator';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mocks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ facilityId: '1' }),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1 },
    userProfile: { fitness_level: 'beginner' },
  }),
}));

jest.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => ({
            data: { id: 1, name: 'Test Facility', equipment: [] },
            error: null,
          }),
        }),
      }),
      insert: () => ({ error: null }),
    }),
  },
}));

// Helper
const renderWithRouter = (ui) => render(<Router>{ui}</Router>);

describe('WorkoutGenerator component', () => {
  test('renders loading spinner initially', async () => {
    renderWithRouter(<WorkoutGenerator />);
    expect(screen.getByText('טוען נתוני מתקן...')).toBeInTheDocument();
  });

  test('renders facility name after loading', async () => {
    renderWithRouter(<WorkoutGenerator />);
    expect(await screen.findByText(/מתקן: Test Facility/)).toBeInTheDocument();
  });

  test('renders workout goal buttons', async () => {
    renderWithRouter(<WorkoutGenerator />);
    expect(await screen.findByText('חיזוק')).toBeInTheDocument();
    expect(screen.getByText('סיבולת')).toBeInTheDocument();
    expect(screen.getByText('גמישות')).toBeInTheDocument();
  });

  test('renders intensity buttons', async () => {
    renderWithRouter(<WorkoutGenerator />);
    expect(await screen.findByText('קלה')).toBeInTheDocument();
    expect(screen.getByText('בינונית')).toBeInTheDocument();
    expect(screen.getByText('גבוהה')).toBeInTheDocument();
  });

  test('renders experience level buttons', async () => {
    renderWithRouter(<WorkoutGenerator />);
    expect(await screen.findByText('מתחיל')).toBeInTheDocument();
    expect(screen.getByText('בינוני')).toBeInTheDocument();
    expect(screen.getByText('מתקדם')).toBeInTheDocument();
  });

  test('renders generate workout button', async () => {
    renderWithRouter(<WorkoutGenerator />);
    expect(await screen.findByRole('button', { name: /יצירת תוכנית אימון/ })).toBeInTheDocument();
  });
});
