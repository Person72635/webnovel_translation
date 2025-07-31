import React, { useEffect } from 'react';
import { XCircle, CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const baseClasses = 'fixed bottom-5 right-5 p-4 rounded-lg text-white shadow-lg flex items-center animate-slide-in-bottom z-50';
  const typeClasses = {
    error: 'bg-red-500',
    success: 'bg-green-500',
  };

  const Icon = type === 'error' ? XCircle : CheckCircle;

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <Icon className="mr-3" />
      <span>{message}</span>
    </div>
  );
};

export default Toast;
