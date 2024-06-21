var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://benckw69:Xp8HRCGYad@cluster0.xhaav3r.mongodb.net/";
const client = new MongoClient(url);
const ObjectId = require('mongodb').ObjectId;
const menuId = new ObjectId("6674d5e69626bba98ce76506");

/* GET home page. */
router.get('/', async (req, res)=> {
  try {
    await client.connect();
    const users = client.db("learningPlatform").collection("code");
    let menuCode = await users.findOne({_id:menuId});
    if(menuCode){
      if(req.session.user){
        if(req.session.user.type== "student") res.render('index',{user:req.session.user, menuBar:menuCode.student_menuBar, title:menuCode.title});
        if(req.session.user.type== "teacher") res.render('index',{user:req.session.user, menuBar:menuCode.teacher_menuBar, title:menuCode.title});
        if(req.session.user.type== "admin") res.render('index',{user:req.session.user, menuBar:menuCode.admin_menuBar, title:menuCode.title});
      }
      else res.render('index',{user:{type:"",username:""},menuBar:"", title:menuCode.title});
    } else res.send("網站錯誤");
  } finally {
      await client.close();
  }
}).get('/logout', (req, res) => {
  //handle logout and redirect to '/'.
  delete req.session.user;
  res.redirect("/");
}).get('/*', (req, res) => {
  //for other sites, redirect to the index page.
  res.redirect('/');
});

module.exports = router;
