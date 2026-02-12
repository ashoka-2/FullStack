const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    caption: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        required: [true, "Img url is required for creating a post"]
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        required:[true,"user is is required for creating a post"]
    },
    

})



const postModel = mongoose.model("posts", postSchema)

module.exports = postModel;