var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', (req, res)=> {
    if(req.session.user && req.session.user.type=="student") {
        res.render("game",{user:req.session.user});
    } else res.redirect("/");
    
});

module.exports = router;
