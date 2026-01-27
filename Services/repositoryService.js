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
            return { id: docReference.id, ...repoWithTimestamps };
        } catch (error) {
            console.error("Error inside addRepository method!", error);
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
            return { id, ...updateData };
        } catch (error) {
            console.error("Error inside updateRepository method!", error);
            throw error;
        }
    }

    async deleteRepository(id) {
        try {
            await this.repositoryCollection.doc(id).delete();
            return { id };
        } catch (error) {
            console.error("Error inside deleteRepository method!", error);
            throw error;
        }
    }
}

export default RepositoryServices;
