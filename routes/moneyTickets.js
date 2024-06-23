var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const client = new MongoClient(config.url);

/*  */
router.get('/insert', (req, res) => {
  if(req.session.user) res.render('moneyTickets_insert', { user:req.session.user, title:config.title, msg:"" });
  else res.redirect('/');

}).post('/', (req, res) => {
  if(req.session.user) {
    //need edit
    let added = true;
    if(added) res.render('moneyTickets_insert', { user:req.session.user, title:config.title, msg:"成功兌換現金卷" });
    else res.render('moneyTickets_insert', { user:req.session.user, title:config.title, msg:"兌換現金卷失敗，請再嘗試" });
    let changeTicket = true;

  //connect to the database to see if ticket exist.  If exist, delete the ticket and add the money to the user
  
  if(changeTicket) res.redirect('/moneyTickets');
  }
  else res.redirect('/');
}).get('/view',(req,res)=>{
  if(req.session.user) res.render('moneyTickets_view', { user:req.session.user, moneyTickets:[{code:"abc123", money:12}], title:config.title });
  else res.redirect('/');
}).get('/new',(req,res)=>{
  if(req.session.user) res.render('moneyTickets_new', { user:req.session.user, title:config.title, msg:"" });
  else res.redirect('/');
}).post('/new',(req,res)=>{
  if(req.session.user) {
    //need edit
    if(req.session.user) {
      let insert = true;
      if(insert) res.render('moneyTickets_new', { user:req.session.user, title:config.title, msg:"添加使用卷成功" });
      else res.render('moneyTickets_new', { user:req.session.user, title:config.title, msg:"添加使用卷失敗，請再嘗試" });
       
    }
  }
  else res.redirect('/');
});

module.exports = router;
