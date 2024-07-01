var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const {url,db} = require('./config');
const auth = require('./auth');
const client = new MongoClient(url);
const users_c = client.db(db).collection("users");
const bcrypt = require('bcrypt');

/* GET login page. */
router.get('/',auth.isNotlogin,(req,res)=>{
  res.render('login');

}).post('/',auth.isNotlogin, async (req,res)=>{
  //handle login request
  let type=req.query.type;
  req.session.messages = [];

  let email = req.body.email, password = req.body.password;
  //take data from database to check whether can login
  try {
    await client.connect();
    let user = await users_c.findOne({email:email, type:type});
    
    if(user){
      if(bcrypt.compareSync(password, user.password)){
        req.session.user = user;
        res.redirect('/');
      }
      else {
        req.session.messages.push("登入失敗：密碼輸入錯誤");
        res.redirect('/login?type='+type);
      }
    } else {
      req.session.messages.push("登入失敗：電郵地址輸入錯誤");
      res.redirect('/login?type='+type);}
  } finally {
      await client.close();
  }
});

module.exports = router;
