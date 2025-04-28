const { createUser, createPhoto, createTag } = require("../controllers/index.js");
const { searchImages, searchPhotoByTag, getSearchHistory } = require("../controllers/unsplashController.js");
const { doesEmailExist, maxTags } = require("../services/index.js");
const { validateUserQueryParams, validatePhotoQueryParams, validateSearchQueryParams, validateSearchPhotoByTagsQueryParams, validateSearchHistoryParams } = require("../validations/index.js");
const { user: userModel, photo: photoModel, tag: tagModel, searchHistory: searchHistoryModel } = require("../models");
const axios = require("axios");

jest.mock("../services/index.js", () => ({
    doesEmailExist: jest.fn(),
    maxTags: jest.fn(),
}));

jest.mock("../validations/index.js", () => ({
    validateUserQueryParams: jest.fn(),
    validatePhotoQueryParams: jest.fn(),
    validateSearchQueryParams: jest.fn(),
    validateSearchPhotoByTagsQueryParams: jest.fn(),
    validateSearchHistoryParams: jest.fn(),
}));

jest.mock("../models", () => ({
    user: {
        create: jest.fn(),
    },
    photo: {
        create: jest.fn(),
        findAll: jest.fn(),
    },
    tag: {
        create: jest.fn(),
        findAll: jest.fn(),
    },
    searchHistory: {
        create: jest.fn(),
        findAll: jest.fn(),
    },
}));

jest.mock("axios");

describe("createUser function testing", () => {
    let req, res;
    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {
                username: "newUser",
                email: "newuser@example.com",
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });
    it("should create a user successfully", async () => {
        validateUserQueryParams.mockReturnValue([]);
        doesEmailExist.mockResolvedValue(false);
        userModel.create.mockResolvedValue(req.body);
        await createUser(req, res);
        expect(validateUserQueryParams).toHaveBeenCalledWith(req.body);
        expect(doesEmailExist).toHaveBeenCalledWith("newuser@example.com");
        expect(userModel.create).toHaveBeenCalledWith({
            username: "newUser",
            email: "newuser@example.com",
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "user created successfully.",
            user: req.body,
        });
    });
    it("should return 400 for validation errors", async () => {
        validateUserQueryParams.mockReturnValue(["Username is required"]);
        await createUser(req, res);
        expect(validateUserQueryParams).toHaveBeenCalledWith(req.body);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errors: ["Username is required"] });
    });
    it("should return 404 if user already exists", async () => {
        validateUserQueryParams.mockReturnValue([]);
        doesEmailExist.mockResolvedValue(true);
        await createUser(req, res);
        expect(doesEmailExist).toHaveBeenCalledWith("newuser@example.com");
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "user already existed." });
    });
    it("should handle internal server error", async () => {
        validateUserQueryParams.mockReturnValue([]);
        doesEmailExist.mockResolvedValue(false);
        userModel.create.mockRejectedValue(new Error("Database error"));
        await createUser(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: "Internal server error.",
            error: expect.any(Error),
        });
    });
});

describe("createPhoto function testing", () => {
    let req, res;
    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {
                imageUrl: "https://images.unsplash.com/photo",
                description: "A beautiful photo",
                altDescription: "Alt text for the photo",
                tags: ["tag1", "tag2"],
                userId: 1,
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });
    it("should save a photo successfully", async () => {
        validatePhotoQueryParams.mockReturnValue([]); 
        photoModel.create.mockResolvedValue({ id: 1, ...req.body }); 
        await createPhoto(req, res);
        expect(validatePhotoQueryParams).toHaveBeenCalledWith(req.body);
        expect(photoModel.create).toHaveBeenCalledWith({
            imageUrl: "https://images.unsplash.com/photo",
            description: "A beautiful photo",
            altDescription: "Alt text for the photo",
            userId: 1,
        });
        expect(tagModel.create).toHaveBeenCalledTimes(2); 
        expect(tagModel.create).toHaveBeenCalledWith({ name: "tag1", photoId: 1 });
        expect(tagModel.create).toHaveBeenCalledWith({ name: "tag2", photoId: 1 });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Photo saved successfully.",
            photo: { id: 1, ...req.body },
        });
    });
    it("should return 400 if validation errors exist", async () => {
        validatePhotoQueryParams.mockReturnValue(["Invalid image URL"]);
        await createPhoto(req, res);
        expect(validatePhotoQueryParams).toHaveBeenCalledWith(req.body);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errors: ["Invalid image URL"] });
    });
    it("should return 400 if tags exceed maximum limit", async () => {
        req.body.tags = ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"]; 
        validatePhotoQueryParams.mockReturnValue([]); 
        await createPhoto(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "A photo can have a maximum of 5 tags.",
        });
    });
    it("should return 400 if a tag exceeds character limit", async () => {
        req.body.tags = ["a".repeat(21)]; 
        validatePhotoQueryParams.mockReturnValue([]); 
        await createPhoto(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "Each tag must not exceed 20 characters in length.",
        });
    });
    it("should handle internal server errors", async () => {
        validatePhotoQueryParams.mockReturnValue([]);
        photoModel.create.mockRejectedValue(new Error("Database error")); 
        await createPhoto(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: "Internal server error.",
            error: expect.any(Error),
        });
    });
});

