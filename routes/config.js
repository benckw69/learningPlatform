const getTitle = async (url)=>{
    const MongoClient = require('mongodb').MongoClient;
    const client = new MongoClient(url);
    try{
        await client.connect();
        const code_c = client.db("learningPlatform").collection("code");
        let code = await code_c.findOne();
        if(code) return code.title;
        else return "error";
    } finally {
        client.close();
    }
}

const url = "mongodb+srv://benckw69:Xp8HRCGYad@cluster0.xhaav3r.mongodb.net/";
exports.url = url;
const title_promise = getTitle(url);
title_promise.then((result)=>{
    exports.title = result;
})