var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const client = new MongoClient(config.url);
const ObjectId = require('mongodb').ObjectId;

/* GET courses page. */
//show all courses, pass course object to ejs. Can see the comments
router.get('/',async (req,res)=>{
    if(req.session.user&& req.session.user.type=="student"){
        //get data from database
        let courses;
        try {
            await client.connect();
            const courses_c = client.db("learningPlatform").collection("courses");
            courses = await courses_c.find().toArray();
            if(courses) res.render('courses_all',{user:req.session.user, courses:courses, title:config.title});
        } finally {
            await client.close();
        }
    }
    else res.redirect('/');
    
}).get('/paid',async (req,res)=>{
    //only students can see the page.  Show the course student attended, pass only the course student attended
    if(req.session.user&& req.session.user.type=="student"){

        let courses=[];
        try{
            await client.connect();
            const buyRecords = client.db("learningPlatform").collection("buyRecords");
            let data = await buyRecords.find({userId:new ObjectId(req.session.user._id)}).toArray();
            if(data){
                const courses_c = client.db("learningPlatform").collection("courses");
                for (const i of data){
                    let data1 = await courses_c.findOne({_id:i.courseId});
                    if(data1) courses.push(data1);
                }
                res.render('courses_paid',{user:req.session.user, courses:courses, title:config.title});
            }
            else {
                res.render('courses_paid',{user:req.session.user, courses:[], message:"你沒有任何購買紀錄！", title:config.title});
            }
        } finally{
            await client.close();
        }
    }
    else res.redirect('/');
}).get('/myCourses',(req,res)=>{
    //only teachers can see the page. Need edit.
    if(req.session.user&& req.session.user.type=="teacher"){

        //first, get course paid, then get course detail
        let courses = [{ 
            name: 'Java',
            introduction:'This is a java course',
            money:500,
            content:"This is a java course.  ",
            whatPeopleLearn:"People can learn java through the course",
            author:"Alan",
            id:1,
            videoLink:"https://www.youtube.com/watch?v=xk4_1vDrzzo",
            photoLink:"https://www.freecodecamp.org/news/content/images/2023/09/javacrash.png",
            category:"programming"
        },{ 
            name: 'Violin',
            introduction:'This is a Violin course',
            money:1000,
            content:"This is a Violin course.  ",
            author:"Ben",
            id:2,
            videoLink:"https://www.youtube.com/watch?v=iPbCdOsrDK4",
            photoLink:"https://upload.wikimedia.org/wikipedia/commons/1/1b/Violin_VL100.png",
            category:"music"
        }
        ]

        res.render('courses_myCourses',{user:req.session.user, courses:courses, title:config.title});
    }
    else res.redirect('/');
}).get('/myCourses/:courseId',(req,res)=>{
    let msg;
    if(req.query.msg=="1") msg="更改資料成功";
    else if(req.query.msg=="2") msg="更改資料失敗。請重新嘗試";
    if(req.session.user&& req.session.user.type=="teacher"){
        //only course owner can see the page.  Course owner can edit the data, show the form that allow course owner to edit.  Need edit
        let course, canView=true;
        
        if(req.params.courseId=="1"){
            course = { 
                name: 'Java',
                introduction:'This is a java course',
                money:500,
                content:"This is a java course.  ",
                whatPeopleLearn:"People can learn java through the course",
                author:"Alan",
                id:1,
                videoLink:"https://www.youtube.com/watch?v=xk4_1vDrzzo",
                photoLink:"https://www.freecodecamp.org/news/content/images/2023/09/javacrash.png",
                category:"programming"
            }
        } else {
            course = { 
                name: 'Violin',
                introduction:'This is a Violin course',
                money:1000,
                content:"This is a Violin course.  ",
                author:"Ben",
                id:2,
                videoLink:"https://www.youtube.com/watch?v=iPbCdOsrDK4",
                photoLink:"https://upload.wikimedia.org/wikipedia/commons/1/1b/Violin_VL100.png",
                category:"music"
            }
        }
        res.render('courses_myCourses_edit',{user:req.session.user, course:course, courseId:req.params.courseId, title:config.title, msg:msg});
    }
    else res.redirect('/');
}).post('/myCourses/:courseId',(req,res)=>{
    if(req.session.user&& req.session.user.type=="teacher"){
        //allow the course to be edit by course owner, handle edited content to database
        let edited = true;
        if(login && type=="teacher" && id && edited) res.redirect('/courses/myCourses/'+req.params.courseId+'?msg=1');
        else if (login && type=="teacher" && id && !edited) res.redirect('/courses/myCourses/'+req.params.courseId+'?msg=2');
    }
    else res.redirect('/');

}).get('/:courseId', async (req, res)=>{
    if(req.session.user&& req.session.user.type=="student"){
        //get single course detail by course id
        try {
            await client.connect();
            const courses_c = client.db("learningPlatform").collection("courses"); 

            if(req.params.courseId.length == 24){
                let o_id = new ObjectId(req.params.courseId);
        
                let course = await courses_c.findOne({_id:o_id});
                
                if(!course) res.send("無法連接到伺服器，請重新嘗試。");
                else {
                    let userId = new ObjectId(req.session.user._id);

                    const buyRecords_c = client.db("learningPlatform").collection("buyRecords");  
                    let buyRecords = await buyRecords_c.findOne({courseId:course._id, userId:userId});
                    if(buyRecords) res.render('courses_detail',{user:req.session.user, course:course, paid:true, title:config.title});
                    else res.render('courses_detail',{user:req.session.user, course:course, paid:false, title:config.title});
                }
            }
            else res.redirect('/');
        } finally {
            await client.close();
        }
    }
    else res.redirect('/');
}).get('/:courseId/buy', (req, res)=>{
    if(req.session.user&& req.session.user.type=="student"){
    
    //insert buy record at database.  Need edit
    
        let canBuy = true;
        res.render('courses_detail',{user:req.session.user, course:course, title:config.title});
    }
    else res.redirect('/');
});

module.exports = router;
