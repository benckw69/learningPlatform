var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const {url,db} = require('./config');
const client = new MongoClient(url);
const ObjectId = require('mongodb').ObjectId;
const users_c = client.db(db).collection("users"); 
const buyRecords = client.db(db).collection("buyRecords");
const validator = require('email-validator');
const bcrypt = require('bcrypt');
const auth = require('./auth');

/* GET users listing. */
router.get('/', auth.islogin, async (req, res) => {
  if(req.user.type == "student") res.render('users_view_student');
  else if(req.user.type == "teacher") res.render('users_view_teacher');
  else if(req.user.type == "admin") res.render('users_view_admin');

}).get('/edit/personalInfo', auth.islogin, async (req, res) => {
  if(req.user.type == "student") res.render('users_edit_student');
  else if(req.user.type == "teacher") res.render('users_edit_teacher');
  else if(req.user.type == "admin") res.render('users_edit_admin');
    
}).post('/edit/personalInfo', auth.islogin, async(req, res) => {
  let user_new = structuredClone(req.user);
  req.session.messages = [];
  
  user_new.email = req.body.email;
  user_new.username = req.body.username;
  if(req.user.type=="teacher"){
    user_new.introduction = req.body.introduction;
  }
  if (!validator.validate(user_new.email)) req.session.messages.push("電郵地址格式錯誤");
  if (user_new.username.length == 0) req.session.messages.push("用戶名稱不能為空");
  if (req.user.type=="teacher" && user_new.introduction.length == 0) req.session.messages.push("用戶介紹不能為空");
  if(req.user.loginMethod=="email" && !bcrypt.compareSync(req.body.password, req.user.password)) req.session.messages.push("輸入的密碼與伺服器不符");
  if(req.session.messages.length != 0) res.redirect('/users/edit/personalInfo');
  else {
    try{
      await client.connect();
      if(req.user.loginMethod == "email") {
        const email_repeat = await users_c.findOne({email:req.body.email, type:req.user.type, loginMethod:"email"});
        if(email_repeat && email_repeat._id.toString() != req.user._id) req.session.messages.push("錯誤：電郵地址已經存在，請更改其他電郵地址");
      }
      else{
        delete user_new._id;
        const result = await users_c.replaceOne({_id:new ObjectId(req.user._id)}, user_new);
        if(result.acknowledged) {
          const result2 = await users_c.findOne({_id:new ObjectId(req.user._id)});
          if(result2){
            req.session.messages.push("更改資料成功");
          }
          else req.session.messages.push("出現未知錯誤，請登出以確保沒有問題");
        }
        else req.session.messages.push("更改資料失敗，請稍後再試");
      }
      res.redirect('/users/edit/personalInfo');
    } finally{
        await client.close();
    }
  }
    
}).get('/edit/password', auth.islogin, (req,res)=>{
  if(req.user.loginMethod=="email") res.render('users_edit_password');
  else res.redirect('/users')

}).post('/edit/password', auth.islogin, async (req,res)=>{
  req.session.messages = [];
  if(req.body.password_new != req.body.password_new2) req.session.messages.push("兩個輸入密碼並不一致，請重新輸入");
  if(req.body.password_new < 8)  req.session.messages.push("密碼長度未夠8位，請重新輸入");
  if(!bcrypt.compareSync(req.body.password_o, req.user.password)) req.session.messages.push("原始密碼錯誤，請重新輸入");
  if(req.session.messages) res.redirect('/users/edit/password');
  else {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(req.body.password_new, salt);
    let user_new = structuredClone(req.user);
    user_new.password = hash;
    delete user_new._id;
    try{
      await client.connect();
      const result = await users_c.replaceOne({_id:new ObjectId(req.user._id)},user_new);
      if(result.acknowledged) {
        const result2 = await users_c.findOne({_id:new ObjectId(req.user._id)});
        if(result2){
          req.session.messages.push("更改密碼成功");
        }
        else req.session.messages.push("出現未知錯誤，請登出以確保沒有問題");
      }
      else req.session.messages.push("更改資料失敗，請稍後再試");
    } finally {
      await client.close();
    }
  }

}).get('/delete',auth.isloginByStudentAndTeacher, async (req,res)=>{
  //delete user data and user paid course data.  Only allow teacher and student type to delete the account.  Need edit.
  let user = req.user;
  try {
    await client.connect(); 
    let user_d = await users_c.deleteOne({_id:new ObjectId(user._id)});
    if(user_d){
      let user_d2 = await buyRecords.deleteMany({userId:new ObjectId(user._id)});
      req.logOut((err)=>{
        res.redirect('/?msg=1');
      })
    }
    else res.redirect('/?msg=2');
  } finally {
      await client.close();
  }
    
});

module.exports = router;
