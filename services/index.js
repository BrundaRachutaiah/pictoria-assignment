const {user: userModel, tag: tagModel} = require("../models")

async function doesEmailExist(email){
    const existingUser = await userModel.findOne({where: {email: email}})
    if (existingUser){
        return true
    } else {
        return false
    }
}

async function maxTags(body) {
    let tagsOfPhotos = await tagModel.findAll({where: {photoId: body.photoId}})
    if ((tagsOfPhotos.length == 5) || (tagsOfPhotos.length + body.tags.length > 5)){
        return true
    } 
    else {
        return false
    }
}

module.exports = {doesEmailExist, maxTags}