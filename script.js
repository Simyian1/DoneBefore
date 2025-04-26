// script.js

// 1. Grab your DOM elements
const inputEl   = document.getElementById('search-input');
const buttonEl  = document.getElementById('search-button');
const generalEl = document.getElementById('general-results');
const patentEl  = document.getElementById('patent-results');
const ipEl      = document.getElementById('ip-results');

// 2. On button click, validate and launch all three searches
buttonEl.addEventListener('click', () => {
  const rawQuery = inputEl.value.trim();
  if (!rawQuery) {
    alert('Please enter some keywords before searching!');
    return;
  }

  // Clear previous results & kick off searches
  [generalEl, patentEl, ipEl].forEach(el => el.innerHTML = '');
  runWebSearch(rawQuery, generalEl, /*siteFilter=*/ '');
  runWebSearch(rawQuery, patentEl,  'site:patents.google.com');
  runIPSearch(rawQuery, ipEl);
});


/**
 * runWebSearch → Google CSE for general or patent results
 */
function runWebSearch(rawQuery, containerEl, siteFilter) {
  const q = siteFilter
    ? `${rawQuery} ${siteFilter}`
    : rawQuery;

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', 'AIzaSyAsc1x4UdiiFbVqZtojJeQkl9nMvin4sgc');
  url.searchParams.set('cx',  '9752e413fdc3d4d91');
  url.searchParams.set('q',   q);
  url.searchParams.set('num', '10');

  containerEl.textContent = 'Loading…';
  fetch(url)
    .then(r => r.json().then(data => {
      if (!r.ok) throw new Error(data.error?.message || r.statusText);
      return data.items || [];
    }))
    .then(items => {
      containerEl.innerHTML = '';
      if (items.length === 0) {
        containerEl.textContent = 'No results found.';
        return;
      }

      // split your rawQuery into keywords
      const kws = rawQuery.toLowerCase().split(/\s+/);
      items.forEach(item => {
        const text = (item.title + ' ' + item.snippet).toLowerCase();
        const matched = kws.filter(k => text.includes(k)).length;
        const similarity = (matched / kws.length) * 100;

        const card = document.createElement('div');
        card.className = 'result-item';

        // Title + link
        const h3 = document.createElement('h3');
        h3.innerHTML = `<a href="${item.link}" target="_blank" rel="noopener">${item.title}</a>`;
        card.appendChild(h3);

        // URL
        card.innerHTML += `<span class="url">${item.link}</span>`;

        // Similarity
        card.innerHTML += `<p class="match">Similarity: ${similarity.toFixed(1)}%</p>`;

        // Snippet
        card.innerHTML += `<p class="snippet">${item.snippet}</p>`;

        containerEl.appendChild(card);
      });
    })
    .catch(err => {
      containerEl.textContent = `Error: ${err.message}`;
      console.error(err);
    });
}


/**
 * runIPSearch → USPTO Trademark API
 * Docs: https://developer.uspto.gov/data/bulk-search#/trademarks
 */
function runIPSearch(rawQuery, containerEl) {
  // Build a Trademark search against the USPTO IBD API
  const endpoint = 'https://developer.uspto.gov/ibd-api/v1/trademark';
  const params = new URLSearchParams({
    searchText: rawQuery,
    rows:       '10',
    start:      '0'
  }).toString();

  containerEl.textContent = 'Loading…';
  fetch(`${endpoint}?${params}`)
    .then(r => r.json())
    .then(data => {
      containerEl.innerHTML = '';
      const items = data.response?.docs || [];
      if (items.length === 0) {
        containerEl.textContent = 'No IP (trademark) results found.';
        return;
      }

      // split your rawQuery into keywords
      const kws = rawQuery.toLowerCase().split(/\s+/);

      items.forEach(doc => {
        // title is the mark name, snippet use goodsServicesDescription
        const title = doc.markLiteral || '<Unnamed>';
        const desc  = doc.goodsServicesDescription || '';
        const text  = (title + ' ' + desc).toLowerCase();
        const matched = kws.filter(k => text.includes(k)).length;
        const similarity = (matched / kws.length) * 100;

        const card = document.createElement('div');
        card.className = 'result-item';

        // Title & Registration Number
        const h3 = document.createElement('h3');
        h3.innerHTML = `
          <a href="https://tsdrapi.uspto.gov/ts/cd/case/${doc.registrationNumber}" 
             target="_blank" rel="noopener">
            ${title}
          </a>
          <small>Reg#: ${doc.registrationNumber || 'N/A'}</small>
        `;
        card.appendChild(h3);

        // Owner
        if (doc.markOwnerName) {
          card.innerHTML += `<p><strong>Owner:</strong> ${doc.markOwnerName}</p>`;
        }

        // Similarity
        card.innerHTML += `<p class="match">Similarity: ${similarity.toFixed(1)}%</p>`;

        // Goods/Services snippet
        card.innerHTML += `<p class="snippet">${desc}</p>`;

        containerEl.appendChild(card);
      });
    })
    .catch(err => {
      containerEl.textContent = `Error: ${err.message}`;
      console.error(err);
    });
}
