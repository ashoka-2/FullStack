const express = require('express');

const {followUserController, unfollowUserController, getFollowersController, respondToFollowRequestController, getAllUsersController} = require('../controllers/user.controller');
const identifyUser = require('../middlewares/auth.middleware');


const router = express.Router();



router.post('/follow/:id',identifyUser,followUserController);  
router.post('/unfollow/:id',identifyUser,unfollowUserController);

router.get('/followers',identifyUser,getFollowersController);
router.post('/followers/respond/:id',identifyUser,respondToFollowRequestController);

router.get('/allUsers',identifyUser,getAllUsersController)




module.exports = router;



