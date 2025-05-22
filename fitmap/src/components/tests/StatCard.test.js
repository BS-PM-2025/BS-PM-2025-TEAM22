// src/components/workouts/StatCard.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import StatCard from '../workouts/StatCard';
import { FaDumbbell } from 'react-icons/fa';

describe('StatCard', () => {
  test('renders with title, value, and icon', () => {
    const title = 'Workouts';
    const value = 5;
    const icon = <FaDumbbell data-testid="icon" />;

    render(<StatCard title={title} value={value} icon={icon} color="#ff0000" />);

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(value.toString())).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
