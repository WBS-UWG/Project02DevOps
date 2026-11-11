const sqlite3 = require('sqlite3').verbose();

const fetchTodoQuery = 'SELECT username FROM account WHERE username = ? AND password = ?';
const insertTodoQuery = 'INSERT INTO account (username, password) VALUES (?, ?)';

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

const insertAccount = async (db, sql, params) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                console.log('Inserted Account with the following information.');
                console.log('username:', params[0]);
                console.log('---');
                resolve();
            }
        });
    });
};

const sign_in = async (db, sql, params) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, function(err, row) {
            if (err) {
                reject(err);
            } else {
                console.log('Verified Account with the following information.');
                console.log('username:', params[0]);
                console.log('---');
                resolve(row);
            }
        });
    });
};

const deleteAccount = async (db, sql, params) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                console.log('Deleted Account:', params[0]);
                resolve();
            }
        });
    });
};

module.exports = {
    connectToDB,
    closeDB,
    insertAccount,
    sign_in,
    deleteAccount,
    fetchTodoQuery,
    insertTodoQuery
};