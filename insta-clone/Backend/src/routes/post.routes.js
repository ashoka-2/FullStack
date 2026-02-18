const express = require('express');


const { createPostController,getPostsController, getPostDetailsController ,likePostController, unlikePostController, getAllPostsController} = require('../controllers/post.controller');


const postRouter = express.Router();
const multer = require('multer');
const identifyUser = require('../middlewares/auth.middleware');

const upload = multer({storage:multer.memoryStorage()})

postRouter.post('/',upload.single("image"),identifyUser,createPostController)

postRouter.get('/',identifyUser,getPostsController)


postRouter.get('/details/:postId',identifyUser,getPostDetailsController)



postRouter.post('/like/:postId',identifyUser,likePostController)

postRouter.post('/unlike/:postId',identifyUser,unlikePostController)

postRouter.get('/all',identifyUser,getAllPostsController)




module.exports = postRouter;

