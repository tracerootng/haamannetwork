import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ServicesPage from './pages/services/ServicesPage';
import AirtimeServicePage from './pages/services/AirtimeServicePage';
import DataServicePage from './pages/services/DataServicePage';
import ElectricityServicePage from './pages/services/ElectricityServicePage';
import WaecServicePage from './pages/services/WaecServicePage';
import StorePage from './pages/store/StorePage';
import ProductDetailPage from './pages/store/ProductDetailPage';
import CartPage from './pages/store/CartPage';
import MyOrdersPage from './pages/store/MyOrdersPage';
import WalletPage from './pages/wallet/WalletPage';
import FundWalletPage from './pages/wallet/FundWalletPage';
import ProfilePage from './pages/profile/ProfilePage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import ReferEarnPage from './pages/refer/ReferEarnPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ComingSoonPage from './pages/ComingSoonPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsManagement from './pages/admin/ProductsManagement';
import UsersManagement from './pages/admin/UsersManagement';
import TransactionsManagement from './pages/admin/TransactionsManagement';
import AdminSettings from './pages/admin/AdminSettings';
import OrdersManagement from './pages/admin/OrdersManagement';
import WalletManagement from './pages/admin/WalletManagement';

import { useAuthStore } from './store/authStore';

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<ProductsManagement />} />
        <Route path="/admin/users" element={<UsersManagement />} />
        <Route path="/admin/transactions" element={<TransactionsManagement />} />
        <Route path="/admin/orders" element={<OrdersManagement />} />
        <Route path="/admin/wallet" element={<WalletManagement />} />
        <Route path="/admin/settings" element={<AdminSettings />} />

        {/* Coming Soon Route */}
        <Route path="/coming-soon" element={<ComingSoonPage />} />

        {/* Main App Routes */}
        <Route path="/" element={<Layout />}>
          {/* Show HomePage for non-authenticated users, Dashboard for authenticated users */}
          <Route index element={isAuthenticated ? <DashboardPage /> : <HomePage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/airtime" element={<AirtimeServicePage />} />
          <Route path="services/data" element={<DataServicePage />} />
          <Route path="services/electricity" element={<ElectricityServicePage />} />
          <Route path="services/waec" element={<WaecServicePage />} />
          <Route path="store" element={<StorePage />} />
          <Route path="store/product/:id" element={<ProductDetailPage />} />
          <Route path="store/cart" element={<CartPage />} />
          <Route path="store/orders" element={<MyOrdersPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="wallet/fund" element={<FundWalletPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="refer" element={<ReferEarnPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        {/* Auth routes outside of main layout */}
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
      </Routes>
    </Router>
  );
}

export default App;