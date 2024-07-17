exports.islogin = (req,res,next)=>{
    if(req.user) next();
    else res.redirect('/login?type=student');
}
exports.isNotlogin = (req,res,next)=>{
    if(!req.user) next();
    else res.redirect('/');
}
exports.isloginByStudent = (req,res,next)=>{
    if(req.user && req.user.type == "student") next();
    else if(req.user) res.redirect('/');
    else res.redirect('/login?type=student');
}
exports.isloginByTeacher = (req,res,next)=>{
    if(req.user && req.user.type == "teacher") next();
    else if(req.user) res.redirect('/');
    else res.redirect('/login?type=teacher');
}
exports.isloginByStudentAndTeacher = (req,res,next)=>{
    if(req.user && (req.user.type == "teacher" || req.user.type == "student")) next();
    else if(req.user) res.redirect('/');
    else res.redirect('/login?type=student');
}
exports.isloginByAdmin = (req,res,next)=>{
    if(req.user && req.user.type == "admin") next();
    else if(req.user) res.redirect('/');
    else res.redirect('/login?type=admin');
}