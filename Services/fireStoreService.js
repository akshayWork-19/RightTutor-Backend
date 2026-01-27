import { db, admin } from "../Config/firebase.js";
import syncService from "./syncService.js";

class BookingServices {

    constructor() {
        this.bookingsCollection = db.collection("bookings");
    }

    async addBooking(booking) {
        try {
            const bookingWithTimestamps = {
                ...booking,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            let docReference;
            try {
                docReference = await this.bookingsCollection.add(bookingWithTimestamps);
            } catch (fsError) {
                console.error("❌ Firestore Permission/Storage Error:", fsError.message);
                throw fsError;
            }

            const result = { id: docReference.id, ...bookingWithTimestamps };

            // Attempt to push to Google Sheets, but don't fail the booking if it fails
            try {
                await syncService.pushToSheet('Bookings', result, 'add');
            } catch (sheetError) {
                console.warn("⚠️ Google Sheets Sync Failed (Booking was saved):", sheetError.message);
            }

            return result;
        } catch (error) {
            console.error("Error in addBooking service:", error.message);
            throw error;
        }
    }

    async getAllBookings() {
        try {
            const snapshot = await this.bookingsCollection.orderBy('createdAt', 'desc').get();
            if (snapshot.empty) {
                return [];
            }
            const bookings = [];
            snapshot.forEach(doc => {
                bookings.push({ id: doc.id, ...doc.data() });
            });
            return bookings;
        } catch (error) {
            console.error("Error inside getAllBookings method!", error);
            throw error;
        }
    }

    async updateBooking(id, data) {
        try {
            const updateData = {
                ...data,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await this.bookingsCollection.doc(id).update(updateData);
            const result = { id, ...updateData };
            // Push to Google Sheets
            await syncService.pushToSheet('Bookings', result, 'update');
            return result;
        } catch (error) {
            console.error("Error inside updateBooking method!", error);
            throw error;
        }
    }

    async deleteBooking(id) {
        try {
            await this.bookingsCollection.doc(id).delete();
            // Push to Google Sheets
            await syncService.pushToSheet('Bookings', { id }, 'delete');
            return { id };
        } catch (error) {
            console.error("Error inside deleteBooking method!", error);
            throw error;
        }
    }
}

export default BookingServices;