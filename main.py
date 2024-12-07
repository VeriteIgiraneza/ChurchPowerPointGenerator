import os
import pandas as pd
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

# Flask app initialization
app = Flask(__name__, static_url_path='', static_folder='static')
CORS(app)


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
            print("Bible data loaded successfully")
            print(f"Total verses: {len(self.df)}")
            print(f"Available columns: {self.df.columns.tolist()}")

        except Exception as e:
            print(f"Error loading CSV: {e}")
            raise

    def fetch_bible_verses(self, book, chapter, verse_start=None, verse_end=None):
        try:
            # Filter by book and chapter using the correct column names
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

            # Convert to dictionary format with renamed keys to match expected format
            result = verses.to_dict('records')
            # Rename keys to match what the frontend expects
            for verse in result:
                verse['book'] = verse.pop('Book Name')
                verse['chapter'] = verse.pop('Chapter')
                verse['verse'] = verse.pop('Verse')
                verse['text'] = verse.pop('Text')
            return result
        except Exception as e:
            print(f"Error fetching Bible verses: {e}")
            return []

    def search_bible_books(self, search_term=''):
        try:
            if search_term:
                books = self.df[
                    self.df['Book Name'].str.lower().str.contains(search_term.lower())
                ]['Book Name'].unique()
            else:
                books = self.df['Book Name'].unique()

            return [{'book': book} for book in sorted(books)]
        except Exception as e:
            print(f"Error searching Bible books: {e}")
            return []


class DatabaseConnection:
    def __init__(self):
        try:
            self.connection = mysql.connector.connect(
                host="cse335-fall-2024.c924km8o85q2.us-east-1.rds.amazonaws.com",
                user="v0igir01",
                password="2c3e13850d",
                database="student_v0igir01_db",
                connection_timeout=5
            )
            if self.connection.is_connected():
                print("Successfully connected to MySQL database")
        except Error as e:
            print(f"Error connecting to MySQL database: {e}")
            raise

    def connect(self):
        """Reconnect to database if connection is lost"""
        try:
            self.connection = mysql.connector.connect(
                host="cse335-fall-2024.c924km8o85q2.us-east-1.rds.amazonaws.com",
                user="v0igir01",
                password="2c3e13850d",
                database="student_v0igir01_db",
                connection_timeout=5
            )
        except Error as e:
            print(f"Error reconnecting to database: {e}")
            raise

    def fetch_all_songs(self):
        try:
            if not self.connection.is_connected():
                self.connect()

            cursor = self.connection.cursor(dictionary=True)
            query = """
            SELECT song_id, title, song_number, lyrics
            FROM songs
            ORDER BY song_number
            """
            cursor.execute(query)
            songs = cursor.fetchall()
            cursor.close()
            return songs
        except Error as e:
            print(f"Error fetching songs: {e}")
            return []

    def search_songs(self, search_term):
        try:
            if not self.connection.is_connected():
                self.connect()

            cursor = self.connection.cursor(dictionary=True)
            query = """
            SELECT song_id, title, song_number, lyrics
            FROM songs
            WHERE title LIKE %s OR CAST(song_number AS CHAR) LIKE %s
            ORDER BY song_number
            """
            search_pattern = f"%{search_term}%"
            cursor.execute(query, (search_pattern, search_pattern))
            songs = cursor.fetchall()
            cursor.close()
            return songs
        except Error as e:
            print(f"Error searching songs: {e}")
            return []

    def get_song_by_id(self, song_id):
        try:
            if not self.connection.is_connected():
                self.connect()

            cursor = self.connection.cursor(dictionary=True)
            query = "SELECT song_id, title, song_number, lyrics FROM songs WHERE song_id = %s"
            cursor.execute(query, (song_id,))
            song = cursor.fetchone()
            cursor.close()
            return song
        except Error as e:
            print(f"Error fetching song {song_id}: {e}")
            return None

    def close_connection(self):
        if hasattr(self, 'connection') and self.connection and self.connection.is_connected():
            self.connection.close()
            print("MySQL connection closed")


# Initialize handlers
current_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(current_dir, 'data', 'asv.csv')
bible_handler = BibleCSVHandler(csv_path)
db = DatabaseConnection()


# Route for serving the main HTML file
@app.route('/')
def serve_index():
    return send_from_directory('static', 'main_template.html')


# Bible routes
@app.route('/api/bible/search', methods=['GET'])
def search_bible():
    try:
        book = request.args.get('book', '')
        chapter = request.args.get('chapter')
        verse_start = request.args.get('verse_start')
        verse_end = request.args.get('verse_end')

        # Convert string numbers to integers
        try:
            chapter = int(chapter) if chapter else None
            verse_start = int(verse_start) if verse_start else None
            verse_end = int(verse_end) if verse_end else None
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid chapter or verse numbers"}), 400

        if not book or not chapter:
            return jsonify({"error": "Book and chapter are required"}), 400

        verses = bible_handler.fetch_bible_verses(book, chapter, verse_start, verse_end)
        return jsonify(verses)
    except Exception as e:
        print(f"Error in search_bible: {e}")
        return jsonify({"error": "Failed to fetch Bible verses"}), 500


@app.route('/api/bible/books', methods=['GET'])
def search_bible_books():
    try:
        search_term = request.args.get('search', '')
        books = bible_handler.search_bible_books(search_term)
        return jsonify(books)
    except Exception as e:
        print(f"Error in search_bible_books: {e}")
        return jsonify({"error": "Failed to fetch Bible books"}), 500


# Song routes (using MySQL)
@app.route('/api/songs', methods=['GET'])
def get_songs():
    try:
        search_term = request.args.get('search', '')
        if search_term:
            songs = db.search_songs(search_term)
        else:
            songs = db.fetch_all_songs()
        return jsonify(songs)
    except Exception as e:
        print(f"Error in get_songs: {e}")
        return jsonify({"error": "Failed to fetch songs"}), 500


@app.route('/api/songs/<int:song_id>', methods=['GET'])
def get_song(song_id):
    try:
        song = db.get_song_by_id(song_id)
        if song:
            return jsonify(song)
        return jsonify({"error": "Song not found"}), 404
    except Exception as e:
        print(f"Error in get_song: {e}")
        return jsonify({"error": "Failed to fetch song"}), 500


if __name__ == "__main__":
    # Create data directory if it doesn't exist
    if not os.path.exists('data'):
        os.makedirs('data')

    app.run(debug=True, port=5000, host='0.0.0.0')