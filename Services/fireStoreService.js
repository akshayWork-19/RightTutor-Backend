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

            // Emit Socket Event
            try {
                const { getIO } = await import('../socket.js');
                const io = getIO();
                io.emit('data_updated', { module: 'bookings', action: 'add', data: result });
            } catch (err) { }

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
            try {
                await syncService.pushToSheet('Bookings', result, 'update');
            } catch (sheetError) {
                console.warn("⚠️ Google Sheets Sync Failed (Booking update):", sheetError.message);
            }

            // Emit Socket Event
            try {
                const { getIO } = await import('../socket.js');
                const io = getIO();
                io.emit('data_updated', { module: 'bookings', action: 'update', data: result });
            } catch (err) { }
            return result;
        } catch (error) {
            console.error(`❌ Firestore Update Error [ID: ${id}]:`, error.message);
            throw error;
        }
    }

    async deleteBooking(id) {
        try {
            await this.bookingsCollection.doc(id).delete();
            // Push to Google Sheets
            try {
                await syncService.pushToSheet('Bookings', { id }, 'delete');
            } catch (sheetError) {
                console.warn("⚠️ Google Sheets Sync Failed (Booking deletion):", sheetError.message);
            }

            // Emit Socket Event
            try {
                const { getIO } = await import('../socket.js');
                const io = getIO();
                io.emit('data_updated', { module: 'bookings', action: 'delete', id });
            } catch (err) { }
            return { id };
        } catch (error) {
            console.error("Error inside deleteBooking method!", error);
            throw error;
        }
    }
}

export default BookingServices;