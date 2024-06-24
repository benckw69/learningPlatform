var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const client = new MongoClient(config.url);

/*  */
router.get('/insert', (req, res) => {
  let msgCode = req.query.msg, msg;
  if(msgCode=="1") msg= "成功兌換現金卷";
  else if(msgCode=="2") msg = "兌換現金卷失敗，請再嘗試";

  if(req.session.user&& req.session.user.type=="student") res.render('moneyTickets_insert', { user:req.session.user, title:config.title, msg:msg });
  else res.redirect('/');

}).post('/insert', (req, res) => {
  if(req.session.user && req.session.user.type=="student") {
    //need edit
    let added = true;
    if(added) res.redirect('/moneyTickets/insert?msg=1');
    else res.redirect('/moneyTickets/insert?msg=2');
    let changeTicket = true;

  //connect to the database to see if ticket exist.  If exist, delete the ticket and add the money to the user
  
  if(changeTicket) res.redirect('/moneyTickets');
  }
  else res.redirect('/');
}).get('/view',(req,res)=>{
  if(req.session.user && req.session.user.type=="admin") res.render('moneyTickets_view', { user:req.session.user, moneyTickets:[{code:"abc123", money:12}], title:config.title });
  else res.redirect('/');
}).get('/new',(req,res)=>{
  let msgCode=req.query.msg, msg;
  if(msgCode=="1") msg= "添加使用卷成功";
  else if(msgCode=="2") msg = "添加使用卷失敗，請再嘗試";

  if(req.session.user && req.session.user.type=="admin") res.render('moneyTickets_new', { user:req.session.user, title:config.title, msg:msg });
  else res.redirect('/');
}).post('/new',(req,res)=>{
  if(req.session.user && req.session.user.type=="admin") {
    //need edit
    let insert = true;
    if(insert) res.redirect('/moneyTickets/new?msg=1');
    else res.redirect('/moneyTickets/new?msg=2');
      
    
  }
  else res.redirect('/');
});

module.exports = router;
