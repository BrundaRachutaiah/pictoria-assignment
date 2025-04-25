const express = require("express")
const cors = require("cors")
require("dotenv").config()
const {sequelize} = require("./models")
const {createUser} = require("./controllers/index.js")
const app = express()
const PORT = process.env.PORT
app.use(express.json())
app.use(cors())

app.post("/create-user", createUser)

sequelize.authenticate().then(() => {
    console.log("database connected")
}).catch(error => {
    console.error("Unable to connect to database", error)
});

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
})
