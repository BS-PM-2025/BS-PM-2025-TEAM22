import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import AddWorkoutForm from '../workouts/workouts/AddWorkoutForm';
import { supabase } from '../utils/supabaseClient';

// Mock supabase client
jest.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis()
  }
}));

describe('AddWorkoutForm Component', () => {
  const mockUserProfile = {
    user_id: 'test-user-123',
    full_name: 'Test User'
  };
  
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  
  const mockFacilities = [
    { id: 1, name: 'פארק העירוני' },
    { id: 2, name: 'פארק הירקון' },
    { id: 3, name: 'מתחם ספורט בשכונה' }
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementation for supabase
    supabase.from.mockReturnThis();
    supabase.select.mockReturnThis();
    supabase.order.mockReturnThis();
    supabase.from().select().order.mockResolvedValue({
      data: mockFacilities,
      error: null
    });
    
    // Mock insert response
    supabase.from().insert().select.mockResolvedValue({
      data: [{
        id: 1,
        workout_name: 'Test Workout',
        user_id: 'test-user-123'
      }],
      error: null
    });
  });

  // Test 1: Renders form correctly with initial values
  test('renders form with initial values', async () => {
    render(
      <AddWorkoutForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        userProfile={mockUserProfile}
      />
    );
    
    // Check if title is displayed
    expect(screen.getByText('הוספת אימון חדש')).toBeInTheDocument();
    
    // Check initial form fields
    expect(screen.getByLabelText('שם האימון')).toHaveValue('');
    
    // Check today's date is set as default
    const today = new Date().toISOString().split('T')[0];
    expect(screen.getByLabelText('תאריך')).toHaveValue(today);
    
    // Check duration default
    expect(screen.getByLabelText('משך האימון (דקות)')).toHaveValue(30);
    
    // Check workout type default
    expect(screen.getByLabelText('סוג אימון')).toHaveValue('strength');
    
    // Check if initial exercise field exists
    expect(screen.getByPlaceholderText(/לדוגמה: מתח עליון, שכיבות סמיכה/i)).toBeInTheDocument();
    
    // Check if facilities are being fetched
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('facilities');
    });
  });

  // Test 2: Tests facility loading and selection
  test('loads and selects facilities correctly', async () => {
    render(
      <AddWorkoutForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        userProfile={mockUserProfile}
      />
    );
    
    // Wait for facilities to load
    await waitFor(() => {
      expect(screen.getByText('פארק העירוני')).toBeInTheDocument();
    });
    
    // Select a facility
    const facilitySelect = screen.getByLabelText('מתקן');
    userEvent.selectOptions(facilitySelect, '2');
    
    // Check if the facility is selected
    expect(facilitySelect).toHaveValue('2');
  });

  // Test 3: Tests exercise addition and removal
  test('adds and removes exercises correctly', () => {
    render(
      <AddWorkoutForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        userProfile={mockUserProfile}
      />
    );
    
    // Initially there should be one exercise
    const exerciseInputs = screen.getAllByPlaceholderText(/לדוגמה: מתח עליון, שכיבות סמיכה/i);
    expect(exerciseInputs).toHaveLength(1);
    
    // Add a new exercise
    const addButton = screen.getByText(/הוסף תרגיל/i);
    fireEvent.click(addButton);
    
    // Now there should be two exercise inputs
    const updatedExerciseInputs = screen.getAllByPlaceholderText(/לדוגמה: מתח עליון, שכיבות סמיכה/i);
    expect(updatedExerciseInputs).toHaveLength(2);
    
    // Fill in the second exercise
    fireEvent.change(updatedExerciseInputs[1], { target: { value: 'פשיטת ברכיים' } });
    expect(updatedExerciseInputs[1]).toHaveValue('פשיטת ברכיים');
    
    // Find remove buttons
    const removeButtons = screen.getAllByLabelText('הסר תרגיל');
    expect(removeButtons).toHaveLength(2);
    
    // Remove the second exercise
    fireEvent.click(removeButtons[1]);
    
    // Should be back to one exercise
    const finalExerciseInputs = screen.getAllByPlaceholderText(/לדוגמה: מתח עליון, שכיבות סמיכה/i);
    expect(finalExerciseInputs).toHaveLength(1);
  });

  // Test 4: Tests form validation
  test('validates form inputs correctly', async () => {
    render(
      <AddWorkoutForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        userProfile={mockUserProfile}
      />
    );
    
    // Try to submit without filling required fields
    const submitButton = screen.getByText('שמור אימון');
    fireEvent.click(submitButton);
    
    // Should display error for missing workout name
    await waitFor(() => {
      expect(screen.getByText('יש להזין שם לאימון')).toBeInTheDocument();
    });
    
    // Fill workout name but leave exercises empty
    const workoutNameInput = screen.getByLabelText('שם האימון');
    fireEvent.change(workoutNameInput, { target: { value: 'אימון בוקר' } });
    
    // Try to submit again
    fireEvent.click(submitButton);
    
    // Should display error for missing exercise
    await waitFor(() => {
      expect(screen.getByText('יש להזין לפחות תרגיל אחד')).toBeInTheDocument();
    });
  });

  // Test 5: Tests successful form submission
  test('submits form successfully with valid data', async () => {
    render(
      <AddWorkoutForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        userProfile={mockUserProfile}
      />
    );
    
    // Fill required fields
    const workoutNameInput = screen.getByLabelText('שם האימון');
    fireEvent.change(workoutNameInput, { target: { value: 'אימון בוקר' } });
    
    // Fill exercise name
    const exerciseNameInput = screen.getByPlaceholderText(/לדוגמה: מתח עליון, שכיבות סמיכה/i);
    fireEvent.change(exerciseNameInput, { target: { value: 'שכיבות סמיכה' } });
    
    // Fill sets
    const setsInput = screen.getByLabelText('סטים');
    fireEvent.change(setsInput, { target: { value: '3' } });
    
    // Fill reps
    const repsInput = screen.getByLabelText('חזרות / משך');
    fireEvent.change(repsInput, { target: { value: '12' } });
    
    // Submit form
    const submitButton = screen.getByText('שמור אימון');
    fireEvent.click(submitButton);
    
    // Check if data was submitted correctly
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('user_workouts');
      expect(supabase.from().insert).toHaveBeenCalled();
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  // Test 6: Tests cancellation
  test('cancels form when cancel button is clicked', () => {
    render(
      <AddWorkoutForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        userProfile={mockUserProfile}
      />
    );
    
    // Click the cancel button
    const cancelButton = screen.getByText('ביטול');
    fireEvent.click(cancelButton);
    
    // Check if onCancel was called
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  // Test 7: Tests error handling during submission
  test('handles errors during form submission', async () => {
    // Mock a submission error
    supabase.from().insert().select.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' }
    });
    
    render(
      <AddWorkoutForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        userProfile={mockUserProfile}
      />
    );
    
    // Fill required fields
    const workoutNameInput = screen.getByLabelText('שם האימון');
    fireEvent.change(workoutNameInput, { target: { value: 'אימון בוקר' } });
    
    // Fill exercise name
    const exerciseNameInput = screen.getByPlaceholderText(/לדוגמה: מתח עליון, שכיבות סמיכה/i);
    fireEvent.change(exerciseNameInput, { target: { value: 'שכיבות סמיכה' } });
    
    // Submit form
    const submitButton = screen.getByText('שמור אימון');
    fireEvent.click(submitButton);
    
    // Should display error message
    await waitFor(() => {
      expect(screen.getByText(/לא ניתן היה לשמור את האימון/i)).toBeInTheDocument();
    });
    
    // Verify onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});