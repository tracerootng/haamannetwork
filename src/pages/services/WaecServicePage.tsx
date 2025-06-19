import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import ServiceForm from '../../components/services/ServiceForm';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, generateTransactionReference } from '../../lib/utils';

const WAEC_CARD_PRICE = 3500;

const WaecServicePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateWalletBalance } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [cardDetails, setCardDetails] = useState<any>(null);

  const generateWaecCard = () => {
    const pin = Array.from({ length: 12 }, () => 
      Math.floor(Math.random() * 10)
    ).join('');
    
    const serialNumber = Array.from({ length: 10 }, () => 
      Math.floor(Math.random() * 10)
    ).join('');
    
    return { pin, serialNumber };
  };

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
      
      if (user.walletBalance < WAEC_CARD_PRICE) {
        throw new Error('Insufficient funds');
      }
      
      const reference = generateTransactionReference();
      const card = generateWaecCard();
      
      const newTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        type: 'waec',
        amount: WAEC_CARD_PRICE,
        status: 'success',
        reference,
        details: {
          pin: card.pin,
          serialNumber: card.serialNumber,
        },
        createdAt: new Date().toISOString(),
      };
      
      updateWalletBalance(user.walletBalance - WAEC_CARD_PRICE);
      
      setTransaction(newTransaction);
      setCardDetails(card);
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
            title="Buy WAEC Scratch Card"
            description="Purchase WAEC scratch card instantly"
            amount={WAEC_CARD_PRICE}
            fields={[
              {
                name: 'email',
                label: 'Email Address',
                type: 'text',
                required: true,
                placeholder: 'Enter your email address',
              },
            ]}
            onSubmit={handleFormSubmit}
          />
        </>
      )}

      {step === 2 && (
        <Card className="animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">Confirm Purchase</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Item</span>
              <span className="font-medium">WAEC Scratch Card</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Email</span>
              <span className="font-medium">{formData.email}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Amount</span>
              <span className="font-medium">{formatCurrency(WAEC_CARD_PRICE)}</span>
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
              
              <h2 className="text-xl font-semibold mb-2">Purchase Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your WAEC scratch card details are below. We've also sent this to your email.
              </p>
              
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-medium">{transaction?.reference}</span>
                </div>
                
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Serial Number</span>
                  <span className="font-medium">{cardDetails?.serialNumber}</span>
                </div>
                
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">PIN</span>
                  <span className="font-medium">{cardDetails?.pin}</span>
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
                  Buy Another Card
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-error-500 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="text-error-500" size={32} />
              </div>
              
              <h2 className="text-xl font-semibold mb-2">Purchase Failed</h2>
              <p className="text-gray-600 mb-6">
                Your WAEC scratch card purchase could not be completed. Please try again.
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

export default WaecServicePage;