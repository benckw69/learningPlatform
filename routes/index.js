var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const client = new MongoClient(config.url);
const ObjectId = require('mongodb').ObjectId;
const menuId = new ObjectId("6674d5e69626bba98ce76506");

/* GET home page. */
router.get('/', async (req, res)=> {
  res.render('index',{user:req.session.user, title:config.title});

}).get('/logout', (req, res) => {
  //handle logout and redirect to '/'.
  delete req.session.user;
  res.redirect("/");
}).get('/*', (req, res) => {
  //for other sites, redirect to the index page.
  res.redirect('/');
});

module.exports = router;
