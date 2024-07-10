var express = require('express');
var router = express.Router();
const auth = require('./auth');
const {db,url} = require('./config');
const {MongoClient} = require('mongodb');
const client = new MongoClient(url);
const users_c = client.db(db).collection("users"); 

/* GET home page. */
router.get('/', auth.isloginByTeacher, (req, res)=> {
    res.render("student_search",{students:[],search:{}});
    
}).post('/', auth.isloginByTeacher, async (req, res)=> {
    const {searchWords, searchMethod } = req.body;
    try {
        await client.connect();
        if(searchMethod=="username"){
            
            let students = await users_c.find({type:"student",username:{$regex:searchWords}}).toArray();
            res.render("student_search",{students:students,search:{method:"username",name:searchWords}});
        } else{
            let students = await users_c.find({type:"student",email:{$regex:searchWords}}).toArray();
            res.render("student_search",{students:students,search:{method:"email",name:searchWords}}); 
        }
    } finally {
        await client.close();
    }
    




    
});

module.exports = router;
