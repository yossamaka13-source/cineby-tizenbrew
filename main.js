// Cineby TizenBrew Module - ES5 Only
// Compatible with Tizen OS 3.0 (IE9-compatible)

// DEBUG: JS loaded confirmation - MUST BE AT TOP
alert('Cineby main.js loaded');

// Initialize on page load - ALL LOGIC MUST BE INSIDE
window.onload = function() {
  // Global state variables
  var app = null;
  var currentView = 'search';
  var searchResults = [];
  var selectedItem = 0;
  var currentTmdbId = null;
  var currentMediaType = null;
  var currentTitle = null;
  var currentSeasonNumber = null;
  var seasons = [];
  var episodes = [];

  // TMDB API Configuration
  var TMDB_API_KEY = 'c1084d318757743e08fcf5cda7ae43da';
  var TMDB_BASE_URL = 'https://api.themoviedb.org/3';

  // DOM Elements cache
  var appContainer = null;

  // Get app container
  appContainer = document.getElementById('app');
  if (!appContainer) {
    return;
  }

  // Register keyboard event listener
  document.addEventListener('keydown', handleKeyDown);

  // Show initial screen
  renderSearchScreen();

  // Keyboard input handler
  function handleKeyDown(event) {
    var keyCode = event.keyCode;

    switch (keyCode) {
      case 13: // Enter
        handleEnter();
        break;
      case 38: // Up
        handleUp();
        break;
      case 40: // Down
        handleDown();
        break;
      case 10009: // Back
        handleBack();
        break;
      default:
        // Allow typing in search input
        if (currentView === 'search') {
          var input = document.getElementById('search-input');
          if (input && document.activeElement === input) {
            // Let the input handle the key naturally
            return;
          }
        }
        break;
    }
  }

  // Handle Enter key
  function handleEnter() {
    if (currentView === 'search') {
      var input = document.getElementById('search-input');
      if (input && input.value.trim()) {
        performSearch(input.value.trim());
      }
    } else if (currentView === 'results') {
      if (searchResults.length > 0 && selectedItem >= 0 && selectedItem < searchResults.length) {
        var result = searchResults[selectedItem];
        currentTmdbId = result.tmdbid;
        currentMediaType = result.media_type;
        currentTitle = result.title || result.name;

        if (currentMediaType === 'movie') {
          playMovie(currentTmdbId);
        } else if (currentMediaType === 'tv') {
          loadSeasons(currentTmdbId);
        }
      }
    } else if (currentView === 'seasons') {
      if (seasons.length > 0 && selectedItem >= 0 && selectedItem < seasons.length) {
        currentSeasonNumber = seasons[selectedItem].season_number;
        loadEpisodes(currentTmdbId, currentSeasonNumber);
      }
    } else if (currentView === 'episodes') {
      if (episodes.length > 0 && selectedItem >= 0 && selectedItem < episodes.length) {
        var episode = episodes[selectedItem];
        playTvEpisode(currentTmdbId, currentSeasonNumber, episode.episode_number);
      }
    } else if (currentView === 'player') {
      closePlayer();
    }
  }

  // Handle Up key
  function handleUp() {
    if (currentView === 'results') {
      if (selectedItem > 0) {
        selectedItem--;
        renderResultsList();
      }
    } else if (currentView === 'seasons') {
      if (selectedItem > 0) {
        selectedItem--;
        renderSeasonsList();
      }
    } else if (currentView === 'episodes') {
      if (selectedItem > 0) {
        selectedItem--;
        renderEpisodesList();
      }
    }
  }

  // Handle Down key
  function handleDown() {
    if (currentView === 'results') {
      if (selectedItem < searchResults.length - 1) {
        selectedItem++;
        renderResultsList();
      }
    } else if (currentView === 'seasons') {
      if (selectedItem < seasons.length - 1) {
        selectedItem++;
        renderSeasonsList();
      }
    } else if (currentView === 'episodes') {
      if (selectedItem < episodes.length - 1) {
        selectedItem++;
        renderEpisodesList();
      }
    }
  }

  // Handle Back key
  function handleBack() {
    if (currentView === 'player') {
      closePlayer();
    } else if (currentView === 'episodes') {
      renderSeasonsScreen();
    } else if (currentView === 'seasons') {
      renderResultsScreen();
    } else if (currentView === 'results') {
      renderSearchScreen();
    }
  }

  // Perform TMDB search
  function performSearch(query) {
    currentView = 'results';
    selectedItem = 0;
    searchResults = [];

    var url = TMDB_BASE_URL + '/search/multi?api_key=' + TMDB_API_KEY + '&query=' + encodeURIComponent(query);

    showLoading();

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 15000; // 15 second timeout

    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);

          if (data.results && data.results.length > 0) {
            // Filter only movies and TV shows
            for (var i = 0; i < data.results.length; i++) {
              var item = data.results[i];
              if (item.media_type === 'movie' || item.media_type === 'tv') {
                // Store with tmdbid explicitly
                item.tmdbid = item.id;
                searchResults.push(item);
              }
            }

            if (searchResults.length > 0) {
              renderResultsScreen();
            } else {
              showError('No results found');
              renderSearchScreen();
            }
          } else {
            showError('No results found');
            renderSearchScreen();
          }
        } catch (e) {
          showError('Error parsing response');
          renderSearchScreen();
        }
      } else {
        showError('Search failed: ' + xhr.status);
        renderSearchScreen();
      }
    };

    xhr.onerror = function() {
      showError('Network error');
      renderSearchScreen();
    };

    xhr.ontimeout = function() {
      showError('Request timeout');
      renderSearchScreen();
    };

    xhr.send();
  }

  // Load TV show seasons
  function loadSeasons(tmdbid) {
    currentView = 'seasons';
    selectedItem = 0;
    seasons = [];

    var url = TMDB_BASE_URL + '/tv/' + tmdbid + '?api_key=' + TMDB_API_KEY;

    showLoading();

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 15000;

    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);

          if (data.seasons && data.seasons.length > 0) {
            // Filter out specials (season 0 usually)
            for (var i = 0; i < data.seasons.length; i++) {
              var season = data.seasons[i];
              if (season.season_number > 0) {
                seasons.push(season);
              }
            }

            if (seasons.length > 0) {
              renderSeasonsScreen();
            } else {
              showError('No seasons available');
              renderResultsScreen();
            }
          } else {
            showError('No seasons available');
            renderResultsScreen();
          }
        } catch (e) {
          showError('Error parsing seasons');
          renderResultsScreen();
        }
      } else {
        showError('Failed to load seasons');
        renderResultsScreen();
      }
    };

    xhr.onerror = function() {
      showError('Network error');
      renderResultsScreen();
    };

    xhr.ontimeout = function() {
      showError('Request timeout');
      renderResultsScreen();
    };

    xhr.send();
  }

  // Load episodes for a season
  function loadEpisodes(tmdbid, seasonNumber) {
    currentView = 'episodes';
    selectedItem = 0;
    episodes = [];

    var url = TMDB_BASE_URL + '/tv/' + tmdbid + '/season/' + seasonNumber + '?api_key=' + TMDB_API_KEY;

    showLoading();

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 15000;

    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);

          if (data.episodes && data.episodes.length > 0) {
            episodes = data.episodes;
            renderEpisodesScreen();
          } else {
            showError('No episodes available');
            renderSeasonsScreen();
          }
        } catch (e) {
          showError('Error parsing episodes');
          renderSeasonsScreen();
        }
      } else {
        showError('Failed to load episodes');
        renderSeasonsScreen();
      }
    };

    xhr.onerror = function() {
      showError('Network error');
      renderSeasonsScreen();
    };

    xhr.ontimeout = function() {
      showError('Request timeout');
      renderSeasonsScreen();
    };

    xhr.send();
  }

  // Play movie using Cineby
  function playMovie(tmdbid) {
    var url = 'https://www.cineby.gd/movies/' + tmdbid + '?play=true';
    showPlayer(currentTitle, url);
  }

  // Play TV episode using Cineby
  function playTvEpisode(tmdbid, season, episode) {
    var url = 'https://www.cineby.gd/tv/' + tmdbid + '/' + season + '/' + episode + '?play=true';
    showPlayer(currentTitle + ' - S' + season + ' E' + episode, url);
  }

  // Show player overlay
  function showPlayer(title, url) {
    currentView = 'player';

    var html =
      '<div class="player-overlay">' +
        '<div class="player-info">' +
          '<h2>' + escapeHtml(title) + '</h2>' +
          '<p>Opening Cineby player...</p>' +
          '<p style="margin-top: 10px; font-size: 12px; color: #666;">Press BACK to return</p>' +
        '</div>' +
      '</div>';

    appContainer.innerHTML = html;

    // Open URL using Tizen 3.0 safe method
    window.location = url;
  }

  // Close player overlay
  function closePlayer() {
    if (currentMediaType === 'tv') {
      renderEpisodesScreen();
    } else {
      renderResultsScreen();
    }
  }

  // ================= RENDER FUNCTIONS =================

  // Render search screen
  function renderSearchScreen() {
    currentView = 'search';
    selectedItem = 0;
    searchResults = [];

    var html =
      '<div class="header">' +
        '<h1>Cineby</h1>' +
        '<div class="status">TizenBrew Module Loaded</div>' +
      '</div>' +
      '<div class="content">' +
        '<div class="search-container">' +
          '<input type="text" id="search-input" class="search-input" placeholder="Search movies & TV shows..." autofocus>' +
        '</div>' +
        '<div class="info-message">' +
          'Type your search and press ENTER' +
        '</div>' +
      '</div>';

    appContainer.innerHTML = html;

    // Focus the input
    setTimeout(function() {
      var input = document.getElementById('search-input');
      if (input) {
        input.focus();
      }
    }, 100);
  }

  // Render results screen
  function renderResultsScreen() {
    currentView = 'results';
    selectedItem = 0;

    var html =
      '<div class="header">' +
        '<h1>Search Results</h1>' +
        '<div class="status">' + searchResults.length + ' items found</div>' +
      '</div>' +
      '<div class="content">' +
        '<div id="results-list" class="results-list"></div>' +
      '</div>';

    appContainer.innerHTML = html;

    renderResultsList();
  }

  // Render results list items
  function renderResultsList() {
    var listContainer = document.getElementById('results-list');
    if (!listContainer) {
      return;
    }

    var html = '';

    for (var i = 0; i < searchResults.length; i++) {
      var item = searchResults[i];
      var selected = (i === selectedItem) ? 'selected' : '';
      var title = item.title || item.name;
      var year = '';
      var type = item.media_type.toUpperCase();
      var posterUrl = '';

      if (item.release_date) {
        year = item.release_date.substring(0, 4);
      } else if (item.first_air_date) {
        year = item.first_air_date.substring(0, 4);
      }

      if (item.poster_path) {
        posterUrl = 'https://image.tmdb.org/t/p/w200' + item.poster_path;
      }

      html +=
        '<div class="result-item ' + selected + '" data-index="' + i + '">' +
          '<div class="result-poster">';

      if (posterUrl) {
        html += '<img src="' + posterUrl + '" alt="' + escapeHtml(title) + '">';
      } else {
        html += 'No Image';
      }

      html +=
          '</div>' +
          '<div class="result-info">' +
            '<div class="result-title">' + escapeHtml(title) + '</div>' +
            '<div class="result-meta">' + year + '</div>' +
            '<div class="result-type">' + type + '</div>' +
          '</div>' +
        '</div>';
    }

    listContainer.innerHTML = html;
  }

  // Render seasons screen
  function renderSeasonsScreen() {
    currentView = 'seasons';
    selectedItem = 0;

    var html =
      '<div class="header">' +
        '<h1>' + escapeHtml(currentTitle) + '</h1>' +
        '<div class="status">Select a Season</div>' +
      '</div>' +
      '<div class="content">' +
        '<div id="season-list" class="season-list"></div>' +
      '</div>';

    appContainer.innerHTML = html;

    renderSeasonsList();
  }

  // Render seasons list items
  function renderSeasonsList() {
    var listContainer = document.getElementById('season-list');
    if (!listContainer) {
      return;
    }

    var html = '';

    for (var i = 0; i < seasons.length; i++) {
      var season = seasons[i];
      var selected = (i === selectedItem) ? 'selected' : '';
      var episodeCount = season.episode_count || 0;

      html +=
        '<div class="season-item ' + selected + '" data-index="' + i + '">' +
          'Season ' + season.season_number + ' (' + episodeCount + ' episodes)' +
        '</div>';
    }

    listContainer.innerHTML = html;
  }

  // Render episodes screen
  function renderEpisodesScreen() {
    currentView = 'episodes';
    selectedItem = 0;

    var html =
      '<div class="header">' +
        '<h1>' + escapeHtml(currentTitle) + '</h1>' +
        '<div class="status">Season ' + currentSeasonNumber + ' - Select an Episode</div>' +
      '</div>' +
      '<div class="content">' +
        '<div id="episode-list" class="episode-list"></div>' +
      '</div>';

    appContainer.innerHTML = html;

    renderEpisodesList();
  }

  // Render episodes list items
  function renderEpisodesList() {
    var listContainer = document.getElementById('episode-list');
    if (!listContainer) {
      return;
    }

    var html = '';

    for (var i = 0; i < episodes.length; i++) {
      var episode = episodes[i];
      var selected = (i === selectedItem) ? 'selected' : '';
      var epNumber = episode.episode_number;
      var epName = episode.name || 'Episode ' + epNumber;

      html +=
        '<div class="episode-item ' + selected + '" data-index="' + i + '">' +
          '<strong>Episode ' + epNumber + ':</strong> ' + escapeHtml(epName) +
        '</div>';
    }

    listContainer.innerHTML = html;
  }

  // Show loading message
  function showLoading() {
    var html =
      '<div class="header">' +
        '<h1>Cineby</h1>' +
        '<div class="status">Loading...</div>' +
      '</div>' +
      '<div class="content">' +
        '<div class="loading-message">Please wait...</div>' +
      '</div>';

    appContainer.innerHTML = html;
  }

  // Show error message
  function showError(message) {
    var html =
      '<div class="header">' +
        '<h1>Cineby</h1>' +
        '<div class="status">Error</div>' +
      '</div>' +
      '<div class="content">' +
        '<div class="error-message">' + escapeHtml(message) + '</div>' +
        '<div class="info-message">Press BACK to return</div>' +
      '</div>';

    appContainer.innerHTML = html;
  }

  // HTML escape utility function
  function escapeHtml(text) {
    if (!text) {
      return '';
    }

    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
