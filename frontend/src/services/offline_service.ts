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

    async attemptSync(token?: string) {
        if (!navigator.onLine) return;

        const queue = await this.getQueue();
        if (queue.length === 0) return;

        console.log(`Attempting to sync ${queue.length} mutations...`);

        for (const mutation of queue) {
            try {
                const result = await this.processMutation(mutation, token);

                if (result.success) {
                    await this.dequeueMutation(mutation.id!);
                } else if (result.conflict) {
                    // SERVER AUTHORITATIVE: Discard local mutation on conflict
                    console.warn(`Conflict detected for mutation ${mutation.id}. Discarding local change.`);
                    await this.dequeueMutation(mutation.id!);

                    // Log event (could be Firebase Analytics in real app)
                    console.log('queue_conflict_detected', {
                        mutation_id: mutation.id,
                        collection: mutation.collection,
                        type: mutation.type
                    });

                    // We should trigger a global refresh or notify user here
                    // For now, we'll continue with the rest of the queue
                } else if (!result.retry) {
                    // Non-retryable error (e.g. 400 Bad Request) - discard to unblock queue
                    console.error(`Non-retryable error for mutation ${mutation.id}. Discarding.`);
                    await this.dequeueMutation(mutation.id!);
                } else {
                    // Network error or server 500 - stop and keep in queue
                    console.log(`Retryable error for mutation ${mutation.id}. Stopping sync.`);
                    break;
                }
            } catch (error) {
                console.error('Unexpected sync error:', error);
                break; // Maintain order
            }
        }
    }

    private async processMutation(mutation: Mutation, token?: string): Promise<{ success: boolean; retry: boolean; conflict: boolean }> {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        let url = `${BACKEND_URL}/api/v1/${mutation.collection}`;
        let method = 'POST';

        if (mutation.type === 'UPDATE' || mutation.type === 'DELETE') {
            url += `/${mutation.data.id}`;
            method = mutation.type === 'UPDATE' ? 'PUT' : 'DELETE';
        }

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, {
                method,
                headers,
                body: mutation.type === 'DELETE' ? undefined : JSON.stringify(mutation.data),
            });

            if (response.ok) {
                return { success: true, retry: false, conflict: false };
            }

            if (response.status === 409) {
                return { success: false, retry: false, conflict: true };
            }

            // 5xx errors or 429 (Too Many Requests) are retryable
            const isRetryable = response.status >= 500 || response.status === 429;
            return { success: false, retry: isRetryable, conflict: false };

        } catch (error) {
            // Network failures are always retryable
            return { success: false, retry: true, conflict: false };
        }
    }
}

export const offlineService = new OfflineService();
