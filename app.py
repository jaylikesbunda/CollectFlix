import importlib.util
import subprocess
import sys
import os

def check_and_install_packages():
    required = {
        'flask': 'flask',
        'flask_cors': 'flask-cors',
        'psycopg2': 'psycopg2-binary',
        'numpy': 'numpy',
        'fuzzywuzzy': 'fuzzywuzzy',
        'dotenv': 'python-dotenv',
        'requests': 'requests',
        'waitress': 'waitress'
    }
    
    for lib, pkg in required.items():
        if not importlib.util.find_spec(lib):
            print(f"🚨 Oh shit, a package is missing, installing {pkg}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

check_and_install_packages()

from flask import Flask, jsonify, request, abort, Response
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
import logging
import numpy as np
import re
import csv
import json
import xml.etree.ElementTree as ET
from io import StringIO
import os
from fuzzywuzzy import process 
from dotenv import load_dotenv

load_dotenv()  # Load environment variables

app = Flask(__name__)

# Allow all origins with credentials
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://collectflix.local"]}})

API_KEY = os.getenv('TMDB_API_KEY')
EBAY_APP_ID = os.getenv('EBAY_APP_ID')
# Configure logging
logging.basicConfig(level=logging.DEBUG)



def ensure_db_constraints():
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            # Check and add the unique constraint on tmdb_id
            cursor.execute("""
                SELECT conname
                FROM pg_constraint
                WHERE conrelid = 'dvds'::regclass AND contype = 'u';
            """)
            constraints = cursor.fetchall()
            if not any('tmdb_id_unique' == constraint[0] for constraint in constraints):
                cursor.execute("""
                    ALTER TABLE dvds ADD CONSTRAINT tmdb_id_unique UNIQUE (tmdb_id);
                """)
                conn.commit()
                logging.info("Unique constraint 'tmdb_id_unique' added to 'tmdb_id' column.")
            else:
                logging.info("Unique constraint 'tmdb_id_unique' already exists.")

            # Check if the average_price column exists, if not, add it
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='dvds' AND column_name='average_price';
            """)
            if not cursor.fetchone():
                cursor.execute("""
                    ALTER TABLE dvds ADD COLUMN average_price DECIMAL(10, 2);
                """)
                conn.commit()
                logging.info("Column 'average_price' added to 'dvds' table.")
            else:
                logging.info("Column 'average_price' already exists.")

            # Check if the total_collection_price column exists, if not, add it
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='dvds' AND column_name='total_collection_price';
            """)
            if not cursor.fetchone():
                cursor.execute("""
                    ALTER TABLE dvds ADD COLUMN total_collection_price DECIMAL(15, 2);
                """)
                conn.commit()
                logging.info("Column 'total_collection_price' added to 'dvds' table.")
            else:
                logging.info("Column 'total_collection_price' already exists.")

            # Check if the currency column exists, if not, add it
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='dvds' AND column_name='currency';
            """)
            if not cursor.fetchone():
                cursor.execute("""
                    ALTER TABLE dvds ADD COLUMN currency VARCHAR(10);
                """)
                conn.commit()
                logging.info("Column 'currency' added to 'dvds' table.")
            else:
                logging.info("Column 'currency' already exists.")
                        # Check if the borrower_name column exists, if not, add it
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='dvds' AND column_name='borrower_name';
            """)
            if not cursor.fetchone():
                cursor.execute("""
                    ALTER TABLE dvds ADD COLUMN borrower_name VARCHAR(255);
                """)
                conn.commit()
                logging.info("Column 'borrower_name' added to 'dvds' table.")
            else:
                logging.info("Column 'borrower_name' already exists.")
            
            # Check if the lend_date column exists, if not, add it
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='dvds' AND column_name='lend_date';
            """)
            if not cursor.fetchone():
                cursor.execute("""
                    ALTER TABLE dvds ADD COLUMN lend_date DATE;
                """)
                conn.commit()
                logging.info("Column 'lend_date' added to 'dvds' table.")
            else:
                logging.info("Column 'lend_date' already exists.")

            # Check if the status column exists, if not, add it
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='dvds' AND column_name='status';
            """)
            if not cursor.fetchone():
                cursor.execute("""
                    ALTER TABLE dvds ADD COLUMN status VARCHAR(50) DEFAULT 'Available';
                """)
                conn.commit()
                logging.info("Column 'status' added to 'dvds' table.")
            else:
                logging.info("Column 'status' already exists.")    
            
            

