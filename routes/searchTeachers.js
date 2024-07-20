var express = require('express');
var router = express.Router();

require('dotenv').config();
const auth = require('./auth');
const {MongoClient} = require('mongodb');
const client = new MongoClient(process.env['server_url']);
const server_db = process.env['server_db'];
const users_c = client.db(server_db).collection("users"); 

/* GET home page. */
router.get('/', auth.isloginByStudent, (req, res)=> {
    res.render("teacher_search",{students:[],search:{}});
    
}).post('/', auth.isloginByStudent, async (req, res)=> {
    const {searchWords, searchMethod } = req.body;
    try {
        await client.connect();
        if(searchMethod=="username"){
            
            let students = await users_c.find({type:"teacher",username:{$regex:searchWords}}).toArray();
            res.render("teacher_search",{students:students,search:{method:"username",name:searchWords}});
        } else{
            let students = await users_c.find({type:"teacher",email:{$regex:searchWords}}).toArray();
            res.render("teacher_search",{students:students,search:{method:"email",name:searchWords}}); 
        }
    } finally {
        await client.close();
    }
    




    
});

module.exports = router;
