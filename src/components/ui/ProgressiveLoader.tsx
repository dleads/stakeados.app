'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useLazyLoading } from './LazyLoader';

interface ProgressiveLoaderProps<T> {
  loadData: (page: number, limit: number) => Promise<T[]>;
  renderItem: (item: T, index: number) => ReactNode;
  renderSkeleton?: () => ReactNode;
  initialPage?: number;
  pageSize?: number;
  threshold?: number;
  className?: string;
  containerClassName?: string;
  loadingClassName?: string;
  emptyMessage?: string;
  errorMessage?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function ProgressiveLoader<T>({
  loadData,
  renderItem,
  renderSkeleton,
  initialPage = 1,
  pageSize = 10,
  threshold = 0.8,
  className = '',
  containerClassName = '',
  loadingClassName = '',
  emptyMessage = 'No items found',
  errorMessage = 'Failed to load items',
  hasMore: externalHasMore,
  onLoadMore,
}: ProgressiveLoaderProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // Load more data when intersection is detected
  const loadMore = useCallback(async () => {
    if (loading || (!hasMore && externalHasMore === undefined)) return;

    setLoading(true);
    setError(null);

    try {
      const newItems = await loadData(page, pageSize);

      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...newItems]);
        setPage(prev => prev + 1);

        // Check if we have more items
        if (newItems.length < pageSize) {
          setHasMore(false);
        }
      }

      onLoadMore?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [
    loadData,
    page,
    pageSize,
    loading,
    hasMore,
    externalHasMore,
    onLoadMore,
    errorMessage,
  ]);

  // Initial load
  useEffect(() => {
    loadMore();
  }, []); // Only run on mount

  // Intersection observer for infinite scroll
  const { elementRef } = useLazyLoading(loadMore, {
    threshold,
    triggerOnce: false,
  });

  // Default skeleton component
  const defaultSkeleton = () => (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
      ))}
    </div>
  );

  const skeleton = renderSkeleton || defaultSkeleton;

  if (initialLoad && loading) {
    return (
      <div className={`${containerClassName} ${loadingClassName}`}>
        {skeleton()}
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className={`text-center py-8 ${containerClassName}`}>
        <div className="text-red-600 mb-4">
          <svg
            className="w-12 h-12 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>{error}</p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setPage(initialPage);
            setItems([]);
            setHasMore(true);
            loadMore();
          }}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <div className={`text-center py-8 text-gray-500 ${containerClassName}`}>
        <svg
          className="w-12 h-12 mx-auto mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const shouldShowMore =
    externalHasMore !== undefined ? externalHasMore : hasMore;

  return (
    <div className={containerClassName}>
      <div className={className}>
        {items.map((item, index) => renderItem(item, index))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className={`mt-6 ${loadingClassName}`}>{skeleton()}</div>
      )}

      {/* Error message for additional loads */}
      {error && items.length > 0 && (
        <div className="text-center py-4">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadMore();
            }}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Intersection trigger for infinite scroll */}
      {shouldShowMore && !loading && !error && (
        <div ref={elementRef} className="h-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}

      {/* End of content indicator */}
      {!shouldShowMore && items.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>You've reached the end!</p>
        </div>
      )}
    </div>
  );
}

// Virtualized list for large datasets
interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5,
  className = '',
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Masonry layout for variable height items
interface MasonryLoaderProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
}

export function MasonryLoader<T>({
  items,
  renderItem,
  columns = 3,
  gap = 16,
  className = '',
}: MasonryLoaderProps<T>) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {items.map((item, index) => (
        <div key={index} className="break-inside-avoid">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
