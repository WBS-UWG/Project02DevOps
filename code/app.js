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

// Temporary item to test
const mockWatchItems = [
  { id: 1, title: "Inception", description: "Un voleur s'infiltre dans les rêves pour voler des secrets.", rate: 5, type: 1 }, // 1 = film
  { id: 2, title: "Breaking Bad", description: "Un professeur de chimie devient baron de la drogue.", rate: 5, type: 2 }, // 2 = série
  { id: 3, title: "Interstellar", description: "Une équipe d'astronautes voyage à travers un trou de ver.", rate: 4, type: 1 }, // 1 = film
  { id: 4, title: "The Office", description: "Mockumentaire sur la vie de bureau de salariés ordinaires.", rate: 4, type: 2 }  // 2 = série
];


app.get('/', (req, res) => {
  const filter = req.query.type || 'all';

  const items = mockWatchItems.map(item => ({
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

//start the web app
app.listen(8080, function () {
    console.log('App listening on port 8080!');
});