import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterToggle from '../map/FilterToggle';
import styles from '../../styles/FitnessMap.module.css';

describe('FilterToggle', () => {
  const mockSetShowFilters = jest.fn();

  beforeEach(() => {
    mockSetShowFilters.mockClear();
  });

  test('renders filter button with correct text when filters are hidden', () => {
    render(<FilterToggle showFilters={false} setShowFilters={mockSetShowFilters} />);
    expect(screen.getByText('סנן מתקנים')).toBeInTheDocument();
  });

  test('renders filter button with correct text when filters are shown', () => {
    render(<FilterToggle showFilters={true} setShowFilters={mockSetShowFilters} />);
    expect(screen.getByText('הסתר פילטרים')).toBeInTheDocument();
  });

  test('calls setShowFilters with opposite value when clicked', () => {
    render(<FilterToggle showFilters={false} setShowFilters={mockSetShowFilters} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockSetShowFilters).toHaveBeenCalledWith(true);
  });
}); 