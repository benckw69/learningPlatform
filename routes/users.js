var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const client = new MongoClient(config.url);
const ObjectId = require('mongodb').ObjectId;
const validator = require('email-validator');
const bcrypt = require('bcrypt');

/* GET users listing. */
router.get('/', async (req, res) => {
  if(req.session.user) {

    //view api.  Take user data from database
    try {
      await client.connect();
      const users_c = client.db("learningPlatform").collection("users");  
      console.log(req.session.user._id);
      let user = await users_c.findOne({_id:new ObjectId(req.session.user._id)});
      if(user){
        if(req.session.user.type == "student") res.render('users_view_student', {user:user, title:config.title});
        else if(req.session.user.type == "teacher") res.render('users_view_teacher', {user:user, title:config.title});
        else if(req.session.user.type == "admin") res.render('users_view_admin', {user:user, title:config.title});
      }
      else {
        res.redirect('/');
      }
    } finally {
        await client.close();
    }
  }
  else res.redirect('/');
}).get('/edit/personalInfo', async (req, res) => {
  let msgCode = req.query.msg, msg;
  if(msgCode=="1") msg= "更改資料成功";
  else if(msgCode=="2") msg = "更改資料失敗：密碼錯誤";
  else if(msgCode=="3") msg = "更改資料失敗，請稍後再試";
  else if(msgCode=="4") msg = "出現未知錯誤，請登出以確保沒有問題";
  else if(msgCode=="5") msg = "電郵地址格式錯誤";
  else if(msgCode=="6") msg = "用戶名稱不能為空";
  else if(msgCode=="7") msg = "用戶介紹不能為空";
  else if(msgCode=="8") msg = "錯誤：電郵地址已經存在，請更改其他電郵地址";
  if(req.session.user) {

    //edit user info api.  Take user data from database.  Handle error.
    try {
      await client.connect();
      const users_c = client.db("learningPlatform").collection("users");  
      let user = await users_c.findOne({_id:new ObjectId(req.session.user._id)});
      if(user){
        if(req.session.user.type == "student") res.render('users_edit_student', {user:user, title:config.title, msg:msg});
        else if(req.session.user.type == "teacher") res.render('users_edit_teacher', {user:user, title:config.title, msg:msg});
        else if(req.session.user.type == "admin") res.render('users_edit_admin', {user:user, title:config.title, msg:msg});
      }
      else res.redirect('/');
    } finally {
        await client.close();
    }
  }
  else res.redirect('/');
}).post('/edit/personalInfo', async(req, res) => {
  if(req.session.user && req.body) {
    let user_new = structuredClone(req.session.user);
    
    user_new.email = req.body.email;
    user_new.username = req.body.username;
    if(req.session.user.type=="teacher"){
      user_new.introduction = req.body.introduction;
    }
    if (!validator.validate(user_new.email)) res.redirect('/users/edit/personalInfo?msg=5');
    else if (user_new.length == 0) res.redirect('/users/edit/personalInfo?msg=6');
    else if (req.session.user.type=="teacher" && user_new.introduction.length == 0) res.redirect('/users/edit/personalInfo?msg=7');
    else if(!bcrypt.compareSync(req.body.password, req.session.user.password)) res.redirect('/users/edit/personalInfo?msg=2');
    else {
      try{
        await client.connect();
        const users_c = client.db("learningPlatform").collection("users");
        const email_repeat = await users_c.findOne({email:req.body.email, type:req.session.user.type});
        if(email_repeat && email_repeat._id.toString() != req.session.user._id) res.redirect('/users/edit/personalInfo?msg=8');
        else{
          delete user_new._id;
          const result = await users_c.replaceOne({_id:new ObjectId(req.session.user._id)}, user_new);
          if(result.acknowledged) {
            const result2 = await users_c.findOne({_id:new ObjectId(req.session.user._id)});
            if(result2){
              req.session.user = result2;
              res.redirect('/users/edit/personalInfo?msg=1');
            }
            else res.redirect('/users/edit/personalInfo?msg=4');
          }
          else res.redirect('/users/edit/personalInfo?msg=3');
        }
        
      } finally{
          await client.close();
      }
    }
    
  } else res.redirect('/');
    
}).get('/edit/password',(req,res)=>{
  let msgCode = req.query.msg, msg;
  if(msgCode=="1") msg= "更改密碼成功";
  else if(msgCode=="2") msg = "原始密碼錯誤，請重新輸入";
  else if(msgCode=="3") msg = "兩個輸入密碼並不一致，請重新輸入";
  else if(msgCode=="4") msg = "密碼長度未夠8位，請重新輸入";
  else if(msgCode=="5") msg = "更改資料失敗，請稍後再試";
  else if(msgCode=="6") msg = "出現未知錯誤，請登出以確保沒有問題";
  
  if(req.session.user) {
    res.render('users_edit_password',{user:req.session.user, title:config.title, msg:msg});
  }
  else res.redirect('/');

}).post('/edit/password',async (req,res)=>{
  if(req.session.user) {
    if(req.body.password_new != req.body.password_new2) res.redirect('/users/edit/password?msg=3');
    else if(req.body.password_o < 8)  res.redirect('/users/edit/password?msg=4');
    else if(!bcrypt.compareSync(req.body.password_o, req.session.user.password)) res.redirect('/users/edit/password?msg=2');
    else {
      const saltRounds = 10;
      const salt = bcrypt.genSaltSync(saltRounds);
      const hash = bcrypt.hashSync(req.body.password_new, salt);
      let user_new = structuredClone(req.session.user);
      user_new.password = hash;
      delete user_new._id;
      try{
        await client.connect();
        const users_c = client.db("learningPlatform").collection("users");
        const result = await users_c.replaceOne({_id:new ObjectId(req.session.user._id)},user_new);
        if(result.acknowledged) {
          const result2 = await users_c.findOne({_id:new ObjectId(req.session.user._id)});
          if(result2){
            req.session.user = result2;
            res.redirect('/users/edit/password?msg=1');
          }
          else res.redirect('/users/edit/password?msg=6');
        }
        else res.redirect('/users/edit/password?msg=5');
      } finally {
        await client.close();
      }
    }
  }
  else res.redirect('/');

}).get('/delete',async (req,res)=>{
  if(req.session.user && req.session.user.type=="student" || req.session.user.type=="teacher") {

    //delete user data and user paid course data.  Only allow teacher and student type to delete the account.  Need edit.
    let user = req.session.user;
    try {
      await client.connect();
      const users_c = client.db("learningPlatform").collection("users");  
      let user_d = await users_c.deleteOne({_id:new ObjectId(user._id)});
      if(user_d){
        const buyRecords = client.db("learningPlatform").collection("buyRecords");
        let user_d2 = await buyRecords.deleteMany({userId:new ObjectId(user._id)});
        delete req.session.user;
        res.redirect('/?msg=1');
      }
      else res.redirect('/?msg=2');
    } finally {
        await client.close();
    }
  }
  else res.redirect('/');
});

module.exports = router;
