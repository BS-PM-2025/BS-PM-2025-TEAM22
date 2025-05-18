import React from 'react';
import { render, screen } from '@testing-library/react';
import EquipmentList from '../map/facility-details/EquipmentList';

describe('EquipmentList', () => {
  it('should show message when no equipment is provided', () => {
    render(<EquipmentList equipment={null} />);
    expect(screen.getByText('אין מידע על ציוד במתקן זה')).toBeInTheDocument();
  });

  it('should show message when equipment array is empty', () => {
    render(<EquipmentList equipment={[]} />);
    expect(screen.getByText('אין מידע על ציוד במתקן זה')).toBeInTheDocument();
  });

  it('should render equipment list with string items', () => {
    const equipment = ['pullup_bars', 'parallel_bars'];
    render(<EquipmentList equipment={equipment} />);
    
    expect(screen.getByText('מתח')).toBeInTheDocument();
    expect(screen.getByText('מקבילים')).toBeInTheDocument();
  });

  it('should render equipment list with object items containing type', () => {
    const equipment = [
      { type: 'pullup_bars', count: 2 },
      { type: 'parallel_bars', count: 1 }
    ];
    render(<EquipmentList equipment={equipment} />);
    
    expect(screen.getByText('מתח')).toBeInTheDocument();
    expect(screen.getByText('(כמות: 2)')).toBeInTheDocument();
    expect(screen.getByText('מקבילים')).toBeInTheDocument();
    expect(screen.getByText('(כמות: 1)')).toBeInTheDocument();
  });

  it('should render equipment list with object items containing name', () => {
    const equipment = [
      { name: 'pullup_bars', quantity: 2 },
      { name: 'parallel_bars', quantity: 1 }
    ];
    render(<EquipmentList equipment={equipment} />);
    
    expect(screen.getByText('מתח')).toBeInTheDocument();
    expect(screen.getByText('(כמות: 2)')).toBeInTheDocument();
    expect(screen.getByText('מקבילים')).toBeInTheDocument();
    expect(screen.getByText('(כמות: 1)')).toBeInTheDocument();
  });

  it('should handle JSON string input', () => {
    const equipment = JSON.stringify(['pullup_bars', 'parallel_bars']);
    render(<EquipmentList equipment={equipment} />);
    
    expect(screen.getByText('מתח')).toBeInTheDocument();
    expect(screen.getByText('מקבילים')).toBeInTheDocument();
  });

  it('should show error message for invalid JSON', () => {
    const equipment = 'invalid-json';
    render(<EquipmentList equipment={equipment} />);
    
    expect(screen.getByText('פורמט ציוד לא תקין')).toBeInTheDocument();
  });

  it('should show error message for non-array data', () => {
    const equipment = { type: 'pullup_bars' };
    render(<EquipmentList equipment={equipment} />);
    
    expect(screen.getByText('פורמט ציוד לא תקין')).toBeInTheDocument();
  });

  it('should handle unknown equipment types', () => {
    const equipment = ['unknown_type'];
    render(<EquipmentList equipment={equipment} />);
    
    expect(screen.getByText('unknown_type')).toBeInTheDocument();
  });

  it('should render complex object items', () => {
    const equipment = [
      { 
        pullup_bars: 2,
        parallel_bars: 1,
        cardio_machines: 3
      }
    ];
    render(<EquipmentList equipment={equipment} />);
    
    expect(screen.getByText('מתח: 2')).toBeInTheDocument();
    expect(screen.getByText('מקבילים: 1')).toBeInTheDocument();
    expect(screen.getByText('מכשירי אירובי: 3')).toBeInTheDocument();
  });
}); 