describe("createTag function testing", () => {
    let req, res;
    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            params: {
                photoId: "1", 
            },
            body: {
                tags: ["tag1", "tag2"], 
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });
    it("should create tags successfully", async () => {
        maxTags.mockResolvedValue(false);
        tagModel.findAll.mockResolvedValue([]);
        await createTag(req, res);
        expect(maxTags).toHaveBeenCalledWith({
            tags: ["tag1", "tag2"],
            photoId: "1",
        });
        expect(tagModel.create).toHaveBeenCalledTimes(2); // Two tags should be created
        expect(tagModel.create).toHaveBeenCalledWith({ name: "tag1", photoId: "1" });
        expect(tagModel.create).toHaveBeenCalledWith({ name: "tag2", photoId: "1" });
        expect(tagModel.findAll).toHaveBeenCalledWith({ where: { photoId: "1" } });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Tag created successfully",
        });
    });
    it("should return 400 if photoId is invalid", async () => {
        req.params.photoId = "invalid"; 
        await createTag(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "photoId is requires and should be number.",
        });
    });
    it("should return 404 if tags exceed the maximum limit", async () => {
        maxTags.mockResolvedValue(true); 
        await createTag(req, res);
        expect(maxTags).toHaveBeenCalledWith({
            tags: ["tag1", "tag2"],
            photoId: "1",
        });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "tags are maximum",
        });
    });
    it("should handle internal server errors", async () => {
        maxTags.mockRejectedValue(new Error("Database error")); 
        await createTag(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: "Internal server error.",
            error: expect.any(Error),
        });
    });
});

describe("searchImages function testing", () => {
    let req, res;
    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            query: {
                query: "nature", 
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });
    it("should return images successfully", async () => {
        validateSearchQueryParams.mockReturnValue([]);
        axios.get.mockResolvedValue({
            data: {
                results: [
                    {
                        urls: { regular: "https://images.unsplash.com/photo1" },
                        description: "Beautiful nature",
                        alt_description: "Nature view",
                    },
                    {
                        urls: { regular: "https://images.unsplash.com/photo2" },
                        description: "Mountain scenery",
                        alt_description: "A view of mountains",
                    },
                ],
            },
        });
        await searchImages(req, res);
        expect(validateSearchQueryParams).toHaveBeenCalledWith(req.query);
        expect(axios.get).toHaveBeenCalledWith(
            "https://api.unsplash.com/search/photos?query=nature",
            {
                headers: {
                    Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
                },
            }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            Images: [
                {
                    imageUrl: { regular: "https://images.unsplash.com/photo1" },
                    description: "Beautiful nature",
                    altDescription: "Nature view",
                },
                {
                    imageUrl: { regular: "https://images.unsplash.com/photo2" },
                    description: "Mountain scenery",
                    altDescription: "A view of mountains",
                },
            ],
        });
    });
    it("should return 400 for validation errors", async () => {
        validateSearchQueryParams.mockReturnValue(["Query is require and should be string."]);
        await searchImages(req, res);
        expect(validateSearchQueryParams).toHaveBeenCalledWith(req.query);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            errors: ["Query is require and should be string."],
        });
    });
    it("should return 404 if no images are found", async () => {
        validateSearchQueryParams.mockReturnValue([]); 
        axios.get.mockResolvedValue({
            data: {
                results: [], 
            },
        });
        await searchImages(req, res);
        expect(validateSearchQueryParams).toHaveBeenCalledWith(req.query);
        expect(axios.get).toHaveBeenCalledWith(
            "https://api.unsplash.com/search/photos?query=nature",
            {
                headers: {
                    Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
                },
            }
        );
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "No images found for the given query.",
        });
    });
    it("should handle internal server errors", async () => {
        validateSearchQueryParams.mockReturnValue([]);
        axios.get.mockRejectedValue(new Error("API Error"));
        await searchImages(req, res);
        expect(validateSearchQueryParams).toHaveBeenCalledWith(req.query);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: "Error while fetching the Images.",
            error: expect.any(Error),
        });
    });
});

