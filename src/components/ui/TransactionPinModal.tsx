import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Lock, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import PinInput from './PinInput';
import Button from './Button';

type TransactionPinModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  message?: string;
};

const TransactionPinModal: React.FC<TransactionPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Enter Transaction PIN',
  message = 'Please enter your 4-digit transaction PIN to authorize this transaction.',
}) => {
  const { verifyTransactionPin, checkPinStatus } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pinStatus, setPinStatus] = useState<{
    hasPin: boolean;
    isLocked: boolean;
    lockedUntil: string | null;
  }>({ hasPin: false, isLocked: false, lockedUntil: null });

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      checkPinStatus().then(setPinStatus).catch(console.error);
    }
  }, [isOpen, checkPinStatus]);

  const handleVerifyPin = async () => {
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await verifyTransactionPin(pin);
      if (isValid) {
        onSuccess();
      } else {
        setError('Incorrect PIN. Please try again.');
        setPin('');
        // Refresh PIN status to check if it's now locked
        const status = await checkPinStatus();
        setPinStatus(status);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to verify PIN');
      setPin('');
      // Refresh PIN status to check if it's now locked
      const status = await checkPinStatus();
      setPinStatus(status);
    } finally {
      setIsVerifying(false);
    }
  };

  // Calculate time remaining if PIN is locked
  const getTimeRemaining = () => {
    if (!pinStatus.lockedUntil) return '';
    
    const lockedUntil = new Date(pinStatus.lockedUntil);
    const now = new Date();
    const diffMs = lockedUntil.getTime() - now.getTime();
    
    if (diffMs <= 0) return '';
    
    const diffMins = Math.ceil(diffMs / 60000);
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 relative animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#0F9D58]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-[#0F9D58]" size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>
        
        {pinStatus.isLocked ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">PIN Locked</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Your PIN has been temporarily locked due to too many failed attempts. 
                  Please try again in {getTimeRemaining()}.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <PinInput
              length={4}
              value={pin}
              onChange={setPin}
              error={error}
              disabled={isVerifying}
              autoFocus
              className="mb-6"
              onComplete={handleVerifyPin}
            />
            
            <Button
              onClick={handleVerifyPin}
              isLoading={isVerifying}
              disabled={pin.length !== 4 || isVerifying}
              className="w-full bg-[#0F9D58] hover:bg-[#0d8a4f] text-white"
            >
              Verify
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionPinModal;