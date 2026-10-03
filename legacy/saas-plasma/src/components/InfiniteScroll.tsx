'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useAnimation, useInView, useScroll, useTransform } from 'framer-motion';

interface InfiniteScrollProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  onLoadMore?: () => Promise<void> | void;
  hasMore?: boolean;
  isLoading?: boolean;
  className?: string;
  itemClassName?: string;
  renderItem?: (item: any, index: number) => React.ReactNode;
  items?: any[];
  initialItems?: any[];
  loader?: React.ReactNode;
  endMessage?: React.ReactNode;
  staggerDelay?: number;
}

interface ScrollItemProps {
  children: React.ReactNode;
  index: number;
  delay?: number;
  className?: string;
  asChild?: boolean;
}

export function ScrollItem({ 
  children, 
  index, 
  delay = 0, 
  className = '',
  asChild = false,
}: ScrollItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const animate = useAnimation();

  useEffect(() => {
    if (isInView) {
      animate.start({
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
          duration: 0.8,
          delay: delay * 0.08,
          ease: [0.34, 1.56, 0.64, 1], // spring-like cubic-bezier
        },
      });
    }
  }, [isInView, animate, delay]);

  const initialState = {
    opacity: 0,
    y: 60,
    scale: 0.95,
    filter: 'blur(16px)',
  };

  if (asChild) {
    return (
      <motion.div
        ref={ref}
        animate={animate}
        initial={initialState}
        className={className}
        style={{ willChange: 'transform, opacity, filter' }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      animate={animate}
      initial={initialState}
      className={className}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  );
}

export function InfiniteScroll({
  children,
  threshold = 0.1,
  rootMargin = '200px',
  onLoadMore,
  hasMore = true,
  isLoading = false,
  className = '',
  itemClassName = '',
  renderItem,
  items = [],
  initialItems = [],
  loader,
  endMessage,
  staggerDelay = 0,
}: InfiniteScrollProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [displayItems, setDisplayItems] = useState(initialItems.length > 0 ? initialItems : items);
  const [showLoader, setShowLoader] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const isObservingRef = useRef(false);

  const handleLoadMore = useCallback(async () => {
    if (!onLoadMore || isLoading || !hasMore) return;
    
    setShowLoader(true);
    try {
      await onLoadMore();
    } catch (error) {
      console.error('Load more failed:', error);
    } finally {
      setShowLoader(false);
    }
  }, [onLoadMore, isLoading, hasMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || isLoading || isObservingRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoading) {
          handleLoadMore();
        }
      },
      { threshold, rootMargin }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
      isObservingRef.current = true;
    }

    return () => {
      observer.disconnect();
      isObservingRef.current = false;
    };
  }, [hasMore, isLoading, threshold, rootMargin, handleLoadMore]);

  // Update display items when items prop changes
  useEffect(() => {
    if (items.length > 0) {
      setDisplayItems(items);
    }
  }, [items]);

  const itemsToRender = renderItem 
    ? displayItems.map((item, index) => renderItem(item, index))
    : displayItems.map((item, index) => (
        <ScrollItem key={index} index={index} delay={index * staggerDelay} className={itemClassName}>
          {typeof item === 'object' && item !== null ? children : item}
        </ScrollItem>
      ));

  const defaultLoader = (
    <motion.div
      className="flex items-center justify-center gap-3 py-8 px-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <motion.div
        className="w-8 h-8 border-2 border-uv-500/30 border-t-uv-500 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <span className="font-mono text-xs text-zinc-500 uppercase tracking-wider">Carregando...</span>
    </motion.div>
  );

  const defaultEndMessage = (
    <motion.div
      className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <p className="font-body text-sm text-zinc-500">Fim do conteúdo</p>
      <p className="font-mono text-xs text-zinc-700">Puxe para atualizar</p>
    </motion.div>
  );

  return (
    <div className={`${className} relative`}>
      <div className="space-y-4 sm:space-y-6">
        <motion.div
          layout
          className="grid gap-4 sm:gap-6"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
        >
          {itemsToRender}
        </motion.div>

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="h-1 w-full" aria-hidden="true" />

        {/* Loader */}
        <motion.div
          key="loader"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showLoader ? 1 : 0, y: showLoader ? 0 : 20 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {showLoader && (loader || defaultLoader)}
        </motion.div>

        {/* End Message */}
        <motion.div
          key="end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showEnd ? 1 : 0, y: showEnd ? 0 : 20 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {!hasMore && !isLoading && (endMessage || defaultEndMessage)}
        </motion.div>
      </div>

      {/* Scroll Progress Indicator */}
      <ScrollProgressIndicator />
    </div>
  );
}

// Scroll Progress Indicator Component
function ScrollProgressIndicator() {
  const { scrollYProgress } = useScroll();

  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const progressOpacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
      style={{ height: '2px' }}
      aria-hidden="true"
    >
      <motion.div
        style={{
          width: progressWidth,
          height: '100%',
          background: 'linear-gradient(90deg, #8b3eff, #d946ef, #e879f9)',
          opacity: progressOpacity,
          boxShadow: '0 0 10px rgba(139, 62, 255, 0.5), 0 0 20px rgba(217, 70, 239, 0.3)',
        }}
      />
    </motion.div>
  );
}

// Hook for manual infinite scroll control
export function useInfiniteScroll(
  callback: () => Promise<void> | void,
  options: { threshold?: number; rootMargin?: string; enabled?: boolean } = {}
) {
  const { threshold = 0.1, rootMargin = '200px', enabled = true } = options;
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      { threshold, rootMargin }
    );

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => observer.disconnect();
  }, [callback, threshold, rootMargin, enabled]);

  return targetRef;
}

export default InfiniteScroll;