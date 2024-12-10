import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Monitor } from 'lucide-react';

const PreviewPanel = ({
  slides = [],
  currentIndex = 0,
  onNavigate,
  onGoLive
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transitionClass, setTransitionClass] = useState('');

  useEffect(() => {
    setTransitionClass('opacity-0');
    const timer = setTimeout(() => setTransitionClass('opacity-100'), 100);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const renderSlideContent = (slide) => {
    if (!slide) return null;

    switch (slide.type) {
      case 'song':
        return (
          <div className="text-center">
            <div className="text-xl font-semibold mb-4">{slide.title}</div>
            <div className="text-2xl whitespace-pre-line">{slide.content}</div>
          </div>
        );

      case 'bible-verse':
        return (
          <div className="text-center">
            <div className="text-lg text-gray-200 mb-2">
              {slide.reference}
            </div>
            <div className="text-2xl">{slide.content}</div>
          </div>
        );

      case 'announcement':
        return (
          <div className="text-center">
            <div className="text-xl font-semibold mb-4">{slide.title}</div>
            <div className="text-2xl">{slide.content}</div>
          </div>
        );

      case 'prayer':
      case 'offering':
        return (
          <div className="text-center">
            <div className="text-4xl font-bold">{slide.type.charAt(0).toUpperCase() + slide.type.slice(1)}</div>
          </div>
        );

      default:
        return (
          <div className="text-center text-2xl">
            {slide.content}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-lg rounded-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Preview</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {slides.length > 0 ? `${currentIndex + 1} / ${slides.length}` : '0 / 0'}
          </span>
        </div>
      </div>

      {/* Preview Window */}
      <div className={`flex-1 bg-black relative overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        <div className={`h-full flex items-center justify-center p-8 transition-opacity duration-300 ${transitionClass}`}>
          {slides.length > 0 ? (
            <div className="text-white w-full">
              {renderSlideContent(slides[currentIndex])}
            </div>
          ) : (
            <div className="text-gray-500 text-center">
              No slides to preview
            </div>
          )}
        </div>

        {/* Navigation Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 flex items-center justify-between bg-gradient-to-t from-black/50 to-transparent">
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onGoLive}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Monitor className="w-4 h-4 mr-2" />
              Go Live
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50"
            >
              <Play className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={() => onNavigate(currentIndex + 1)}
            disabled={currentIndex === slides.length - 1}
            className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="p-2 border-t overflow-x-auto">
        <div className="flex space-x-1">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => onNavigate(index)}
              className={`flex-shrink-0 w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Optional keyboard navigation
const useKeyboardNavigation = (onNavigate, currentIndex, slidesLength) => {
  useEffect(() => {
    const handleKeyPress = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          if (currentIndex > 0) onNavigate(currentIndex - 1);
          break;
        case 'ArrowRight':
          if (currentIndex < slidesLength - 1) onNavigate(currentIndex + 1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onNavigate, currentIndex, slidesLength]);
};

// Usage example
const PreviewPanelWithKeyboard = (props) => {
  useKeyboardNavigation(props.onNavigate, props.currentIndex, props.slides.length);
  return <PreviewPanel {...props} />;
};

export default PreviewPanelWithKeyboard;