var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const {url,db} = require('./config');
const auth = require('./auth');
const client = new MongoClient(url);
const users_c = client.db(db).collection("users");
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const GoogleStrategy = require('passport-google-oidc');

passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }
  ,async (req, email, password, done)=> {
    try {
      await client.connect();
      let userExist = await users_c.findOne({email:email, type:req.query.type});
      console.log("userExist",userExist);
      if(!userExist) return done(null, false,{message:"找不到電郵地址，請重新輸入"});
      if(!bcrypt.compareSync(password, userExist.password)) return done(null, false,{message:"密碼不正確，請重新輸入"});
      return done(null, userExist);
    } finally {
      await client.close();
    }
  }
));

/* GET login page. */
router.get('/',auth.isNotlogin,(req,res)=>{
  res.render('login');

}).post('/',auth.isNotlogin, (req,res,next)=>{
  const callback = passport.authenticate('local', { successRedirect: '/',
    failureRedirect: '/login?type='+req.query.type,
    failureMessage: true });
    callback(req, res, next);
});

module.exports = router;
