const express = require('express');
const { createPostController,getPostsController } = require('../controllers/post.controller');
const postRouter = express.Router();
const multer = require('multer');

const upload = multer({storage:multer.memoryStorage()})

postRouter.post('/',upload.single("image"),createPostController)


postRouter.get('/',getPostsController)

module.exports = postRouter;

