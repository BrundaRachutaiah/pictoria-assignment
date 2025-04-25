const {user} = require("../models/users.js")

async function doesEmailExist(email){
    const exitingUser = await user.findOne({where: {email: email}})
    if (exitingUser){
        return true
    } else {
        return false
    }
}

module.exports = {doesEmailExist}