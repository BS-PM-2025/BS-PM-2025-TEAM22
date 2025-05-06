/*
// src/components/tests/ContactForm.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import ContactForm from '../Contact/ContactForm';
import React from 'react';

describe('ContactForm Component', () => {
  test('מרנדר את הטופס', () => {
    render(<ContactForm />);
    const form = screen.getByRole('form', { name: /טופס יצירת קשר/i });
    expect(form).toBeInTheDocument();
  });

  test('מציג שגיאות כאשר מנסים לשלוח טופס ריק', async () => {
    render(<ContactForm />);
    fireEvent.click(screen.getByRole('button', { name: /שלח הודעה/i }));

    const nameError = await screen.findByText(/נא להזין שם מלא/i);
    const emailError = await screen.findByText(/נא להזין כתובת דוא"ל/i);
    const subjectError = await screen.findByText(/נא לבחור נושא לפנייה/i);
    const messageError = await screen.findByText(/נא להזין את תוכן ההודעה/i);

    expect(nameError).toBeInTheDocument();
    expect(emailError).toBeInTheDocument();
    expect(subjectError).toBeInTheDocument();
    expect(messageError).toBeInTheDocument();
  });

  test('שולח טופס תקין ומציג הודעת הצלחה', async () => {
    render(<ContactForm />);
  
    fireEvent.change(screen.getByPlaceholderText('ישראל ישראלי'), { target: { value: 'ישראל ישראלי' } });
    fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('נשמח לשמוע במה נוכל לעזור...'), { target: { value: 'תוכן הודעה ארוך ומפורט' } });
    fireEvent.change(screen.getByRole('combobox', { name: /נושא/i }), { target: { value: 'שאלה כללית' } });
  
    fireEvent.click(screen.getByRole('button', { name: /שלח הודעה/i }));
  
    const alert = await screen.findByRole('alert');  // תופסים את כל הקופסה של ההודעה
    expect(alert).toHaveTextContent(/הפנייה נשלחה בהצלחה/i);
  });
  
  test('מציג שגיאה כאשר כתובת אימייל אינה תקינה', async () => {
    render(<ContactForm />);

    fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), { target: { value: 'emailלאחוקי' } });
    fireEvent.click(screen.getByRole('button', { name: /שלח הודעה/i }));

    const emailError = await screen.findByText(/כתובת דוא"ל אינה תקינה/i);
    expect(emailError).toBeInTheDocument();
  });

  test('מציג שגיאה כאשר ההודעה קצרה מדי', async () => {
    render(<ContactForm />);

    fireEvent.change(screen.getByPlaceholderText('ישראל ישראלי'), { target: { value: 'דני ישראלי' } });
    fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), { target: { value: 'danny@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('נשמח לשמוע במה נוכל לעזור...'), { target: { value: 'שלום' } });
    fireEvent.change(screen.getByRole('combobox', { name: /נושא/i }), { target: { value: 'אחר' } });

    fireEvent.click(screen.getByRole('button', { name: /שלח הודעה/i }));

    const messageError = await screen.findByText(/ההודעה קצרה מדי/i);
    expect(messageError).toBeInTheDocument();
  });
});
*/
