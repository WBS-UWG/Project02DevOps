var checker = require('./db');

let db;

beforeEach(() => {
    db = checker.connectToDB();
});

afterEach(async () => {
    await checker.deleteAccount(db, 'DELETE FROM account WHERE username = ?', ['testuser']).catch(() => {});
});

test('connectToDB should return a database object', () => {
    expect(db).toBeDefined();
});
