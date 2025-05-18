import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FitnessFilters from '../map/FitnessFilters';
import styles from '../../styles/FitnessFilters.module.css';

describe('FitnessFilters', () => {
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    mockOnFiltersChange.mockClear();
  });

  test('renders filter panel with title', () => {
    render(<FitnessFilters onFiltersChange={mockOnFiltersChange} />);
    expect(screen.getByText('סינון מתקני כושר')).toBeInTheDocument();
  });

  test('renders all filter sections', () => {
    render(<FitnessFilters onFiltersChange={mockOnFiltersChange} />);
    
    // Check section titles
    expect(screen.getByText('סוג מתקן')).toBeInTheDocument();
    expect(screen.getByText('ציוד')).toBeInTheDocument();
    expect(screen.getByText('מאפיינים')).toBeInTheDocument();
    expect(screen.getByText('מרחק מהמיקום הנוכחי (ק"מ)')).toBeInTheDocument();
  });

  test('distance slider has correct default value', () => {
    render(<FitnessFilters onFiltersChange={mockOnFiltersChange} />);
    const distanceSlider = screen.getByRole('slider');
    expect(distanceSlider).toHaveValue('10');
  });

  test('calls onFiltersChange when distance is changed', () => {
    render(<FitnessFilters onFiltersChange={mockOnFiltersChange} />);
    const distanceSlider = screen.getByRole('slider');
    
    fireEvent.change(distanceSlider, { target: { value: '20' } });
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith(expect.objectContaining({
      distance: 20
    }));
  });
}); 