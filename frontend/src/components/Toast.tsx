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
        return 'bg-[var(--bg-surface)] border-[var(--accent-red)]/30 text-[var(--accent-red)]';
      case 'success':
        return 'bg-[var(--bg-surface)] border-[var(--accent-green)]/30 text-[var(--accent-green)]';
      default:
        return 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)]';
    }
  };

  return (
    <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-md z-50 border ${getStyles()}`}>
      <p className="font-medium">{message}</p>
    </div>
  );
}