var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const client = new MongoClient(config.url);
const ObjectId = require('mongodb').ObjectId;

/* GET users listing. */
router.get('/', async (req, res) => {
  if(req.session.user) {

    //take data from database
    try {
      await client.connect();
      const users_c = client.db("learningPlatform").collection("users");  
      console.log(req.session.user._id);
      let user = await users_c.findOne({_id:new ObjectId(req.session.user._id)});
      if(user){
        if(req.session.user.type == "student") res.render('users_view_student', {user:user});
        else if(req.session.user.type == "teacher") res.render('users_view_teacher', {user:user});
        else if(req.session.user.type == "admin") res.render('users_view_admin', {user:user});
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
  if(req.session.user) {

    //take data from database
    try {
      await client.connect();
      const users_c = client.db("learningPlatform").collection("users");  
      let user = await users_c.findOne({_id:new ObjectId(req.session.user._id)});
      if(user){
        if(req.session.user.type == "student") res.render('users_edit_student', {user:user});
        else if(req.session.user.type == "teacher") res.render('users_edit_teacher', {user:user});
        else if(req.session.user.type == "admin") res.render('users_edit_admin', {user:user});
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
    if(canUpdate ) res.redirect('/users/edit/personalInfo?error=false');
    else res.redirect('/users/edit/personalInfo?error=true');
  }
  res.redirect('/');
    
}).get('/edit/password',(req,res)=>{
  if(req.session.user) {
    res.render('users_edit_password',{user:req.session.user});
  }
  else res.redirect('/');

}).post('/edit/password',(req,res)=>{
  if(req.session.user) {
  
    //update the password from database. Check whether two new passwords are the same.  Need edit.
    let updated = true;
    if(req.body.password_new != req.body.password_new2) updated = false;


    if(updated) res.redirect('/users/edit/password?error=false');
  }
  else res.redirect('/users/edit/password?error=true');

}).get('/delete',(req,res)=>{
  if(req.session.user) {

    //delete user data and user paid course data.  Only allow teacher and student type to delete the account.  Need edit.
    let successfullyDelete = true;

    if(successfullyDelete) res.redirect('/?delete=true');
  }
  else res.redirect('/');

});


module.exports = router;
