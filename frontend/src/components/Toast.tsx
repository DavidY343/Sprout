import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  onClose?: () => void;
  duration?: number;
}

export default function Toast({ 
  message, 
  type, 
  onClose, 
  duration = 3000 
}: ToastProps) {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-900/90 border-red-700/30 text-red-300';
      case 'success':
        return 'bg-green-900/90 border-green-700/30 text-green-300';
      default:
        return 'bg-gray-900/90 border-gray-700/30 text-gray-300';
    }
  };

  return (
    <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 border backdrop-blur-sm ${getStyles()}`}>
      <p className="font-medium">{message}</p>
    </div>
  );
}