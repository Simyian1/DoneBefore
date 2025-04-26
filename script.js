// script.js

// 1. Grab references to the DOM elements
const inputEl  = document.getElementById('search-input');
const buttonEl = document.getElementById('search-button');

// 2. Attach a click‐event listener to our button
buttonEl.addEventListener('click', () => {
  // 2a. Read the current value of the input field
  const rawQuery = inputEl.value;

  // 2b. Quick check: make sure it's not empty
  if (!rawQuery.trim()) {
    alert('Please enter some keywords before searching!');
    return;
  }

  // 2c. Kick off your search routine, passing the raw text
  performSearch(rawQuery);
});

// 3. performSearch: hits Google Custom Search API, parses results
function performSearch(rawQuery) {
  const query = encodeURIComponent(rawQuery.trim());
  const apiKey = 'AIzaSyAsc1x4UdiiFbVqZtojJeQkl9nMvin4sgc';
  const cxId   = '9752e413fdc3d4d91';
  const url    = `https://www.googleapis.com/customsearch/v1?key=${apiKey}`
               + `&cx=${cxId}`
               + `&q=${query}`;

  fetch(url)
    .then(async response => {
      const payload = await response.json();   // attempt to parse JSON
      if (!response.ok) {
        // Log the full error object that Google returns
        console.error('Google API error detail:', payload.error);
        throw new Error(`Google API Error ${payload.error.code}: ${payload.error.message}`);
      }
      return payload;
    })
    .then(data => {
      const items = data.items || [];
      const totalResults = data.searchInformation.totalResults || '0';

      console.log(`Total hits reported by Google: ${totalResults}`);
      console.log(`Number of items in this batch: ${items.length}`);

      // 3e. Compute a “keyword match” percentage per result
      items.forEach(item => {
        const title   = item.title.toLowerCase();
        const snippet = item.snippet.toLowerCase();
        const keyword = rawQuery.toLowerCase().trim();

        // Count matches in title & snippet
        const matchesInTitle   = (title.match(new RegExp(keyword, 'gi')) || []).length;
        const matchesInSnippet = (snippet.match(new RegExp(keyword, 'gi')) || []).length;
        const totalWords       = title.split(/\s+/).length + snippet.split(/\s+/).length;
        const percentMatch     = totalWords
                                  ? ((matchesInTitle + matchesInSnippet) / totalWords) * 100
                                  : 0;

        console.log(
          `Result: "${item.title}" → match ≈ ${percentMatch.toFixed(1)}%`
        );
      });

      // 3f. TODO: Extend with companies, patents, marketing links…
    })
    .catch(err => {
      console.error('Search error caught:', err);
      alert(`Search failed: ${err.message}`);
    });
}

