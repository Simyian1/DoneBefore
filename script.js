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
  runWebSearch(rawQuery, generalEl, /*general=*/ '');
  runWebSearch(rawQuery, patentEl,  /*patents=*/ 'site:patents.google.com');
  runIPSearch(rawQuery, ipEl);  // trademarks via public directories
});


/**
 * runWebSearch → Google CSE for a given siteFilter
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
      if (!items.length) {
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
        card.innerHTML = `
          <h3><a href="${item.link}" target="_blank" rel="noopener">${item.title}</a></h3>
          <span class="url">${item.link}</span>
          <p class="match">Keyword Map: ${similarity.toFixed(1)}%</p>
          <p class="snippet">${item.snippet}</p>
        `;
        containerEl.appendChild(card);
      });
    })
    .catch(err => {
      containerEl.textContent = `Error: ${err.message}`;
      console.error(err);
    });
}


/**
 * runIPSearch → trademark/IP via Google CSE on public directories
 */
function runIPSearch(rawQuery, containerEl) {
  // use site filters for popular trademark directories
  const trademarkSites = [
    'site:trademarkia.com',
    'site:trademarks.justia.com',
    'site:uspto.gov/trademarks'
  ].join(' OR ');

  // delegate back to runWebSearch
  runWebSearch(rawQuery, containerEl, trademarkSites);
}
