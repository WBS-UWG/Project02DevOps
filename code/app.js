var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
const { connectToDB, closeDB } = require('./db');

var app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static('public'));

app.use(session({
    secret: '9087e7fbede17275cfafcf0319ce2baadffe8f27ba8589a21dd6772440bb3150',
    resave: false,
    saveUninitialized: false
}));

let mockWatchItems = [
  { id: 1, title: "Inception", description: "Un voleur s'infiltre dans les rêves pour voler des secrets.", rate: 5, type: 1, watchlist: 0 }, 
  { id: 2, title: "Ready player one", description: "Le futur du jeu video", rate: 5, type: 2, watchlist: 0 }, 
  { id: 3, title: "Breaking Bad", description: "Un professeur de chimie devient baron de la drogue.", rate: 5, type: 2, watchlist: 1 },
  { id: 4, title: "Interstellar", description: "Une équipe d'astronautes voyage à travers un trou de ver.", rate: 4, type: 1, watchlist: 0 }, 
  { id: 5, title: "The Office", description: "Mockumentaire sur la vie de bureau de salariés ordinaires.", rate: 4, type: 2, watchlist: 1 }
];

app.get('/addItem', (req, res) => {
    const fromWatchlist = req.query.from === 'watchlist';
    res.render('page/addItem', { fromWatchlist });
});

// Traitement de l'ajout d'un élément
app.post('/addItem', (req, res) => {
  const { title, description, rate, type, from } = req.body;

  const newItem = {
    id: mockWatchItems.length + 1,
    title: title ? title.trim() : "Sans titre",
    description: description ? description.trim() : "",
    rate: parseInt(rate, 10) || 3,
    type: parseInt(type, 10) || 1,
    watchlist: from === 'watchlist' ? 1 : 0
  };

  mockWatchItems.push(newItem);

  if (from === 'watchlist') {
    res.redirect('/watchlist');
  } else {
    res.redirect('/');
  }
});

app.get('/watchlist', (req, res) => {
  const filter = req.query.type || 'all';

  let watchlistItems = mockWatchItems.filter(item => item.watchlist === 1);

  const items = watchlistItems.map(item => ({
    ...item,
    titre: item.title,
    rating: item.rate,
    type: item.type === 1 ? 'film' : 'serie'
  }));

  const filteredItems = filter === 'all'
    ? items
    : items.filter(item => item.type === filter);

  const counts = {
    all: items.length,
    film: items.filter(i => i.type === 'film').length,
    serie: items.filter(i => i.type === 'serie').length
  };

  res.render('page/watchlist', {
    items: filteredItems,
    counts,
    filter
  });
});

app.get('/', (req, res) => {
  const filter = req.query.type || 'all';

  let landingItems = mockWatchItems.filter(item => item.watchlist === 0);

  const items = landingItems.map(item => ({
    ...item,
    titre: item.title,
    rating: item.rate,
    type: item.type === 1 ? 'film' : 'serie'
  }));

  const filteredItems = filter === 'all'
    ? items
    : items.filter(item => item.type === filter);

  const counts = {
    all: items.length,
    film: items.filter(i => i.type === 'film').length,
    serie: items.filter(i => i.type === 'serie').length
  };

  res.render('page/landing', {
    items: filteredItems,
    counts,
    filter
  });
});

// Start the web app
app.listen(8080, function () {
    console.log('App listening on port 8080!');
});