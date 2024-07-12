var express = require('express');
var router = express.Router();
const auth = require('./auth');
const {url,db} = require('./config');
const {ObjectId, MongoClient} = require('mongodb');
const client = new MongoClient(url);
const gameRecords_c = client.db(db).collection("gameRecords");

/* GET home page. */
router.get('/', auth.isloginByStudent, (req, res)=> {
    res.render("game");
    
}).post('/request', async (req,res)=>{
    const userId = new ObjectId(req.body.userId);
    const score = req.body.score;
    const date = req.body.date;
    const month = new Date().getMonth()<9?  "0"+(new Date().getMonth()+1): new Date().getMonth()+1;
    const yearMonthString = ""+new Date().getFullYear()+month;
    try{
        await client.connect();
        const response = await gameRecords_c.findOne({userId:userId,date:date});
        if(response) {
            if (Number(score) > response.score) {
                let newGameRecords = structuredClone(response);
                delete newGameRecords._id;
                newGameRecords.score = Number(score);
                await gameRecords_c.replaceOne({_id:userId},newGameRecords);
                res.json({newScore:true, oldScore:response.score});
            }
            else {res.json({newScore:false, oldScore:response.score});}
        }
        else {
            await gameRecords_c.insertOne({userId:userId,score:score,date:yearMonthString});
            res.json({newScore:true, oldScore:-1})
        }
    } finally{
        await client.close();
    }
});

module.exports = router;
