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
}).get('/myCourses',async(req,res)=>{
    //only teachers can see the page.
    if(req.session.user&& req.session.user.type=="teacher"){
        let courses_c = client.db("learningPlatform").collection("courses");
        let courses_u = client.db("learningPlatform").collection("users");
        let courses=[];
                //first, get course paid, then get course detail
        try {
          await client.connect();
          //convert author name from _id to username of the author
          let data = await courses_c.findOne({author:new ObjectId(req.session.user._id)});
          //let courseauthor_a = data.map((data)=>data.author);
          if(data){
            let courseauthor_a = data.author;
            let courseauthor_b = await courses_u.findOne({_id:courseauthor_a})
            if(courseauthor_b){
                let authorname = courseauthor_b.username;
                for (let i=0;i<data.length;i++) {
                data[i].author = authorname;
                }
            }
            res.render("courses_myCourses", {
                user: req.session.user,
                courses: data,title:config.title
            });
            } else res.render("courses_myCourses", {
                user: req.session.user,
                courses: [],title:config.title
            });
          
        } finally {
          await client.close();
        }
      } else res.redirect("/");
}).get('/myCourses/:courseId',async(req,res)=>{
    const {courseId} = req.params;
    //define edit message
    let msg = req.query.msg;
    if(req.query.msg=="1") msg="更改資料成功";
    else if(req.query.msg=="2") msg="更改資料失敗。請重新嘗試";
    if(req.session.user&& req.session.user.type=="teacher"){
        let courses_c = client.db("learningPlatform").collection("courses");
      let courses = [];
        //only course owner can see the page.  Course owner can edit the data, show the form that allow course owner to edit.  Need edit
        let course, canView=true;
        try {
          await client.connect();
          let data = await courses_c.findOne({_id:new ObjectId(req.params.courseId)});
          if (data) {
              res.render("courses_myCourses_edit", {
                user: req.session.user,
                course: data,
                courseId:req.params._id, title:config.title,msg:msg
              });
            }
        } finally {
          await client.close();
        }
    }
    else res.redirect('/');
}).post('/myCourses/:courseId',async(req,res)=>{
    const {courseId} = req.params;
    if(req.session.user&& req.session.user.type=="teacher"){
        console.log("a");
        let courses_c = client.db("learningPlatform").collection("courses");
        //rendering details of selected course
        //allow the course to be edit by course owner, handle edited content to database
            try {
            await client.connect();
            let data = await courses_c.findOne({name: req.body.name,
            introduction: req.body.introduction,
            money: req.body.money,
            content: req.body.content,
            whatPeopleLearn: req.body.whatPeopleLearn,
            videoLink: req.body.videoLink,
            photoLink: req.body.photoLink,
            category: req.body.category}
            );
 
            let data1 = await courses_c.updateOne({ _id: new ObjectId(courseId) }, {
                $set: {
            name: req.body.name,
            introduction: req.body.introduction,
            money: req.body.money,
            content: req.body.content,
            whatPeopleLearn: req.body.whatPeopleLearn,
            videoLink: req.body.videoLink,
            photoLink: req.body.photoLink,
            category: req.body.category
                }
          });
        if (data1.matchedCount == 1) {
            res.redirect(`/courses/myCourses/${req.params.courseId}?msg=1`);
        }
        else { 
            res.redirect(`/courses/myCourses/${req.params.courseId}?msg=2`);
        }
    } finally {
    await client.close();
  }}
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