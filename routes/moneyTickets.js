var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const client = new MongoClient(config.url);

/*  */
router.get('/', (req, res) => {
  if(req.session.user) {
    res.render('moneyTickets_insert', { user:req.session.user });
  }
  else res.redirect('/');

}).post('/', (req, res) => {
  if(req.session.user) {
    //need edit
    res.render('moneyTickets_insert', { user:req.session.user });
    let changeTicket = true;

  //connect to the database to see if ticket exist.  If exist, delete the ticket and add the money to the user
  
  if(changeTicket) res.redirect('/moneyTickets');
  }
  else res.redirect('/');
}).get('/insert',(req,res)=>{
  if(req.session.user) res.render('moneyTickets_insert', { user:req.session.user });
  else res.redirect('/');
}).get('/view',(req,res)=>{
  if(req.session.user) res.render('moneyTickets_view', { user:req.session.user, moneyTickets:[{code:"abc123", money:12}] });
  else res.redirect('/');
}).get('/new',(req,res)=>{
  if(req.session.user) res.render('moneyTickets_new', { user:req.session.user });
  else res.redirect('/');
}).post('/new',(req,res)=>{
  if(req.session.user) {
    //need edit
    let insert = true;
    if(insert) res.redirect('/moneyTickets/new&error=false');
  }
  else res.redirect('/');
});

module.exports = router;
