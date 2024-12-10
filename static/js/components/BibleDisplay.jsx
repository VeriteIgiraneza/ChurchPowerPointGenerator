import React, { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

const BibleDisplay = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [verseStart, setVerseStart] = useState('');
  const [verseEnd, setVerseEnd] = useState('');
  const [verses, setVerses] = useState([]);
  const [bookInfo, setBookInfo] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch Bible books when component mounts
  useEffect(() => {
    fetchBooks();
  }, []);

  // Fetch books matching search term
  const fetchBooks = async (search = '') => {
    try {
      const response = await fetch(`/api/bible/books?search=${encodeURIComponent(search)}`);
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error('Error fetching Bible books:', error);
    }
  };

  // Fetch verses when selection changes
  const fetchVerses = async () => {
    if (!selectedBook || !selectedChapter) return;

    try {
      const params = new URLSearchParams({
        book: selectedBook,
        chapter: selectedChapter,
        verse_start: verseStart,
        verse_end: verseEnd
      });

      const response = await fetch(`/api/bible/search?${params}`);
      const data = await response.json();
      setVerses(data);
    } catch (error) {
      console.error('Error fetching verses:', error);
    }
  };

  // Handle book selection
  const handleBookSelect = async (book) => {
    setSelectedBook(book);
    setSelectedChapter('');
    setVerseStart('');
    setVerseEnd('');
    setIsSearching(false);

    try {
      const response = await fetch(`/api/bible/books/${encodeURIComponent(book)}`);
      const data = await response.json();
      setBookInfo(data);
    } catch (error) {
      console.error('Error fetching book info:', error);
    }
  };

  // Search handler
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsSearching(true);
    fetchBooks(value);
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Search and Selection */}
      <div className="w-72 border-r p-4 bg-white">
        {/* Book Search */}
        <div className="relative mb-4">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            placeholder="Search Bible books..."
            value={searchTerm}
            onChange={handleSearch}
            onFocus={() => setIsSearching(true)}
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>

        {/* Book List */}
        {isSearching && (
          <div className="max-h-64 overflow-y-auto border rounded-lg mb-4">
            {books.map((book, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleBookSelect(book.book)}
              >
                {book.book}
              </div>
            ))}
          </div>
        )}

        {/* Chapter and Verse Selection */}
        {bookInfo && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Chapter</label>
              <select
                className="w-full p-2 border rounded-lg"
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
              >
                <option value="">Select Chapter</option>
                {bookInfo.chapters?.map((chapter) => (
                  <option key={chapter} value={chapter}>
                    {chapter}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">From Verse</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  value={verseStart}
                  onChange={(e) => setVerseStart(e.target.value)}
                  min="1"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">To Verse</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  value={verseEnd}
                  onChange={(e) => setVerseEnd(e.target.value)}
                  min={verseStart || "1"}
                />
              </div>
            </div>

            <button
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              onClick={fetchVerses}
            >
              Search Verses
            </button>
          </div>
        )}
      </div>

      {/* Right Panel - Verse Display */}
      <div className="flex-1 p-6 bg-gray-50">
        {verses.length > 0 ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              {selectedBook} {selectedChapter}:{verseStart}
              {verseEnd && verseEnd !== verseStart ? `-${verseEnd}` : ''}
            </h2>
            <div className="space-y-4">
              {verses.map((verse, index) => (
                <div key={index} className="flex">
                  <span className="text-sm text-gray-500 w-8">{verse.verse}</span>
                  <p className="flex-1">{verse.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-10">
            Select a book, chapter, and verse range to view Bible verses
          </div>
        )}
      </div>
    </div>
  );
};

export default BibleDisplay;