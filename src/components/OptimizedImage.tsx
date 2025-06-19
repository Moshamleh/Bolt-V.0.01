import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  fallbackSrc?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  sizes = '100vw',
  fallbackSrc = 'https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg',
  objectFit = 'cover',
  priority = false,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(!priority);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    // Update image source if prop changes
    if (src) {
      setImageSrc(src);
      setError(false);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
    setImageSrc(fallbackSrc);
    if (onError) onError();
  };

  // Generate srcSet for responsive images if width is provided
  const generateSrcSet = () => {
    if (!src || error) return undefined;
    
    // For external URLs that don't support width parameters, return undefined
    if (src.includes('pexels.com') || src.includes('unsplash.com')) {
      return undefined;
    }
    
    // For Supabase Storage URLs, we could implement transformations here
    // This is a placeholder for future implementation
    return undefined;
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden",
        className
      )}
      style={{ width, height }}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      
      <img
        src={imageSrc}
        alt={alt}
        srcSet={generateSrcSet()}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full transition-opacity duration-300",
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill',
          objectFit === 'none' && 'object-none',
          objectFit === 'scale-down' && 'object-scale-down',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
      />
    </div>
  );
};

export default OptimizedImage;