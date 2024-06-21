var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const client = new MongoClient(config.url);
const validator = require('email-validator');
const bcrypt = require('bcrypt');

router.get('/',(req,res)=>{

  let type, login, id, error;
  if(req.query.type) type=req.query.type;
  if(req.query.login) login=req.query.login;
  if(req.query.id) id=req.query.id;
  if(req.query.error) error=req.query.error;
  if(login || id) res.redirect("/?login="+login+"&type="+type+'&id='+id);
  else if(error=="1") res.render('register',{type:type, error:"兩個輸入密碼並不一致"});
  else if(error=="2") res.render('register',{type:type, error:"密碼長度未夠8位"});
  else if(error=="3") res.render('register',{type:type, error:"電郵地址已經存在"});
  else if(error=="4") res.render('register',{type:type, error:"未能新増紀錄，請再嘗試"});
  else if(error=="5") res.render('register',{type:type, error:"未能尋找新増紀錄，請再嘗試"});
  else if(error=="6") res.render('register',{type:type, error:"電郵地址格式錯誤"});
  else if(type == "student" || type == "teacher") res.render('register',{type:type, error:""});
  else res.redirect('/');

}).post('/', async (req, res) => {
  let type;
  if(req.query.type) type= req.query.type;
  let username = req.body.username, email = req.body.email;
  let password = req.body.password, password2 = req.body.password_repeat; 

  //check whether two passwords are the same and the length is longer than or equal to 8.
  if(password != password2 ) res.redirect('/register?type='+type+'&error=1');
  else if(password.length < 8) res.redirect('/register?type='+type+'&error=2');
  else if(!validator.validate(email)) res.redirect('/register?type='+type+'&error=6');
  else {
    //check whether email exist in the database.
    try {
      await client.connect();

      const users_c = client.db("learningPlatform").collection("users");  
      const userExist = await users_c.findOne({email:email});
      if(userExist) res.redirect('/register?type='+type+'&error=3');
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
          const newUser = await users_c.findOne({email:email});
          if(newUser) {
            req.session.user = newUser;
            res.redirect('/');
          }
          else res.redirect('/register?type='+type+'&error=5');
        }
        else res.redirect('/register?type='+type+'&error=4');
      }
    } finally {
        await client.close();
    }
  }
  //optional: encrypt the password
});

module.exports = router;
