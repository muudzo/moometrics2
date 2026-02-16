import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';
import { offlineService } from '../services/offline_service';

export interface Animal {
    id: number;
    tagNumber: string;
    type: 'Cow' | 'Goat' | 'Sheep' | 'Pig' | 'Other';
    sex: 'Male' | 'Female';
    healthStatus: 'Healthy' | 'Sick' | 'Under Observation';
    vaccinationStatus: 'Up to Date' | 'Due' | 'Not Vaccinated';
    notes?: string;
    imageUrl?: string; // Added for native photo support
    farm_id?: number; // Added for backend compatibility
}

export interface LivestockSummary {
    type: string;
    count: number;
}

interface AnimalContextType {
    animals: Animal[];
    addAnimal: (animal: Omit<Animal, 'id'>) => void;
    updateAnimal: (id: number, updated: Animal) => void;
    deleteAnimal: (id: number) => void;
    getLivestockSummary: () => LivestockSummary[];
    getTotalAnimals: () => number;
    getHealthStats: () => {
        healthy: number;
        sick: number;
        underObservation: number;
    };
    syncData: () => Promise<void>;
}

const AnimalContext = createContext<AnimalContextType | undefined>(undefined);

export function AnimalProvider({ children }: { children: ReactNode }) {
    const [animals, setAnimals] = useState<Animal[]>([]);

    useEffect(() => {
        const loadInitialData = async () => {
            const storedAnimals = await offlineService.getData('animals');
            if (storedAnimals && storedAnimals.length > 0) {
                setAnimals(storedAnimals as Animal[]);
            }
        };
        loadInitialData();
    }, []);

    const addAnimal = async (animal: Omit<Animal, 'id'>) => {
        const newAnimal: Animal = {
            ...animal,
            id: Date.now(),
        };
        const updatedAnimals = [...animals, newAnimal];
        setAnimals(updatedAnimals);
        await offlineService.saveData('animals', updatedAnimals);

        // Queue mutation for backend
        await offlineService.enqueueMutation({
            type: 'ADD',
            collection: 'animals',
            data: newAnimal
        });

        toast.success('Animal recorded locally', {
            description: `${animal.tagNumber} will sync once online`,
        });
    };

    const updateAnimal = async (id: number, updated: Animal) => {
        const updatedAnimals = animals.map((a) => (a.id === id ? updated : a));
        setAnimals(updatedAnimals);
        await offlineService.saveData('animals', updatedAnimals);

        await offlineService.enqueueMutation({
            type: 'UPDATE',
            collection: 'animals',
            data: updated
        });

        toast.success('Update saved locally', {
            description: `${updated.tagNumber} will sync once online`,
        });
    };

    const deleteAnimal = async (id: number) => {
        const animal = animals.find((a) => a.id === id);
        const updatedAnimals = animals.filter((a) => a.id !== id);
        setAnimals(updatedAnimals);
        await offlineService.saveData('animals', updatedAnimals);

        await offlineService.enqueueMutation({
            type: 'DELETE',
            collection: 'animals',
            data: { id }
        });

        toast.success('Removal queued', {
            description: animal ? `${animal.tagNumber} will be removed from server` : 'Animal removal pending sync',
        });
    };

    const syncData = async () => {
        await offlineService.attemptSync();
    };

    const getLivestockSummary = (): LivestockSummary[] => {
        const summary = animals.reduce(
            (acc, animal) => {
                const existing = acc.find((item) => item.type === animal.type);
                if (existing) {
                    existing.count += 1;
                } else {
                    acc.push({ type: animal.type, count: 1 });
                }
                return acc;
            },
            [] as LivestockSummary[]
        );
        return summary;
    };

    const getTotalAnimals = (): number => {
        return animals.length;
    };

    const getHealthStats = () => {
        return animals.reduce(
            (acc, animal) => {
                if (animal.healthStatus === 'Healthy') acc.healthy += 1;
                else if (animal.healthStatus === 'Sick') acc.sick += 1;
                else if (animal.healthStatus === 'Under Observation') acc.underObservation += 1;
                return acc;
            },
            { healthy: 0, sick: 0, underObservation: 0 }
        );
    };

    return (
        <AnimalContext.Provider
            value={{
                animals,
                addAnimal,
                updateAnimal,
                deleteAnimal,
                getLivestockSummary,
                getTotalAnimals,
                getHealthStats,
                syncData,
            }}
        >
            {children}
        </AnimalContext.Provider>
    );
}

export function useAnimalContext() {
    const context = useContext(AnimalContext);
    if (context === undefined) {
        throw new Error('useAnimalContext must be used within an AnimalProvider');
    }
    return context;
}
