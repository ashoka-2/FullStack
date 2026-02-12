const postModel = require('../model/post.model')

const ImageKit= require("@imagekit/nodejs") 
const {toFile}= require("@imagekit/nodejs"); 
const { Folders } = require('@imagekit/nodejs/resources/index.js');
const jwt = require('jsonwebtoken');



const imagekit = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY
})



async function createPostController(req,res){

    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({
            message:"Token not provided, Unauthorized",
        })
    }

    let decoded;
   try{
     decoded = jwt.verify(token, process.env.JWT_SECRET);
   }catch(err){ 
        return res.status(401).json({message:"Invalid token, Unauthorized", })
   }

    const file =await imagekit.files.upload({
        file: await toFile(Buffer.from(req.file.buffer),'file'),
        fileName:req.file.originalname,
        folder:"cohort/insta-clone/posts"
    })

    const post = await postModel.create({
        caption:req.body.caption,
        image:file.url,
        user:decoded.id
    })

    res.status(201).json({
        message:"Post created successfully",
        post
    })
}



async function getPostsController(req,res){
     const posts = await postModel.find()

    res.status(200).json({
        message:"Posts fetched",
        posts
    })
}




module.exports = {
    createPostController,
    getPostsController
}





