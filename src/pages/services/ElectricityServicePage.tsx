import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import ServiceForm from '../../components/services/ServiceForm';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, generateTransactionReference } from '../../lib/utils';

const discos = [
  { value: 'ikeja', label: 'Ikeja Electric' },
  { value: 'eko', label: 'Eko Electric' },
  { value: 'ibadan', label: 'IBEDC' },
  { value: 'abuja', label: 'AEDC' },
];

const meterTypes = [
  { value: 'prepaid', label: 'Prepaid Meter' },
  { value: 'postpaid', label: 'Postpaid Meter' },
];

const ElectricityServicePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateWalletBalance } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [transaction, setTransaction] = useState<any>(null);

  const handleFormSubmit = (data: any) => {
    setFormData(data);
    setStep(2);
  };

  const handlePayment = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const amount = Number(formData.amount);
      
      if (user.walletBalance < amount) {
        throw new Error('Insufficient funds');
      }
      
      const reference = generateTransactionReference();
      const newTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        type: 'electricity',
        amount,
        status: 'success',
        reference,
        details: {
          disco: formData.disco,
          meterNumber: formData.meterNumber,
          meterType: formData.meterType,
        },
        createdAt: new Date().toISOString(),
      };
      
      updateWalletBalance(user.walletBalance - amount);
      
      setTransaction(newTransaction);
      setIsSuccess(true);
      setStep(3);
    } catch (error) {
      console.error(error);
      setIsSuccess(false);
      setStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6">
      {step === 1 && (
        <>
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/services')}
            icon={<ArrowLeft size={16} />}
          >
            Back to Services
          </Button>
          
          <ServiceForm
            title="Pay Electricity Bill"
            description="Pay your electricity bills instantly"
            fields={[
              {
                name: 'disco',
                label: 'Select Distribution Company',
                type: 'select',
                options: discos,
                required: true,
                icon: <Zap size={16} />,
              },
              {
                name: 'meterType',
                label: 'Meter Type',
                type: 'select',
                options: meterTypes,
                required: true,
              },
              {
                name: 'meterNumber',
                label: 'Meter Number',
                type: 'text',
                required: true,
                placeholder: 'Enter meter number',
              },
              {
                name: 'amount',
                label: 'Amount',
                type: 'number',
                required: true,
                placeholder: 'Enter amount',
              },
            ]}
            onSubmit={handleFormSubmit}
          />
        </>
      )}

      {step === 2 && (
        <Card className="animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">Confirm Bill Payment</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Distribution Company</span>
              <span className="font-medium">
                {discos.find(d => d.value === formData.disco)?.label}
              </span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Meter Type</span>
              <span className="font-medium">
                {meterTypes.find(t => t.value === formData.meterType)?.label}
              </span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Meter Number</span>
              <span className="font-medium">{formData.meterNumber}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Amount</span>
              <span className="font-medium">{formatCurrency(Number(formData.amount))}</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Wallet Balance</span>
              <span className="font-medium">{formatCurrency(user?.walletBalance || 0)}</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setStep(1)} fullWidth>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handlePayment}
              isLoading={isLoading}
              fullWidth
            >
              Pay Now
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="animate-bounce-in text-center">
          {isSuccess ? (
            <>
              <div className="w-16 h-16 bg-success-500 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-success-500\" size={32} />
              </div>
              
              <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your electricity bill payment was successful.
              </p>
              
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-medium">{transaction?.reference}</span>
                </div>
                
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Meter Number</span>
                  <span className="font-medium">{formData.meterNumber}</span>
                </div>
                
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-medium">{formatCurrency(Number(formData.amount))}</span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/services')}
                  fullWidth
                >
                  Back to Services
                </Button>
                
                <Button
                  variant="primary"
                  onClick={() => setStep(1)}
                  fullWidth
                >
                  Make Another Payment
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-error-500 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="text-error-500" size={32} />
              </div>
              
              <h2 className="text-xl font-semibold mb-2">Payment Failed</h2>
              <p className="text-gray-600 mb-6">
                Your electricity bill payment could not be completed. Please try again.
              </p>
              
              <Button
                variant="primary"
                onClick={() => setStep(1)}
                fullWidth
              >
                Try Again
              </Button>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default ElectricityServicePage;