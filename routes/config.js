const url = "mongodb+srv://benckw69:Xp8HRCGYad@cluster0.xhaav3r.mongodb.net/";
const db = "learningPlatform";
const audioLink = "/media/music.m4a";
const videoLink = "/media/river.mp4"

const getTitle = async (url,db)=>{
    const MongoClient = require('mongodb').MongoClient;
    const client = new MongoClient(url);
    try{
        await client.connect();
        const code_c = client.db(db).collection("code");
        let code = await code_c.findOne();
        if(code) return code.title;
        else return "error";
    } finally {
        client.close();
    }
}

getTitle(url,db).then((result)=>{
    exports.title = result;
})

exports.url = url;
exports.db = db;
exports.audioLink = audioLink;
exports.videoLink = videoLink;

