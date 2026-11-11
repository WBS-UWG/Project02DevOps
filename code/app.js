var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
const { connectToDB, closeDB, insertAccount, sign_in, fetchTodoQuery, insertTodoQuery } = require('./db');

var app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static('public'));

app.use(session({
    secret: '9087e7fbede17275cfafcf0319ce2baadffe8f27ba8589a21dd6772440bb3150',
    resave: false,
    saveUninitialized: false
}));

// Routes
app.get('/', async function(req, res) {
    res.render('page/index');
});

app.get('/landing', async function(req, res) {
    if (req.session.isConnected) {
        res.render('page/landing', { username: req.session.username });
    } else {
        res.redirect('/');
    }
});

app.post('/api/sign_in', async function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    const params = [username, password];
    
    const db = connectToDB();
    
    try {
        const row = await sign_in(db, fetchTodoQuery, params);
        if (row) {
            console.log('Connected successfully.');
            req.session.isConnected = true;
            req.session.username = row.username;
            return res.redirect('/landing');
        } else {
            console.log('Invalid credentials.');
            res.render('page/index', { message: 'Invalid credentials' });
        }
    } catch (err) {
        console.log(err);
        res.render('page/error');
    } finally {
        closeDB(db);
    }
});

app.get('/signup', async function(req, res) {
    res.render('page/signup');
});

app.post('/api/signup', async function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    const params = [username, password];
    
    const db = connectToDB();
    
    try {
        await insertAccount(db, insertTodoQuery, params);
        console.log('Account created successfully.');
        req.session.isConnected = true;
        req.session.username = username;
        return res.redirect('/landing');
    } catch (err) {
        console.log('Error during account creation:', err.message);
        res.render('page/signup', { message: 'Error while creating account. Try another username.' });
    } finally {
        closeDB(db);
    }
});


//start the web app
app.listen(8080, function () {
    console.log('App listening on port 8080!');
});