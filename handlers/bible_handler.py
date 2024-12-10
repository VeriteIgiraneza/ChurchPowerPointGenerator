import pandas as pd

class BibleHandler:
    def __init__(self, csv_path):
        try:
            # Skip the first 5 lines (header comments) and load CSV
            self.df = pd.read_csv(
                csv_path,
                skiprows=5,  # Skip the header comments
                encoding='utf-8',
                dtype={
                    'Book Number': int,
                    'Chapter': int,
                    'Verse': int,
                    'Verse ID': int
                }
            )
            print("Bible data loaded successfully")
            print(f"Total verses: {len(self.df)}")
            print(f"Available columns: {self.df.columns.tolist()}")

            # Verify the required columns exist
            required_columns = {'Book Name', 'Chapter', 'Verse', 'Text'}
            missing_columns = required_columns - set(self.df.columns)
            if missing_columns:
                raise ValueError(f"Missing required columns: {missing_columns}")

        except FileNotFoundError:
            print(f"Error: Bible CSV file not found at {csv_path}")
            raise
        except Exception as e:
            print(f"Error loading Bible CSV: {e}")
            raise

    def fetch_bible_verses(self, book, chapter, verse_start=None, verse_end=None):
        """Fetch Bible verses based on reference."""
        try:
            # Convert parameters to appropriate types
            chapter = int(chapter) if chapter else None
            verse_start = int(verse_start) if verse_start else None
            verse_end = int(verse_end) if verse_end else None

            # Debug information
            print(f"Fetching verses for: {book} {chapter}:{verse_start}-{verse_end}")

            # Filter by book and chapter
            verses = self.df[
                (self.df['Book Name'].str.lower() == book.lower()) &
                (self.df['Chapter'] == chapter)
            ]

            # If verse range is specified
            if verse_start and verse_end:
                verses = verses[
                    (verses['Verse'] >= verse_start) &
                    (verses['Verse'] <= verse_end)
                ]
            elif verse_start:
                verses = verses[verses['Verse'] == verse_start]

            # Sort by verse number
            verses = verses.sort_values('Verse')

            # Convert to dictionary format
            result = []
            for _, verse in verses.iterrows():
                result.append({
                    'book': verse['Book Name'],
                    'chapter': int(verse['Chapter']),
                    'verse': int(verse['Verse']),
                    'text': verse['Text']
                })

            print(f"Found {len(result)} verses")
            return result

        except Exception as e:
            print(f"Error fetching Bible verses: {e}")
            return []

    def search_bible_books(self, search_term=''):
        """Search for Bible books."""
        try:
            print(f"Searching for books with term: {search_term}")

            if search_term:
                books = self.df[
                    self.df['Book Name'].str.lower().str.contains(search_term.lower())
                ]['Book Name'].unique()
            else:
                books = self.df['Book Name'].unique()

            # Sort books alphabetically
            sorted_books = sorted(books)
            result = [{'book': book} for book in sorted_books]

            print(f"Found {len(result)} matching books")
            return result

        except Exception as e:
            print(f"Error searching Bible books: {e}")
            return []

    def get_book_info(self, book_name):
        """Get information about a specific book."""
        try:
            book_data = self.df[self.df['Book Name'].str.lower() == book_name.lower()]
            if book_data.empty:
                return None

            chapters = book_data['Chapter'].unique()
            return {
                'name': book_name,
                'chapters': sorted(chapters.tolist()),
                'total_verses': len(book_data)
            }
        except Exception as e:
            print(f"Error getting book info: {e}")
            return None

    def get_chapter_info(self, book_name, chapter):
        """Get information about a specific chapter."""
        try:
            chapter_data = self.df[
                (self.df['Book Name'].str.lower() == book_name.lower()) &
                (self.df['Chapter'] == int(chapter))
            ]
            if chapter_data.empty:
                return None

            verses = chapter_data['Verse'].unique()
            return {
                'book': book_name,
                'chapter': int(chapter),
                'verses': sorted(verses.tolist()),
                'total_verses': len(chapter_data)
            }
        except Exception as e:
            print(f"Error getting chapter info: {e}")
            return None