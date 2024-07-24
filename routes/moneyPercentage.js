var express = require('express');
var router = express.Router();

require('dotenv').config();
const {MongoClient} = require('mongodb');
const auth = require('./auth');
const client = new MongoClient(process.env['server_url']);
const server_db = process.env['server_db'];
const moneyPercentage_c = client.db(server_db).collection("moneyPercentage");

router.get('/',auth.isloginByAdmin, async (req,res)=>{
    try{
        await client.connect();
        const result = await moneyPercentage_c.findOne();
        res.render("moneyPercentage",{moneyPercentage:result});
    } finally {
        await client.close();
    }
    
}).post('/',auth.isloginByAdmin,async (req,res)=>{
    const moneyPercentage = parseInt(req.body.percentage);
    try{
        await client.connect();
        const result = await moneyPercentage_c.updateOne({},{$set:{percentage:moneyPercentage}})
        if(result.matchedCount==1){
            req.session.messages.push("更新成功");
        } else {
            req.session.messages.push("更新失敗，請重試");
        }
        res.redirect('/moneyPercentage');
    } finally {
        await client.close();
    }
    
})

module.exports = router;