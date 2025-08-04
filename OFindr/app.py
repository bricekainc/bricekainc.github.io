import requests
from flask import Flask, render_template, request, jsonify
from bs4 import BeautifulSoup

app = Flask(__name__)

# Route for the home page
@app.route('/')
def home():
    return render_template('index.html')

# Route for the search functionality
@app.route('/search')
def search():
    query = request.args.get('q', '').strip()
    
    if not query:
        return jsonify({"error": "No query provided"}), 400

    # Get search results from all sites
    results = search_all_sites(query)
    
    # Find the best result (this could be based on relevance, ranking, or a simple criteria)
    best_result = get_best_result(results)
    
    return jsonify(best_result)

# Function to search all the websites
def search_all_sites(query):
    results = []

    # List of search functions for each site
    search_functions = [
        search_dudjob,
        search_fansmetrics,
        search_juicysearch,
        search_subseeker
    ]

    # Get results from each site
    for search_function in search_functions:
        results.extend(search_function(query))
    
    return results

# Function to get the best result (this could be based on different factors like relevance, ranking, etc.)
def get_best_result(results):
    if not results:
        return {"error": "No results found"}
    
    # Example of sorting by name or any other criteria you prefer
    best_result = sorted(results, key=lambda x: x['name'].lower())[0]  # Just as an example, sorting alphabetically
    return best_result

# Function to search on DudJob
def search_dudjob(query):
    try:
        url = f"https://dudjob.com/onlyfans-search?q={query}"
        response = requests.get(url)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            results = []
            for model in soup.find_all('div', class_='model'):
                model_name = model.find('a', class_='model-name').text.strip()
                results.append({"name": model_name, "source": "DudJob", "url": url})
            return results
    except Exception as e:
        print(f"Error during DudJob search: {str(e)}")
    return []

# Function to search on FansMetrics
def search_fansmetrics(query):
    try:
        url = f"https://fansmetrics.com/search/{query}"
        response = requests.get(url)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            results = []
            for model in soup.find_all('div', class_='model-info'):
                model_name = model.find('a').text.strip()
                results.append({"name": model_name, "source": "FansMetrics", "url": url})
            return results
    except Exception as e:
        print(f"Error during FansMetrics search: {str(e)}")
    return []

# Function to search on JuicySearch
def search_juicysearch(query):
    try:
        url = f"https://juicysearch.com/results/?q={query}"
        response = requests.get(url)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            results = []
            for model in soup.find_all('div', class_='result-item'):
                model_name = model.find('h3').text.strip()
                results.append({"name": model_name, "source": "JuicySearch", "url": url})
            return results
    except Exception as e:
        print(f"Error during JuicySearch search: {str(e)}")
    return []

# Function to search on SubSeeker
def search_subseeker(query):
    try:
        url = f"https://subseeker.co/search?q={query}"
        response = requests.get(url)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            results = []
            for model in soup.find_all('div', class_='profile'):
                model_name = model.find('h4').text.strip()
                results.append({"name": model_name, "source": "SubSeeker", "url": url})
            return results
    except Exception as e:
        print(f"Error during SubSeeker search: {str(e)}")
    return []

if __name__ == '__main__':
    app.run(debug=True)
