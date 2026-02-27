const followModel = require('../model/follow.model');
const userModel = require('../model/user.model');



async function followUserController(req,res){

    const followerUsername = req.user.id;
    const followeeUsername = req.params.id;
    

    if(followeeUsername === followerUsername){
        return res.status(400).json({
            message:"You cannot follow yourself"
        })
    }

    const isFolloweeExists = await userModel.findById(followeeUsername)

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
    const followerUSername = req.user.id;
    const followeeUsername = req.params.id;


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

    const userId = req.user.id;
const followers = await followModel.find({ followee: userId, status: "pending" })
    .populate('follower', 'username profilePic fullName'); 

    res.status(200).json({
        message:"Followers retrieved successfully",
        data:followers
    })

}

async function respondToFollowRequestController(req,res){

    const followeeUsername = req.user.id;
    const followerUsername = req.params.id;
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


async function getAllUsersController(req, res) {
    try {
        const userId = req.user.id; 
        const rawUsers = await userModel.find({ 
            _id: { $ne: userId } 
        }).select("username profilePic fullName").lean();

        const usersWithFollowStatus = await Promise.all(
            rawUsers.map(async (user) => {
                const followRecord = await followModel.findOne({
                    follower: userId,
                    followee: user._id
                });
                user.isFollowing = Boolean(followRecord); 
                user.followStatus = followRecord ? followRecord.status : null; 
                return user;
            })
        );

        res.status(200).json({
            message: "Users fetched successfully",
            users: usersWithFollowStatus
        });
    } catch (error) {
        console.error("Explore Users Error:", error);
        res.status(500).json({ message: "Error fetching users" });
    }
}



module.exports = {
    followUserController,
    unfollowUserController,
    getFollowersController,
    respondToFollowRequestController,
    getAllUsersController
    
}