def get_db_connection():
    try:
        return psycopg2.connect(
            host=os.getenv('DB_HOST'),
            dbname=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            port=os.getenv('DB_PORT')
        )
    except psycopg2.OperationalError as e:
        logging.error(f"Database connection failed: {e}")
        abort(500, description="Database connection failed")

def fetch_dvd_info(title):
    search_url = f"https://api.themoviedb.org/3/search/movie?api_key={API_KEY}&query={title}"
    response = requests.get(search_url)
    if response.status_code != 200:
        return None
    search_response = response.json()
    if not search_response.get('results'):
        return None

    first_result = search_response['results'][0]
    details_url = f"https://api.themoviedb.org/3/movie/{first_result['id']}?api_key={API_KEY}"
    details_response = requests.get(details_url).json()

    return {
        'title': details_response.get('title', 'N/A'),
        'genre': ', '.join(g['name'] for g in details_response.get('genres', [])),
        'tmdb_id': details_response['id'],
        'rating': details_response.get('vote_average', 0),
        'cover_url': f"https://image.tmdb.org/t/p/original{details_response.get('poster_path', '')}",
        'release_date': details_response.get('release_date', 'Unknown'),
        'description': details_response.get('overview', 'No description available.'),
        'runtime': details_response.get('runtime', 0),
        'status': 'Available',
        'media_type': None  # Set later
    }



# Export movies endpoint
@app.route('/export_movies', methods=['GET'])
def export_movies():
    format = request.args.get('format', 'json').lower()

    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM dvds")
        movies = cursor.fetchall()

        if not movies:
            return jsonify({"message": "No movies found"}), 404

        if format == 'json':
            return jsonify(movies)

        elif format == 'csv':
            output = StringIO()
            writer = csv.DictWriter(output, fieldnames=movies[0].keys())
            writer.writeheader()
            writer.writerows(movies)
            output.seek(0)
            return Response(output, mimetype='text/csv', headers={"Content-Disposition": "attachment;filename=movies.csv"})

        elif format == 'xml':
            root = ET.Element("Movies")
            for movie in movies:
                movie_element = ET.SubElement(root, "Movie")
                for key, value in movie.items():
                    ET.SubElement(movie_element, key).text = str(value)
            xml_str = ET.tostring(root, encoding='utf-8', method='xml').decode('utf-8')
            return Response(xml_str, mimetype='application/xml', headers={"Content-Disposition": "attachment;filename=movies.xml"})

        else:
            abort(400, description="Unsupported format. Use 'json', 'csv', or 'xml'.")

    except psycopg2.Error as e:
        logging.error(f"Database query failed: {e}")
        abort(500, description="Failed to retrieve movies from the database")
    finally:
        cursor.close()
        conn.close()

