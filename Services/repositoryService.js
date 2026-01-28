import { db, admin } from "../Config/firebase.js";

class RepositoryServices {

    constructor() {
        this.repositoryCollection = db.collection("repositories");
    }

    async addRepository(repo) {
        try {
            const repoWithTimestamps = {
                ...repo,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            const docReference = await this.repositoryCollection.add(repoWithTimestamps);
            const result = { id: docReference.id, ...repoWithTimestamps };

            // Emit Socket Event
            try {
                const { getIO } = await import('../socket.js');
                const io = getIO();
                io.emit('data_updated', { module: 'repositories', action: 'add', data: result });
            } catch (err) { }

            return result;
        } catch (error) {
            console.error("Error inside addRepository method!", error.message);
            throw error;
        }
    }

    async getAllRepositories() {
        try {
            const snapshot = await this.repositoryCollection.orderBy('createdAt', 'desc').get();
            if (snapshot.empty) {
                return [];
            }
            const repositories = [];
            snapshot.forEach(doc => {
                repositories.push({ id: doc.id, ...doc.data() });
            });
            return repositories;
        } catch (error) {
            console.error("Error inside getAllRepositories method!", error);
            throw error;
        }
    }

    async updateRepository(id, data) {
        try {
            const updateData = {
                ...data,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await this.repositoryCollection.doc(id).update(updateData);
            const result = { id, ...updateData };

            // Emit Socket Event
            try {
                const { getIO } = await import('../socket.js');
                const io = getIO();
                io.emit('data_updated', { module: 'repositories', action: 'update', data: result });
            } catch (err) { }

            return result;
        } catch (error) {
            console.error("Error inside updateRepository method!", error);
            throw error;
        }
    }

    async deleteRepository(id) {
        try {
            await this.repositoryCollection.doc(id).delete();

            // Emit Socket Event
            try {
                const { getIO } = await import('../socket.js');
                const io = getIO();
                io.emit('data_updated', { module: 'repositories', action: 'delete', id });
            } catch (err) { }

            return { id };
        } catch (error) {
            console.error("Error inside deleteRepository method!", error);
            throw error;
        }
    }
}

export default RepositoryServices;
