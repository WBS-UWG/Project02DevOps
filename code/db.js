const sqlite3 = require('sqlite3').verbose();

const connectToDB = function(dbPath = './account-store.db') {
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

module.exports = {
    connectToDB,
    closeDB,
};