import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useProductStore } from '../../store/productStore';
import { formatCurrency } from '../../lib/utils';

const ProductSlideshow: React.FC = () => {
  const navigate = useNavigate();
  const { products, fetchProducts } = useProductStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Get latest 4 products
  const latestProducts = products
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    // Only auto-slide if there are multiple products
    if (latestProducts.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % latestProducts.length);
      }, 4000); // Auto-slide every 4 seconds

      return () => clearInterval(interval);
    }
  }, [latestProducts.length]);

  const nextSlide = () => {
    if (latestProducts.length > 1) {
      setCurrentSlide((prev) => (prev + 1) % latestProducts.length);
    }
  };

  const prevSlide = () => {
    if (latestProducts.length > 1) {
      setCurrentSlide((prev) => (prev - 1 + latestProducts.length) % latestProducts.length);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (latestProducts.length === 0) {
    return (
      <div className="w-full h-64 md:h-80 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 mb-8 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Products Yet</h3>
          <p className="text-gray-500 dark:text-gray-500">Products will appear here once they're added to the store.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 mb-8">
      {/* Slides */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ 
          transform: latestProducts.length > 1 
            ? `translateX(-${currentSlide * 100}%)` 
            : 'translateX(0%)' 
        }}
      >
        {latestProducts.map((product, index) => (
          <div
            key={product.id}
            className="w-full flex-shrink-0 relative cursor-pointer"
            onClick={() => navigate(`/store/product/${product.id}`)}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${product.image_url})`,
                filter: 'brightness(0.7)'
              }}
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            
            {/* Content */}
            <div className="relative z-10 h-full flex items-center p-6 md:p-8">
              <div className="text-white max-w-md">
                {/* New Badge */}
                {product.is_new && (
                  <span className="inline-block bg-[#0F9D58] text-white text-xs px-3 py-1 rounded-full font-bold mb-3">
                    NEW ARRIVAL
                  </span>
                )}
                
                {/* Featured Badge */}
                {product.is_featured && (
                  <span className="inline-block bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-bold mb-3 ml-2">
                    FEATURED
                  </span>
                )}
                
                {/* Product Name */}
                <h3 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">
                  {product.name}
                </h3>
                
                {/* Description */}
                <p className="text-sm md:text-base text-gray-200 mb-4 line-clamp-2">
                  {product.description}
                </p>
                
                {/* Price */}
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-2xl md:text-3xl font-bold text-[#0F9D58]">
                    {formatCurrency(product.price)}
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-lg text-gray-300 line-through">
                      {formatCurrency(product.original_price)}
                    </span>
                  )}
                  {product.discount > 0 && (
                    <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full font-bold">
                      -{product.discount}% OFF
                    </span>
                  )}
                </div>
                
                {/* Stock Status */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-3 h-3 rounded-full ${product.in_stock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm">
                    {product.in_stock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                
                {/* CTA Button */}
                <button 
                  className={`px-6 py-3 rounded-full font-semibold transition-colors duration-200 shadow-lg ${
                    product.in_stock 
                      ? 'bg-[#0F9D58] hover:bg-[#0d8a4f] text-white' 
                      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  }`}
                  disabled={!product.in_stock}
                >
                  {product.in_stock ? 'Shop Now' : 'Out of Stock'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Only show if more than 1 product */}
      {latestProducts.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Dots Indicator - Only show if more than 1 product */}
      {latestProducts.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {latestProducts.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentSlide 
                  ? 'bg-white scale-110' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

      {/* Product Counter - Only show if more than 1 product */}
      {latestProducts.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
          {currentSlide + 1} / {latestProducts.length}
        </div>
      )}

      {/* Single Product Indicator */}
      {latestProducts.length === 1 && (
        <div className="absolute top-4 right-4 bg-[#0F9D58] text-white px-3 py-1 rounded-full text-sm font-bold">
          Latest Product
        </div>
      )}
    </div>
  );
};

export default ProductSlideshow;