document.getElementById('searchForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const query = document.getElementById('searchInput').value;
    
    if (!query) {
        alert("Please enter a search query.");
        return;
    }
    
    fetch(`/search?q=${query}`)
        .then(response => response.json())
        .then(data => {
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '';
            
            if (data.error) {
                resultsDiv.innerHTML = `<p>${data.error}</p>`;
            } else {
                const resultItem = document.createElement('div');
                resultItem.classList.add('result-item');
                resultItem.innerHTML = `
                    <strong>${data.name}</strong><br>
                    <a href="${data.url}" target="_blank">Visit Profile</a>
                `;
                resultsDiv.appendChild(resultItem);
            }
        })
        .catch(err => {
            console.error(err);
            alert("An error occurred. Please try again later.");
        });
});
