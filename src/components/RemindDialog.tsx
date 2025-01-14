'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface RemindDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  currentDate?: Date | null;
}

export default function RemindDialog({ isOpen, onClose, onConfirm, currentDate }: RemindDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(currentDate || null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedDate) {
      onConfirm(selectedDate);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Set Reminder
        </h2>
        <div className="mb-6">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            minDate={new Date()}
            inline
            calendarClassName="dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                     hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedDate}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 
                     hover:bg-blue-600 rounded-lg disabled:opacity-50 
                     disabled:cursor-not-allowed"
          >
            Set Reminder
          </button>
        </div>
      </div>
    </div>
  );
} 