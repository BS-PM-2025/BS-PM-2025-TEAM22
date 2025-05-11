import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LeaderboardSection from '../challenges/LeaderboardSection';

const mockParticipants = [
  { user_id: 'u1', name: 'Alice', value: 100, avatar_url: '' },
  { user_id: 'u2', name: 'Bob', value: 80, avatar_url: '' },
  { user_id: 'u3', name: 'Charlie', value: 60, avatar_url: '' },
];

describe('LeaderboardSection', () => {
  test('1. Renders leaderboard with participants', () => {
    render(<LeaderboardSection participants={mockParticipants} userId="u2" metric="km" />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  test('2. Formats metric values correctly', () => {
    render(<LeaderboardSection participants={mockParticipants} userId="u1" metric="calories" />);
    expect(screen.getByText(/100 קלוריות/)).toBeInTheDocument();
  });

  test('3. Shows top 3 participants with medals/crown', () => {
    render(<LeaderboardSection participants={mockParticipants} userId="u3" metric="steps" />);
    const gold = screen.getAllByTitle('מקום ראשון')[0];
    const silver = screen.getAllByTitle('מקום 2')[0];
    const bronze = screen.getAllByTitle('מקום 3')[0];
    expect(gold).toBeInTheDocument();
    expect(silver).toBeInTheDocument();
    expect(bronze).toBeInTheDocument();
  });

  test('4. Shows empty message when no participants', () => {
    render(<LeaderboardSection participants={[]} userId="u1" />);
    expect(screen.getByText(/אין משתתפים בלוח המובילים עדיין/i)).toBeInTheDocument();
  });
});
