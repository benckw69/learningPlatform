var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
//const url = "mongodb://localhost:27017/";
const url = "mongodb+srv://benckw69:thrawN1996@cluster0.xhaav3r.mongodb.net/";
const client = new MongoClient(url);
const ObjectId = require('mongodb').ObjectId;

/* GET login page. */
router.get('/',(req,res)=>{
  if(req.session.user) res.redirect('/');
  else res.render('login');

}).post('/', async (req,res)=>{
  //handle login request

  let type;
  if(req.query.type) type=req.query.type;
  //take data from database to check whether can login
  try {
    await client.connect();
    const users = client.db("learningPlatform").collection("users");
    let user = await users.findOne({email:req.body.email, password:req.body.password, type:type});
    
    if(user){
      req.session.user = user;
      res.redirect('/');
    } else res.redirect('/login?type='+type+'&error=true');
  } finally {
      await client.close();
  }
});

module.exports = router;
