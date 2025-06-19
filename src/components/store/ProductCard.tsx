import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { useCartStore } from '../../store/cartStore';

type Product = {
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

type ProductCardProps = {
  product: Product;
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
  };

  const handleProductClick = () => {
    navigate(`/store/product/${product.id}`);
  };

  return (
    <Card
      className="h-full flex flex-col group cursor-pointer overflow-hidden"
      hoverEffect
      onClick={handleProductClick}
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg mb-3">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.pexels.com/photos/163100/circuit-circuit-board-resistor-computer-163100.jpeg';
          }}
        />
        
        {/* Wishlist Button */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          <Heart size={16} className="text-gray-600 hover:text-red-500" />
        </button>
        
        {/* Quick Add to Cart */}
        {product.in_stock && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2 right-2 p-2 bg-[#0F9D58] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#0d8a4f]"
          >
            <ShoppingCart size={16} />
          </button>
        )}
      </div>
      
      <div className="flex-1 flex flex-col">
        {/* Category Badge */}
        <div className="mb-2">
          <Badge variant="default" className="text-xs">
            {product.category}
          </Badge>
        </div>
        
        {/* Product Name */}
        <h3 className="text-sm font-medium line-clamp-2 mb-2 text-gray-900 dark:text-white">
          {product.name}
        </h3>
        
        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              <Star size={12} className="text-yellow-400 fill-current" />
              <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                {product.rating}
              </span>
            </div>
            {product.reviews > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-500 ml-1">
                ({product.reviews})
              </span>
            )}
          </div>
        )}
        
        {/* Price */}
        <div className="mt-auto">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#0F9D58] text-lg">
              {formatCurrency(product.price)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xs text-gray-500 line-through">
                {formatCurrency(product.original_price)}
              </span>
            )}
          </div>
          
          {/* Stock Status */}
          {!product.in_stock && (
            <Badge variant="error" className="mt-1 text-xs">
              Out of Stock
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;