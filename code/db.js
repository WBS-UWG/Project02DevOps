const sqlite3 = require('sqlite3').verbose();

const connectToDB = function(dbPath = './filmTracker.db') {
    return new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, 
        (err) => {
            if (err){
                console.error('Connection error:', err.message);
                process.exit(1);
            }
            console.log('Connected to the SQLite database.');
        }
    );
};

const closeDB = function(db) {
    db.close((err) => {
        if (err) {
            return console.error('Closure error:', err.message);
        }
        console.log('Database connection closed.');
    });
};

const initDB = function(db) {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS watch_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                rate INTEGER DEFAULT 3,
                type INTEGER DEFAULT 1,      -- 1 = film, 2 = série
                watchlist INTEGER DEFAULT 0  -- 0 = accueil, 1 = watchlist
            )
        `);
    });
};

const getItems = function(db, watchlist, callback) {
    db.all(
        'SELECT * FROM watch_items WHERE watchlist = ? ORDER BY id',
        [watchlist],
        callback
    );
};

const addItem = function(db, item, callback) {
    db.run(
        'INSERT INTO watch_items (title, description, rate, type, watchlist) VALUES (?, ?, ?, ?, ?)',
        [item.title, item.description, item.rate, item.type, item.watchlist],
        function(err) {
            callback(err, this ? this.lastID : null);
        }
    );
};

module.exports = {
    connectToDB,
    closeDB,
    initDB,
    getItems,
    addItem,
};