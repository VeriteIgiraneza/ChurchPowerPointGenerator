import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const HymnDisplay = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hymns, setHymns] = useState([]);
  const [selectedHymn, setSelectedHymn] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slides, setSlides] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search for hymns
  const searchHymns = async (term) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/hymns/search?term=${encodeURIComponent(term)}`);
      const data = await response.json();
      setHymns(data);
    } catch (error) {
      console.error('Error searching hymns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch hymn details
  const fetchHymnDetails = async (hymnNumber) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/hymns/${hymnNumber}`);
      const hymn = await response.json();
      setSelectedHymn(hymn);

      // Create slides from hymn data
      const hymnSlides = [];

      // Title slide
      hymnSlides.push({
        type: 'title',
        content: `${hymn.number}. ${hymn.title}`
      });

      // Add verses and choruses
      hymn.verses.forEach((verse, index) => {
        // Add verse
        hymnSlides.push({
          type: 'verse',
          number: verse.number,
          content: verse.text
        });

        // Add chorus after verse if it exists and isn't the last verse
        if (hymn.chorus && index < hymn.verses.length - 1) {
          hymnSlides.push({
            type: 'chorus',
            content: hymn.chorus
          });
        }
      });

      setSlides(hymnSlides);
      setCurrentSlideIndex(0);
    } catch (error) {
      console.error('Error fetching hymn details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const delayDebounce = setTimeout(() => {
        searchHymns(searchTerm);
      }, 300);

      return () => clearTimeout(delayDebounce);
    }
  }, [searchTerm]);

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePreviousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const renderCurrentSlide = () => {
    if (!slides.length) return null;

    const currentSlide = slides[currentSlideIndex];

    return (
      <div className="text-center p-8">
        {currentSlide.type === 'title' ? (
          <h2 className="text-3xl font-bold">{currentSlide.content}</h2>
        ) : (
          <div>
            <div className="mb-4 text-sm text-gray-500">
              {currentSlide.type === 'verse' ? `Verse ${currentSlide.number}` : 'Chorus'}
            </div>
            <p className="text-2xl whitespace-pre-line">{currentSlide.content}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-100">
      {/* Left Panel - Search and Hymn List */}
      <div className="w-80 bg-white border-r p-4">
        <div className="relative mb-4">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            placeholder="Search hymns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>

        {/* Hymn List */}
        <div className="overflow-y-auto h-[calc(100vh-8rem)]">
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          ) : (
            hymns.map((hymn) => (
              <div
                key={hymn.number}
                className="p-3 hover:bg-gray-50 cursor-pointer rounded-lg mb-2"
                onClick={() => fetchHymnDetails(hymn.number)}
              >
                <div className="font-medium">{hymn.title}</div>
                <div className="text-sm text-gray-500">Hymn #{hymn.number}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Hymn Display */}
      <div className="flex-1 flex flex-col">
        {/* Preview Window */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg min-h-[400px] flex items-center justify-center">
            {renderCurrentSlide()}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="p-4 bg-white border-t flex items-center justify-between">
          <button
            onClick={handlePreviousSlide}
            disabled={currentSlideIndex === 0}
            className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </button>

          <div className="text-sm text-gray-500">
            {slides.length > 0 && `Slide ${currentSlideIndex + 1} of ${slides.length}`}
          </div>

          <button
            onClick={handleNextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HymnDisplay;