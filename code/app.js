var express = require('express');
var bodyParser = require('body-parser');
const { connectToDB, closeDB, initDB, getItems, addItem, deleteItem } = require('./db');

var app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


const db = connectToDB();
initDB(db);

function renderItemsPage(view, watchlistValue) {
  return (req, res) => {
    const filter = req.query.type || 'all';

    getItems(db, watchlistValue, (err, rows) => {
      if (err) {
        console.error('Error reading DB:', err.message);
        return res.status(500).send('Error while reading the database.');
      }

      const items = rows.map(item => ({...item, titre: item.title, description: item.description,
        rating: item.rate, type: item.type === 1 ? 'film' : 'serie'
      }));

      const filteredItems = filter === 'all' ? items : items.filter(item => item.type === filter);

      const counts = {
        all: items.length,
        film: items.filter(i => i.type === 'film').length,
        serie: items.filter(i => i.type === 'serie').length
      };

      res.render(view, {items: filteredItems, counts, filter});
    });
  };
}

app.get('/addItem', (req, res) => {
    const fromWatchlist = req.query.from === 'watchlist';
    res.render('page/addItem', { fromWatchlist });
});

app.post('/addItem', (req, res) => {
  const { title, description, rate, type, from } = req.body;

  const newItem = {
    title: title ? title.trim() : "No Title",
    description: description ? description.trim() : "",
    rate: from === 'watchlist' ? null : (parseInt(rate, 10) || 3),
    type: parseInt(type, 10) || 1,
    watchlist: from === 'watchlist' ? 1 : 0
  };

  addItem(db, newItem, (err) => {
    if (err) {
      console.error('Error inserting into DB:', err.message);
      return res.status(500).send("Error while adding the item.");
    }
    res.redirect(from === 'watchlist' ? '/watchlist' : '/');
  });
});

app.post('/items/delete', (req, res) => {
  const id = Number.parseInt(req.body.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).send('Invalid item ID.');
  }

  deleteItem(db, id, (err) => {
    if (err) {
      console.error('Error deleting item:', err.message);
      return res.status(500).send('Error while deleting the item.');
    }
    res.redirect('/watchlist');
  });
});

app.get('/watchlist', renderItemsPage('page/watchlist', 1));
app.get('/', renderItemsPage('page/landing', 0));

// Start the web app
app.listen(8080, function () {
    console.log('App listening on port 8080!');
});
