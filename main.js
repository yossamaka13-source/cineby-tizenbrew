alert('Cineby loaded');

var TMDB_KEY = 'c1084d318757743e08fcf5cda7ae43da';
var TMDB = 'https://api.themoviedb.org/3';

var state = {
  view: 'search',
  index: 0,
  results: [],
  seasons: [],
  episodes: [],
  tmdbid: null,
  type: null,
  title: ''
};

var app = document.getElementById('app');
document.onkeydown = handleKey;

renderSearch();

/* ------------------ INPUT ------------------ */

function handleKey(e) {
  if (e.keyCode === 13) enter();
  if (e.keyCode === 38 && state.index > 0) state.index--;
  if (e.keyCode === 40) state.index++;
  if (e.keyCode === 10009) back();
  render();
}

function enter() {
  if (state.view === 'search') {
    search(document.getElementById('q').value);
  } else if (state.view === 'results') {
    var r = state.results[state.index];
    state.tmdbid = r.id;
    state.type = r.media_type;
    state.title = r.title || r.name;
    if (state.type === 'movie') playMovie();
    else loadSeasons();
  } else if (state.view === 'seasons') {
    loadEpisodes(state.seasons[state.index].season_number);
  } else if (state.view === 'episodes') {
    playEpisode(
      state.seasons[state.index].season_number,
      state.episodes[state.index].episode_number
    );
  }
}

function back() {
  if (state.view === 'episodes') state.view = 'seasons';
  else if (state.view === 'seasons') state.view = 'results';
  else state.view = 'search';
}

/* ------------------ TMDB ------------------ */

function search(q) {
  loading();
  xhr(TMDB + '/search/multi?api_key=' + TMDB_KEY + '&query=' + encodeURIComponent(q),
    function (d) {
      state.results = [];
      for (var i = 0; i < d.results.length; i++) {
        if (d.results[i].media_type !== 'person') {
          state.results.push(d.results[i]);
        }
      }
      state.view = 'results';
      state.index = 0;
      render();
    }
  );
}

function loadSeasons() {
  loading();
  xhr(TMDB + '/tv/' + state.tmdbid + '?api_key=' + TMDB_KEY,
    function (d) {
      state.seasons = d.seasons;
      state.view = 'seasons';
      state.index = 0;
      render();
    }
  );
}

function loadEpisodes(season) {
  loading();
  xhr(TMDB + '/tv/' + state.tmdbid + '/season/' + season + '?api_key=' + TMDB_KEY,
    function (d) {
      state.episodes = d.episodes;
      state.view = 'episodes';
      state.index = 0;
      render();
    }
  );
}

/* ------------------ PLAYBACK ------------------ */

function playMovie() {
  redirect('https://www.cineby.gd/movies/' + state.tmdbid + '?play=true');
}

function playEpisode(season, episode) {
  redirect(
    'https://www.cineby.gd/tv/' +
    state.tmdbid + '/' + season + '/' + episode + '?play=true'
  );
}

function redirect(url) {
  app.innerHTML = '<h2>Opening player…</h2>';
  setTimeout(function () {
    window.location.href = url;
  }, 300);
}

/* ------------------ UI ------------------ */

function renderSearch() {
  app.innerHTML =
    '<input id="q" placeholder="Search movie or show">';
}

function render() {
  if (state.view === 'search') renderSearch();
  else if (state.view === 'results') renderList(state.results, 'title');
  else if (state.view === 'seasons') renderList(state.seasons, 'season_number');
  else if (state.view === 'episodes') renderList(state.episodes, 'episode_number');
}

function renderList(list, key) {
  var html = '';
  for (var i = 0; i < list.length; i++) {
    html += '<div class="item ' + (i === state.index ? 'selected' : '') + '">' +
      (list[i].title || list[i].name || key + ' ' + list[i][key]) +
      '</div>';
  }
  app.innerHTML = html;
}

function loading() {
  app.innerHTML = '<p>Loading…</p>';
}

/* ------------------ XHR ------------------ */

function xhr(url, cb) {
  var x = new XMLHttpRequest();
  x.open('GET', url, true);
  x.onload = function () {
    cb(JSON.parse(x.responseText));
  };
  x.send();
}
