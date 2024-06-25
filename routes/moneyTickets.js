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

}).post('/insert', async(req, res) => {
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
  let msgCode=req.query.msg, msg;
  if(msgCode=="1") msg= "刪除成功";
  else if(msgCode=="2") msg = "刪除失敗，請稍後再試";

  if(req.session.user && req.session.user.type=="admin") res.render('moneyTickets_view', { user:req.session.user, moneyTickets:[{code:"abc123", money:12}], title:config.title, pop:msg });
  else res.redirect('/');
}).get('/new',(req,res)=>{
  let msgCode=req.query.msg, msg;
  if(msgCode=="1") msg= "添加使用卷成功";
  else if(msgCode=="2") msg = "已有此使用卷號碼，請嘗試輸入其他號碼";
  else if(msgCode=="3") msg = "號碼不能為空，請輸入號碼";
  else if(msgCode=="4") msg = "未能插入新紀錄，請稍後再試";

  if(req.session.user && req.session.user.type=="admin") res.render('moneyTickets_new', { user:req.session.user, title:config.title, msg:msg });
  else res.redirect('/');
}).post('/new', async(req,res)=>{
  if(req.session.user && req.session.user.type=="admin") {
    let code = req.body.code, money = req.body.money;
    const moneyTickets_new = {code:code, money:money};
    if(code.length==0) res.redirect('/moneyTickets/new?msg=3');
    else {
      try {
        await client.connect();
        const moneyTickets_c = client.db("learningPlatform").collection("moneyTickets");  
        const moneyTicketsExist = await moneyTickets_c.findOne({code:code});
        if(moneyTicketsExist) res.redirect('/moneyTickets/new?msg=2');
        else {
          const moneyTickets_insert = await moneyTickets_c.insertOne(moneyTickets_new);
          if(moneyTickets_insert.acknowledged) res.redirect('/moneyTickets/new?msg=1');
          else res.redirect('/moneyTickets/new?msg=4');
        }
      } finally {
        await client.close();
      }
    }
  }
  else res.redirect('/');
}).get('/delete',(req,res)=>{
  if(req.session.user && req.session.user.type=="admin") {
    //need edit
    let insert = true;
    if(insert) res.redirect('/moneyTickets/view?msg=1');
    else res.redirect('/moneyTickets/view?msg=2');
      
    
  }
  else res.redirect('/');
});

module.exports = router;
