var checker = require('./db');

let db;

const validItem = (overrides = {}) => ({
    title: 'Inception',
    description: 'Un film de science-fiction',
    rate: 5,
    type: 1,
    watchlist: 0,
    ...overrides
});


const countRows = (callback) => {
    db.get('SELECT COUNT(*) AS total FROM watch_items', [], (err, row) => {
        callback(err, row ? row.total : null);
    });
};

beforeEach((done) => {
    db = checker.connectToDB(':memory:');
    checker.initDB(db, (err) => {
        expect(err).toBeNull();
        done();
    });
});

afterEach((done) => {
    checker.closeDB(db);
    setTimeout(done, 10);
});

// ---------------------------------------------------------------------------
// connectToDB
// ---------------------------------------------------------------------------
test('connectToDB should return a database object', () => {
    expect(db).toBeDefined();
});

test('initDB should add progress columns to an existing database', (done) => {
    const legacyDb = checker.connectToDB(':memory:');
    legacyDb.run(`
        CREATE TABLE watch_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            rate INTEGER DEFAULT 3,
            type INTEGER DEFAULT 1,
            watchlist INTEGER DEFAULT 0
        )
    `, (createError) => {
        expect(createError).toBeNull();

        checker.initDB(legacyDb, (initError) => {
            expect(initError).toBeNull();
            legacyDb.all('PRAGMA table_info(watch_items)', (pragmaError, columns) => {
                expect(pragmaError).toBeNull();
                expect(columns.map(column => column.name)).toEqual(expect.arrayContaining(['season', 'episode']));
                checker.closeDB(legacyDb);
                done();
            });
        });
    });
});

// ---------------------------------------------------------------------------
// addItem : Valid data
// ---------------------------------------------------------------------------
test('addItem should insert a new watch item into the database', (done) => {
    const newItem = validItem();
    checker.addItem(db, newItem, (err, lastID) => {
        expect(err).toBeNull();
        expect(lastID).toBeDefined();
        expect(lastID).toBeGreaterThan(0);

        db.get('SELECT * FROM watch_items WHERE id = ?', [lastID], (err, row) => {
            expect(err).toBeNull();
            expect(row).toBeDefined();
            expect(row.title).toBe('Inception');
            expect(row.description).toBe('Un film de science-fiction');
            expect(row.rate).toBe(5);
            expect(row.type).toBe(1);
            expect(row.watchlist).toBe(0);
            done();
        });
    });
});

test.each([0, 1, 2, 3, 4, 5])('addItem should accept the valid rate %p', (rate, done) => {
    checker.addItem(db, validItem({ rate }), (err, lastID) => {
        expect(err).toBeNull();
        expect(lastID).toBeGreaterThan(0);
        done();
    });
});

test.each([
    [0, 0, 0],
    [3, 0, 1],
    [5, 1, 0],
    [2, 1, 1]
])('addItem should persist valid values rate=%p, type=%p, watchlist=%p', (rate, type, watchlist, done) => {
    checker.addItem(db, validItem({ rate, type, watchlist }), (err, lastID) => {
        expect(err).toBeNull();
        expect(lastID).toBeGreaterThan(0);

        db.get('SELECT rate, type, watchlist FROM watch_items WHERE id = ?', [lastID], (err, row) => {
            expect(err).toBeNull();
            expect(row).toEqual({ rate, type, watchlist });
            done();
        });
    });
});

test.each([0, 1, 2])('addItem should accept the valid type %p', (type, done) => {
    checker.addItem(db, validItem({ type }), (err, lastID) => {
        expect(err).toBeNull();
        expect(lastID).toBeGreaterThan(0);
        done();
    });
});

test('addItem should save a series season and episode', (done) => {
    checker.addItem(db, validItem({ type: 2, season: 3, episode: 7 }), (err, id) => {
        expect(err).toBeNull();

        db.get('SELECT season, episode FROM watch_items WHERE id = ?', [id], (err, row) => {
            expect(err).toBeNull();
            expect(row).toEqual({ season: 3, episode: 7 });
            done();
        });
    });
});

test.each([0, 1])('addItem should accept the valid watchlist %p', (watchlist, done) => {
    checker.addItem(db, validItem({ watchlist }), (err, lastID) => {
        expect(err).toBeNull();
        expect(lastID).toBeGreaterThan(0);
        done();
    });
});

