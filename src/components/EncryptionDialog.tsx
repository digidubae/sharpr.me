'use client';

import { useRef, useEffect, useState } from 'react';
import { useDialog } from '@/context/DialogContext';
import { toast } from 'react-hot-toast';

interface EncryptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  mode?: 'encrypt' | 'decrypt' | 'turn-off';
  error?: string | null;
}

export default function EncryptionDialog({ isOpen, onClose, onConfirm, mode = 'encrypt', error }: EncryptionDialogProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() && mode !== 'turn-off') {
      toast.error('Please enter a password');
      return;
    }
    setIsLoading(true);
    try {
      await onConfirm(password);
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
           onKeyDown={handleKeyDown}>
        <h2 className="text-xl font-semibold mb-4 dark:text-white">
          {mode === 'encrypt' && 'Encrypt Space'}
          {mode === 'decrypt' && 'Decrypt Space'}
          {mode === 'turn-off' && 'Turn Off Encryption'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          {mode !== 'turn-off' && (
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {mode === 'encrypt' ? 'Set a password to encrypt your space' : 'Enter password to decrypt your space'}
              </label>
              <input
                ref={inputRef}
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 
                         dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={mode === 'encrypt' ? 'Enter new password' : 'Enter password'}
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>
          )}
          
          {mode === 'turn-off' && (
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              This will turn off encryption for your space. Are you sure?
            </p>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                       hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 
                       hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 
                       focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'encrypt' && 'Encrypting...'}
                  {mode === 'decrypt' && 'Decrypting...'}
                  {mode === 'turn-off' && 'Turning Off...'}
                </>
              ) : (
                <>
                  {mode === 'encrypt' && 'Encrypt'}
                  {mode === 'decrypt' && 'Decrypt'}
                  {mode === 'turn-off' && 'Turn Off'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 