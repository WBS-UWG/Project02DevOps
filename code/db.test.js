var checker = require('./db');

let db;

beforeEach((done) => {
    db = checker.connectToDB();
    db.once('open', done);
});

afterEach((done) => {
    db.close(done);
});

test('connectToDB should return a database object', () => {
    expect(db).toBeDefined();
});
