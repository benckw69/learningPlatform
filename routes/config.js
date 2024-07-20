const audioLink = "/media/music.m4a";
const videoLink = "/media/river.mp4";
const title = "學無止境";

// const getTitle = async (url,db)=>{
//     const MongoClient = require('mongodb').MongoClient;
//     const client = new MongoClient(url);
//     try{
//         await client.connect();
//         const code_c = client.db(db).collection("code");
//         let code = await code_c.findOne();
//         if(code) return code.title;
//         else return "error";
//     } finally {
//         client.close();
//     }
// }

// getTitle(url,db).then((result)=>{
//     exports.title = result;
// })

exports.audioLink = audioLink;
exports.videoLink = videoLink;
exports.title = title;