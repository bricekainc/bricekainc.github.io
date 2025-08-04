document.getElementById('searchForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Prevent default form submission

    const query = document.getElementById('searchInput').value;
    if (!query) {
        return alert('Please enter a search query!');
    }

    // Send search query to Flask backend
    fetch(`https://ofindr.onrender.com/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '';  // Clear previous results

            if (data.length === 0) {
                resultsDiv.innerHTML = 'No models found.';
            } else {
                data.forEach(model => {
                    const modelElement = document.createElement('div');
                    modelElement.innerHTML = `
                        <p><strong>${model.name}</strong></p>
                        <a href="${model.profile_url}" target="_blank">View Profile</a>
                    `;
                    resultsDiv.appendChild(modelElement);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching search results:', error);
            document.getElementById('results').innerHTML = 'An error occurred while fetching results.';
        });
});
