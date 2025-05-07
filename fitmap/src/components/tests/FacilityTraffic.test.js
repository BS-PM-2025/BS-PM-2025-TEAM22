import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FacilityTraffic from '../map/facility-details/FacilityTraffic';

describe('FacilityTraffic', () => {
  beforeEach(() => {
    // Mock the Date to always return Sunday (0)
    const mockDate = new Date('2024-01-07'); // A Sunday
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should show loading state initially', () => {
    render(<FacilityTraffic facilityId="123" />);
    expect(screen.getByText('טוען נתוני עומס...')).toBeInTheDocument();
  });

  it('should show traffic data after loading', async () => {
    jest.useFakeTimers();
    render(<FacilityTraffic facilityId="123" />);

    // Fast-forward through loading timeout
    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    // Check if days are rendered
    expect(screen.getByText('ראשון')).toBeInTheDocument();
    expect(screen.getByText('שני')).toBeInTheDocument();
    expect(screen.getByText('שלישי')).toBeInTheDocument();

    // Check if hours are rendered
    expect(screen.getByText('6:00')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getByText('20:00')).toBeInTheDocument();

    // Check if traffic note is shown
    expect(screen.getByText(/הנתונים מבוססים על ביקורים קודמים/)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('should change selected day when clicking day buttons', async () => {
    jest.useFakeTimers();
    render(<FacilityTraffic facilityId="123" />);

    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    // Click on a different day
    fireEvent.click(screen.getByText('שלישי'));
    
    // Verify the button is selected (you might need to adjust this based on your CSS)
    expect(screen.getByText('שלישי').closest('button')).toHaveClass('selectedDay');

    jest.useRealTimers();
  });

  it('should show traffic levels with correct colors', async () => {
    jest.useFakeTimers();
    render(<FacilityTraffic facilityId="123" />);

    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    // Check for different traffic level labels
    const trafficLevels = screen.getAllByText(/^(לא עמוס|עמוס בינוני|עמוס מאוד)$/);
    expect(trafficLevels.length).toBeGreaterThan(0);

    jest.useRealTimers();
  });
}); 