var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const client = new MongoClient(config.url);
const validator = require('email-validator');
const bcrypt = require('bcrypt');

router.get('/',(req,res)=>{

  let msgCode, msg, type, loginText;
  if(req.query.type) type=req.query.type;
  if(req.query.type=="student") loginText="學生註冊";
  else if(req.query.type=="teacher") loginText="老師註冊";
  if(req.query.msg) msgCode=req.query.msg;
  
  if(req.session.user) res.redirect("/");
  else if(msgCode=="1") res.render('register',{user:req.session.user, loginText: loginText, type:type, title:config.title, msg:"註冊失敗：兩個輸入密碼並不一致"});
  else if(msgCode=="2") res.render('register',{user:req.session.user, loginText: loginText, type:type, title:config.title, msg:"註冊失敗：密碼長度未夠8位"});
  else if(msgCode=="3") res.render('register',{user:req.session.user, loginText: loginText, type:type, title:config.title, msg:"註冊失敗：電郵地址已經存在"});
  else if(msgCode=="4") res.render('register',{user:req.session.user, loginText: loginText, type:type, title:config.title, msg:"註冊失敗：未能新増紀錄，請再嘗試"});
  else if(msgCode=="5") res.render('register',{user:req.session.user, loginText: loginText, type:type, title:config.title, msg:"註冊失敗：未能尋找新増紀錄，請再嘗試"});
  else if(msgCode=="6") res.render('register',{user:req.session.user, loginText: loginText, type:type, title:config.title, msg:"註冊失敗：電郵地址格式錯誤"});
  else if(type == "student" || type == "teacher") res.render('register',{user:req.session.user, loginText, type:type, title:config.title , msg:""});
  else res.redirect('/');

}).post('/', async (req, res) => {
  let type;
  if(req.query.type) type= req.query.type;
  let username = req.body.username, email = req.body.email;
  let password = req.body.password, password2 = req.body.password_repeat; 

  //check whether two passwords are the same and the length is longer than or equal to 8.
  if(password != password2 ) res.redirect('/register?type='+type+'&msg=1');
  else if(password.length < 8) res.redirect('/register?type='+type+'&msg=2');
  else if(!validator.validate(email)) res.redirect('/register?type='+type+'&msg=6');
  else {
    //check whether email exist in the database.
    try {
      await client.connect();

      const users_c = client.db("learningPlatform").collection("users");  
      const userExist = await users_c.findOne({email:email, type:type});
      if(userExist) res.redirect('/register?type='+type+'&msg=3');
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
          if(newUser) {
            req.session.user = newUser;
            res.redirect('/?msg=3');
          }
          else res.redirect('/register?type='+type+'&msg=5');
        }
        else res.redirect('/register?type='+type+'&msg=4');
      }
    } finally {
        await client.close();
    }
  }
});

module.exports = router;
