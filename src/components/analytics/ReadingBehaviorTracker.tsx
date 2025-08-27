'use client';

import { useState, useEffect, useRef } from 'react';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';

interface ReadingBehaviorTrackerProps {
  contentId: string;
  contentType: 'article' | 'news';
  children: React.ReactNode;
}

interface ReadingProgress {
  scrollDepth: number;
  readingTime: number;
  isVisible: boolean;
  currentSection: string;
  interactions: {
    clicks: number;
    highlights: number;
    copies: number;
  };
}

export default function ReadingBehaviorTracker({
  contentId,
  contentType,
  children,
}: ReadingBehaviorTrackerProps) {
  const [progress, setProgress] = useState<ReadingProgress>({
    scrollDepth: 0,
    readingTime: 0,
    isVisible: true,
    currentSection: 'introduction',
    interactions: {
      clicks: 0,
      highlights: 0,
      copies: 0,
    },
  });

  const { session, trackInteraction, isTracking } = useAnalyticsTracking({
    contentId,
    contentType,
    trackReadingTime: true,
    trackScrollDepth: true,
  });

  const contentRef = useRef<HTMLDivElement>(null);

  const lastScrollTime = useRef(Date.now());
  const readingTimeInterval = useRef<NodeJS.Timeout | null>(null);

  // Track scroll depth and current section
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const scrollTop = window.pageYOffset;
      const documentHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth =
        documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;

      // Find current section
      let currentSection = 'introduction';
      const sections = contentRef.current.querySelectorAll('h1, h2, h3');

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= 0) {
          currentSection =
            section.textContent?.toLowerCase().replace(/\s+/g, '-') ||
            `section-${index}`;
        }
      });

      setProgress(prev => ({
        ...prev,
        scrollDepth: Math.max(prev.scrollDepth, scrollDepth),
        currentSection,
      }));

      lastScrollTime.current = Date.now();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track reading time when content is visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setProgress(prev => ({ ...prev, isVisible }));

      if (isVisible && isTracking) {
        // Resume reading time tracking
        readingTimeInterval.current = setInterval(() => {
          setProgress(prev => ({
            ...prev,
            readingTime: prev.readingTime + 1,
          }));
        }, 1000);
      } else {
        // Pause reading time tracking
        if (readingTimeInterval.current) {
          clearInterval(readingTimeInterval.current);
          readingTimeInterval.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start tracking immediately if visible
    if (!document.hidden && isTracking) {
      handleVisibilityChange();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (readingTimeInterval.current) {
        clearInterval(readingTimeInterval.current);
      }
    };
  }, [isTracking]);

  // Track user interactions
  useEffect(() => {
    if (!contentRef.current) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Track clicks on links, buttons, and interactive elements
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.onclick
      ) {
        setProgress(prev => ({
          ...prev,
          interactions: {
            ...prev.interactions,
            clicks: prev.interactions.clicks + 1,
          },
        }));

        // Track specific interaction types
        if (target.classList.contains('share-button')) {
          trackInteraction('share', { section: progress.currentSection });
        } else if (target.classList.contains('bookmark-button')) {
          trackInteraction('bookmark', { section: progress.currentSection });
        } else if (target.classList.contains('like-button')) {
          trackInteraction('like', { section: progress.currentSection });
        }
      }
    };

    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 10) {
        setProgress(prev => ({
          ...prev,
          interactions: {
            ...prev.interactions,
            highlights: prev.interactions.highlights + 1,
          },
        }));
      }
    };

    const handleCopy = () => {
      setProgress(prev => ({
        ...prev,
        interactions: {
          ...prev.interactions,
          copies: prev.interactions.copies + 1,
        },
      }));
    };

    const content = contentRef.current;
    content.addEventListener('click', handleClick);
    content.addEventListener('mouseup', handleSelection);
    content.addEventListener('copy', handleCopy);

    return () => {
      content.removeEventListener('click', handleClick);
      content.removeEventListener('mouseup', handleSelection);
      content.removeEventListener('copy', handleCopy);
    };
  }, [progress.currentSection, trackInteraction]);

  // Track reading milestones
  useEffect(() => {
    const milestones = [25, 50, 75, 90, 100];
    const currentMilestone = milestones.find(
      m => progress.scrollDepth >= m && !session.interactions[`milestone_${m}`]
    );

    if (currentMilestone) {
      // Track milestone achievement
      console.log('Milestone achieved:', currentMilestone, {
        section: progress.currentSection,
        readingTime: progress.readingTime,
      });
    }
  }, [
    progress.scrollDepth,
    progress.currentSection,
    progress.readingTime,
    session.interactions,
    trackInteraction,
  ]);

  return (
    <div ref={contentRef} className="relative">
      {/* Reading Progress Indicator */}
      {isTracking && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div
            className="h-1 bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress.scrollDepth}%` }}
          />
        </div>
      )}

      {/* Reading Stats Overlay (for development/testing) */}
      {process.env.NODE_ENV === 'development' && isTracking && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs space-y-1 z-50">
          <div>Scroll: {progress.scrollDepth.toFixed(1)}%</div>
          <div>
            Time: {Math.floor(progress.readingTime / 60)}:
            {(progress.readingTime % 60).toString().padStart(2, '0')}
          </div>
          <div>Section: {progress.currentSection}</div>
          <div>Clicks: {progress.interactions.clicks}</div>
          <div>Highlights: {progress.interactions.highlights}</div>
          <div>Copies: {progress.interactions.copies}</div>
          <div>Visible: {progress.isVisible ? 'Yes' : 'No'}</div>
        </div>
      )}

      {children}
    </div>
  );
}
