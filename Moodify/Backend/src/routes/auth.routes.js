const {Router} = require('express');
const { registerUser, loginUser } = require('../controllers/auth.controller');

const router = Router();
module.exports = router;


router.post('/register',registerUser)
router.post('/login',loginUser)
