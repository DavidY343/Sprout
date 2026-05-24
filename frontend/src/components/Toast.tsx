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
        return 'bg-white border-[#C25B3F]/30 text-[#C25B3F]';
      case 'success':
        return 'bg-white border-[#6B8F71]/30 text-[#6B8F71]';
      default:
        return 'bg-white border-[#E5DED3] text-[#5A5549]';
    }
  };

  return (
    <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-md z-50 border ${getStyles()}`}>
      <p className="font-medium">{message}</p>
    </div>
  );
}