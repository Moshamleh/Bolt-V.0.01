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
    
    // For Supabase Storage URLs, implement transformations
    if (src.includes('supabase.co/storage/v1/object/public')) {
      try {
        // Parse the URL to extract the base and path
        const url = new URL(src);
        const basePath = url.origin + url.pathname;
        const searchParams = url.searchParams;
        
        // Create srcSet with different widths
        const widths = [320, 640, 960, 1280, 1920];
        return widths
          .map(w => {
            // Clone the search params
            const params = new URLSearchParams(searchParams);
            // Add or update width parameter
            params.set('width', w.toString());
            // Add quality parameter for optimization
            params.set('quality', w >= 960 ? '80' : '70');
            
            return `${basePath}?${params.toString()} ${w}w`;
          })
          .join(', ');
      } catch (e) {
        console.error('Error generating srcSet:', e);
        return undefined;
      }
    }
    
    // For other sources, return undefined
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