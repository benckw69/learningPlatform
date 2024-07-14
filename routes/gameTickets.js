var express = require('express');
var router = express.Router();
const auth = require('./auth');
const {db,url} = require('./config');
const {MongoClient} = require('mongodb');
const client = new MongoClient(url);
const users_c = client.db(db).collection("users"); 

/* GET home page. */
router.get('/', auth.isloginByTeacher, (req, res)=> {
    
}).post('/', auth.isloginByTeacher, async (req, res)=> {
    
})
module.exports = router;