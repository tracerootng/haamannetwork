import React, { useState } from 'react';
import { X, AlertCircle, Lock, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import PinInput from './PinInput';
import Button from './Button';

type SetPinModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isChangingPin?: boolean;
};

const SetPinModal: React.FC<SetPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isChangingPin = false,
}) => {
  const { setTransactionPin } = useAuthStore();
  const [step, setStep] = useState(isChangingPin ? 'current' : 'new');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetState = () => {
    setStep(isChangingPin ? 'current' : 'new');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError('');
    setIsProcessing(false);
    setIsSuccess(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSetPin = async () => {
    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await setTransactionPin(newPin, isChangingPin ? currentPin : undefined);
      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to set PIN');
      if (isChangingPin) {
        setStep('current');
        setCurrentPin('');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCurrentPinComplete = (pin: string) => {
    setCurrentPin(pin);
    setStep('new');
  };

  const handleNewPinComplete = (pin: string) => {
    setNewPin(pin);
    setStep('confirm');
  };

  const handleConfirmPinComplete = (pin: string) => {
    setConfirmPin(pin);
    // Auto-submit if pins match
    if (newPin === pin) {
      handleSetPin();
    } else {
      setError('PINs do not match');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 relative animate-slide-up">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
        
        {isSuccess ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-500" size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {isChangingPin ? 'PIN Changed Successfully' : 'PIN Set Successfully'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your transaction PIN has been {isChangingPin ? 'updated' : 'set'}. You'll need to use this PIN for all future transactions.
            </p>
            <Button
              onClick={handleClose}
              className="w-full bg-[#0F9D58] hover:bg-[#0d8a4f] text-white"
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#0F9D58]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-[#0F9D58]" size={28} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {isChangingPin 
                  ? (step === 'current' ? 'Enter Current PIN' : step === 'new' ? 'Create New PIN' : 'Confirm New PIN')
                  : (step === 'new' ? 'Create Transaction PIN' : 'Confirm PIN')
                }
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {step === 'current' 
                  ? 'Please enter your current 4-digit transaction PIN.'
                  : step === 'new' 
                  ? 'Create a 4-digit PIN that you\'ll use to authorize transactions.'
                  : 'Please re-enter your PIN to confirm.'
                }
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6">
                <div className="flex items-start">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <p className="ml-3 text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}
            
            {step === 'current' && (
              <PinInput
                length={4}
                value={currentPin}
                onChange={setCurrentPin}
                disabled={isProcessing}
                autoFocus
                className="mb-6"
                onComplete={handleCurrentPinComplete}
              />
            )}
            
            {step === 'new' && (
              <PinInput
                length={4}
                value={newPin}
                onChange={setNewPin}
                disabled={isProcessing}
                autoFocus
                className="mb-6"
                onComplete={handleNewPinComplete}
              />
            )}
            
            {step === 'confirm' && (
              <PinInput
                length={4}
                value={confirmPin}
                onChange={setConfirmPin}
                disabled={isProcessing}
                autoFocus
                className="mb-6"
                onComplete={handleConfirmPinComplete}
              />
            )}
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              
              {step === 'current' ? (
                <Button
                  onClick={() => handleCurrentPinComplete(currentPin)}
                  disabled={currentPin.length !== 4 || isProcessing}
                  isLoading={isProcessing}
                  className="flex-1 bg-[#0F9D58] hover:bg-[#0d8a4f] text-white"
                >
                  Next
                </Button>
              ) : step === 'new' ? (
                <Button
                  onClick={() => handleNewPinComplete(newPin)}
                  disabled={newPin.length !== 4 || isProcessing}
                  isLoading={isProcessing}
                  className="flex-1 bg-[#0F9D58] hover:bg-[#0d8a4f] text-white"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSetPin}
                  disabled={confirmPin.length !== 4 || isProcessing}
                  isLoading={isProcessing}
                  className="flex-1 bg-[#0F9D58] hover:bg-[#0d8a4f] text-white"
                >
                  {isChangingPin ? 'Change PIN' : 'Set PIN'}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SetPinModal;