// ---------------------------------------------------------------------------
// addItem : Invalid data
// ---------------------------------------------------------------------------
describe('addItem with invalid data', () => {
    const expectRejected = (item, done) => {
        checker.addItem(db, item, (err, lastID) => {
            expect(err).not.toBeNull();
            expect(lastID).toBeFalsy();

            countRows((countErr, total) => {
                expect(countErr).toBeNull();
                expect(total).toBe(0);
                done();
            });
        });
    };

    test.each([
        ['negative', -1],
        ['very negative', -100],
        ['higher than 5', 6],
        ['float', 2.5],
        ['string', 'abc'],
        ['NaN', NaN],
        ['null', null],
    ])('should reject a rate that is %s', (_label, rate, done) => {
        expectRejected(validItem({ rate }), done);
    });

    test('should reject an item with no rate field', (done) => {
        const item = validItem();
        delete item.rate;
        expectRejected(item, done);
    });

    test.each([
        ['negative', -1],
        ['very negative', -100],
        ['higher than 5', 6],
        ['float', 2.5],
        ['string', 'abc'],
        ['NaN', NaN],
        ['null', null],
    ])('should reject a type that is %s', (_label, type, done) => {
        expectRejected(validItem({ type }), done);
    });

    test('should reject an item with no type field', (done) => {
        const item = validItem();
        delete item.type;
        expectRejected(item, done);
    });

    test.each([0, -1, 1.5, '2', 'invalid'])(
        'should reject an invalid season %p',
        (season, done) => {
            expectRejected(validItem({ type: 2, season }), done);
        }
    );

    test.each([0, -1, 1.5, '2', 'invalid'])(
        'should reject an invalid episode %p',
        (episode, done) => {
            expectRejected(validItem({ type: 2, season: 1, episode }), done);
        }
    );

    test('should reject an episode when no season is provided', (done) => {
        expectRejected(validItem({ type: 2, episode: 1 }), done);
    });

    test.each([
        ['negative', -1],
        ['higher than 1', 2],
        ['very high', 99],
        ['float', 0.5],
        ['string', 'oui'],
        ['NaN', NaN],
        ['null', null],
    ])('should reject a watchlist value that is %s', (_label, watchlist, done) => {
        expectRejected(validItem({ watchlist }), done);
    });

    test('should reject an item with no watchlist field', (done) => {
        const item = validItem();
        delete item.watchlist;
        expectRejected(item, done);
    });

    test.each([
        ['Empty', ''],
        ['just space', '   '],
        ['just tab', '\t\t'],
        ['null', null],
        ['undefined', undefined],
    ])('should reject a title that is %s', (_label, title, done) => {
        expectRejected(validItem({ title }), done);
    });

    test('should reject an item with no title field', (done) => {
        const item = validItem();
        delete item.title;
        expectRejected(item, done);
    });

    test('should reject an item where every field is invalid', (done) => {
        expectRejected({ title: '', description: '', rate: -5, type: 7, watchlist: 3 }, done);
    });

    test('should reject a null item', (done) => {
        expectRejected(null, done);
    });

    test('should reject an empty object', (done) => {
        expectRejected({}, done);
    });
});

// ---------------------------------------------------------------------------
// getItems
// ---------------------------------------------------------------------------
test('getItems should return items matching the specified watchlist status', (done) => {
    const item1 = validItem({ title: 'Film Accueil', description: '', rate: 3, watchlist: 0 });
    const item2 = validItem({ title: 'Film Watchlist', description: '', rate: 4, watchlist: 1 });

    checker.addItem(db, item1, () => {
        checker.addItem(db, item2, () => {
            checker.getItems(db, 0, (err, rows) => {
                expect(err).toBeNull();
                expect(rows.length).toBe(1);
                expect(rows[0].title).toBe('Film Accueil');
                done();
            });
        });
    });
});

test('getItems should return an empty array when no item matches', (done) => {
    checker.getItems(db, 1, (err, rows) => {
        expect(err).toBeNull();
        expect(rows).toEqual([]);
        done();
    });
});

