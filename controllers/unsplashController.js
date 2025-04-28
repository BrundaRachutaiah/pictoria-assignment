const axios = require("axios")
require("dotenv").config()
const {tag: tagModel, photo: photoModel, searchHistory: searchHistoryModel} = require("../models")
const {validateSearchQueryParams, validateSearchPhotoByTagsQueryParams, validateSearchHistoryParams} = require("../validations/index.js")

const searchImages = async (req,res) => {
    try {
        let {query} = req.query
        let errors = validateSearchQueryParams(req.query)
        if (errors.length > 0){
            return res.status(400).json({errors})
        }
        let response = await axios.get(`https://api.unsplash.com/search/photos?query=${query}`,{
            headers: {
                Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
            }
        })
        if (!response || !response.data || !response.data.results || response.data.results.length === 0) {
            return res.status(404).json({ message: "No images found for the given query." });
        }
        let formatedData = response.data.results.map((img) => {
            return {
                imageUrl: img.urls, 
                description: img.description,
                altDescription: img.alt_description
            }
        })
        return res.status(200).json({Images: formatedData})
    } catch (error) {
        return res.status(500).json({message: "Error while fetching the Images.", error: error})
    }
}

const searchPhotoByTag = async (req,res) => {
    let errors = validateSearchPhotoByTagsQueryParams(req.query)
    if(errors.length > 0){
        return res.status(400).json({errors})
    }
    try {
        let {tag, sort = "ASC", userId} = req.query
        const validSortOrders = ["ASC", "DESC"];
        if (!validSortOrders.includes(sort.toUpperCase())) {
            return res.status(400).json({ message: "Invalid sort order. Use 'ASC' or 'DESC'." });
        }
        const tagsMatched = await tagModel.findAll({ where: { name: tag } });
        if (tagsMatched.length === 0) {
            return res.status(404).json({ message: "Tag not found." });
        }
        if (userId) {
            await searchHistoryModel.create({
                userId,
                query: tag,
            });
        }
        let  photoIds = tagsMatched.map((tag) => tag.photoId);
        let photos = await photoModel.findAll({
            where: { id: photoIds },
            include: [
                {
                    model: tagModel,
                    attributes: ["name"], 
                },
            ],
            order: [["dateSaved", sort.toUpperCase()]],
        })
        if (photos.length === 0) {
            return res.status(404).json({ message: "No photos found for the given tag." });
        }
        const response = photos.map((photo) => ({
            imageUrl: photo.imageUrl,
            description: photo.description,
            dateSaved: photo.dateSaved,
            tags: photo.tags?.map((tag) => tag.name) || [],
        }));

        res.status(200).json({ photos: response });
    } catch (error) {
        return res.status(500).json({message: "Error while fetching the Photos by tag.", error: error})
    }
}

const getSearchHistory = async (req,res) => {
    let errors = validateSearchHistoryParams(req.query)
    if(errors.length > 0){
        return res.status(400).json({errors})
    }
    try {
        let userId = parseInt(req.query.userId)
        let searchHistoies = await searchHistoryModel.findAll({where: {userId: userId}})
        if(searchHistoies.length === 0){
            return res.status(400).json({message: "no search history found"})
        }
        return res.status(200).json({searchHistoies: searchHistoies})
    } catch (error) {
        return res.status(500).json({message: "Error while fetching the search history by userId.", error: error})
    }
}

module.exports = {searchImages, searchPhotoByTag, getSearchHistory}