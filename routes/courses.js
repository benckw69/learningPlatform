var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const db = config.db;
const client = new MongoClient(config.url);
const ObjectId = require('mongodb').ObjectId;
const auth = require('./auth');
const path = require('path');
const fs = require('fs');
const {upload} = require('./multer');
const {searchRating} = require('./searchRating');

const courses_c = client.db(db).collection("courses");
const courses_u = client.db(db).collection("users");
const users_c = client.db(db).collection('users');
const buyRecords_c = client.db(db).collection("buyRecords");

/* GET courses page. */
//show all courses, pass course object to ejs. Can see the comments
router.get('/', auth.isloginByStudent, async (req,res)=>{
    //get all courses and ratings from database
    try {
        await client.connect();
        let courses = await courses_c.find().toArray();
    //map all authors and course ids into arrays from all courses
        let courseauthor_a = courses.map((courses)=>courses.author);
        let coursematch = courses.map((courses)=>courses._id);

        //for courses in database, convert author names from _id to their related username
        for (let i=0;i<courses.length;i++) {
        let courseauthor_b = await courses_u.findOne({_id:new ObjectId(courseauthor_a[i])}); //get all author data by author id
        courses[i].author = courseauthor_b.username;
        courses[i].rate = 0;
        }

        //for courses in database, calculate their related average rating
        courses = await searchRating(courses);
        if(courses) res.render('courses_all',{courses:courses, search:{method:"words",param:""}});
    } finally {
        await client.close();
    }
    
}).post('/', auth.isloginByStudent,async (req,res)=>{
    let {searchMethod} = req.body;
    try {
        await client.connect();
        if(searchMethod == "words"){
            let {searchWords} = req.body;
            let searchByWords = await courses_c.find({name:{$regex:searchWords}}).toArray();
            for(let i=0; i<searchByWords.length;i++){
                searchByWords[i].id = searchByWords[i].author;
                let findAuthorName = await users_c.findOne({_id:searchByWords[i].id});
                searchByWords[i].author = findAuthorName.username;
            }
            searchByWords = await searchRating(searchByWords);
            res.render('courses_all',{courses:searchByWords, search:{method:"words",param:searchWords}});
        } else if(searchMethod == "category"){
            let {category} = req.body;
            let searchByCategory;
            if(category=="all") searchByCategory = await courses_c.find().toArray();
            else searchByCategory = await courses_c.find({category:category}).toArray();
            for(let i=0; i<searchByCategory.length;i++){
                searchByCategory[i].id = searchByCategory[i].author;
                let findAuthorName = await users_c.findOne({_id:searchByCategory[i].id});
                searchByCategory[i].author = findAuthorName.username;
            }
            searchByCategory = await searchRating(searchByCategory);
            res.render('courses_all',{courses:searchByCategory, search:{method:"category",param:category}});
        } else if(searchMethod == "tutor"){
            let {searchWords} = req.body;
            let searchTutor = await users_c.find({username:{$regex:searchWords}, type:"teacher"}).toArray();
            let authorName = [];
            for(const i of searchTutor) {
                authorName.push(i._id);
            }
            let searchByAuthorId = await courses_c.find({author:{$in:authorName}}).toArray();
            for(let i=0;i<searchByAuthorId.length;i++){
                searchByAuthorId[i].id = searchByAuthorId[i].author;
                let findAuthorName = await users_c.findOne({_id:searchByAuthorId[i].id});
                searchByAuthorId[i].author = findAuthorName.username;
            }
            searchByAuthorId = await searchRating(searchByAuthorId);
            res.render('courses_all',{courses:searchByAuthorId, search:{method:"words",param:searchWords}});
        } 
        else res.redirect('/courses');
    } finally {
        await client.close();
    }

}).get('/paid', auth.isloginByStudent,async (req,res)=>{
    //only students can see the page.  Show the course student attended, pass only the course student attended
    let courses=[];
    try{
        await client.connect();
        let buyRecords = await buyRecords_c.find({userId:new ObjectId(req.user._id)}).toArray();
        if(buyRecords){
            for (const i of buyRecords){
                let boughtcourses = await courses_c.findOne({_id:i.courseId});
                courses.push(boughtcourses);
            }
            for (let i=0;i<courses.length;i++){
                let courseauthor = await courses_u.findOne({_id:courses[i].author});
                courses[i].author = courseauthor.username;
            }
            courses = await searchRating(courses);
            res.render('courses_paid',{courses:courses});
        } else {
            res.render('courses_paid',{courses:[], message:"你沒有任何購買紀錄！"});
        }
    } finally{
        await client.close();
    }

}).get('/myCourses', auth.isloginByTeacher, async(req,res)=>{
    //only teachers can see the page.
            //first, get course paid, then get course detail
    try {
        await client.connect();
        //convert author name from _id to username of the author
        let data = await courses_c.find({author:new ObjectId(req.user._id)}).toArray();
        if(data.length>=1){
        let courseauthor = await courses_u.findOne({_id:data[0].author})
        if(courseauthor){
            let authorname = courseauthor.username;
            for (let i=0;i<data.length;i++) {
            data[i].author = authorname;
            }
        }
        data = await searchRating(data);
        res.render("courses_myCourses", {
            courses: data
        });
        } else res.render("courses_myCourses", {
            courses: []
        });
        
    } finally {
        await client.close();
    }
}).get('/myCourses/:courseId', auth.isloginByTeacher,async(req,res)=>{
    const {courseId} = req.params;
    //define edit message
    let msg = req.query.msg;
    if(req.query.msg=="1") msg="更改資料成功";
    else if(req.query.msg=="2") msg="更改資料失敗。請重新嘗試";
    //only course owner can see the page.  Course owner can edit the data, show the form that allow course owner to edit.
    if(courseId.length == 24){
        try {
            await client.connect();
            let course = await courses_c.findOne({_id:new ObjectId(courseId)});
            if (course && course.author.toString()==req.user._id.toString()) {
                res.render("courses_myCourses_edit", {
                    course: course,
                    msg:msg
                });
            } else res.redirect('/courses/myCourses');
        } finally {
            await client.close();
        }
    } else res.redirect('/courses/myCourses');

    /* handle updated course content into database */
}).post('/myCourses/:courseId', auth.isloginByTeacher, upload.fields([{name: 'videoLink', maxCount:1},
    {name: 'photoLink', maxCount:1}]), async(req,res)=>{
    const {courseId} = req.params;
    //check if the courseId is valid
    if(courseId.length == 24){
        try {
            await client.connect();
                const videoLink = req.files.videoLink ? req.files.videoLink[0]: null; //set object video to null if no video is uploaded
                if (videoLink != null) { //setup renaming format if video exists
                    const videoextension = path.extname(videoLink.originalname);
                let videoLinkPath = req.files.videoLink ? `./public/videos/${courseId}_video${videoextension}` : null;
                if (videoLinkPath) { //rename video in directory if video exists
                fs.rename(videoLink.path, videoLinkPath, (err) => {
                    if (err) throw err;
                  });
                }
            }
            /* ...photo... */
            const photoLink = req.files.photoLink ? req.files.photoLink[0]: null;
                if (photoLink != null) {
                const photoextension = path.extname(photoLink.originalname);
                let photoLinkPath = req.files.photoLink ? `./public/images/${courseId}_photo${photoextension}` : null;
                if (photoLinkPath) {
                fs.rename(photoLink.path, photoLinkPath, (err) => {
                    if (err) throw err;
                  });
                }
                }
            // setup the new data set
            // if video or photo data exists in database, do not replace it with null
            newSet =  {
                name: req.body.name,
                introduction: req.body.introduction,
                money: parseInt(req.body.money),
                content: req.body.content,
                whatPeopleLearn: req.body.whatPeopleLearn,
                category: req.body.category
            }
            if(videoLink != null)newSet.video = videoLink;
            if(photoLink != null)newSet.photo = photoLink;
            let newData = await courses_c.updateOne({ _id: new ObjectId(courseId) }, {$set:newSet});
            //check if data is stored in database, else output fail message
            if (newData.matchedCount == 1) {
                res.redirect(`/courses/myCourses/${req.params.courseId}?msg=1`);
            }
            else { 
                res.redirect(`/courses/myCourses/${req.params.courseId}?msg=2`);
    }
        } finally {
            await client.close();
        }
    } else res.redirect('/courses/myCourses');

}).get('/newCourse', auth.isloginByTeacher, (req,res)=>{
    let msg="";
    if(req.query.msg==1) msg="新増課程成功";
    else if(req.query.msg==2) msg="新増課程失敗";
    else if(req.query.msg==3) msg+="課程名稱已被使用\n"
    else if(req.query.msg==4) msg+="課程價錢必須為數字\n"
    res.render('courses_newCourse',{
        user: req.user,
        msg:msg});
    
    
}).post('/newCourse', auth.isloginByTeacher, auth.isloginByTeacher, upload.fields([{name: 'videoLink', maxCount:1},
    {name: 'photoLink', maxCount:1}]), async(req,res)=>{
    //add course to database
        try {
        await client.connect();

        const videoLink = req.files.videoLink ? req.files.videoLink[0]: null; //set object video to null if no video is uploaded
        if (videoLink != null) { //setup renaming format if video exists
            const videoextension = path.extname(videoLink.originalname);
        let videoLinkPath = req.files.videoLink ? `./public/videos/${courseId}_video${videoextension}` : null;
        if (videoLinkPath) { //rename video in directory if video exists
        fs.rename(videoLink.path, videoLinkPath, (err) => {
            if (err) throw err;
          });
        }
    }
    /* ...photo... */
    const photoLink = req.files.photoLink ? req.files.photoLink[0]: null;
        if (photoLink != null) {
        const photoextension = path.extname(photoLink.originalname);
        let photoLinkPath = req.files.photoLink ? `./public/images/${courseId}_photo${photoextension}` : null;
        if (photoLinkPath) {
        fs.rename(photoLink.path, photoLinkPath, (err) => {
            if (err) throw err;
          });
        }
        }
    // setup the new data set
    // if no video or photo is uploaded, assign corresponding default file
    newSet =  {
        name: req.body.name,
        introduction: req.body.introduction,
        money: parseInt(req.body.money),
        content: req.body.content,
        author: new ObjectId(req.user._id),
        whatPeopleLearn: req.body.whatPeopleLearn,
        category: req.body.category
    }

        //check course name, output an error message if course name is replicated
    const isexistedCourse = await courses_c.findOne({ name: req.body.name });
    if (isexistedCourse) {
        res.redirect(`/courses/newCourse?msg=3`);
    } else {
        if (!Number.isInteger(parseInt(req.body.money))) { //check if money is valid number, else output an error message
        res.redirect(`/courses/newCourse?msg=4`);
        } else { 
            let insertData = await courses_c.insertOne(newSet);
            if(insertData.acknowledged) res.redirect(`/courses/newCourse?msg=1`);
            else res.redirect(`/courses/NewCourse?msg=2`);
        } 
    }
    } finally {
    await client.close();
  }
  
}).get('/:courseId', auth.isloginByStudent, async (req, res)=>{
    const {courseId} = req.params;
    if(courseId.length == 24){
        let msg="";
        if(req.query.msg==1) msg="評分成功";
        else if(req.query.msg==2) msg="評分失敗";
        else if(req.query.msg==3) msg="評分錯誤";
        //get single course detail by course id
        try {
            await client.connect();
            let courses = await courses_c.findOne({_id:new ObjectId(courseId)});
            if(courses){
                //replace author id with author name and find the introduction of author
                courseauthor =  await courses_u.findOne({_id:new ObjectId(courses.author)}); 
                courses.author = courseauthor.username;
                courses.authorDetails = courseauthor.introduction;
                let userId = new ObjectId(req.user._id);
                let courseId = courses._id;
                let buyRecords = await buyRecords_c.findOne({courseId:courseId, userId:userId});
                const paid = buyRecords? true:false;
                const rate = paid&&buyRecords.rate?  buyRecords.rate: null;
                res.render('courses_detail',{course:courses, paid:paid,rate:rate, msg:msg});
                
            } else res.redirect('/courses');
        }finally {
            await client.close();
        }
    } else res.redirect('/courses');
    
}).post('/:courseId', auth.isloginByStudent, async (req, res)=>{
    const {courseId} = req.params;
    if(courseId.length == 24){
        try {
            await client.connect();
            let data = Number(req.body.rate);
            if (data >=5.1 || data <=-0.1) {
                res.redirect(`/courses/${req.params.courseId}?msg=3`);
            }
            else {
                let updateRecords = await buyRecords_c.updateOne({$and:[{userId:new ObjectId(req.user._id)}, {courseId:new ObjectId(courseId)}]},{$set:{rate:data}});
                if(updateRecords.modifiedCount > 0) res.redirect(`/courses/${req.params.courseId}?msg=1`);
                else res.redirect(`/courses/${req.params.courseId}?msg=2`);
            }
        }finally {
            await client.close();
        }
    } else res.redirect('/courses');
    
}).get('/:courseId/buy', auth.isloginByStudent, async(req, res)=>{
    const {courseId} = req.params;
    if(courseId.length == 24){
        try {
            await client.connect();
            //insert buy record at database. need edit
            let course = await courses_c.findOne({_id:new ObjectId(courseId)});
            let user = await courses_u.findOne({_id:req.user._id});
            if (user.money >= course.money) {
                let canBuy = true;
                if (canBuy) {
                    let balance = user.money -= course.money;
                    await buyRecords_c.insertOne({userId:req.user._id, courseId:courseId});
                    await courses_u.updateOne({_id:req.user._id}, {$set: {money: balance}});
                }
            }
            res.render('courses_detail',{course:course});
        } finally {
            await client.close();
        }
    } else res.redirect('/courses');
});

module.exports = router;