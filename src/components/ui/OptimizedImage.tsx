'use client';

import { useState, useEffect } from 'react';
import { cdnService } from '@/lib/cache/cdnService';
import { LazyImage } from './LazyLoader';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,

  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fill = false,
  objectFit = 'cover',
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [srcSet, setSrcSet] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) return;

    // Generate optimized image URLs
    const optimizedSrc = cdnService.getOptimizedImageUrl(src, 'medium');
    const responsiveSrcSet = cdnService.getResponsiveImageSrcSet(src);

    setImageSrc(optimizedSrc);
    setSrcSet(responsiveSrcSet);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  // Generate blur placeholder if not provided
  const getBlurDataURL = () => {
    if (blurDataURL) return blurDataURL;

    // Generate a simple blur placeholder
    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="sans-serif" font-size="14">
          Loading...
        </text>
      </svg>`
    ).toString('base64')}`;
  };

  if (!src) {
    return (
      <div className={`bg-gray-200 ${className}`} style={{ width, height }}>
        <div className="flex items-center justify-center h-full text-gray-400">
          No image
        </div>
      </div>
    );
  }

  const imageProps = {
    src: imageSrc,
    alt,
    className: `${className} ${fill ? 'absolute inset-0 w-full h-full' : ''}`,
    style: {
      objectFit: fill ? objectFit : undefined,
      width: fill ? '100%' : width,
      height: fill ? '100%' : height,
    },
    srcSet: srcSet || undefined,
    sizes: srcSet ? sizes : undefined,
    onLoad: handleLoad,
    onError: handleError,
    loading: (priority ? 'eager' : 'lazy') as 'lazy' | 'eager',
  };

  // Use priority loading for above-the-fold images
  if (priority) {
    return (
      <div className={fill ? 'relative' : ''}>
        {/* Preload link for critical images */}
        {typeof window !== 'undefined' && (
          <link rel="preload" as="image" href={imageSrc} />
        )}

        {/* Loading placeholder */}
        {isLoading && placeholder === 'blur' && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse">
            <img
              src={getBlurDataURL()}
              alt=""
              className="w-full h-full object-cover filter blur-sm opacity-50"
            />
          </div>
        )}

        {/* Main image */}
        <img
          {...imageProps}
          className={`${imageProps.className} transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <svg
                className="w-8 h-8 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm">Image failed to load</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Use lazy loading for non-critical images
  return (
    <LazyImage
      src={imageSrc}
      alt={alt}
      className={className}
      placeholder={placeholder === 'blur' ? getBlurDataURL() : undefined}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}

// WebP/AVIF support detection and fallback
export function PictureOptimized({
  src,
  alt,
  className = '',
  width,
  height,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
}) {
  const variants = cdnService.getImageVariants(src, 'medium');

  return (
    <picture className={className}>
      {/* AVIF format for modern browsers */}
      <source srcSet={variants.avif} sizes={sizes} type="image/avif" />

      {/* WebP format for most browsers */}
      <source srcSet={variants.webp} sizes={sizes} type="image/webp" />

      {/* Fallback for older browsers */}
      <img
        src={variants.fallback}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </picture>
  );
}

// Progressive image loading with multiple quality levels
export function ProgressiveImage({
  src,
  alt,
  className = '',
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;

    // Start with low quality
    const lowQualitySrc = cdnService.getOptimizedImageUrl(src, 'thumbnail');
    setCurrentSrc(lowQualitySrc);

    // Preload high quality version
    const highQualitySrc = cdnService.getOptimizedImageUrl(src, 'large');
    const img = new Image();

    img.onload = () => {
      setCurrentSrc(highQualitySrc);
      setIsLoaded(true);
    };

    img.src = highQualitySrc;
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={`w-full h-full object-cover transition-all duration-500 ${
          isLoaded ? 'filter-none' : 'filter blur-sm'
        }`}
        loading="lazy"
      />
    </div>
  );
}
