export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  walletBalance: number;
  isAdmin: boolean;
  referralCode: string;
  referredBy?: string;
  totalReferrals: number;
  referralEarnings: number;
  createdAt: string;
};

export type Transaction = {
  id: string;
  userId: string;
  type: 'airtime' | 'data' | 'electricity' | 'waec' | 'wallet_funding' | 'product_purchase' | 'referral_bonus';
  amount: number;
  status: 'success' | 'pending' | 'failed';
  reference: string;
  details: {
    [key: string]: any;
  };
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  image_url: string;
  category: string;
  in_stock: boolean;
  rating: number;
  reviews: number;
  discount: number;
  is_new: boolean;
  is_featured: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  products: Array<{
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
  }>;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: 'wallet' | 'pay_on_delivery';
  shipping_address: {
    name: string;
    address: string;
    city: string;
    state: string;
    phone: string;
  };
  estimated_delivery_date: string;
  tracking_number: string;
  created_at: string;
  updated_at: string;
};

export type DataPlan = {
  id: string;
  network: 'mtn' | 'airtel' | 'glo' | '9mobile';
  name: string;
  description: string;
  amount: number;
  validity: string;
};

export type WaecCard = {
  id: string;
  pin: string;
  serialNumber: string;
  expiresAt: string;
  isUsed: boolean;
  userId?: string;
  transactionId?: string;
};

export type DiscoProvider = 'ikeja' | 'eko' | 'ibadan' | 'enugu' | 'portharcourt' | 'abuja' | 'kaduna' | 'kano' | 'jos';

export type MeterType = 'prepaid' | 'postpaid';

export type ReferralData = {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralCode: string;
  bonusAmount: number;
  status: 'pending' | 'paid';
  createdAt: string;
};