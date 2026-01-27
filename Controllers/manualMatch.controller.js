import { asyncHandler } from "../Utils/asyncHandler.js";
import logger from "../Utils/logger.js";
import ManualMatchServices from "../Services/manualMatchService.js";

const manualMatchService = new ManualMatchServices();

export const addMatch = asyncHandler(async (req, res) => {
    const data = req.body;
    logger.info(`Adding Manual Match: ${JSON.stringify(data)}`);
    const result = await manualMatchService.addManualMatch(data);

    return res.status(201).json({
        success: true,
        message: "Match added successfully",
        data: result
    });
});

export const getMatches = asyncHandler(async (req, res) => {
    const result = await manualMatchService.getAllMatches();
    return res.status(200).json({
        success: true,
        message: "Matches fetched successfully",
        data: result
    });
});

export const updateMatch = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    logger.info(`Updating Match ${id}: ${JSON.stringify(data)}`);
    const result = await manualMatchService.updateManualMatch(id, data);

    return res.status(200).json({
        success: true,
        message: "Match updated successfully",
        data: result
    });
});

export const deleteMatch = asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.info(`Deleting Match ${id}`);
    await manualMatchService.deleteManualMatch(id);

    return res.status(200).json({
        success: true,
        message: "Match deleted successfully"
    });
});
