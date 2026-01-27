import { asyncHandler } from "../Utils/asyncHandler.js";
import logger from "../Utils/logger.js";
import RepositoryServices from "../Services/repositoryService.js";

const repositoryService = new RepositoryServices();

export const addRepo = asyncHandler(async (req, res) => {
    const data = req.body;
    logger.info(`Adding Repository: ${JSON.stringify(data)}`);
    const result = await repositoryService.addRepository(data);

    return res.status(201).json({
        success: true,
        message: "Repository added successfully",
        data: result
    });
});

export const getRepos = asyncHandler(async (req, res) => {
    const result = await repositoryService.getAllRepositories();
    return res.status(200).json({
        success: true,
        message: "Repositories fetched successfully",
        data: result
    });
});

export const updateRepo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    logger.info(`Updating Repository ${id}: ${JSON.stringify(data)}`);
    const result = await repositoryService.updateRepository(id, data);

    return res.status(200).json({
        success: true,
        message: "Repository updated successfully",
        data: result
    });
});

export const deleteRepo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.info(`Deleting Repository ${id}`);
    await repositoryService.deleteRepository(id);

    return res.status(200).json({
        success: true,
        message: "Repository deleted successfully"
    });
});