# Import movies endpoint
@app.route('/import_movies', methods=['POST'])
def import_movies():
    format = request.args.get('format', 'json').lower()
    if format not in ['json', 'csv', 'xml']:
        abort(400, description="Unsupported format. Use 'json', 'csv', or 'xml'.")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        if format == 'json':
            movies = request.json.get('movies')
            if not movies or not isinstance(movies, list):
                abort(400, description="Invalid JSON input data")

        elif format == 'csv':
            file = request.files.get('file')
            if not file:
                abort(400, description="CSV file is required")
            file_data = file.stream.read().decode("UTF-8")
            csv_data = csv.DictReader(StringIO(file_data))
            movies = list(csv_data)

        elif format == 'xml':
            file = request.files.get('file')
            if not file:
                abort(400, description="XML file is required")
            xml_data = ET.parse(file.stream)
            root = xml_data.getroot()
            movies = []
            for movie_element in root.findall('Movie'):
                movie = {elem.tag: elem.text for elem in movie_element}
                movies.append(movie)

        # Validate and insert movies into the database
        for movie in movies:
            if not movie.get('title') or not movie.get('tmdb_id'):
                logging.warning(f"Skipping movie with incomplete data: {movie}")
                continue  # Skip invalid entries

            cursor.execute("""
                INSERT INTO dvds (title, genre, tmdb_id, rating, cover_url, release_date, description, runtime, status, media_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (tmdb_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    genre = EXCLUDED.genre,
                    rating = EXCLUDED.rating,
                    cover_url = EXCLUDED.cover_url,
                    release_date = EXCLUDED.release_date,
                    description = EXCLUDED.description,
                    runtime = EXCLUDED.runtime,
                    status = EXCLUDED.status,
                    media_type = EXCLUDED.media_type;
            """, (
                movie.get('title'),
                movie.get('genre', 'Unknown'),
                movie.get('tmdb_id'),
                float(movie.get('rating', 0.0)),
                movie.get('cover_url', ''),
                movie.get('release_date', 'Unknown'),
                movie.get('description', 'No description available.'),
                int(movie.get('runtime', 0)),
                movie.get('status', 'Available'),
                movie.get('media_type', 'DVD')
            ))

        conn.commit()
        return jsonify({"message": "Movies imported successfully"}), 201

    except psycopg2.Error as e:
        logging.error(f"Failed to import movies: {e}")
        abort(500, description="Failed to import movies")
    finally:
        cursor.close()
        conn.close()



@app.route('/search_ebay', methods=['POST'])
def search_dvd():
    data = request.json
    dvd_title = data.get("title")

    conn = get_db_connection()
    cursor = conn.cursor()

    if dvd_title:
        # Handle single movie update
        cursor.execute("SELECT id, title, media_type FROM dvds WHERE title = %s", (dvd_title,))
        movies = cursor.fetchall()
    else:
        # Fetch all movies from the database
        cursor.execute("SELECT id, title, media_type FROM dvds")
        movies = cursor.fetchall()

    for movie in movies:
        movie_id = movie[0]
        title = movie[1]
        media_type = movie[2]

        # Combine title and media type for more accurate search results
        search_keywords = f"{title} {media_type}"

        api_endpoint = "https://svcs.ebay.com/services/search/FindingService/v1"
        app_id = EBAY_APP_ID

        headers = {
            "Content-Type": "application/json",
            "X-EBAY-SOA-OPERATION-NAME": "findItemsAdvanced",
            "X-EBAY-SOA-SECURITY-APPNAME": app_id,
            "X-EBAY-SOA-RESPONSE-DATA-FORMAT": "JSON"
        }

        params = {
            "keywords": search_keywords,
            "categoryId": "617",  # Category for DVDs
            "paginationInput.entriesPerPage": 100
        }

        try:
            response = requests.get(api_endpoint, headers=headers, params=params)
            response.raise_for_status()
            response_data = response.json()

            average_price_usd = calculate_average_price(response_data)
            currency = "USD"

            # Ensure that average_price_usd is properly formatted as a decimal number
            cursor.execute("""
                UPDATE dvds
                SET average_price = %s, currency = %s
                WHERE id = %s
            """, (float(average_price_usd), currency, movie_id))

            conn.commit()

            logging.info(f"Updated {title} ({media_type}): ${average_price_usd} {currency}")

        except requests.exceptions.RequestException as e:
            logging.error(f"Request to eBay API failed for {title} ({media_type}): {e}")
        except Exception as e:
            logging.error(f"Failed to update price for {title} ({media_type}): {e}")
            conn.rollback()  # Rollback the transaction in case of error

    cursor.close()
    conn.close()

    return jsonify({"message": "Prices updated"}), 200


