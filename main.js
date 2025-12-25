// Cineby TizenBrew – Tizen OS 3.0 SAFE
alert('Cineby main.js loaded');

window.onload = function () {

  var app = document.getElementById('app');
  var view = 'search';
  var results = [];
  var index = 0;
  var tmdbId = null;
  var mediaType = null;
  var title = '';
  var seasonNum = null;
  var seasons = [];
  var episodes = [];

  var TMDB_KEY = 'c1084d318757743e08fcf5cda7ae43da';
  var TMDB = 'https://api.themoviedb.org/3';

  document.onkeydown = handleKey;

  renderSearch();

  function handleKey(e) {
    var k = e.keyCode;
    if (k === 13) enter();
    else if (k === 38) up();
    else if (k === 40) down();
    else if (k === 10009) back();
  }

  function enter() {
    if (view === 'search') {
      var i = document.getElementById('q');
      if (i && i.value) search(i.value);
    } else if (view === 'results') {
      var r = results[index];
      tmdbId = r.tmdbid;
      mediaType = r.media_type;
      title = r.title || r.name;
      if (mediaType === 'movie') playMovie(tmdbId);
      else loadSeasons(tmdbId);
    } else if (view === 'seasons') {
      seasonNum = seasons[index].season_number;
      loadEpisodes(tmdbId, seasonNum);
    } else if (view === 'episodes') {
      playEpisode(tmdbId, seasonNum, episodes[index].episode_number);
    }
  }

  function up() { if (index > 0) index--; render(); }
  function down() { index++; render(); }

  function back() {
    if (view === 'episodes') renderSeasons();
    else if (view === 'seasons') renderResults();
    else if (view === 'results') renderSearch();
  }

  function search(q) {
    view = 'results'; index = 0; results = [];
    loading();
    xhr(TMDB + '/search/multi?api_key=' + TMDB_KEY + '&query=' + encodeURIComponent(q),
      function (d) {
        for (var i = 0; i < d.results.length; i++) {
          var it = d.results[i];
          if (it.media_type === 'movie' || it.media_type === 'tv') {
            it.tmdbid = it.id;
            results.push(it);
          }
        }
        renderResults();
      });
  }

  function loadSeasons(id) {
    view = 'seasons'; index = 0; seasons = [];
    loading();
    xhr(TMDB + '/tv/' + id + '?api_key=' + TMDB_KEY,
      function (d) {
        for (var i = 0; i < d.seasons.length; i++) {
          if (d.seasons[i].season_number > 0) seasons.push(d.seasons[i]);
        }
        renderSeasons();
      });
  }

  function loadEpisodes(id, s) {
    view = 'episodes'; index = 0;
    loading();
    xhr(TMDB + '/tv/' + id + '/season/' + s + '?api_key=' + TMDB_KEY,
      function (d) {
        episodes = d.episodes;
        renderEpisodes();
      });
  }

  function playMovie(id) {
    redirect('https://www.cineby.gd/movies/' + id + '?play=true');
  }

  function playEpisode(id, s, e) {
    redirect('https://www.cineby.gd/tv/' + id + '/' + s + '/' + e + '?play=true');
  }

  function redirect(url) {
    app.innerHTML = '<div class="player-overlay">Opening player…</div>';
    setTimeout(function () { window.location.href = url; }, 300);
  }

  function renderSearch() {
    view = 'search';
    app.innerHTML =
      '<div class="header"><h1>Cineby</h1></div>' +
      '<div class="content">' +
      '<input id="q" class="search-input" placeholder="Search…" autofocus>' +
      '</div>';
  }

  function renderResults() {
    view = 'results';
    var h = '';
    for (var i = 0; i < results.length; i++) {
      h += '<div class="' + (i === index ? 'selected' : '') + '">' +
        (results[i].title || results[i].name) + '</div>';
    }
    app.innerHTML = '<div class="header"><h1>Results</h1></div><div class="content">' + h + '</div>';
  }

  function renderSeasons() {
    view = 'seasons';
    var h = '';
    for (var i = 0; i < seasons.length; i++) {
      h += '<div class="' + (i === index ? 'selected' : '') + '">' +
        'Season ' + seasons[i].season_number + '</div>';
    }
    app.innerHTML = '<div class="header"><h1>' + title + '</h1></div><div class="content">' + h + '</div>';
  }

  function renderEpisodes() {
    view = 'episodes';
    var h = '';
    for (var i = 0; i < episodes.length; i++) {
      h += '<div class="' + (i === index ? 'selected' : '') + '">' +
        'Episode ' + episodes[i].episode_number + '</div>';
    }
    app.innerHTML = '<div class="header"><h1>' + title + '</h1></div><div class="content">' + h + '</div>';
  }

  function render() {
    if (view === 'results') renderResults();
    else if (view === 'seasons') renderSeasons();
    else if (view === 'episodes') renderEpisodes();
  }

  function loading() {
    app.innerHTML = '<div class="content"><div class="loading-message">Loading…</div></div>';
  }

  function xhr(url, cb) {
    var x = new XMLHttpRequest();
    x.open('GET', url, true);
    x.onload = function () { cb(JSON.parse(x.responseText)); };
    x.send();
  }
};
