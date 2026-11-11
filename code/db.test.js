var checker = require('./db');

let db;

// S'exécute avant chaque test : ouvre une connexion propre
beforeEach(() => {
    db = checker.connectToDB();
});

afterEach(async () => {
    await checker.deleteAccount(db, 'DELETE FROM account WHERE username = ?', ['testuser']).catch(() => {});
});

test('connectToDB should return a database object', () => {
    expect(db).toBeDefined();
});

test('insertAccount should insert a new account into the database', async () => {
    const sql = checker.insertTodoQuery;
    const params = ['testuser', 'testpassword'];
    
    await checker.insertAccount(db, sql, params);
    
    const row = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM account WHERE username = ?', ['testuser'], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
    
    expect(row).toBeDefined();
    expect(row.username).toBe('testuser');
    expect(row.password).toBe('testpassword');    
});

test('sign_in should return the account if credentials are correct', async () => {
    const sql = checker.insertTodoQuery;
    const params = ['testuser', 'testpassword'];
    
    await checker.insertAccount(db, sql, params);
    
    const signInSql = checker.fetchTodoQuery;
    const signInParams = ['testuser', 'testpassword'];
    
    const row = await checker.sign_in(db, signInSql, signInParams);
    
    expect(row).toBeDefined();
    expect(row.username).toBe('testuser');
});

test('sign_in should return undefined if credentials are incorrect', async () => {
    const signInSql = checker.fetchTodoQuery;
    const signInParams = ['nonexistentuser', 'wrongpassword'];
    
    const row = await checker.sign_in(db, signInSql, signInParams);
    
    expect(row).toBeUndefined();
});