def calculate_average_price(response_data):
    prices = []
    
    search_result = response_data["findItemsAdvancedResponse"][0].get("searchResult", [{}])[0]
    items = search_result.get("item", [])
    
    for item in items:
        current_price = float(item["sellingStatus"][0]["convertedCurrentPrice"][0]["__value__"])
        prices.append(current_price)
    
    if not prices:
        return 0.0

    # Convert prices list to a numpy array for easier calculation
    prices = np.array(prices)

    # Calculate the first and third quartile (Q1 and Q3)
    Q1 = np.percentile(prices, 25)
    Q3 = np.percentile(prices, 75)

    # Calculate the interquartile range (IQR)
    IQR = Q3 - Q1

    # Determine the bounds for outliers
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR

    # Filter out prices that are considered outliers
    filtered_prices = [price for price in prices if lower_bound <= price <= upper_bound]

    if filtered_prices:
        average_price = sum(filtered_prices) / len(filtered_prices)
    else:
        average_price = sum(prices) / len(prices)  # Fallback to mean of all prices if all are outliers

    return average_price

@app.route('/calculate_total_collection_price', methods=['POST'])
def calculate_total_collection_price():
    try:
        # Connect to the database
        conn = get_db_connection()
        cursor = conn.cursor()

        # Calculate the total collection price by summing all average prices
        cursor.execute("""
            SELECT SUM(average_price) 
            FROM dvds 
            WHERE average_price IS NOT NULL;
        """)
        total_collection_price = cursor.fetchone()[0] or 0.0  # If None, default to 0.0

        # Update the total_collection_price in the database (assuming this is stored in a single row or similar)
        cursor.execute("""
            UPDATE dvds 
            SET total_collection_price = %s;
        """, (total_collection_price,))

        conn.commit()
        cursor.close()
        conn.close()

        logging.info(f"Total collection price calculated: ${total_collection_price:.2f}")

        return jsonify({"total_collection_price": total_collection_price}), 200

    except Exception as e:
        logging.error(f"Failed to calculate total collection price: {e}")
        if conn:
            conn.rollback()  # Rollback the transaction in case of an error
        return jsonify({"error": "Failed to calculate total collection price"}), 500


@app.route('/movies', methods=['GET'])
def get_movies():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 100, type=int)
    offset = (page - 1) * limit
    
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute('''
                SELECT 
                    id, 
                    title, 
                    cover_url, 
                    genre, 
                    description, 
                    media_type, 
                    rating, 
                    release_date, 
                    runtime, 
                    status, 
                    borrower_name, 
                    lend_date, 
                    average_price, 
                    currency
                FROM dvds
                ORDER BY id
                LIMIT %s OFFSET %s;
            ''', (limit, offset))
            
            movies = cursor.fetchall()
            return jsonify(movies)



