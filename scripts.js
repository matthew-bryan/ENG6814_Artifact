// scripts.js

document.getElementById('search-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const query = document.getElementById('search-query').value;
  fetchSearchResults(query);
});

const stopWords = [
  'the', 'and', 'a', 'to', 'of', 'in', 'for', 'is', 'on', 'that', 'with',
  'as', 'by', 'at', 'from', 'it', 'this', 'an', 'be', 'or', 'are', 'was',
  'but', 'not', 'we', 'you', 'your', 'have', 'has', 'will', 'can', 'if',
  'about', 'more', 'our', 'so', 'what', 'when', 'which', 'their', 'they',
  'all', 'there', 'been', 'also', 'into', 'do', 'up', 'out', 'who', 'no',
  'he', 'she', 'her', 'his', 'them', 'one', 'some', 'could', 'would',
  'should', 'may', 'like', 'just', 'over', 'then', 'now', 'how', 'get'
];

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
