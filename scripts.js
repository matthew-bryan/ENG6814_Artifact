// scripts.js

document.getElementById('search-form').addEventListener('submit', function(e) {
  e.preventDefault();

  // Get form values
  const query = document.getElementById('search-query').value;
  const numResults = parseInt(document.getElementById('num-results').value, 10);
  const exactMatch = document.getElementById('exact-match').checked;
  const dateRestrict = document.getElementById('date-filter').value;
  const domainFilter = document.getElementById('domain-filter').value.trim();

  fetchSearchResults({ query, numResults, exactMatch, dateRestrict, domainFilter });
});

const stopWords = [
'the', 'and', 'a', 'to', 'of', 'in', 'for', 'is', 'on', 'that', 'with',
  'as', 'by', 'at', 'from', 'it', 'this', 'an', 'be', 'or', 'are', 'was',
  'but', 'not', 'we', 'you', 'your', 'have', 'has', 'will', 'can', 'if',
  'about', 'more', 'our', 'so', 'what', 'when', 'which', 'their', 'they',
  'all', 'there', 'been', 'also', 'into', 'do', 'up', 'out', 'who', 'no',
  'he', 'she', 'her', 'his', 'them', 'one', 'some', 'could', 'would',
  'should', 'may', 'like', 'just', 'over', 'then', 'now', 'how', 'get'];

async function fetchSearchResults({ query, numResults, exactMatch, dateRestrict, domainFilter }) {
  const apiKey = 'AIzaSyDI2nJOzKpPd74NeLnm3tGBDGSLU00X-44'; // Replace with your actual API key
  const searchEngineId = '726043605d5c7476d'; // Replace with your actual Search Engine ID
  const resultsPerPage = 10;
  let allItems = [];

  // Adjust the query for exact match
  let searchQuery = exactMatch ? `"${query}"` : query;

  // Apply domain filter
  if (domainFilter) {
    // Ensure domainFilter starts with '.'
    const domain = domainFilter.startsWith('.') ? domainFilter : `.${domainFilter}`;
    searchQuery += ` site:*${domain}`;
  }

  // Prepare additional parameters
  const additionalParams = new URLSearchParams();
  if (dateRestrict) {
    additionalParams.append('dateRestrict', dateRestrict);
  }

  // Calculate the number of pages to fetch
  const pages = Math.ceil(numResults / resultsPerPage);

  // Show a loading message or spinner
  const resultsContainer = document.getElementById('results-container');
  resultsContainer.innerHTML = '<p>Loading results...</p>';

  for (let i = 0; i < pages; i++) {
    const startIndex = i * resultsPerPage + 1;
    const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}` +
      `&cx=${searchEngineId}&q=${encodeURIComponent(searchQuery)}` +
      `&start=${startIndex}` +
      `&${additionalParams.toString()}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.items) {
        allItems = allItems.concat(data.items);
      } else {
        console.log('No more results found.');
        break;
      }

      // Check if we have enough results
      if (allItems.length >= numResults) {
        allItems = allItems.slice(0, numResults);
        break;
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
      break;
    }
  }

  // Process the collected results
  processSearchResults({ items: allItems });
}

function processSearchResults(data) {
  const items = data.items || [];
  if (!items.length) {
    console.log('No results found');
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '<p>No results found.</p>';
    clearVisualizations();
    return;
  }

  const resultsData = items.map(item => ({
    title: item.title,
    snippet: item.snippet,
    link: item.link,
    displayLink: item.displayLink
  }));

  // Display the search results
  displaySearchResults(resultsData);

  const titleWords = [];
  const snippetWords = [];
  const displayLinks = [];

  resultsData.forEach(item => {
    titleWords.push(...extractWords(item.title));
    snippetWords.push(...extractWords(item.snippet));
    displayLinks.push(item.displayLink);
  });

  visualizeData({
    titleWords,
    snippetWords,
    displayLinks
  });
}

