import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import { cn } from '../../lib/utils';

type ServiceCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color?: string;
  className?: string;
  state?: any;
};

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  icon,
  path,
  color = 'bg-primary-500',
  className,
  state,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (state) {
      navigate(path, { state });
    } else {
      navigate(path);
    }
  };

  return (
    <Card
      className={cn('h-full', className)}
      hoverEffect
      onClick={handleClick}
    >
      <div className="flex flex-col h-full">
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-3', color)}>
          <div className="text-white">{icon}</div>
        </div>
        
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow">{description}</p>
      </div>
    </Card>
  );
};

export default ServiceCard;