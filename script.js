// script.js

const inputEl   = document.getElementById('search-input');
const buttonEl  = document.getElementById('search-button');
const resultsEl = document.getElementById('results');

buttonEl.addEventListener('click', () => {
  const rawQuery = inputEl.value;
  if (!rawQuery.trim()) {
    alert('Please enter some keywords before searching!');
    return;
  }
  performSearch(rawQuery);
});

function performSearch(rawQuery) {
  // 1) clear old results
  resultsEl.innerHTML = '';

  // 2) prepare query for URL
  const query  = encodeURIComponent(rawQuery.trim());
  const apiKey = 'AIzaSyAsc1x4UdiiFbVqZtojJeQkl9nMvin4sgc';
  const cxId   = '9752e413fdc3d4d91';
  const url    = `https://www.googleapis.com/customsearch/v1?key=${apiKey}`
               + `&cx=${cxId}`
               + `&q=${query}`;

  // 3) show a “loading” message
  const loading = document.createElement('p');
  loading.textContent = 'Searching…';
  resultsEl.appendChild(loading);

  fetch(url)
    .then(async response => {
      const payload = await response.json();
      if (!response.ok) {
        console.error('Google API error detail:', payload.error);
        throw new Error(`Google API Error ${payload.error.code}: ${payload.error.message}`);
      }
      return payload;
    })
    .then(data => {
      // remove “Searching…”
      resultsEl.innerHTML = '';

      const items        = data.items || [];
      const totalResults = data.searchInformation?.totalResults || '0';

      // show total hits
      const header = document.createElement('p');
      header.innerHTML = `<strong>Total hits:</strong> ${totalResults} — showing ${items.length} results below`;
      resultsEl.appendChild(header);

      items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'result-item';

        // title + link
        const h3 = document.createElement('h3');
        const a  = document.createElement('a');
        a.href       = item.link;
        a.text       = item.title;
        a.target     = '_blank';
        a.rel        = 'noopener';
        h3.appendChild(a);
        card.appendChild(h3);

        // URL
        const urlSpan = document.createElement('span');
        urlSpan.className = 'url';
        urlSpan.textContent = item.link;
        card.appendChild(urlSpan);

        // compute match %
        const title   = item.title.toLowerCase();
        const snippet = item.snippet.toLowerCase();
        const keyword = rawQuery.toLowerCase().trim();
        const matchesInTitle   = (title.match(new RegExp(keyword, 'gi')) || []).length;
        const matchesInSnippet = (snippet.match(new RegExp(keyword, 'gi')) || []).length;
        const totalWords       = title.split(/\s+/).length + snippet.split(/\s+/).length;
        const percentMatch     = totalWords
                                  ? ((matchesInTitle + matchesInSnippet) / totalWords) * 100
                                  : 0;

        const matchP = document.createElement('p');
        matchP.className = 'match';
        matchP.textContent = `Match: ${percentMatch.toFixed(1)}%`;
        card.appendChild(matchP);

        // snippet
        const snippetP = document.createElement('p');
        snippetP.className = 'snippet';
        snippetP.textContent = item.snippet;
        card.appendChild(snippetP);

        resultsEl.appendChild(card);
      });

      if (items.length === 0) {
        const none = document.createElement('p');
        none.textContent = 'No results found.';
        resultsEl.appendChild(none);
      }
    })
    .catch(err => {
      resultsEl.innerHTML = '';
      console.error('Search error caught:', err);
      const errP = document.createElement('p');
      errP.textContent = `Search failed: ${err.message}`;
      resultsEl.appendChild(errP);
    });
}
