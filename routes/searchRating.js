const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const db = config.db;
const client = new MongoClient(config.url);
const ObjectId = require('mongodb').ObjectId;
const buyRecords_c = client.db(db).collection("buyRecords");

async function searchRating(courses){
        let coursematch = courses.map((courses)=>courses._id);
    
    //define maps for courses rating
    let ratings=new Map();
    let courseCount=new Map();

    for (let i=0;i<coursematch.length;i++) { //for total course numbers
        let records = await buyRecords_c.find({courseId:new ObjectId(coursematch[i])}).toArray(); //retrieve all buying records by course id

        //for courses in database, calculate the average, then push the result into ratings
        for(let j=0;j<records.length;j++){ //for how many buying records do course[i] have
            if (records[j].rate) {
                let thiscourseId = records[j].courseId.toHexString();
                if (!ratings.has(thiscourseId)) {
                    ratings.set(thiscourseId, 0);
                    courseCount.set(thiscourseId, 0);
                }
                ratings.set(thiscourseId, ratings.get(thiscourseId) + records[j].rate);
                courseCount.set(thiscourseId, courseCount.get(thiscourseId) + 1);
                let currentcourseId = coursematch[i].toHexString();
                if (ratings.has(currentcourseId)) {
                    let averageRating = ratings.get(currentcourseId) / courseCount.get(currentcourseId);
                    courses[i].rate = averageRating.toPrecision(2);
                } else {
                    courses[i].rate = 0;
                }
                courses[i].rateCount = courseCount.get(thiscourseId);

            }
        }
        
    }
    return courses;
}
exports.searchRating = searchRating;