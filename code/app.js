var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
const { connectToDB, closeDB } = require('./db');

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
    res.render('page/landing');
});

//start the web app
app.listen(8080, function () {
    console.log('App listening on port 8080!');
});