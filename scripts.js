document.getElementById('search-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const query = document.getElementById('search-query').value;
  fetchSearchResults(query);
});

async function fetchSearchResults(query) {
  const apiKey = 'AIzaSyDI2nJOzKpPd74NeLnm3tGBDGSLU00X-44';
  const searchEngineId = '726043605d5c7476d';
  const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    processSearchResults(data);
  } catch (error) {
    console.error('Error fetching search results:', error);
  }
}

function processSearchResults(data) {
  const items = data.items || [];
  if (!items.length) {
    console.log('No results found');
    return;
  }

  const resultsData = items.map(item => ({
    title: item.title,
    snippet: item.snippet,
    link: item.link,
    displayLink: item.displayLink
  }));
  visualizeData(resultsData);
}

function visualizeData(resultsData) {
  const domainCounts = {};
  resultsData.forEach(item => {
    const domain = item.displayLink;
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  });

  const labels = Object.keys(domainCounts);
  const counts = Object.values(domainCounts);

  if (!labels.length) {
    console.log('No data available for visualization');
    return;
  }

  const ctx = document.getElementById('chart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Domain Frequency',
        data: counts,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
    