test.each([2, -1, 'abc', null, undefined])(
    'getItems should not return any item for the invalid watchlist status %p',
    (status, done) => {
        checker.addItem(db, validItem({ watchlist: 0 }), () => {
            checker.addItem(db, validItem({ title: 'Autre', watchlist: 1 }), () => {
                checker.getItems(db, status, (err, rows) => {
                    if (err) {
                        expect(err).not.toBeNull();
                    } else {
                        expect(rows).toEqual([]);
                    }
                    done();
                });
            });
        });
    }
);

// ---------------------------------------------------------------------------
// deleteItem
// ---------------------------------------------------------------------------
test('deleteItem should delete an item only if watchlist is 1', (done) => {
    const itemInWatchlist = validItem({ title: 'A voir plus tard', description: '', rate: 3, type: 0, watchlist: 1 });

    checker.addItem(db, itemInWatchlist, (err, id) => {
        expect(err).toBeNull();

        checker.deleteItem(db, id, (err, changes) => {
            expect(err).toBeNull();
            expect(changes).toBe(1);

            db.get('SELECT * FROM watch_items WHERE id = ?', [id], (err, row) => {
                expect(err).toBeNull();
                expect(row).toBeUndefined();
                done();
            });
        });
    });
});

test('deleteItem should NOT delete an item whose watchlist is 0', (done) => {
    checker.addItem(db, validItem({ watchlist: 0 }), (err, id) => {
        expect(err).toBeNull();

        checker.deleteItem(db, id, (err, changes) => {
            expect(changes).toBeFalsy();

            db.get('SELECT * FROM watch_items WHERE id = ?', [id], (err, row) => {
                expect(err).toBeNull();
                expect(row).toBeDefined();
                expect(row.title).toBe('Inception');
                done();
            });
        });
    });
});

test('deleteItem should not change anything for a non-existent id', (done) => {
    checker.deleteItem(db, 9999, (err, changes) => {
        expect(changes).toBeFalsy();
        countRows((countErr, total) => {
            expect(countErr).toBeNull();
            expect(total).toBe(0);
            done();
        });
    });
});

test.each([-1, 0, 'abc', null, undefined])(
    'deleteItem should not delete anything for the invalid id %p',
    (badId, done) => {
        checker.addItem(db, validItem({ watchlist: 1 }), (err) => {
            expect(err).toBeNull();

            checker.deleteItem(db, badId, (err, changes) => {
                expect(changes).toBeFalsy();

                countRows((countErr, total) => {
                    expect(countErr).toBeNull();
                    expect(total).toBe(1);
                    done();
                });
            });
        });
    }
);

// ---------------------------------------------------------------------------
// updateItem : Valid data
// ---------------------------------------------------------------------------
test('updateItem should modify an existing watch item in the database', (done) => {
    const initialItem = validItem({
        title: 'Interstellar',
        description: 'Before edit',
        rate: 3,
        watchlist: 1
    });

    checker.addItem(db, initialItem, (err, id) => {
        expect(err).toBeNull();

        const updatedData = {
            id: id,
            title: 'Interstellar - Director\'s Cut',
            description: 'Description mise à jour avec une super note',
            rate: 5,
            type: 1,
            watchlist: 0
        };

        checker.updateItem(db, updatedData, (err, changes) => {
            expect(err).toBeNull();
            expect(changes).toBe(1);

            db.get('SELECT * FROM watch_items WHERE id = ?', [id], (err, row) => {
                expect(err).toBeNull();
                expect(row).toBeDefined();
                expect(row.title).toBe('Interstellar - Director\'s Cut');
                expect(row.description).toBe('Description mise à jour avec une super note');
                expect(row.rate).toBe(5);
                expect(row.watchlist).toBe(0);
                done();
            });
        });
    });
});

test.each([
    [0, 0, 0],
    [3, 0, 1],
    [5, 1, 0],
    [2, 1, 1],
    [4, 2, 1]
])('updateItem should persist valid values rate=%p, type=%p, watchlist=%p', (rate, type, watchlist, done) => {
    checker.addItem(db, validItem(), (err, id) => {
        expect(err).toBeNull();

        checker.updateItem(db, {
            id,
            title: 'Updated title',
            description: 'Updated description',
            rate,
            type,
            watchlist
        }, (err, changes) => {
            expect(err).toBeNull();
            expect(changes).toBe(1);

            db.get('SELECT rate, type, watchlist FROM watch_items WHERE id = ?', [id], (err, row) => {
                expect(err).toBeNull();
                expect(row).toEqual({ rate, type, watchlist });
                done();
            });
        });
    });
});

