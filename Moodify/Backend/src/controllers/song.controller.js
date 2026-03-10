const songModel = require('../models/song.model');
const id3 = require('node-id3');
const storageService = require('../services/storage.service')

async function uploadSong(req,res){

    const songBuffer = req.file.buffer;
    const {mood} = req.body;

    const tags = id3.read(req.file.buffer)
    
    const [songFile, posterFile] = await Promise.all([
        storageService.uploadFile({
            buffer: songBuffer,
            filename: tags.title + ".mp3",
            folder: "cohort/moodify/songs"
        }),
        storageService.uploadFile({
            buffer: tags.image.imageBuffer,
            filename: tags.title + ".jpeg",
            folder: "cohort/moodify/posters"
        })
    ])


    const song = await songModel.create({
        title:tags.title,
        url:songFile.url,
        posterUrl:posterFile.url,
        mood
    })

    res.status(201).json({
        message:"Song uploaded successfully",
        song
    })

}



async function getSong(req,res){
    const {mood} = req.query;

     const songs = await songModel.aggregate([
        {$match:{mood:mood}},
        {$sample:{size:1}}
     ]);

     const song = songs.length > 0?songs[0]:null;

     if(!song){
        return res.status(404).json({
            message:"No song found for the given mood"
        })
     }

     res.status(200).json({
        message:"Song fetched successfully",
        song
     })
}





module.exports = {
    uploadSong,
    getSong
}