@app.route('/add_movie', methods=['POST'])
def add_movie():
    data = request.json or {}
    title = data.get('title')
    media_type = data.get('media_type')
    if not title or not media_type:
        abort(400, description="Title and media type are required.")

    movie_info = fetch_dvd_info(title)
    if not movie_info:
        abort(404, description="Movie not found in TMDB.")

    movie_info['media_type'] = media_type
    with get_db_connection() as conn, conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO dvds (title, genre, tmdb_id, rating, cover_url, release_date, description, runtime, status, media_type)
            VALUES (%(title)s, %(genre)s, %(tmdb_id)s, %(rating)s, %(cover_url)s, %(release_date)s, %(description)s, %(runtime)s, %(status)s, %(media_type)s)
            ON CONFLICT (tmdb_id) DO UPDATE SET
            title = EXCLUDED.title,
            genre = EXCLUDED.genre,
            rating = EXCLUDED.rating,
            cover_url = EXCLUDED.cover_url,
            release_date = EXCLUDED.release_date,
            description = EXCLUDED.description,
            runtime = EXCLUDED.runtime,
            status = EXCLUDED.status,
            media_type = EXCLUDED.media_type;
        """, movie_info)
        conn.commit()
        return jsonify({"message": "Movie added successfully"}), 201

@app.route('/update_movie/<int:movie_id>', methods=['PUT'])
def update_movie(movie_id):
    data = request.json
    with get_db_connection() as conn, conn.cursor() as cursor:
        # Build dynamic query based on provided fields
        fields = {
            'title': data.get('title'),
            'genre': data.get('genre'),
            'rating': data.get('rating'),
            'cover_url': data.get('cover_url'),
            'release_date': data.get('release_date'),
            'description': data.get('description'),
            'runtime': data.get('runtime'),
            'status': data.get('status'),
            'media_type': data.get('media_type')
        }
        query = "UPDATE dvds SET "
        query += ', '.join(f"{key} = %s" for key in fields if fields[key] is not None)
        query += " WHERE id = %s"
        values = [value for value in fields.values() if value is not None] + [movie_id]

        try:
            cursor.execute(query, values)
            conn.commit()
        except psycopg2.Error as e:
            logging.error(f"Failed to update movie: {e}")
            abort(500, description="Failed to update movie in the database")
        return jsonify({"message": "Movie updated successfully"}), 200


@app.route('/fix_metadata/<int:movie_id>', methods=['POST'])
def fix_metadata(movie_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("SELECT title FROM dvds WHERE id = %s", (movie_id,))
        movie = cursor.fetchone()
        if not movie:
            abort(404, description="Movie not found")
        
        # Fetch possible matches from TMDB
        matches = fetch_possible_matches(movie['title'])
        if not matches:
            abort(404, description="No metadata matches found on TMDB")
        
        return jsonify({"matches": matches}), 200
    
    except psycopg2.Error as e:
        logging.error(f"Failed to fix metadata: {e}")
        abort(500, description="Failed to fetch metadata matches")
    finally:
        cursor.close()
        conn.close()


def fetch_possible_matches(title):
    # TMDB API call to search for movies by title
    tmdb_api_key = API_KEY
    url = f"https://api.themoviedb.org/3/search/movie?api_key={tmdb_api_key}&query={title}"
    
    response = requests.get(url)
    if response.status_code != 200:
        return None
    
    results = response.json().get('results', [])
    matches = []
    for result in results:
        matches.append({
            'tmdb_id': result['id'],
            'title': result['title'],
            'genre': result.get('genre_ids', []),  # You may need to map genre IDs to genre names
            'release_date': result.get('release_date'),
            'description': result.get('overview'),
            'cover_url': f"https://image.tmdb.org/t/p/w500{result['poster_path']}" if result.get('poster_path') else None,
            'rating': result.get('vote_average')
        })
    
    return matches

@app.route('/update_metadata/<int:movie_id>', methods=['POST'])
def update_metadata(movie_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Extract the selected match data from the request body
        selected_match = request.json.get('selectedMatch')
        
        if not selected_match:
            abort(400, description="No metadata match selected")

        # Handle the release_date to ensure it's a valid date or null
        release_date = selected_match.get('release_date')
        if not release_date or release_date.strip() == '':
            release_date = None  # Set to None if the release date is invalid

        # Safely access all keys with a fallback to avoid KeyError
        cursor.execute("""
            UPDATE dvds
            SET title=%s, genre=%s, tmdb_id=%s, rating=%s, cover_url=%s, release_date=%s, description=%s, runtime=%s, status=%s
            WHERE id=%s
        """, (
            selected_match.get('title', 'Unknown Title'),  # Fallback to 'Unknown Title'
            selected_match.get('genre', 'Unknown Genre'),  # Fallback to 'Unknown Genre'
            selected_match.get('tmdb_id', None),  # Fallback to None
            selected_match.get('rating', 0),  # Fallback to 0
            selected_match.get('cover_url', ''),  # Fallback to empty string
            release_date,  # Already handled release_date
            selected_match.get('description', 'No description available.'),  # Fallback to default description
            selected_match.get('runtime', 0),  # Fallback to 0 if runtime is missing
            selected_match.get('status', 'Available'),  # Fallback to 'Available'
            movie_id
        ))
        conn.commit()
    except psycopg2.Error as e:
        logging.error(f"Failed to update metadata: {e}")
        abort(500, description="Failed to update metadata")
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "Metadata updated successfully"}), 200

@app.route('/delete_movie/<int:movie_id>', methods=['DELETE'])
def delete_movie(movie_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM dvds WHERE id = %s", (movie_id,))
        conn.commit()
    except psycopg2.Error as e:
        logging.error(f"Failed to delete movie: {e}")
        abort(500, description="Failed to delete movie from the database")
    finally:
        cursor.close()
        conn.close()
    
    return jsonify({"message": "Movie deleted successfully"}), 200

@app.route('/search_movies', methods=['GET'])
def search_movies():
    title = request.args.get('title')
    sort = request.args.get('sort', 'title')  # Default sort by title
    order = request.args.get('order', 'asc')  # Default order ascending

    if not title:
        abort(400, description="Search term is required")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    # Dynamic sorting based on the query parameters
    order_clause = 'ASC' if order == 'asc' else 'DESC'
    valid_sort_columns = ['title', 'release_date', 'rating']
    if sort not in valid_sort_columns:
        sort = 'title'

    try:
        query = f"""
            SELECT id, title, cover_url, genre, description, media_type, rating, release_date
            FROM dvds
            WHERE title ILIKE %s
            ORDER BY {sort} {order_clause}
        """
        cursor.execute(query, ('%' + title + '%',))
        movies = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(movies)
    except psycopg2.Error as e:
        logging.error(f"Failed to search movies: {e}")
        abort(500, description="Failed to search movies in the database")

@app.route('/search_advanced', methods=['POST'])
def search_advanced():
    data = request.json
    title = data.get('title')
    genre = data.get('genre')
    rating = data.get('rating')
    release_date = data.get('release_date')
    
    query = "SELECT id, title, cover_url, genre, description FROM dvds WHERE TRUE"
    params = []

    if title:
        query += " AND title ILIKE %s"
        params.append('%' + title + '%')
    if genre:
        query += " AND genre ILIKE %s"
        params.append('%' + genre + '%')
    if rating:
        query += " AND rating >= %s"
        params.append(rating)
    if release_date:
        query += " AND release_date = %s"
        params.append(release_date)
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute(query, tuple(params))
        movies = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(movies)
    except psycopg2.Error as e:
        logging.error(f"Failed to search movies: {e}")
        abort(500, description="Failed to perform advanced search in the database")

@app.route('/lend_movie/<int:movie_id>', methods=['POST'])
def lend_movie(movie_id):
    borrower_name = request.json.get('borrower_name')
    lend_date = request.json.get('lend_date')

    logging.info(f"Lending movie {movie_id} to {borrower_name} on {lend_date}")

    if not borrower_name or not lend_date:
        abort(400, description="Borrower name and lend date are required")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE dvds SET status='Lent', borrower_name=%s, lend_date=%s WHERE id=%s
        """, (borrower_name, lend_date, movie_id))
        conn.commit()
        logging.info(f"Movie {movie_id} lent successfully")
    except psycopg2.Error as e:
        logging.error(f"Failed to mark movie as lent: {e}")
        abort(500, description="Failed to mark movie as lent")
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "Movie lent successfully"}), 200

