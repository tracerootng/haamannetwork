import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

type SuccessModalProps = {
  show: boolean;
  title: string;
  message: string;
  onClose: () => void;
  className?: string;
};

const SuccessModal: React.FC<SuccessModalProps> = ({
  show,
  title,
  message,
  onClose,
  className,
}) => {
  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && show) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    
    // Prevent scrolling when modal is open
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
      <div 
        className={cn(
          "bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 relative animate-[bounceIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)]",
          className
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
        
        {/* Success icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="text-green-500 dark:text-green-400" size={40} />
          </div>
          
          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h2>
          
          {/* Message */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#0F9D58] text-white rounded-full font-medium hover:bg-[#0d8a4f] transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;