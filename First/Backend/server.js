

require('dotenv').config();
const app = require("./src/app");
const connectDb = require("./src/config/database")



connectDb();

app.listen(3000, () => {
    console.log("Server is running at http://localhost:3000");

})