describe("searchPhotoByTag function testing", () => {
    let req, res;
    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            query: {
                tag: "nature",
                sort: "ASC",
                userId: "1",
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });
    it("should return photos successfully", async () => {
        validateSearchPhotoByTagsQueryParams.mockReturnValue([]); 
        tagModel.findAll.mockResolvedValue([
            { name: "nature", photoId: 1 },
            { name: "nature", photoId: 2 },
        ]); 
        photoModel.findAll.mockResolvedValue([
            {
                id: 1,
                imageUrl: "https://example.com/photo1.jpg",
                description: "A beautiful nature photo",
                dateSaved: "2023-01-01",
                tags: [{ name: "nature" }],
            },
            {
                id: 2,
                imageUrl: "https://example.com/photo2.jpg",
                description: "Another nature photo",
                dateSaved: "2023-01-02",
                tags: [{ name: "nature" }],
            },
        ]); 
        await searchPhotoByTag(req, res);
        expect(validateSearchPhotoByTagsQueryParams).toHaveBeenCalledWith(req.query);
        expect(tagModel.findAll).toHaveBeenCalledWith({ where: { name: "nature" } });
        expect(photoModel.findAll).toHaveBeenCalledWith({
            where: { id: [1, 2] },
            include: [{ model: tagModel, attributes: ["name"] }],
            order: [["dateSaved", "ASC"]],
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            photos: [
                {
                    imageUrl: "https://example.com/photo1.jpg",
                    description: "A beautiful nature photo",
                    dateSaved: "2023-01-01",
                    tags: ["nature"],
                },
                {
                    imageUrl: "https://example.com/photo2.jpg",
                    description: "Another nature photo",
                    dateSaved: "2023-01-02",
                    tags: ["nature"],
                },
            ],
        });
    });
    it("should return 400 for validation errors", async () => {
        validateSearchPhotoByTagsQueryParams.mockReturnValue(["Tags require and should be string."]);
        await searchPhotoByTag(req, res);
        expect(validateSearchPhotoByTagsQueryParams).toHaveBeenCalledWith(req.query);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            errors: ["Tags require and should be string."],
        });
    });
    it("should return 400 for invalid sort order", async () => {
        req.query.sort = "INVALID"; 
        validateSearchPhotoByTagsQueryParams.mockReturnValue([]);
        await searchPhotoByTag(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "Invalid sort order. Use 'ASC' or 'DESC'.",
        });
    });
    it("should return 404 if tag not found", async () => {
        validateSearchPhotoByTagsQueryParams.mockReturnValue([]); 
        tagModel.findAll.mockResolvedValue([]); 
        await searchPhotoByTag(req, res);
        expect(tagModel.findAll).toHaveBeenCalledWith({ where: { name: "nature" } });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "Tag not found.",
        });
    });
    it("should return 404 if no photos found", async () => {
        validateSearchPhotoByTagsQueryParams.mockReturnValue([]); 
        tagModel.findAll.mockResolvedValue([{ name: "nature", photoId: 1 }]); 
        photoModel.findAll.mockResolvedValue([]);
        await searchPhotoByTag(req, res);
        expect(photoModel.findAll).toHaveBeenCalledWith({
            where: { id: [1] },
            include: [{ model: tagModel, attributes: ["name"] }],
            order: [["dateSaved", "ASC"]],
        });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: "No photos found for the given tag.",
        });
    });
    it("should handle internal server errors", async () => {
        validateSearchPhotoByTagsQueryParams.mockReturnValue([]); 
        tagModel.findAll.mockRejectedValue(new Error("Database error")); 
        await searchPhotoByTag(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: "Error while fetching the Photos by tag.",
            error: expect.any(Error),
        });
    });
});

describe("getSearchHistory function testing", () => {
    let req, res;
    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            query: {
                userId: "1", 
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });
    it("should return validation errors for invalid userId", async () => {
        validateSearchHistoryParams.mockReturnValue(["userId is required and should be a number."]);
        await getSearchHistory(req, res);
        expect(validateSearchHistoryParams).toHaveBeenCalledWith(req.query);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errors: ["userId is required and should be a number."] });
    });
    it("should return 400 if no search history found", async () => {
        validateSearchHistoryParams.mockReturnValue([]); 
        searchHistoryModel.findAll.mockResolvedValue([]); 
        await getSearchHistory(req, res);
        expect(validateSearchHistoryParams).toHaveBeenCalledWith(req.query);
        expect(searchHistoryModel.findAll).toHaveBeenCalledWith({ where: { userId: 1 } });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "no search history found" });
    });
    it("should return search history successfully", async () => {
        validateSearchHistoryParams.mockReturnValue([]); 
        searchHistoryModel.findAll.mockResolvedValue([
            { id: 1, userId: 1, query: "nature", createdAt: "2023-01-01" },
            { id: 2, userId: 1, query: "mountains", createdAt: "2023-01-02" },
        ]); 
        await getSearchHistory(req, res);
        expect(validateSearchHistoryParams).toHaveBeenCalledWith(req.query);
        expect(searchHistoryModel.findAll).toHaveBeenCalledWith({ where: { userId: 1 } });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            searchHistoies: [
                { id: 1, userId: 1, query: "nature", createdAt: "2023-01-01" },
                { id: 2, userId: 1, query: "mountains", createdAt: "2023-01-02" },
            ],
        });
    });
    it("should handle internal server errors", async () => {
        validateSearchHistoryParams.mockReturnValue([]); 
        searchHistoryModel.findAll.mockRejectedValue(new Error("Database error")); 
        await getSearchHistory(req, res);
        expect(validateSearchHistoryParams).toHaveBeenCalledWith(req.query);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: "Error while fetching the search history by userId.",
            error: expect.any(Error),
        });
    });
});

describe("validateUserQueryParams function testing", () => {
    it("should return an error if the username is missing", () => {
        const query = { email: "valid@example.com" }; 
        const result = validateUserQueryParams(query);
        expect(result.statusCode).toEqual(400)
        expect(result.error).toEqual(["Username is required and should be string."]);
    });

    it("should return an error if the username is not a string", () => {
        const query = { username: 123, email: "valid@example.com" }; 
        const result = validateUserQueryParams(query);
        expect(result.statusCode).toEqual(400)
        expect(result.error).toEqual(["Username is required and should be string."]);
    });

    it("should return an error if the email is missing", () => {
        const query = { username: "validUser" }; 
        const result = validateUserQueryParams(query);
        expect(result.statusCode).toEqual(400)
        expect(result.error).toEqual(["email is require and should be string."]);
    });

    it("should return an error if the email is not a string", () => {
        const query = { username: "validUser", email: 12345 }; 
        const result = validateUserQueryParams(query);
        expect(result.statusCode).toEqual(400)
        expect(result.error).toEqual(["email is require and should be string."]);
    });

    it("should return an error if the email does not contain '@'", () => {
        const query = { username: "validUser", email: "invalid-email.com" };
        const result = validateUserQueryParams(query);
        expect(result.statusCode).toEqual(400)
        expect(result.error).toEqual(["email is require and should be string."]);
    });

    it("should return an error if the email does not contain '.'", () => {
        const query = { username: "validUser", email: "invalid@email" };
        const result = validateUserQueryParams(query);
        expect(result.statusCode).toEqual(400)
        expect(result.error).toEqual(["email is require and should be string."]);
    });

    it("should return both username and email errors if both are invalid", () => {
        const query = { username: 123, email: "invalid-email.com" }; 
        const result = validateUserQueryParams(query);
        expect(result.statusCode).toEqual(400)
        expect(result).toEqual(["Username is required and should be string."]);
        expect(result.error).toEqual(["email is require and should be string."]);
    });

    it("should return an empty array if both username and email are valid", () => {
        const query = { username: "validUser", email: "valid@example.com" }; 
        const result = validateUserQueryParams(query);
        expect(result.error).toEqual([]); 
    });
});


