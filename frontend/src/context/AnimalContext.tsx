import { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';

export interface Animal {
    id: number;
    tagNumber: string;
    type: 'Cow' | 'Goat' | 'Sheep' | 'Pig' | 'Other';
    sex: 'Male' | 'Female';
    healthStatus: 'Healthy' | 'Sick' | 'Under Observation';
    vaccinationStatus: 'Up to Date' | 'Due' | 'Not Vaccinated';
    notes?: string;
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
}

const AnimalContext = createContext<AnimalContextType | undefined>(undefined);

export function AnimalProvider({ children }: { children: ReactNode }) {
    const [animals, setAnimals] = useState<Animal[]>([]);

    const addAnimal = (animal: Omit<Animal, 'id'>) => {
        const newAnimal: Animal = {
            ...animal,
            id: Date.now(),
        };
        setAnimals((prev) => [...prev, newAnimal]);
        toast.success('Animal added successfully', {
            description: `${animal.tagNumber} has been recorded`,
        });
    };

    const updateAnimal = (id: number, updated: Animal) => {
        setAnimals((prev) => prev.map((a) => (a.id === id ? updated : a)));
        toast.success('Animal updated successfully', {
            description: `${updated.tagNumber} has been updated`,
        });
    };

    const deleteAnimal = (id: number) => {
        const animal = animals.find((a) => a.id === id);
        setAnimals((prev) => prev.filter((a) => a.id !== id));
        toast.success('Animal deleted successfully', {
            description: animal ? `${animal.tagNumber} has been removed` : 'Animal removed',
        });
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
