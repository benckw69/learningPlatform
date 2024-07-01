var express = require('express');
var router = express.Router();

const { MongoClient } = require('mongodb');
const auth = require('./auth');
const {url,db} = require('./config');
const client = new MongoClient(url);
const users_c = client.db(db).collection("users");
const validator = require('email-validator');
const bcrypt = require('bcrypt');

router.get('/',auth.isNotlogin,(req,res)=>{
  if(req.query.type=="admin") res.redirect("/");
  else res.render('register');

}).post('/',auth.isNotlogin, async (req, res) => {
  let type = req.query.type;
  let username = req.body.username, email = req.body.email;
  let password = req.body.password, password2 = req.body.password_repeat; 
  req.session.messages = [];

  //check whether two passwords are the same and the length is longer than or equal to 8.
  if(password != password2 ) req.session.messages.push("註冊失敗：兩個輸入密碼並不一致");
  if(password.length < 8) req.session.messages.push("註冊失敗：密碼長度未夠8位");
  if(!validator.validate(email)) req.session.messages.push("註冊失敗：電郵地址格式錯誤");
  if(!! req.session.messages.length) res.redirect('/register?type='+type);
  else {
    //check whether email exist in the database.
    try {
      await client.connect();
      const userExist = await users_c.findOne({email:email, type:type});
      if(userExist) req.session.messages.push("註冊失敗：電郵地址已經存在");
      else {
        //insert data into database
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(password, salt);
        let userData = {type:type, email:req.body.email, username:username, password:hash};
        if(type == "student" || type == "teacher") userData.money = 0;
        if(type == "teacher") userData.introduction = "";
        const user = await users_c.insertOne(userData);
        //check whether data are inserted.  Find back the inserted data
        if(user.acknowledged) {
          const newUser = await users_c.findOne({email:email, type:type});
          if(newUser) req.session.user = newUser;
          else req.session.messages.push("註冊失敗：未能尋找新増紀錄，請再嘗試");
        }
        else req.session.messages.push("註冊失敗：未能新増紀錄，請再嘗試");
      }
      if(!! req.session.messages.length) res.redirect('/register?type='+type);
      else res.redirect('/?msg=3');
    } finally {
        await client.close();
    }
  }
});

module.exports = router;
