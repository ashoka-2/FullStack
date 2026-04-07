import express from "express"
import useGraph from "./services/graph.ai.service.js"
const app = express()


app.get("/", (req, res) => {
    res.send("Hello World")
})

app.post("/use-graph",async (req,res)=>{
    const result = await useGraph("Write a factorial function in JS")

    res.json(result)
})


export default app