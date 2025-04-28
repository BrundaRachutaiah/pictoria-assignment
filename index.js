const express = require("express")
const cors = require("cors")
require("dotenv").config()
const {sequelize} = require("./models")
const {createUser, createPhoto, createTag} = require("./controllers/index.js")
const {searchImages, searchPhotoByTag, getSearchHistory} = require("./controllers/unsplashController.js")
const app = express()
const PORT = process.env.PORT
app.use(express.json())
app.use(cors())

app.post("/create/user", createUser)
app.post("/create/photo", createPhoto)
app.post("/create/tag/:photoId", createTag)
app.get("/search/photos", searchImages)
app.get("/photos/tag/search", searchPhotoByTag)
app.get("/search-history", getSearchHistory)

sequelize.authenticate().then(() => {
    console.log("database connected")
}).catch(error => {
    console.error("Unable to connect to database", error)
});

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
})


module.exports = {app}