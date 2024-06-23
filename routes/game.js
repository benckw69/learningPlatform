var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const client = new MongoClient(config.url);
const ObjectId = require('mongodb').ObjectId;
const menuId = new ObjectId("6674d5e69626bba98ce76506");

/* GET home page. */
router.get('/', async (req, res)=> {
    try {
        await client.connect();
        const users = client.db("learningPlatform").collection("code");
        let menuCode = await users.findOne({_id:menuId});
        console.log(menuCode);
        if(menuCode){
            if(req.session.user && req.session.user.type=="student") {
                res.render("game",{user:req.session.user, menuBar:menuCode.student_menuBar, title:menuCode.title, title:config.title});
            }
          else res.redirect("/");
        } else res.send("網站錯誤");
    } finally {
        await client.close();
    }
    
});

module.exports = router;
