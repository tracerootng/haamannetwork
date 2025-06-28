import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

type PinInputProps = {
  length?: number;
  onChange: (pin: string) => void;
  value?: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  onComplete?: (pin: string) => void;
};

const PinInput: React.FC<PinInputProps> = ({
  length = 4,
  onChange,
  value = '',
  error,
  disabled = false,
  autoFocus = false,
  className,
  onComplete,
}) => {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Update values when external value changes
  useEffect(() => {
    if (value) {
      const valueArray = value.split('').slice(0, length);
      setValues(valueArray.concat(Array(length - valueArray.length).fill('')));
    }
  }, [value, length]);

  // Auto-focus first input on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Only accept digits
    if (!/^\d*$/.test(newValue)) return;
    
    // Handle paste or multiple characters
    if (newValue.length > 1) {
      const digits = newValue.split('').slice(0, length);
      const newValues = [...values];
      
      // Fill in as many inputs as we have digits
      digits.forEach((digit, i) => {
        if (index + i < length) {
          newValues[index + i] = digit;
        }
      });
      
      setValues(newValues);
      onChange(newValues.join(''));
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(index + digits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      
      // If we've filled all inputs, call onComplete
      if (newValues.join('').length === length && onComplete) {
        onComplete(newValues.join(''));
      }
      
      return;
    }
    
    // Handle single character
    const newValues = [...values];
    newValues[index] = newValue;
    setValues(newValues);
    onChange(newValues.join(''));
    
    // Auto-focus next input if we entered a digit
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // If we've filled all inputs, call onComplete
    if (newValues.join('').length === length && onComplete) {
      onComplete(newValues.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!values[index] && index > 0) {
        // If current input is empty, focus previous input
        inputRefs.current[index - 1]?.focus();
        
        // Clear previous input
        const newValues = [...values];
        newValues[index - 1] = '';
        setValues(newValues);
        onChange(newValues.join(''));
      }
    }
    
    // Handle left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle right arrow
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').split('').slice(0, length);
    
    if (digits.length > 0) {
      const newValues = [...values];
      digits.forEach((digit, i) => {
        if (i < length) {
          newValues[i] = digit;
        }
      });
      
      setValues(newValues);
      onChange(newValues.join(''));
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = newValues.findIndex(v => !v);
      const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
      
      // If we've filled all inputs, call onComplete
      if (newValues.join('').length === length && onComplete) {
        onComplete(newValues.join(''));
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-center space-x-3">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={values[index]}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              "w-12 h-14 text-center text-2xl font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F9D58] transition-all",
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
        ))}
      </div>
      {error && (
        <p className="text-center text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default PinInput;