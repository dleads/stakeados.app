import { cdnService } from '@/lib/cache/cdnService';

export interface ImageOptimizationOptions {
  priority?: boolean;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  loading?: 'lazy' | 'eager';
}

export interface ResponsiveImageConfig {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  options?: ImageOptimizationOptions;
}

// Generate optimized image props for Next.js Image component
export function getOptimizedImageProps(config: ResponsiveImageConfig) {
  const { src, alt, width, height, className = '', options = {} } = config;
  const {
    priority = false,
    quality = 75,
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    placeholder = 'blur',
    loading = priority ? 'eager' : 'lazy',
  } = options;

  // Generate optimized URLs
  const optimizedSrc = cdnService.getOptimizedImageUrl(src, 'medium');
  const srcSet = cdnService.getResponsiveImageSrcSet(src);

  return {
    src: optimizedSrc,
    alt,
    width,
    height,
    className,
    sizes,
    quality,
    priority,
    loading,
    placeholder,
    srcSet: srcSet || undefined,
    style: {
      objectFit: 'cover' as const,
      objectPosition: 'center',
    },
  };
}

// Generate picture element with multiple formats
export function generatePictureElement(config: ResponsiveImageConfig): string {
  const { src, alt, width, height, className = '' } = config;
  const variants = cdnService.getImageVariants(src, 'medium');

  return `
    <picture class="${className}">
      <source srcset="${variants.avif}" type="image/avif" />
      <source srcset="${variants.webp}" type="image/webp" />
      <img 
        src="${variants.fallback}" 
        alt="${alt}" 
        width="${width || ''}" 
        height="${height || ''}"
        loading="lazy"
        decoding="async"
        style="object-fit: cover; object-position: center;"
      />
    </picture>
  `;
}

// Preload critical images
export function preloadCriticalImages(imageUrls: string[]): void {
  if (typeof window === 'undefined') return;

  imageUrls.forEach(url => {
    const optimizedUrl = cdnService.getOptimizedImageUrl(url, 'hero');

    // Create preload link
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = optimizedUrl;
    link.fetchPriority = 'high';

    document.head.appendChild(link);
  });
}

// Generate blur placeholder data URL
export function generateBlurPlaceholder(
  width: number = 400,
  height: number = 300
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2a2a2a;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <circle cx="50%" cy="50%" r="20" fill="#333" opacity="0.5" />
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// Lazy load images with Intersection Observer
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private images: Set<HTMLImageElement> = new Set();

  constructor(options: IntersectionObserverInit = {}) {
    if (typeof window === 'undefined') return;

    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer?.unobserve(img);
            this.images.delete(img);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      }
    );
  }

  observe(img: HTMLImageElement): void {
    if (!this.observer) return;

    this.images.add(img);
    this.observer.observe(img);
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;

    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }

    if (srcset) {
      img.srcset = srcset;
      img.removeAttribute('data-srcset');
    }

    img.classList.remove('lazy-loading');
    img.classList.add('lazy-loaded');
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.images.clear();
    }
  }
}

// Progressive image loading with quality levels
export class ProgressiveImageLoader {
  private static instances = new Map<string, ProgressiveImageLoader>();

  constructor(private src: string) {}

  static getInstance(src: string): ProgressiveImageLoader {
    if (!this.instances.has(src)) {
      this.instances.set(src, new ProgressiveImageLoader(src));
    }
    return this.instances.get(src)!;
  }

  async load(
    onProgress?: (quality: 'low' | 'medium' | 'high') => void
  ): Promise<string> {
    // Start with low quality
    onProgress?.('low');

    // Preload medium quality
    const mediumQualitySrc = cdnService.getOptimizedImageUrl(
      this.src,
      'medium'
    );
    await this.preloadImage(mediumQualitySrc);
    onProgress?.('medium');

    // Preload high quality
    const highQualitySrc = cdnService.getOptimizedImageUrl(this.src, 'large');
    await this.preloadImage(highQualitySrc);
    onProgress?.('high');

    return highQualitySrc;
  }

  private preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }
}

// Image format detection and fallback
export function detectImageFormatSupport(): {
  webp: boolean;
  avif: boolean;
} {
  if (typeof window === 'undefined') {
    return { webp: false, avif: false };
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  return {
    webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
    avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0,
  };
}

// Optimize images for different viewport sizes
export function getViewportOptimizedSrc(
  src: string,
  viewport: 'mobile' | 'tablet' | 'desktop'
): string {
  const sizeMap = {
    mobile: 'thumbnail',
    tablet: 'medium',
    desktop: 'large',
  } as const;

  return cdnService.getOptimizedImageUrl(src, sizeMap[viewport]);
}

// Calculate optimal image dimensions based on container
export function calculateOptimalDimensions(
  containerWidth: number,
  containerHeight: number,
  aspectRatio: number = 16 / 9
): { width: number; height: number } {
  const containerAspectRatio = containerWidth / containerHeight;

  if (containerAspectRatio > aspectRatio) {
    // Container is wider than image aspect ratio
    return {
      width: Math.round(containerHeight * aspectRatio),
      height: containerHeight,
    };
  } else {
    // Container is taller than image aspect ratio
    return {
      width: containerWidth,
      height: Math.round(containerWidth / aspectRatio),
    };
  }
}
