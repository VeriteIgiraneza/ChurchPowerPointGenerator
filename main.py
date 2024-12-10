import os
import pandas as pd
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from datetime import datetime
from handlers.bible_handler import BibleHandler
from handlers.hymn_handler import HymnHandler

# Flask app initialization
app = Flask(__name__, static_url_path='', static_folder='static')
CORS(app)

# Get the absolute path to the project directory
project_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(project_dir, 'data')

# Define paths relative to the project directory
bible_path = os.path.join(data_dir, 'asv.csv')  # Using asv.csv instead of bible.xlsx
songs_path = os.path.join(data_dir, 'SongsSlide.xlsx')  # Using SongsSlide.xlsx

# Initialize handlers
try:
    bible_handler = BibleHandler(bible_path)
    hymn_handler = HymnHandler(songs_path)
except Exception as e:
    print(f"Failed to initialize handlers: {e}")
    raise


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


# Hymn routes
@app.route('/api/hymns', methods=['GET'])
def search_hymns():
    try:
        search_term = request.args.get('search', '')
        hymns = hymn_handler.search_hymns(search_term)
        return jsonify(hymns)
    except Exception as e:
        print(f"Error in search_hymns: {e}")
        return jsonify({"error": "Failed to fetch hymns"}), 500


@app.route('/api/hymns/<int:hymn_number>', methods=['GET'])
def get_hymn(hymn_number):
    try:
        hymn = hymn_handler.get_hymn(hymn_number)
        if hymn:
            return jsonify(hymn)
        return jsonify({"error": "Hymn not found"}), 404
    except Exception as e:
        print(f"Error in get_hymn: {e}")
        return jsonify({"error": "Failed to fetch hymn"}), 500


# Presentations list (in-memory storage for now)
presentations = []


@app.route('/api/presentations', methods=['GET'])
def get_presentations():
    return jsonify(presentations)


@app.route('/api/presentations', methods=['POST'])
def create_presentation():
    try:
        data = request.get_json()
        if not data.get('name'):
            return jsonify({"error": "Presentation name is required"}), 400

        presentation = {
            'id': len(presentations) + 1,
            'name': data['name'],
            'date': data.get('date', datetime.now().isoformat()),
            'slides': data.get('slides', []),
            'created_at': datetime.now().isoformat()
        }
        presentations.append(presentation)
        return jsonify(presentation), 201
    except Exception as e:
        print(f"Error creating presentation: {e}")
        return jsonify({"error": "Failed to create presentation"}), 500


@app.route('/api/presentations/<int:presentation_id>', methods=['DELETE'])
def delete_presentation(presentation_id):
    try:
        global presentations
        presentations = [p for p in presentations if p['id'] != presentation_id]
        return '', 204
    except Exception as e:
        print(f"Error deleting presentation: {e}")
        return jsonify({"error": "Failed to delete presentation"}), 500


if __name__ == "__main__":
    print(f"Project directory: {project_dir}")
    print(f"Data directory: {data_dir}")
    print(f"Bible path: {bible_path}")
    print(f"Songs path: {songs_path}")

    # Create data directory if it doesn't exist
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        print(f"Created data directory at: {data_dir}")

    app.run(debug=True)