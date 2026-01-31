const express = require('express');
const noteModel = require('./models/note.models');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());


app.post('/',(req,res)=>{
    console.log("Home Screen");
    
})



app.post('/api/notes',async (req,res)=>{
    const {title,description} = req.body

    const note = await noteModel.create({
        title,description
    })

    res.status(201).json({
        messsage:"Note created successfully"
    })
})

app.get("/api/notes",async (req,res)=>{
    const notes = await noteModel.find()

    res.status(200).json({
        message:"Notes fetched",
        notes
    })
})


app.delete('/api/notes/:id',async (req,res)=>{
    const id = req.params.id

    await noteModel.findByIdAndDelete(id)

    
    res.status(200).json({
        message:"Note Deleted successfully"
    })
})


app.patch('/api/notes/:id',async (req,res)=>{
    const id = req.params.id
    const {description} = req.body

    await noteModel.findByIdAndUpdate(id,{description})

    res.status(200).json({
        message:"Note Updated",
        
    })

})


module.exports = app;
