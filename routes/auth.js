exports.islogin = (req,res,next)=>{
    if(req.session.user) next();
    else res.redirect('/login?type=student');
}
exports.isNotlogin = (req,res,next)=>{
    if(!req.session.user) next();
    else res.redirect('/');
}
exports.isloginByStudent = (req,res,next)=>{
    if(req.sessionuser && req.session.user.type == "student") next();
    else if(req.session.user) res.redirect('/');
    else res.redirect('/login?type=student');
}
exports.isloginByTeacher = (req,res,next)=>{
    if(req.session.user && req.session.user.type == "teacher") next();
    else if(req.session.user) res.redirect('/');
    else res.redirect('/login?type=teacher');
}
exports.isloginByStudentAndTeacher = (req,res,next)=>{
    if(req.session.user && req.session.user.type == "teacher" || req.session.user.type == "student") next();
    else if(req.session.user) res.redirect('/');
    else res.redirect('/login?type=student');
}
exports.isloginByAdmin = (req,res,next)=>{
    if(req.session.user && req.session.user.type == "admin") next();
    else if(req.session.user) res.redirect('/');
    else res.redirect('/login?type=admin');
}