test('updateItem should save a series season and episode', (done) => {
    checker.addItem(db, validItem({ type: 2 }), (err, id) => {
        expect(err).toBeNull();

        checker.updateItem(db, {
            ...validItem({ type: 2, season: 4, episode: 2 }),
            id
        }, (err, changes) => {
            expect(err).toBeNull();

            db.get('SELECT season, episode FROM watch_items WHERE id = ?', [id], (err, row) => {
                expect(err).toBeNull();
                expect(row).toEqual({ season: 4, episode: 2 });
                done();
            });
        });
    });
});

test('updateSeriesProgress should update only series on the main page', (done) => {
    checker.addItem(db, validItem({ type: 2, watchlist: 0 }), (err, mainId) => {
        expect(err).toBeNull();
        checker.addItem(db, validItem({ title: 'Watchlist series', type: 2, watchlist: 1 }), (watchlistErr, watchlistId) => {
            expect(watchlistErr).toBeNull();

            checker.updateSeriesProgress(db, mainId, 3, 5, (updateError, changes) => {
                expect(updateError).toBeNull();
                expect(changes).toBe(1);

                checker.updateSeriesProgress(db, watchlistId, 3, 5, (watchlistUpdateError, watchlistChanges) => {
                    expect(watchlistUpdateError).toBeNull();
                    expect(watchlistChanges).toBe(0);

                    db.get('SELECT season, episode FROM watch_items WHERE id = ?', [mainId], (mainReadError, mainRow) => {
                        expect(mainReadError).toBeNull();
                        expect(mainRow).toEqual({ season: 3, episode: 5 });
                        db.get('SELECT season, episode FROM watch_items WHERE id = ?', [watchlistId], (watchlistReadError, watchlistRow) => {
                            expect(watchlistReadError).toBeNull();
                            expect(watchlistRow).toEqual({ season: null, episode: null });
                            done();
                        });
                    });
                });
            });
        });
    });
});

// ---------------------------------------------------------------------------
// updateItem : Invalid data
// ---------------------------------------------------------------------------
describe('updateItem with invalid data', () => {
    const original = {
        title: 'Original',
        description: 'Description originale',
        rate: 3,
        type: 1,
        watchlist: 1
    };

    const expectUpdateRejected = (overrides, done) => {
        checker.addItem(db, validItem(original), (err, id) => {
            expect(err).toBeNull();

            checker.updateItem(db, { ...original, id, ...overrides }, (err, changes) => {
                expect(err).not.toBeNull();
                expect(changes).toBeFalsy();

                db.get('SELECT * FROM watch_items WHERE id = ?', [id], (err, row) => {
                    expect(err).toBeNull();
                    expect(row.title).toBe(original.title);
                    expect(row.description).toBe(original.description);
                    expect(row.rate).toBe(original.rate);
                    expect(row.type).toBe(original.type);
                    expect(row.watchlist).toBe(original.watchlist);
                    done();
                });
            });
        });
    };

    test.each([-1, 6, 100, 2.5, 'abc', '3', null, undefined, NaN])(
        'should reject an update with the invalid rate %p',
        (rate, done) => {
            expectUpdateRejected({ rate }, done);
        }
    );

    test.each([-1, 3, 99, 0.5, 'film', '1', null, undefined, NaN])(
        'should reject an update with the invalid type %p',
        (type, done) => {
            expectUpdateRejected({ type }, done);
        }
    );

    test.each([-1, 2, 99, 0.5, 'oui', '0', null, undefined, NaN])(
        'should reject an update with the invalid watchlist %p',
        (watchlist, done) => {
            expectUpdateRejected({ watchlist }, done);
        }
    );

    test.each(['', '   ', '\t', null, undefined])(
        'should reject an update with the invalid title %p',
        (title, done) => {
            expectUpdateRejected({ title }, done);
        }
    );

    test('should reject an update with an episode but no season', (done) => {
        expectUpdateRejected({ type: 2, episode: 1 }, done);
    });

    test('should not modify anything when the id does not exist', (done) => {
        checker.updateItem(db, validItem({ id: 9999 }), (err, changes) => {
            expect(changes).toBeFalsy();
            countRows((countErr, total) => {
                expect(countErr).toBeNull();
                expect(total).toBe(0);
                done();
            });
        });
    });
});