@app.route('/scan_barcode', methods=['POST'])
def scan_barcode():
    barcode_number = request.json.get('barcode')
    if not barcode_number:
        abort(400, description="Barcode number is required")

    try:
        ebay_titles = search_ebay_by_barcode(barcode_number)
        if not ebay_titles:
            logging.error(f"No results found on eBay for barcode {barcode_number}")
            return jsonify({"error": "Movie not found on eBay"}), 404

        # Try each title until a valid TMDB response is received
        for title in ebay_titles:
            cleaned_title = clean_title(title)
            tmdb_response = search_tmdb_by_title(cleaned_title)
            if tmdb_response:
                # Use TMDB title; fallback to cleaned_title if TMDB returns 'N/A' or is empty
                final_title = tmdb_response.get('title') or cleaned_title
                movie_id = add_movie_to_database(tmdb_response)
                return jsonify({
                    "message": "Movie added successfully",
                    "title": final_title,
                    "media_type": tmdb_response.get('media_type', 'Unknown format'),
                    "movie_id": movie_id
                }), 200
            else:
                logging.debug(f"TMDB search failed for cleaned title: {cleaned_title}")

        logging.error(f"TMDB search failed for all titles derived from barcode {barcode_number}")
        return jsonify({"error": "Movie not found on TMDB for any derived titles"}), 404

    except Exception as e:
        logging.error(f"Error scanning barcode: {e}")
        return jsonify({"error": "Failed to scan barcode"}), 500



