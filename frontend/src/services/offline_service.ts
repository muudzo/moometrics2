import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'moometrics-db';
const STORE_NAME = 'mutation-queue';
const DATA_STORE = 'animal-data';

export interface Mutation {
    id?: number;
    type: 'ADD' | 'UPDATE' | 'DELETE';
    collection: string;
    data: any;
    timestamp: number;
}

class OfflineService {
    private db: Promise<IDBPDatabase>;

    constructor() {
        this.db = openDB(DB_NAME, 1, {
            upgrade(db) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                db.createObjectStore(DATA_STORE, { keyPath: 'id' });
            },
        });
    }

    async saveData(collection: string, data: any[]) {
        const db = await this.db;
        const tx = db.transaction(DATA_STORE, 'readwrite');
        const store = tx.objectStore(DATA_STORE);
        // In a real generic app, we'd use a store per collection
        // For now, we'll keep it simple but acknowledge the collection
        console.log(`Saving ${data.length} items to ${collection}`);
        await store.clear();
        for (const item of data) {
            await store.put(item);
        }
        await tx.done;
    }

    async getData(collection: string) {
        const db = await this.db;
        console.log(`Fetching data for ${collection}`);
        return db.getAll(DATA_STORE);
    }

    async enqueueMutation(mutation: Omit<Mutation, 'timestamp'>) {
        const db = await this.db;
        const fullMutation: Mutation = {
            ...mutation,
            timestamp: Date.now(),
        };
        await db.add(STORE_NAME, fullMutation);
        this.attemptSync();
    }

    async getQueue(): Promise<Mutation[]> {
        const db = await this.db;
        return db.getAll(STORE_NAME);
    }

    async dequeueMutation(id: number) {
        const db = await this.db;
        await db.delete(STORE_NAME, id);
    }

    async attemptSync() {
        if (!navigator.onLine) return;

        const queue = await this.getQueue();
        if (queue.length === 0) return;

        for (const mutation of queue) {
            try {
                const success = await this.processMutation(mutation);
                if (success) {
                    await this.dequeueMutation(mutation.id!);
                }
            } catch (error) {
                console.error('Failed to process mutation:', error);
                break; // Stop processing queue on error to maintain order
            }
        }
    }

    private async processMutation(mutation: Mutation): Promise<boolean> {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        let url = `${BACKEND_URL}/api/v1/${mutation.collection}`;
        let method = 'POST';

        if (mutation.type === 'UPDATE' || mutation.type === 'DELETE') {
            url += `/${mutation.data.id}`;
            method = mutation.type === 'UPDATE' ? 'PUT' : 'DELETE';
        }

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    // TODO: Add Authorization header from AuthContext
                },
                body: mutation.type === 'DELETE' ? undefined : JSON.stringify(mutation.data),
            });

            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

export const offlineService = new OfflineService();
