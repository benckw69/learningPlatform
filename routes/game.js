var express = require('express');
var router = express.Router();
const auth = require('./auth');

/* GET home page. */
router.get('/', auth.isloginByStudent, (req, res)=> {
    res.render("game");
    
});

module.exports = router;
