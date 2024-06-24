var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const client = new MongoClient(config.url);
const ObjectId = require('mongodb').ObjectId;

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
}).post('/edit/personalInfo', (req, res) => {
  if(req.session.user) {
  
    //update data from database.  need edit
    let data = {type:type, email:req.body.email, username:req.body.username, id:id, money:123}

    let canUpdate = true;
    if(canUpdate ) res.redirect('/users/edit/personalInfo?msg=1');
    else res.redirect('/users/edit/personalInfo?msg=2');
  }
  res.redirect('/');
    
}).get('/edit/password',(req,res)=>{
  let msgCode = req.query.msg, msg;
  if(msgCode=="1") msg= "更改密碼成功";
  else if(msgCode=="2") msg = "更改密碼失敗：密碼錯誤";
  
  if(req.session.user) {
    res.render('users_edit_password',{user:req.session.user, title:config.title, msg:msg});
  }
  else res.redirect('/');

}).post('/edit/password',(req,res)=>{
  if(req.session.user) {
  
    //update the password from database. Check whether two new passwords are the same.  Need edit.
    let updated = true;
    if(req.body.password_new != req.body.password_new2) updated = false;


    if(updated) res.redirect('/users/edit/password?msg=1');
  }
  else res.redirect('/users/edit/password?msg=2');

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
