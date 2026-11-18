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

const validationError = (message) => new Error(`Invalid watch item: ${message}`);

const validateItem = (item, requireId = false) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return validationError('item must be an object');
    }

    if (typeof item.title !== 'string' || item.title.trim().length === 0) {
        return validationError('title must be a non-empty string');
    }

    if (!Number.isInteger(item.rate) || item.rate < 0 || item.rate > 5) {
        return validationError('rate must be an integer between 0 and 5');
    }

    if (!Number.isInteger(item.type) || (item.type !== 0 && item.type !== 1)) {
        return validationError('type must be 0 or 1');
    }

    if (!Number.isInteger(item.watchlist) || (item.watchlist !== 0 && item.watchlist !== 1)) {
        return validationError('watchlist must be 0 or 1');
    }

    if (requireId && (!Number.isInteger(item.id) || item.id <= 0)) {
        return validationError('id must be a positive integer');
    }

    return null;
};

const reject = (callback, error) => {
    process.nextTick(() => callback(error, 0));
};

const getItems = function(db, watchlist, callback) {
    db.all(
        'SELECT * FROM watch_items WHERE watchlist = ? ORDER BY id',
        [watchlist],
        callback
    );
};

const addItem = function(db, item, callback) {
    const error = validateItem(item);
    if (error) {
        return reject(callback, error);
    }

    db.run(
        'INSERT INTO watch_items (title, description, rate, type, watchlist) VALUES (?, ?, ?, ?, ?)',
        [item.title, item.description, item.rate, item.type, item.watchlist],
        function(err) {
            callback(err, this ? this.lastID : null);
        }
    );
};

const deleteItem = function(db, id, callback) {
    db.run(
        'DELETE FROM watch_items WHERE id = ? AND watchlist = 1',
        [id],
        function(err) {
            callback(err, this ? this.changes : 0);
        }
    );
};

const updateItem = function(db, item, callback) {
    const error = validateItem(item, true);
    if (error) {
        return reject(callback, error);
    }

    db.run(
        'UPDATE watch_items SET title = ?, description = ?, rate = ?, type = ?, watchlist = ? WHERE id = ?',
        [item.title, item.description, item.rate, item.type, item.watchlist, item.id],
        function(err) {
            callback(err, this ? this.changes : 0);
        }
    );
};

module.exports = {
    connectToDB,
    closeDB,
    initDB,
    getItems,
    addItem,
    updateItem,
    deleteItem,
};