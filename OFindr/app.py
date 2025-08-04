import os
from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup

# Create Flask app
app = Flask(__name__)

# Route to handle search requests
@app.route('/search', methods=['GET'])
def search():
    # Get the search query from the request
    query = request.args.get('q')

    # If no query is provided, return an empty list
    if not query:
        return jsonify([])

    # Construct the URL for DudJob search page
    search_url = f"https://dudjob.com/onlyfans-search?q={query}"

    # Send a GET request to DudJob's search page
    try:
        response = requests.get(search_url)
        response.raise_for_status()  # Check for request errors
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to fetch data from DudJob: {str(e)}"}), 500

    # Parse the HTML content with BeautifulSoup
    soup = BeautifulSoup(response.text, 'html.parser')

    # List to store model names and their profile URLs
    models = []

    # Example: Find model divs (Update the class as needed based on the actual page structure)
    for model_div in soup.find_all('div', class_='model-class'):  # Replace with actual class
        model_name = model_div.find('h3').text.strip()  # Update based on page structure
        profile_url = model_div.find('a')['href'] if model_div.find('a') else ''
        
        # Append model data to list
        models.append({
            'name': model_name,
            'profile_url': profile_url
        })

    # Return the models as a JSON response
    return jsonify(models)


# Start the Flask app
if __name__ == '__main__':
    # Make sure the app listens on port and host for Render
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
