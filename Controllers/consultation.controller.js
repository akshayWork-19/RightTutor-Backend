import { asyncHandler } from "../Utils/asyncHandler.js";
import logger from "../Utils/logger.js";
import BookingServices from "../Services/fireStoreService.js";

const bookingService = new BookingServices();

export const submitBooking = asyncHandler(async (req, res) => {
    const data = req.body;
    logger.info(`Adding Booking: ${JSON.stringify(data)}`);
    const result = await bookingService.addBooking(data);

    return res.status(201).json({
        success: true,
        message: "Booking submitted successfully",
        data: result
    });
});

export const getBookings = asyncHandler(async (req, res) => {
    const result = await bookingService.getAllBookings();
    return res.status(200).json({
        success: true,
        message: "Bookings fetched successfully",
        data: result
    });
});

export const updateBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    logger.info(`Updating Booking ${id}: ${JSON.stringify(data)}`);
    const result = await bookingService.updateBooking(id, data);

    return res.status(200).json({
        success: true,
        message: "Booking updated successfully",
        data: result
    });
});

export const deleteBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.info(`Deleting Booking ${id}`);
    await bookingService.deleteBooking(id);

    return res.status(200).json({
        success: true,
        message: "Booking deleted successfully"
    });
});
