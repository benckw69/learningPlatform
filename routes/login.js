var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const client = new MongoClient(config.url);
const ObjectId = require('mongodb').ObjectId;
const bcrypt = require('bcrypt');

/* GET login page. */
router.get('/',(req,res)=>{
  if(req.session.user) res.redirect('/');
  if(!(req.query.type=="student" || req.query.type=="teacher" || req.query.type=="admin")) res.redirect('/');
  else if(req.query.error==1)res.render('login',{user:"", errorMsg:"登入失敗：密碼輸入錯誤", title:config.title});
  else if(req.query.error==2)res.render('login',{user:"", errorMsg:"登入失敗：電郵地址輸入錯誤", title:config.title});
  else res.render('login',{user:"", errorMsg:"", title:config.title});

}).post('/', async (req,res)=>{
  //handle login request
  let type;
  if(req.query.type) type=req.query.type;

  let email = req.body.email, password = req.body.password;
  //take data from database to check whether can login
  try {
    await client.connect();
    const users = client.db("learningPlatform").collection("users");
    let user = await users.findOne({email:email, type:type});
    
    if(user){
      if(bcrypt.compareSync(password, user.password)){
        req.session.user = user;
        res.redirect('/');
      }
      else res.redirect('/login?type='+type+'&error=1');
    } else res.redirect('/login?type='+type+'&error=2');
  } finally {
      await client.close();
  }
});

module.exports = router;
