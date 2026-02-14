const express = require('express');
const { createPostController,getPostsController, getPostDetailsController } = require('../controllers/post.controller');
const postRouter = express.Router();
const multer = require('multer');
const { post } = require('./post.routes');

const upload = multer({storage:multer.memoryStorage()})

postRouter.post('/',upload.single("image"),createPostController)

postRouter.get('/',getPostsController)


postRouter.get('/details/:postId',getPostDetailsController)




module.exports = postRouter;

