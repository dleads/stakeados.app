export interface CDNConfig {
  baseUrl: string;
  imageTransformations: {
    thumbnail: string;
    medium: string;
    large: string;
    hero: string;
  };
  cacheHeaders: {
    images: string;
    static: string;
    dynamic: string;
  };
}

const CDN_CONFIG: CDNConfig = {
  baseUrl: process.env.CDN_BASE_URL || '',
  imageTransformations: {
    thumbnail: 'w_300,h_200,c_fill,f_auto,q_auto',
    medium: 'w_600,h_400,c_fill,f_auto,q_auto',
    large: 'w_1200,h_800,c_fill,f_auto,q_auto',
    hero: 'w_1920,h_1080,c_fill,f_auto,q_auto',
  },
  cacheHeaders: {
    images: 'public, max-age=31536000, immutable', // 1 year
    static: 'public, max-age=31536000, immutable', // 1 year
    dynamic: 'public, max-age=300, s-maxage=600', // 5 min browser, 10 min CDN
  },
};

export class CDNService {
  private config: CDNConfig;

  constructor(config: CDNConfig = CDN_CONFIG) {
    this.config = config;
  }

  /**
   * Generate optimized image URL with transformations
   */
  getOptimizedImageUrl(
    imageUrl: string,
    size: keyof CDNConfig['imageTransformations'] = 'medium',
    customTransforms?: string
  ): string {
    if (!imageUrl) return '';

    // If it's already a CDN URL, return as is
    if (imageUrl.startsWith(this.config.baseUrl)) {
      return imageUrl;
    }

    // If no CDN configured, return original URL
    if (!this.config.baseUrl) {
      return imageUrl;
    }

    const transforms =
      customTransforms || this.config.imageTransformations[size];

    // For Cloudinary-style CDN
    if (this.config.baseUrl.includes('cloudinary')) {
      return `${this.config.baseUrl}/image/fetch/${transforms}/${encodeURIComponent(imageUrl)}`;
    }

    // For other CDNs, append query parameters
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${this.config.baseUrl}${imageUrl}${separator}${transforms}`;
  }

  /**
   * Generate responsive image srcset
   */
  getResponsiveImageSrcSet(imageUrl: string): string {
    if (!imageUrl || !this.config.baseUrl) return '';

    const sizes = [
      { width: 300, transform: this.config.imageTransformations.thumbnail },
      { width: 600, transform: this.config.imageTransformations.medium },
      { width: 1200, transform: this.config.imageTransformations.large },
    ];

    return sizes
      .map(({ width, transform }) => {
        const url = this.getOptimizedImageUrl(imageUrl, 'medium', transform);
        return `${url} ${width}w`;
      })
      .join(', ');
  }

  /**
   * Get cache headers for different content types
   */
  getCacheHeaders(
    contentType: 'images' | 'static' | 'dynamic'
  ): Record<string, string> {
    const cacheControl = this.config.cacheHeaders[contentType];

    return {
      'Cache-Control': cacheControl,
      Vary: 'Accept-Encoding',
      ...(contentType === 'images' && {
        Accept: 'image/webp,image/avif,image/*,*/*;q=0.8',
      }),
    };
  }

  /**
   * Preload critical images
   */
  generatePreloadLinks(imageUrls: string[]): string[] {
    return imageUrls.map(url => {
      const optimizedUrl = this.getOptimizedImageUrl(url, 'hero');
      return `<${optimizedUrl}>; rel=preload; as=image`;
    });
  }

  /**
   * Generate WebP and AVIF variants
   */
  getImageVariants(
    imageUrl: string,
    size: keyof CDNConfig['imageTransformations'] = 'medium'
  ): {
    webp: string;
    avif: string;
    fallback: string;
  } {
    const baseTransform = this.config.imageTransformations[size];

    return {
      webp: this.getOptimizedImageUrl(
        imageUrl,
        size,
        `${baseTransform},f_webp`
      ),
      avif: this.getOptimizedImageUrl(
        imageUrl,
        size,
        `${baseTransform},f_avif`
      ),
      fallback: this.getOptimizedImageUrl(imageUrl, size),
    };
  }

  /**
   * Purge CDN cache for specific URLs
   */
  async purgeCacheUrls(urls: string[]): Promise<boolean> {
    if (!process.env.CDN_PURGE_API_KEY || !process.env.CDN_PURGE_ENDPOINT) {
      console.warn('CDN purge not configured');
      return false;
    }

    try {
      const response = await fetch(process.env.CDN_PURGE_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CDN_PURGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to purge CDN cache:', error);
      return false;
    }
  }

  /**
   * Generate optimized video URL
   */
  getOptimizedVideoUrl(
    videoUrl: string,
    quality: 'auto' | 'low' | 'medium' | 'high' = 'auto'
  ): string {
    if (!videoUrl || !this.config.baseUrl) return videoUrl;

    const qualityMap = {
      auto: 'q_auto',
      low: 'q_30',
      medium: 'q_60',
      high: 'q_80',
    };

    const transform = `${qualityMap[quality]},f_auto`;

    if (this.config.baseUrl.includes('cloudinary')) {
      return `${this.config.baseUrl}/video/fetch/${transform}/${encodeURIComponent(videoUrl)}`;
    }

    const separator = videoUrl.includes('?') ? '&' : '?';
    return `${this.config.baseUrl}${videoUrl}${separator}${transform}`;
  }
}

// Singleton instance
export const cdnService = new CDNService();

// Utility functions for Next.js Image component
export function getImageProps(
  src: string,
  size: keyof CDNConfig['imageTransformations'] = 'medium'
) {
  const variants = cdnService.getImageVariants(src, size);

  return {
    src: variants.fallback,
    srcSet: cdnService.getResponsiveImageSrcSet(src),
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  };
}

export function getOptimizedImageUrl(
  src: string,
  size: keyof CDNConfig['imageTransformations'] = 'medium'
) {
  return cdnService.getOptimizedImageUrl(src, size);
}
