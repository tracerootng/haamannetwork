import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import { formatCurrency, truncateText } from '../../lib/utils';

// Mock data for featured products
const featuredProducts = [
  {
    id: '1',
    name: 'Wireless Bluetooth Earbuds',
    description: 'High-quality wireless earbuds with noise cancellation',
    price: 15000,
    imageUrl: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg',
    category: 'Electronics',
    inStock: true,
  },
  {
    id: '2',
    name: 'Smart Watch Series 5',
    description: 'Track your fitness and stay connected with this smartwatch',
    price: 25000,
    imageUrl: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg',
    category: 'Electronics',
    inStock: true,
  },
  {
    id: '3',
    name: 'Portable Power Bank 10000mAh',
    description: 'Keep your devices charged on the go',
    price: 8000,
    imageUrl: 'https://images.pexels.com/photos/5699063/pexels-photo-5699063.jpeg',
    category: 'Electronics',
    inStock: true,
  },
  {
    id: '4',
    name: 'Bluetooth Speaker',
    description: 'Portable speaker with amazing sound quality',
    price: 12000,
    imageUrl: 'https://images.pexels.com/photos/1279107/pexels-photo-1279107.jpeg',
    category: 'Electronics',
    inStock: true,
  },
];

const FeaturedProducts: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="my-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Featured Products</h2>
        <a href="/store" className="text-primary-500 text-sm">View All</a>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {featuredProducts.map((product) => (
          <Card
            key={product.id}
            className="h-full flex flex-col"
            hoverEffect
            onClick={() => navigate(`/store/product/${product.id}`)}
          >
            <div className="aspect-square w-full overflow-hidden rounded-lg mb-3">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
            
            <h3 className="text-sm font-medium line-clamp-1">{product.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 flex-grow">
              {truncateText(product.description, 60)}
            </p>
            
            <div className="mt-auto">
              <p className="font-semibold text-primary-500">
                {formatCurrency(product.price)}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeaturedProducts;