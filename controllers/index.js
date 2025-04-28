
const {user: userModel, photo: photoModel, tag:tagModel} = require("../models")
const {doesEmailExist, maxTags} = require("../services/index.js")
const {validateUserQueryParams, validatePhotoQueryParams} = require("../validations/index.js")

const createUser = async (req,res) => {
    const errors = validateUserQueryParams(req.body)
    if(errors.length > 0){
        return res.status(400).json({errors})
    }
    try {
        const {username, email} = req.body
        const userExisted = await doesEmailExist(email)
        if(userExisted){
            return res.status(404).json({message: "user already existed."})
        }
        const newUser = await userModel.create({username, email})
        return res.status(200).json({message: "user created successfully.", user: newUser})
    } catch (error) {
        res.status(500).json({message: "Internal server error.", error: error})
    }
}

const createPhoto = async (req,res) => {
    let errors = validatePhotoQueryParams(req.body)
    if(errors.length > 0){
        return res.status(400).json({errors})
    }
    try {
        const {imageUrl, description, altDescription, tags, userId} = req.body
        if(tags && tags.length > 5){
            return res.status(400).json({message: "A photo can have a maximum of 5 tags."})
        }
        if (tags && tags.some(tag => tag.length > 20)) {
            return res.status(400).json({ message: "Each tag must not exceed 20 characters in length." });
        }
        let createPhoto = await photoModel.create({imageUrl, description, altDescription, userId})
        if (tags && tags.length > 0){
            for (let i=0; i<tags.length; i++){
                await tagModel.create({name: tags[i], photoId: createPhoto.id})
            }
        }
        res.status(200).json({message: "Photo saved successfully.", photo: createPhoto})
    } catch (error) {
        res.status(500).json({message: "Internal server error.", error: error})
    }
}

const createTag = async (req,res) => {
    try {
        let photoId = req.params.photoId
        if(!photoId || isNaN(photoId)){
            return res.status(400).json({message: "photoId is requires and should be number."})
        }
        let {tags} = req.body
        const maxTag = await maxTags({tags, photoId})
        if(maxTag){
            return res.status(404).json({message: "tags are maximum"})
        }
        if(tags && tags.length > 0){
            for (let i=0; i<tags.length; i++){
                await tagModel.create({name: tags[i], photoId: photoId})
            }
        }
        let allTags = await tagModel.findAll({where: {photoId: photoId}})
        res.status(200).json({message: "Tag created successfully"})
    } catch (error) {
        res.status(500).json({message: "Internal server error.", error: error})
    }
}

module.exports = {createUser, createPhoto, createTag}
