const express = require('express');

const {followUserController, unfollowUserController, getFollowersController, respondToFollowRequestController} = require('../controllers/user.controller');
const identifyUser = require('../middlewares/auth.middleware');


const router = express.Router();



router.post('/follow/:username',identifyUser,followUserController);  
router.post('/unfollow/:username',identifyUser,unfollowUserController);

router.post('/followers',identifyUser,getFollowersController);
router.post('/followers/respond/:username',identifyUser,respondToFollowRequestController);




module.exports = router;



