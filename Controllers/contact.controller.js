import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import logger from "../Utils/logger.js";
import ContactServices from "../Services/contactService.js";

const contactService = new ContactServices();

export const submitContact = asyncHandler(async (req, res) => {
    const data = req.body;

    logger.info(`Submitting Contact: ${JSON.stringify(data)}`);
    const result = await contactService.addContact(data);

    return res.status(201).json({
        success: true,
        message: "Contact submitted successfully",
        data: result
    });
});

export const getContacts = asyncHandler(async (req, res) => {
    const result = await contactService.getAllContacts();
    return res.status(200).json({
        success: true,
        message: "Contacts fetched successfully",
        data: result
    });
});

export const updateContact = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    logger.info(`Updating Contact ${id}: ${JSON.stringify(data)}`);
    const result = await contactService.updateContact(id, data);

    return res.status(200).json({
        success: true,
        message: "Contact updated successfully",
        data: result
    });
});

export const deleteContact = asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.info(`Deleting Contact ${id}`);
    await contactService.deleteContact(id);

    return res.status(200).json({
        success: true,
        message: "Contact deleted successfully"
    });
});
