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

  test('2. Highlights current user', () => {
    render(<LeaderboardSection participants={mockParticipants} userId="u2" metric="km" />);
    const bobRow = screen.getByText('Bob').closest('div');
    expect(bobRow.className).toMatch(/currentUserRow/);
    expect(screen.getByText(/אתה/i)).toBeInTheDocument();
  });

  test('3. Formats metric values correctly', () => {
    render(<LeaderboardSection participants={mockParticipants} userId="u1" metric="calories" />);
    expect(screen.getByText(/100 קלוריות/)).toBeInTheDocument();
  });

  test('4. Shows top 3 participants with medals/crown', () => {
    render(<LeaderboardSection participants={mockParticipants} userId="u3" metric="steps" />);
    const gold = screen.getAllByTitle('מקום ראשון')[0];
    const silver = screen.getAllByTitle('מקום 2')[0];
    const bronze = screen.getAllByTitle('מקום 3')[0];
    expect(gold).toBeInTheDocument();
    expect(silver).toBeInTheDocument();
    expect(bronze).toBeInTheDocument();
  });

  test('5. Shows empty message when no participants', () => {
    render(<LeaderboardSection participants={[]} userId="u1" />);
    expect(screen.getByText(/אין משתתפים בלוח המובילים עדיין/i)).toBeInTheDocument();
  });

  test('6. Collapsible leaderboard toggles visibility', () => {
    render(<LeaderboardSection participants={mockParticipants} userId="u1" isCollapsible={true} />);
    const toggleButton = screen.getByRole('button');
    expect(screen.getByText(/לוח מובילים/i)).toBeInTheDocument();
    fireEvent.click(toggleButton);
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    fireEvent.click(toggleButton);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  test('7. Filters participants by search term', () => {
    const longList = [
      ...mockParticipants,
      { user_id: 'u4', name: 'David', value: 50, avatar_url: '' },
      { user_id: 'u5', name: 'Eve', value: 30, avatar_url: '' },
    ];
    render(<LeaderboardSection participants={longList} userId="u1" />);
    fireEvent.change(screen.getByPlaceholderText(/חיפוש משתתפים/i), { target: { value: 'eve' } });
    expect(screen.getByText('Eve')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });
});
