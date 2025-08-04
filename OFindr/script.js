// Handle the form submission
document.getElementById("searchForm").addEventListener("submit", function(event) {
    event.preventDefault();  // Prevent page reload

    const query = document.getElementById("searchInput").value;
    const resultsContainer = document.getElementById("search-results");

    resultsContainer.innerHTML = "<p>Loading results...</p>";

    // Fetch data from the backend (replace with actual backend URL)
    fetch(`https://your-backend-url.com/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                resultsContainer.innerHTML = "<p>No models found for your search.</p>";
            } else {
                resultsContainer.innerHTML = "";
                data.forEach(model => {
                    const resultDiv = document.createElement("div");
                    resultDiv.classList.add("result");

                    const resultLink = document.createElement("a");
                    resultLink.href = model.profile_url;
                    resultLink.textContent = model.name;

                    resultDiv.appendChild(resultLink);
                    resultsContainer.appendChild(resultDiv);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            resultsContainer.innerHTML = "<p>Error fetching results.</p>";
        });
});
