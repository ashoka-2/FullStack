import express from "express"
import useGraph from "./services/graph.ai.service.js"
const app = express()


app.post("/",async (req,res)=>{
    const result = await useGraph("Write a factorial function in JS")

    res.json(result)
})


export default app