// Function to display search results
function displaySearchResults(resultsData) {
  const resultsContainer = document.getElementById('results-container');
  resultsContainer.innerHTML = ''; // Clear previous results

  resultsData.forEach(item => {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'search-result';

    // Title with link
    const title = document.createElement('h3');
    const titleLink = document.createElement('a');
    titleLink.href = item.link;
    titleLink.target = '_blank'; // Open in new tab
    titleLink.textContent = item.title;
    title.appendChild(titleLink);

    // Display link (URL)
    const displayLink = document.createElement('div');
    displayLink.className = 'display-link';
    displayLink.textContent = item.displayLink;

    // Snippet
    const snippet = document.createElement('p');
    snippet.textContent = item.snippet;

    // Append elements to the result div
    resultDiv.appendChild(title);
    resultDiv.appendChild(displayLink);
    resultDiv.appendChild(snippet);

    // Append result div to the results container
    resultsContainer.appendChild(resultDiv);
  });

  // Add attribution as per Google's requirements
  addAttribution(resultsContainer);
}

// Function to add Google attribution
function addAttribution(container) {
  const attribution = document.createElement('div');
  attribution.style.fontSize = '12px';
  attribution.style.color = '#757575';
  attribution.style.marginTop = '10px';
  attribution.innerHTML = 'Search results provided by Google';
  container.appendChild(attribution);
}

function extractWords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word && !stopWords.includes(word));
}

function calculateFrequencies(items) {
  const frequencies = {};
  items.forEach(item => {
    frequencies[item] = (frequencies[item] || 0) + 1;
  });
  return frequencies;
}

function extractDomains(links) {
  const secondLevelDomains = [];
  const topLevelDomains = [];

  links.forEach(link => {
    const domainParts = link.split('.');
    if (domainParts.length >= 2) {
      const tld = domainParts.pop();
      const sld = domainParts.pop();
      secondLevelDomains.push(sld);
      topLevelDomains.push(tld);
    }
  });

  return { secondLevelDomains, topLevelDomains };
}

function getTopN(frequencies, n) {
  const entries = Object.entries(frequencies);
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, n);
}

function clearVisualizations() {
  document.getElementById('visualization').innerHTML = '';
}

function visualizeData({ titleWords, snippetWords, displayLinks }) {
  const titleWordFreq = calculateFrequencies(titleWords);
  const snippetWordFreq = calculateFrequencies(snippetWords);
  const { secondLevelDomains, topLevelDomains } = extractDomains(displayLinks);
  const sldFreq = calculateFrequencies(secondLevelDomains);
  const tldFreq = calculateFrequencies(topLevelDomains);

  const titleTop10 = getTopN(titleWordFreq, 10);
  const titleTop25 = getTopN(titleWordFreq, 25);
  const snippetTop10 = getTopN(snippetWordFreq, 10);
  const snippetTop25 = getTopN(snippetWordFreq, 25);
  const sldTop5 = getTopN(sldFreq, 5);
  const tldTop3 = getTopN(tldFreq, 3);

  clearVisualizations();

  createBarChart(titleTop10, 'title-top-words', 'Top 10 Words in Titles');
  createWordCloud(titleTop25, 'title-word-cloud', 'Word Cloud of Titles');

  createBarChart(snippetTop10, 'snippet-top-words', 'Top 10 Words in Snippets');
  createWordCloud(snippetTop25, 'snippet-word-cloud', 'Word Cloud of Snippets');

  createBarChart(sldTop5, 'sld-top-domains', 'Top 5 Second-Level Domains');
  createBarChart(tldTop3, 'tld-top-domains', 'Top 3 Top-Level Domains');
}

function createBarChart(dataArray, canvasId, chartTitle) {
  const canvas = document.createElement('canvas');
  canvas.id = canvasId;
  document.getElementById('visualization').appendChild(canvas);

  const labels = dataArray.map(item => item[0]);
  const counts = dataArray.map(item => item[1]);

  new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: chartTitle,
        data: counts,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: chartTitle
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  });
}

function createWordCloud(dataArray, canvasId, chartTitle) {
  const container = document.createElement('div');
  container.className = 'wordcloud-container';

  const title = document.createElement('h3');
  title.textContent = chartTitle;
  container.appendChild(title);

  const canvas = document.createElement('canvas');
  canvas.id = canvasId;
  container.appendChild(canvas);

  document.getElementById('visualization').appendChild(container);

  const list = dataArray.map(item => [item[0], item[1]]);

  WordCloud(canvas, {
    list: list,
    gridSize: 8,
    weightFactor: function (size) {
      return size * 5; // Adjust the size multiplier as needed
    },
    fontFamily: 'Times, serif',
    color: 'random-dark',
    rotateRatio: 0,
    backgroundColor: '#fff'
  });
}