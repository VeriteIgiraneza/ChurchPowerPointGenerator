import os
import pandas as pd
from flask import jsonify


class BibleCSVHandler:
    def __init__(self, csv_path):
        try:
            # Skip the first 4 lines (header information)
            self.df = pd.read_csv(
                csv_path,
                skiprows=4,
                encoding='utf-8',
                dtype={
                    'Verse ID': int,
                    'Book Number': int,
                    'Chapter': int,
                    'Verse': int
                }
            )
            # Print debug information
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
            print(f"Current working directory: {os.getcwd()}")
            raise

    def fetch_bible_verses(self, book, chapter, verse_start=None, verse_end=None):
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

            # Debug information
            print(f"Found {len(result)} verses")
            return result

        except Exception as e:
            print(f"Error fetching Bible verses: {e}")
            return []

    def search_bible_books(self, search_term=''):
        try:
            # Debug information
            print(f"Searching for books with term: {search_term}")

            if search_term:
                # Case-insensitive search
                books = self.df[
                    self.df['Book Name'].str.lower().str.contains(search_term.lower())
                ]['Book Name'].unique()
            else:
                books = self.df['Book Name'].unique()

            # Sort books alphabetically
            sorted_books = sorted(books)

            # Convert to list of dictionaries
            result = [{'book': book} for book in sorted_books]

            # Debug information
            print(f"Found {len(result)} matching books")
            return result

        except Exception as e:
            print(f"Error searching Bible books: {e}")
            print(f"Search term was: {search_term}")
            return []

    def get_book_info(self, book_name):
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

    def validate_reference(self, book, chapter, verse_start=None, verse_end=None):
        try:
            # Check if book exists
            book_data = self.df[self.df['Book Name'].str.lower() == book.lower()]
            if book_data.empty:
                return False, "Book not found"

            # Check if chapter exists
            chapter_data = book_data[book_data['Chapter'] == int(chapter)]
            if chapter_data.empty:
                return False, "Chapter not found"

            # Check verses if specified
            if verse_start:
                verse_start = int(verse_start)
                if not chapter_data[chapter_data['Verse'] == verse_start].any().any():
                    return False, "Starting verse not found"

            if verse_end:
                verse_end = int(verse_end)
                if not chapter_data[chapter_data['Verse'] == verse_end].any().any():
                    return False, "Ending verse not found"

            if verse_start and verse_end and verse_start > verse_end:
                return False, "Starting verse cannot be greater than ending verse"

            return True, "Valid reference"

        except Exception as e:
            print(f"Error validating reference: {e}")
            return False, "Error validating reference"


# Helper function to create the handler
def create_bible_handler(data_directory):
    try:
        csv_path = os.path.join(data_directory, 'asv.csv')
        return BibleCSVHandler(csv_path)
    except Exception as e:
        print(f"Error creating Bible handler: {e}")
        raise