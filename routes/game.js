var express = require('express');
var router = express.Router();

require('dotenv').config();
const auth = require('./auth');
const {MongoClient} = require('mongodb');
const server_db = process.env['server_db'];
const client = new MongoClient(url);
const gameRecords_c = client.db(server_db).collection("gameRecords");
const gameScore_c = client.db(server_db).collection("gameScore");
const users_c = client.db(server_db).collection("users");

/* GET home page. */
router.get('/', auth.isloginByStudent, (req, res)=> {
    res.render("game");
    
}).post('/request',auth.isloginByStudent, async (req,res)=>{
    const userId = req.user._id;
    const score = Number(req.body.score);
    const date = req.body.date;
    //make a date string that is yyyymm format
    const month = new Date().getMonth()<9?  "0"+(new Date().getMonth()+1): new Date().getMonth()+1;
    const yearMonthString = ""+new Date().getFullYear()+month;
    try{
        await client.connect();
        //get game settings and the game record of the user on the current month
        const gameSettings = await gameScore_c.findOne();
        const response = await gameRecords_c.findOne({userId:userId,date:date});
        //if there is game records, it means the personal played before at the current month
        //if there is better score, insert new records.
        //if the user break the score in the game setting, the student can gain money for reward
        //return with json format
        if(response) {
            if (score > response.score) {
                let returnSet = {newScore:true,thresholdScore:gameSettings.score, oldScore:response.score}
                const userScore = await gameRecords_c.updateOne({userId:userId,date:date},{$set:{score:score}});
                if(response.score<gameSettings.score && score>=gameSettings.score){
                    const user = await users_c.findOne({_id:userId});
                    if(user){
                        await users_c.updateOne({_id:userId},{$set:{money:user.money+gameSettings.money}})
                        returnSet.tickets = true;
                    } else res.json({error:true});
                }
                if(userScore.modifiedCount == 1) res.json(returnSet);
                else res.json({error:true});
            }
            else res.json({newScore:false, oldScore:response.score});
        }
        else {
            const insert = await gameRecords_c.insertOne({userId:userId,score:score,date:yearMonthString});
            if(!insert.acknowledged) res.json({error:true});
            else {
                let returnSet = {newScore:true,thresholdScore:gameSettings.score, oldScore:0}
                if(score>gameSettings.score){
                    const user = await users_c.findOne({_id:userId});
                    if(user){
                        await users_c.updateOne({_id:userId,date:date},{$set:{money:user.money+gameSettings.money}})
                        returnSet.tickets = true;
                    } else res.json({error:true});
                }
                res.json(returnSet);
            }
        }
    } finally{
        await client.close();
    }
}).get('/settings',auth.isloginByAdmin, async (req,res,next)=>{
    //get game settings and render settings page
    try{
        await client.connect();
        const gameScore = await gameScore_c.findOne();
        res.render("game_settings",{gameScore:gameScore});
    } finally{
        await client.close();
    }

}).post('/settings',auth.isloginByAdmin, async(req,res)=>{
    //update new game settings
    const {score,money} = req.body;
    try{
        await client.connect();
        const gameSetting = await gameScore_c.updateOne({},{$set:{score:Number(score),money:Number(money)}});
        if(gameSetting.matchedCount==1 && gameSetting.modifiedCount==1) req.session.messages.push("成功更改資料");
        else req.session.messages.push("你沒有資料需要更新");
        res.redirect("/game/settings");
    } finally {
        await client.close();
    }
    
});

module.exports = router;
