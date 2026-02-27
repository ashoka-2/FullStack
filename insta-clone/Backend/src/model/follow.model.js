const mongoose = require('mongoose');


const followSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'users'
    },
    followee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    status: {
        type: String,
        default: "pending",
        enum: {
            values: ["accepted", "rejected", "pending"],
            message: "Status can only be accepted, rejected or pending"
        }
    }
},
    { timestamps: true }
)


followSchema.index({ follower: 1, followee: 1 }, { unique: true })


const followModel = mongoose.model("follows", followSchema)

module.exports = followModel;