def search_ebay_by_barcode(barcode_number):
    api_endpoint = "https://svcs.ebay.com/services/search/FindingService/v1"
    app_id = EBAY_APP_ID
    entries_per_page = "10"  # Fetch more entries for better analysis

    params = {
        "OPERATION-NAME": "findItemsByKeywords",
        "SERVICE-VERSION": "1.0.0",
        "SECURITY-APPNAME": app_id,
        "RESPONSE-DATA-FORMAT": "JSON",
        "keywords": barcode_number,
        "paginationInput.entriesPerPage": entries_per_page,
    }

    titles = []
    try:
        response = requests.get(api_endpoint, params=params)
        response.raise_for_status()
        response_data = response.json()

        # Parse the eBay response to collect possible titles
        items = response_data.get('findItemsByKeywordsResponse', [{}])[0].get('searchResult', [{}])[0].get('item', [])
        for item in items:
            title = item.get('title', [])
            if isinstance(title, list):
                titles.extend(title)  # Extend the flat list with elements of the sublist
            else:
                titles.append(title)  # Append the title as a string
    except requests.exceptions.RequestException as e:
        logging.error(f"Request to eBay API failed: {e}")

    return titles


def extract_movie_title(titles):
    if not isinstance(titles, list) or not all(isinstance(title, str) for title in titles):
        raise ValueError("titles should be a list of strings")
    cleaned_titles = [clean_title(title) for title in titles]
    if not cleaned_titles:
        return None
    best_match = process.extractOne(' '.join(cleaned_titles), cleaned_titles)
    if best_match:
        title, _ = best_match  # Ensure that best_match is unpacked correctly
        if not isinstance(title, str):
            raise ValueError("extracted title should be a string")
        return title
    return None


def clean_title(title):
    title = re.sub(r'[\(\[].*?[\)\]]', '', title)  # Remove any parentheses and their contents
    title = re.sub(r'Region\s*\d+', '', title, flags=re.IGNORECASE)  # Remove region codes
    title = re.sub(r'(DVD|Blu-ray|BR|4K|UHD|PAL|NTSC)', '', title, flags=re.IGNORECASE)  # Remove format descriptions
    title = re.split(r'[\-:]', title)[0]  # Split on hyphen or colon and take the first part
    return title.strip()  # Trim whitespace



def search_tmdb_by_title(title):
    # Ensure the title is properly formatted
    if isinstance(title, list):
        title = title[0]

    # Remove anything in parentheses or square brackets
    title = re.sub(r'[\(\[].*?[\)\]]', '', title).strip()

    # Remove region codes (e.g., "Region 4") and other common irrelevant details
    title = re.sub(r'Region\s*\d+', '', title, flags=re.IGNORECASE)
    title = re.sub(r'(DVD|Blu-ray|BR|4K|UHD|PAL|NTSC)', '', title, flags=re.IGNORECASE)

    # Remove any actors' names or extra information that often follows a hyphen
    title = title.split('-')[0].strip()

    # Remove genre descriptions or keyword-like strings that may follow the main title
    title = title.split(':')[0].strip()  # Removes any subtitle after a colon, if present

    # Remove any non-alphanumeric characters except spaces
    title = re.sub(r'[^a-zA-Z0-9\s]', '', title).strip()

    # Clean up any extra spaces
    title = re.sub(r'\s+', ' ', title).strip()

    logging.info(f"Searching TMDB for title: {title}")

    # Construct the search URL
    search_url = f"https://api.themoviedb.org/3/search/movie?api_key={API_KEY}&query={title}"
    response = requests.get(search_url)

    if response.status_code != 200:
        logging.error(f"TMDB search failed with status code {response.status_code}")
        return None

    search_response = response.json()

    if not search_response.get('results'):
        logging.error(f"TMDB search failed for title {title}")
        return None

    first_result = search_response['results'][0]
    details_url = f"https://api.themoviedb.org/3/movie/{first_result['id']}?api_key={API_KEY}"
    details_response = requests.get(details_url).json()

    return {
        'title': details_response.get('title', 'N/A'),
        'genre': ', '.join(g['name'] for g in details_response.get('genres', [])),
        'tmdb_id': details_response['id'],
        'rating': details_response.get('vote_average', 0),
        'cover_url': f"https://image.tmdb.org/t/p/original{details_response.get('poster_path', '')}",
        'release_date': details_response.get('release_date', 'Unknown'),
        'description': details_response.get('overview', 'No description available.'),
        'runtime': details_response.get('runtime', 0),
        'status': 'Available',
        'media_type': None  # Set later
    }

