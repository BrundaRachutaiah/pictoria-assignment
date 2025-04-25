const {user} = require("../models/users.js")
const {doesEmailExist} = require("../services/index.js")
const {validateUserQueryParams} = require("../validations/index.js")

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
        const newUser = await user.create({username, email})
        return res.status(200).json({message: "user created successfully.", user: newUser})
    } catch (error) {
        res.status(500).json({message: "Internal server error.", error: error})
    }
}

module.exports = {createUser}
