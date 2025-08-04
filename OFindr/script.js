// When the user submits the form
document.querySelector('form').addEventListener('submit', function (event) {
    event.preventDefault();  // Prevent the default form submission

    // Get the search query from the input field
    const query = document.querySelector('input[name="q"]').value;

    // Clear the results section before starting the new search
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '<p>Loading results...</p>';

    // Send a GET request to the backend (replace with your backend URL)
    fetch(`https://your-backend-url.com/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())  // Assuming your backend returns JSON data
        .then(data => {
            // If no results, show a "No results" message
            if (data.length === 0) {
                resultsContainer.innerHTML = '<p>No models found for your search.</p>';
                return;
            }

            // Otherwise, loop through the data and display each result
            resultsContainer.innerHTML = '';  // Clear "Loading" message
            data.forEach(model => {
                const resultDiv = document.createElement('div');
                resultDiv.classList.add('result');

                // Create a link for each model
                const resultLink = document.createElement('a');
                resultLink.href = model.profile_url;
                resultLink.textContent = model.name;
                
                // Append the link to the result div
                resultDiv.appendChild(resultLink);
                resultsContainer.appendChild(resultDiv);
            });
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            resultsContainer.innerHTML = '<p>There was an error while fetching the data.</p>';
        });
});