def add_movie_to_database(movie_info):
    with get_db_connection() as conn, conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO dvds (title, genre, tmdb_id, rating, cover_url, release_date, description, runtime, status, media_type)
            VALUES (%(title)s, %(genre)s, %(tmdb_id)s, %(rating)s, %(cover_url)s, %(release_date)s, %(description)s, %(runtime)s, %(status)s, %(media_type)s)
            ON CONFLICT (tmdb_id) DO UPDATE SET
                title = EXCLUDED.title,
                genre = EXCLUDED.genre,
                rating = EXCLUDED.rating,
                cover_url = EXCLUDED.cover_url,
                release_date = EXCLUDED.release_date,
                description = EXCLUDED.description,
                runtime = EXCLUDED.runtime,
                status = EXCLUDED.status,
                media_type = EXCLUDED.media_type
            RETURNING id;
        """, movie_info)
        conn.commit()
        return cursor.fetchone()[0]


@app.route('/save_settings', methods=['POST'])
def save_settings():
    settings = request.json
    try:
        # Define the path to the settings.json file using dynamic path resolution
        json_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'settings.json')
        
        # Save the settings to the file
        with open(json_file_path, 'w') as settings_file:
            json.dump(settings, settings_file)
        
        # Log the path of the saved file
        logging.info(f"Settings saved to: {json_file_path}")
        
        return jsonify({"message": "Settings saved successfully"}), 200
    except Exception as e:
        logging.error(f"Error saving settings: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/load_settings', methods=['GET'])
def load_settings():
    try:
        # Define the path to the settings.json file using dynamic path resolution
        json_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'settings.json')
        
        # Load the settings from the file
        with open(json_file_path, 'r') as settings_file:
            settings = json.load(settings_file)
        
        # Log the path of the loaded file
        logging.info(f"Settings loaded from: {json_file_path}")
        
        return jsonify(settings), 200
    except Exception as e:
        logging.error(f"Error loading settings: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/return_movie/<int:movie_id>', methods=['POST'])
def return_movie(movie_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE dvds SET status='Available', borrower_name=NULL, lend_date=NULL WHERE id=%s
        """, (movie_id,))
        conn.commit()
    except psycopg2.Error as e:
        logging.error(f"Failed to mark movie as returned: {e}")
        abort(500, description="Failed to mark movie as returned")
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "Movie returned successfully"}), 200

@app.route('/lent_movies', methods=['GET'])
def lent_movies():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("SELECT id, title, borrower_name, lend_date FROM dvds WHERE status='Lent'")
        movies = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(movies)
    except psycopg2.Error as e:
        logging.error(f"Failed to fetch lent movies: {e}")
        abort(500, description="Failed to fetch lent movies")

@app.route('/generate_report', methods=['GET'])
def generate_report():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("""
            SELECT genre, COUNT(*) AS count, AVG(rating) AS avg_rating
            FROM dvds
            GROUP BY genre
            ORDER BY count DESC;
        """)
        report = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(report)
    except psycopg2.Error as e:
        logging.error(f"Failed to generate report: {e}")
        abort(500, description="Failed to generate report")


# Ensuring database constraints are set correctly
ensure_db_constraints()

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition'
    return response

@app.route('/')
def index():
    return jsonify({
        'status': 'CollectFlix API Running',
        'endpoints': ['/export_movies', '/import_movies', '/search_ebay']
    })

if __name__ == '__main__':
    from waitress import serve
    serve(app, host='0.0.0.0', port=5500)
