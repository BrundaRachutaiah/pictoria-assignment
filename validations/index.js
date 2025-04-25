function validateUserQueryParams(query){
    const errors = []
    if(!query.username || typeof query.username !== "string"){
        errors.push("Username is required and should be string.")
    }
    if(!query.email || typeof query.email !== "string" || !query.email.includes("@") || !query.email.includes(".")){
        errors.push("email is require and should be string.")
    }
    return errors
}

module.exports = {validateUserQueryParams}