const followModel = require('../model/follow.model');
const userModel = require('../model/user.model');



async function followUserController(req,res){

    const followerUsername = req.user.username;
    const followeeUsername = req.params.username;
    

    if(followeeUsername === followerUsername){
        return res.status(400).json({
            message:"You cannot follow yourself"
        })
    }

    const isFolloweeExists = await userModel.findOne({
        username: followeeUsername
    })

    if(!isFolloweeExists){
        return res.status(404).json({
            message:"User not found"
        })
    }



    const isAlreadyFollwing = await followModel.findOne({
        follower:followerUsername,
        followee:followeeUsername

    })

    if(isAlreadyFollwing){
        return res.status(200).json({
            message:"You are already following this user",
            follow:isAlreadyFollwing
        })
    }

    const followerRecord = await followModel.create({
        follower:followerUsername,
        followee:followeeUsername
    })

    res.status(200).json({
        message:"Followed successfully",
        data:followerRecord
    })



}



async function unfollowUserController(req,res){
    const followerUSername = req.user.username;
    const followeeUsername = req.params.username;


    const isUserFollowing = await followModel.findOne({
        follower:followerUSername,
        followee:followeeUsername
    })

    if(!isUserFollowing){
        return res.status(400).json({
            message:`You are not following this ${followeeUsername}`
        })
    }

    const unfollow = await followModel.findByIdAndDelete(isUserFollowing._id)

    res.status(200).json({
        message:`You have unfollowed ${followeeUsername}`,
        data:unfollow
    })

}




async function getFollowersController(req,res){

    const username = req.user.username;

    const followers = await followModel.find({
        followee:username,
        status:"pending"

    })

    res.status(200).json({
        message:"Followers retrieved successfully",
        data:followers
    })

}

async function respondToFollowRequestController(req,res){

    const followeeUsername = req.user.username;
    const followerUsername = req.params.username;
    const {status} = req.body;


    if(status!=="accepted" && status!=="rejected"){
        return res.status(400).json({
            message:"Status must be either accepted or rejected"
        })
    }

    const followRequest = await followModel.findOne({
        follower:followerUsername,
        followee:followeeUsername,
        status:{$in: ["pending", "rejected","accepted"]}
    })

    if(!followRequest){
        return res.status(404).json({
            message:"Follow request not found"
        })
    }
    
    const updatedFollowRequest = await followModel.findByIdAndUpdate(
        followRequest._id,
        {status:status},
        {returnDocument:"after"}
    )

    res.status(200).json({
        message:"Follow request status updated successfully",
        data:updatedFollowRequest
    })


}





module.exports = {
    followUserController,
    unfollowUserController,
    getFollowersController,
    respondToFollowRequestController
}
