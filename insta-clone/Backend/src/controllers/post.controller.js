const postModel = require('../model/post.model')

const ImageKit = require("@imagekit/nodejs")
const { toFile } = require("@imagekit/nodejs");
const jwt = require('jsonwebtoken');
const likeModel = require('../model/likes.model');
const followModel = require('../model/follow.model');
const userModel = require('../model/user.model');



const imagekit = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY
})



async function createPostController(req, res) {
    const file = await imagekit.files.upload({
        file: await toFile(Buffer.from(req.file.buffer), 'file'),
        fileName: req.file.originalname,
        folder: "cohort/insta-clone/posts"
    })

    const post = await postModel.create({
        caption: req.body.caption,
        image: file.url,
        user: req.user.id
    })

    res.status(201).json({
        message: "Post created successfully",
        post
    })
}



async function getPostsController(req, res) {

    const userId = req.user.id;

    const posts = await postModel.find({
        user: userId
    })

    res.status(200).json({
        message: "Posts fetched successfully",
        posts
    })
}



async function getPostDetailsController(req,res){

    const userId = req.user.id;
    const postId = req.params.postId;

    const post = await postModel.findById(postId);

    if(!post){
        return res.status(404).json({
            message: "Post not found"
        })
    }

    const isValidUser = post.user.toString() === userId;

    if(!isValidUser){
        return res.status(403).json({
            message: "Forbidden, you don't have access to this post"
        })
    }




    res.status(200).json({
        message: "Post details fetched successfully",
        post
    })
}



async function likePostController(req,res){
    const username = req.user.username;
    const postId = req.params.postId


    const post = await postModel.findById(postId);

    if(!post){
        return res.status(404).json({
            message: "Post not found"
    })
    }

    const isAlreadyLiked = await likeModel.findOne({
        post:postId,
        user:username
    })

    if(isAlreadyLiked){
        return res.status(200).json({
            message: "You have already liked this post",
            like:isAlreadyLiked
        })
    }

    const like = await likeModel.create({
        post:postId,
        user:username
    })

    
    res.status(200).json({
        message: "Post liked successfully",
        like
    })

}



async function unlikePostController(req,res){
    const username = req.user.username;
    const postId = req.params.postId;


     const post = await postModel.findById(postId);
     
    if(!post){
        return res.status(404).json({
            message: "Post not found"
        })
    }

    const isAlreadyLiked = await likeModel.findOne({
        post:postId,
        user:username
    })

    if(!isAlreadyLiked){
        return res.status(400).json({
            message: "You have not liked this post"
        })
    }


    const unlike = await likeModel.findByIdAndDelete(isAlreadyLiked._id);

    res.status(200).json({
        message: "Post unliked successfully",
        unlike
    })

}




async function getAllPostsController(req, res) {

    const username = req.user.username;

   const acceptedFollowers = await followModel.find({
        follower:username,
        status:"accepted"
    })

    const followeeUsernames = acceptedFollowers.map(f => f.followee);

    const users = await userModel.find({
        username: { $in: followeeUsernames }
    });

    const userIds = users.map(u => u._id);

    const posts = await postModel.find({
        user: { $in: userIds }
    });

    if (posts.length === 0) {
        return res.status(200).json({
            message: "You have no friends yet, so no posts to show",
            posts: []
        });
    }

    res.status(200).json({
        message: "Posts fetched successfully",
        posts
    })
}





module.exports = {
    createPostController,
    getPostsController,
    getPostDetailsController,
    likePostController,
    unlikePostController,
    getAllPostsController
}


