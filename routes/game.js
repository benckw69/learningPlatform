var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const client = new MongoClient(config.url);
const ObjectId = require('mongodb').ObjectId;
const menuId = new ObjectId("6674d5e69626bba98ce76506");

/* GET home page. */
router.get('/', (req, res)=> {
    if(req.session.user && req.session.user.type=="student") {
        res.render("game",{user:req.session.user, title:config.title});
    } else res.redirect("/");
    
});

module.exports = router;
