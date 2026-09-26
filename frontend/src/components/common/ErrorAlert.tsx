import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  onRetry?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title,
  message,
  type = 'error',
  onRetry,
  className = '',
}) => {
  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
        };
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
        };
      case 'info':
        return {
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-900',
          icon: <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0" />,
        };
      default:
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900',
          icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
        };
    }
  };

  const style = getStyles();

  return (
    <div className={`border rounded-xl p-4 flex items-start space-x-3 shadow-xs ${style.bg} ${className}`}>
      {style.icon}
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-bold leading-tight mb-0.5">{title}</h4>}
        <p className="text-xs font-medium leading-relaxed opacity-90">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2.5 inline-flex items-center space-x-1.5 text-xs font-bold underline hover:opacity-80 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    </div>
  );
};
