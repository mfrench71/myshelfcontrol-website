/**
 * Lightbox Component
 * Full-screen image viewer with navigation and zoom
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface LightboxImage {
  url: string;
  caption?: string;
}

interface LightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Lightbox - Full-screen image viewer with navigation
 *
 * @param images - Array of images to display
 * @param initialIndex - Index of image to show first
 * @param isOpen - Whether the lightbox is visible
 * @param onClose - Callback when lightbox is closed
 */
export function Lightbox({ images, initialIndex = 0, isOpen, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [swipeOffset, setSwipeOffset] = useState(0); // Vertical swipe offset for close gesture
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  /**
   * Reset zoom, rotation, and position
   */
  const resetTransforms = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  /**
   * Navigate to previous image
   */
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetTransforms();
  }, [images.length, resetTransforms]);

  /**
   * Navigate to next image
   */
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    resetTransforms();
  }, [images.length, resetTransforms]);

  /**
   * Zoom in
   */
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.5, 4));
  }, []);

  /**
   * Zoom out
   */
  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  /**
   * Rotate image 90 degrees
   */
  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Reset state when opening or changing images (modal initialization pattern)
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetTransforms();
      setSwipeOffset(0);
      setIsClosing(false);
    }
  }, [isOpen, initialIndex, resetTransforms]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'r':
          handleRotate();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext, handleZoomIn, handleZoomOut, handleRotate]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /**
   * Handle mouse/touch start for dragging
   */
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (zoom <= 1) return;

    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  }, [zoom, position]);

  /**
   * Handle mouse/touch move for dragging
   */
  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || zoom <= 1) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  }, [isDragging, zoom, dragStart]);

  /**
   * Handle mouse/touch end for dragging
   */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Handle touch events for swipe navigation
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (zoom > 1) {
      handleDragStart(e);
      return;
    }
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setSwipeOffset(0);
  }, [zoom, handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (zoom > 1) {
      handleDragMove(e);
      return;
    }

    if (!touchStartRef.current) return;

    const currentY = e.touches[0].clientY;
    const diffY = currentY - touchStartRef.current.y;

    // Only track downward swipes for close gesture
    if (diffY > 0) {
      setSwipeOffset(diffY);
    }
  }, [zoom, handleDragMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (zoom > 1) {
      handleDragEnd();
      return;
    }

    if (!touchStartRef.current) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const diffX = touchEnd.x - touchStartRef.current.x;
    const diffY = touchEnd.y - touchStartRef.current.y;

    // Horizontal swipe (more than 50px and more horizontal than vertical)
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
      setSwipeOffset(0);
    }
    // Vertical swipe down to close
    else if (diffY > 100 && Math.abs(diffY) > Math.abs(diffX)) {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
      }, 150);
    } else {
      // Reset swipe offset with animation
      setSwipeOffset(0);
    }

    touchStartRef.current = null;
  }, [zoom, handleDragEnd, goToPrevious, goToNext, onClose]);

  /**
   * Handle backdrop click to close
   */
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  // Calculate opacity based on swipe offset
  const swipeOpacity = Math.max(0.3, 1 - swipeOffset / 300);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-black/95 flex items-center justify-center lightbox-enter ${
        isClosing ? 'lightbox-exit' : ''
      }`}
      style={{ opacity: swipeOffset > 0 ? swipeOpacity : undefined }}
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Close image viewer"
      >
        <X className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/50 rounded-full px-4 py-2">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 1}
          className="p-2 hover:bg-white/20 rounded-full text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-5 h-5" aria-hidden="true" />
        </button>
        <span className="text-white text-sm min-w-[48px] text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 4}
          className="p-2 hover:bg-white/20 rounded-full text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="w-px h-6 bg-white/30" aria-hidden="true" />
        <button
          onClick={handleRotate}
          className="p-2 hover:bg-white/20 rounded-full text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Rotate image"
        >
          <RotateCw className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Previous button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
        </button>
      )}

      {/* Next button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" aria-hidden="true" />
        </button>
      )}

      {/* Image container */}
      <div
        className={`relative max-w-full max-h-full lightbox-image-enter ${isDragging ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : ''} ${swipeOffset > 0 ? 'lightbox-dragging' : ''}`}
        style={{
          transform: `translate(${position.x}px, ${position.y + swipeOffset}px) scale(${zoom * (1 - swipeOffset / 1000)}) rotate(${rotation}deg)`,
          transition: isDragging || swipeOffset > 0 ? 'none' : 'transform 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={currentImage.url}
          alt={currentImage.caption || `Image ${currentIndex + 1} of ${images.length}`}
          width={1200}
          height={1600}
          className="max-w-[90vw] max-h-[80vh] w-auto h-auto object-contain"
          priority
          unoptimized
        />
      </div>

      {/* Image counter and caption */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-center">
        {images.length > 1 && (
          <div className="bg-black/50 text-white px-4 py-1.5 rounded-full text-sm mb-2">
            {currentIndex + 1} / {images.length}
          </div>
        )}
        {currentImage.caption && (
          <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm max-w-[80vw]">
            {currentImage.caption}
          </div>
        )}
      </div>

      {/* Thumbnail strip for multiple images */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/50 rounded-lg p-2 max-w-[90vw] overflow-x-auto">
          {images.map((img, index) => (
            <button
              key={img.url}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
                resetTransforms();
              }}
              className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-white scale-110'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={img.url}
                alt=""
                width={48}
                height={48}
                className="w-full h-full object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
