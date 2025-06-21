import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

interface BlurImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const BlurImage: React.FC<BlurImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  fallbackSrc = 'https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg',
  objectFit = 'cover',
  priority = false,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    // Update image source if prop changes
    if (src) {
      setImageSrc(src);
      setError(false);
      setIsLoaded(false);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setError(true);
    setImageSrc(fallbackSrc);
    if (onError) onError();
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden",
        className
      )}
      style={{ width, height }}
    >
      {/* Low quality placeholder */}
      <div 
        className={cn(
          "absolute inset-0 bg-gray-200 dark:bg-gray-700",
          isLoaded ? "opacity-0" : "opacity-100",
          "transition-opacity duration-500"
        )}
      />
      
      <img
        src={imageSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full transition-all duration-500",
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill',
          objectFit === 'none' && 'object-none',
          objectFit === 'scale-down' && 'object-scale-down',
          isLoaded ? "blur-0 scale-100" : "blur-sm scale-110"
        )}
      />
    </div>
  );
};

export default BlurImage;