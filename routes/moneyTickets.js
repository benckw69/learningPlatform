var express = require('express');
var router = express.Router();

require('dotenv').config();
const { ObjectId, MongoClient } = require('mongodb');
const client = new MongoClient(process.env['server_url']);
const server_db = process.env['server_db'];
const users_c = client.db(server_db).collection("users");
const moneyTickets_c = client.db(server_db).collection("moneyTickets");
const auth = require('./auth');

/*  */
router.get('/insert', auth.isloginByStudent, (req, res) => {
  let msgCode = req.query.msg, msg;
  if(msgCode=="1") msg= "成功兌換現金卷";
  else if(msgCode=="2") msg = "兌換現金卷失敗，請再嘗試";
  else if(msgCode=="3") msg = "兌換現金卷失敗：號碼錯誤，請更改號碼後再嘗試";
  else if(msgCode=="4") msg = "兌換現金卷失敗：伺服器無法刪除紀錄，請稍後再嘗試";
  else if(msgCode=="5") msg = "兌換現金卷失敗：伺服器無法找到用家，請稍後再嘗試";
  else if(msgCode=="6") msg = "兌換現金卷失敗：伺服器無法新增現金給予用家，請稍後再嘗試";

  res.render('moneyTickets_insert', { msg:msg });

}).post('/insert', auth.isloginByStudent, async(req, res) => {
    
  let code=req.body.ticketNum;
  let user=req.user;
  try {
    await client.connect();
    const getMoneyTickets = await moneyTickets_c.findOne({code:code});
    if(getMoneyTickets) {
      //delete the tickets and modify the value of money of user
      const deleteMoneyTickets = await moneyTickets_c.deleteOne({code:code});
      if(deleteMoneyTickets.deletedCount == 1) {
        const getUser = await users_c.findOne({_id:user._id});
        if(getUser) {
          const addMoneyToUser = await users_c.updateOne({_id:user._id},{$set:{money:getUser.money + getMoneyTickets.money}});
          if(addMoneyToUser.modifiedCount == 1) res.redirect('/moneyTickets/insert?msg=1');
          else res.redirect('/moneyTickets/insert?msg=6');
        } else res.redirect('/moneyTickets/insert?msg=5');
      } else res.redirect('/moneyTickets/insert?msg=4');
    }
    //when there is no code in database, return error message
    else res.redirect('/moneyTickets/insert?msg=3');
  } finally {
    await client.close();
  }
  
  
}).get('/view', auth.isloginByAdmin, async(req,res)=>{
  let msgCode=req.query.msg, msg;
  if(msgCode=="1") msg= "刪除成功";
  else if(msgCode=="2") msg = "刪除失敗，請稍後再試";
  try{
    await client.connect();
    const moneyTickets = await moneyTickets_c.find().toArray();
    res.render('moneyTickets_view', { moneyTickets:moneyTickets, pop:msg });
  } finally {
    await client.close();
  }
    
}).get('/new', auth.isloginByAdmin, (req,res)=>{
  let msgCode=req.query.msg, msg;
  if(msgCode=="1") msg= "添加使用卷成功";
  else if(msgCode=="2") msg = "已有此使用卷號碼，請嘗試輸入其他號碼";
  else if(msgCode=="3") msg = "號碼不能為空，請輸入號碼";
  else if(msgCode=="4") msg = "未能插入新紀錄，請稍後再試";

  res.render('moneyTickets_new', { msg:msg });
  
}).post('/new', auth.isloginByAdmin, async(req,res)=>{
  let code = req.body.code, money = Number(req.body.money);
  const moneyTickets_new = {code:code, money:money};
  if(code.length==0) res.redirect('/moneyTickets/new?msg=3');
  else {
    try {
      await client.connect();
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
  
}).get('/delete', auth.isloginByAdmin, async(req,res)=>{
  if(req.query.id && req.query.id.length==24){
    let id=req.query.id;
    try {
      await client.connect();
      const deleteMoneyTickets = await moneyTickets_c.deleteOne({_id:new ObjectId(id)});
      if(deleteMoneyTickets.deletedCount == 1) res.redirect("/moneyTickets/view?msg=1");
      else res.redirect('/moneyTickets/view?msg=2');
    } finally {
      await client.close();
    }
  } else res.redirect('/moneyTickets/view');

});

module.exports = router;
