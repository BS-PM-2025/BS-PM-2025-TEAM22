import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FacilityTraffic from '../map/facility-details/FacilityTraffic';

describe('FacilityTraffic', () => {
  /* ---------- Date תמיד תחזיר 0 (Sunday) ---------- */
  beforeEach(() => {
    jest.spyOn(Date.prototype, 'getDay').mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Date & Math.random (אם קיים)
    jest.useRealTimers();
  });

  it('should show loading state initially', () => {
    render(<FacilityTraffic facilityId="123" />);
    expect(screen.getByText('טוען נתוני עומס...')).toBeInTheDocument();
  });

  it('should show traffic data after loading', async () => {
    jest.useFakeTimers();
    render(<FacilityTraffic facilityId="123" />);

    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    expect(screen.getByText('ראשון')).toBeInTheDocument();
    expect(screen.getByText('שני')).toBeInTheDocument();
    expect(screen.getByText('6:00')).toBeInTheDocument();
    expect(
      screen.getByText(/הנתונים מבוססים על ביקורים קודמים/)
    ).toBeInTheDocument();
  });

  it('should change selected day when clicking day buttons', async () => {
    jest.useFakeTimers();
    render(<FacilityTraffic facilityId="123" />);

    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    fireEvent.click(screen.getByText('שלישי'));
    const tueBtn = screen.getByRole('button', { name: 'שלישי' });
    expect(tueBtn.className).toMatch(/selectedDay/);
  });

  it('should show traffic levels with correct labels', async () => {
    jest.useFakeTimers();
    render(<FacilityTraffic facilityId="123" />);

    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    const trafficLabels = screen.getAllByText(/^(לא עמוס|עמוס בינוני|עמוס מאוד)$/);
    expect(trafficLabels.length).toBeGreaterThan(0);
  });

  /* ---------- תוספות אינטגרציה מתוקנות ---------- */

  it('should highlight current day (Sunday) by default', async () => {
    jest.useFakeTimers();
    render(<FacilityTraffic facilityId="123" />);

    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    const sunBtn = screen.getByRole('button', { name: 'ראשון' });
    expect(sunBtn.className).toMatch(/selectedDay/);
  });

  it('should render at least one "very busy" label (עמוס מאוד)', async () => {
    /* מכריחים רמת עומס גבוהה: Math.random → 0.9 */
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    jest.useFakeTimers();

    render(<FacilityTraffic facilityId="123" />);

    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    const veryBusy = screen.getAllByText('עמוס מאוד');
    expect(veryBusy.length).toBeGreaterThan(0);
  });
});
