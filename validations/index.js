function validateUserQueryParams(query) {
    const errors = [];
    if (!query.username || typeof query.username !== "string") {
        errors.push("Username is required and should be string.");
    }
    if (!query.email || typeof query.email !== "string" || !query.email.includes("@") || !query.email.includes(".")) {
        errors.push("email is require and should be string.");
    }
    return errors;
}

function validateSearchQueryParams(body){
    const errors = []
    if(!body.query || typeof body.query !== "string"){
        errors.push("Query is require and should be string.")
    }
    return errors
}

function validatePhotoQueryParams(query){
    const errors = []
    if (!query.imageUrl.startsWith('https://images.unsplash.com/')) {
        errors.push("Invalid image URL")
    }
    if(!query.userId || typeof query.userId !== "number"){
        errors.push("userId is required and should be number.")
    }
    return errors
}

function validateSearchPhotoByTagsQueryParams(query) {
    const errors = [];
    if (!query.tag || typeof query.tag !== "string") {
        errors.push("Tags require and should be string.");
    }
    if (query.userId && isNaN(parseInt(query.userId))) {
        errors.push("UserId must be number."); 
    }
    return errors;
}

function validateSearchHistoryParams(query) {
    const errors = [];
    if (!query.userId || isNaN(query.userId)) { // Use isNaN to validate invalid userId
        errors.push("userId is required and should be a number.");
    }
    return errors;
}

module.exports = {validateUserQueryParams, validateSearchQueryParams, validatePhotoQueryParams, validateSearchPhotoByTagsQueryParams, validateSearchHistoryParams}