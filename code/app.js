var express = require('express');
var bodyParser = require('body-parser');
const { connectToDB, closeDB, initDB, getItems, addItem, deleteItem, updateItem, updateSeriesProgress } = require('./db');

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
  const { title, description, rate, type, from, season, episode } = req.body;
  const parsedType = parseInt(type, 10) || 1;
  const parsedSeason = season === undefined || season === '' ? null : Number(season);
  const parsedEpisode = episode === undefined || episode === '' ? null : Number(episode);

  if (from !== 'watchlist' && parsedType === 2) {
    if ((parsedSeason !== null && (!Number.isSafeInteger(parsedSeason) || parsedSeason < 1)) ||
        (parsedEpisode !== null && (!Number.isSafeInteger(parsedEpisode) || parsedEpisode < 1))) {
      return res.status(400).send('Season and episode must be positive whole numbers.');
    }
    if (parsedEpisode !== null && parsedSeason === null) {
      return res.status(400).send('An episode number requires a season number.');
    }
  }

  const newItem = {
    title: title ? title.trim() : "No Title",
    description: description ? description.trim() : "",
    rate: from === 'watchlist' ? 0 : (parseInt(rate, 10) || 3),
    type: parsedType,
    watchlist: from === 'watchlist' ? 1 : 0,
    season: from !== 'watchlist' && parsedType === 2 ? parsedSeason : null,
    episode: from !== 'watchlist' && parsedType === 2 ? parsedEpisode : null
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

app.post('/items/progress', (req, res) => {
  const id = Number.parseInt(req.body.id, 10);
  const season = req.body.season === undefined || req.body.season === '' ? null : Number(req.body.season);
  const episode = req.body.episode === undefined || req.body.episode === '' ? null : Number(req.body.episode);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).send('Invalid item ID.');
  }
  if ((season !== null && (!Number.isSafeInteger(season) || season < 1)) ||
      (episode !== null && (!Number.isSafeInteger(episode) || episode < 1))) {
    return res.status(400).send('Season and episode must be positive whole numbers.');
  }
  if (episode !== null && season === null) {
    return res.status(400).send('An episode number requires a season number.');
  }

  updateSeriesProgress(db, id, season, episode, (err) => {
    if (err) {
      console.error('Error updating series progress:', err.message);
      return res.status(500).send('Error while updating series progress.');
    }
    res.redirect('/?type=serie');
  });
});

app.post('/items/update', (req, res) => {
  const id = Number.parseInt(req.body.id, 10);
  const { title, description, rate, type, watchlist, season, episode } = req.body;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).send('Invalid item ID.');
  }

  const parsedType = parseInt(type, 10) || 1;
  const parsedSeason = season === undefined || season === '' ? null : Number(season);
  const parsedEpisode = episode === undefined || episode === '' ? null : Number(episode);
  if (parsedType === 2) {
    if ((parsedSeason !== null && (!Number.isSafeInteger(parsedSeason) || parsedSeason < 1)) ||
        (parsedEpisode !== null && (!Number.isSafeInteger(parsedEpisode) || parsedEpisode < 1))) {
      return res.status(400).send('Season and episode must be positive whole numbers.');
    }
    if (parsedEpisode !== null && parsedSeason === null) {
      return res.status(400).send('An episode number requires a season number.');
    }
  }

  const updatedItem = {
    id: id,
    title: title ? title.trim() : "No Title",
    description: description ? description.trim() : "",
    rate: parseInt(rate, 10) || 3,
    type: parsedType,
    watchlist: parseInt(watchlist, 10) === 1 ? 1 : 0,
    season: parsedType === 2 ? parsedSeason : null,
    episode: parsedType === 2 ? parsedEpisode : null
  };

  updateItem(db, updatedItem, (err) => {
    if (err) {
      console.error('Error updating item:', err.message);
      return res.status(500).send('Error while updating the item.');
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
