require('dotenv').config(); // always first line

const app = require('./src/app');
const connectDb = require("./src/config/database")
connectDb();


app.listen(3000,()=>{
    console.log("Server is running on http://localhost:3000");
    
})