import React from 'react';
import { useNavigate } from 'react-router-dom';
import ComingSoonPage from '../ComingSoonPage';
import { BookOpen } from 'lucide-react';

const WaecServicePage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <ComingSoonPage />
  );
};

export default WaecServicePage;