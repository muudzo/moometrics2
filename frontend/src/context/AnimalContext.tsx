import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/features/auth/context/AuthContext';

// Internal DB row type (snake_case from Supabase)
interface AnimalRow {
    id: string;
    tag_number: string;
    type: 'Cow' | 'Goat' | 'Sheep' | 'Pig' | 'Other';
    sex: 'Male' | 'Female';
    health_status: 'Healthy' | 'Sick' | 'Under Observation';
    vaccination_status: 'Up to Date' | 'Due' | 'Not Vaccinated';
    notes?: string;
    image_url?: string;
    farm_id: string;
    owner_id: string;
    created_at: string;
    updated_at: string;
}

// Public type used by UI components (camelCase, backwards-compatible)
export interface Animal {
    id: string;
    tagNumber: string;
    type: 'Cow' | 'Goat' | 'Sheep' | 'Pig' | 'Other';
    sex: 'Male' | 'Female';
    healthStatus: 'Healthy' | 'Sick' | 'Under Observation';
    vaccinationStatus: 'Up to Date' | 'Due' | 'Not Vaccinated';
    notes?: string;
    imageUrl?: string;
    farm_id: string;
}

export interface LivestockSummary {
    type: string;
    count: number;
}

interface AnimalContextType {
    animals: Animal[];
    isLoading: boolean;
    addAnimal: (animal: Omit<Animal, 'id' | 'farm_id'>) => Promise<void>;
    updateAnimal: (id: string, updated: Animal) => Promise<void>;
    deleteAnimal: (id: string) => Promise<void>;
    getLivestockSummary: () => LivestockSummary[];
    getTotalAnimals: () => number;
    getHealthStats: () => {
        healthy: number;
        sick: number;
        underObservation: number;
    };
    refreshAnimals: () => Promise<void>;
}

// Transform DB row (snake_case) to UI format (camelCase)
function toAnimal(row: AnimalRow): Animal {
    return {
        id: row.id,
        tagNumber: row.tag_number,
        type: row.type,
        sex: row.sex,
        healthStatus: row.health_status,
        vaccinationStatus: row.vaccination_status,
        notes: row.notes,
        imageUrl: row.image_url,
        farm_id: row.farm_id,
    };
}

const AnimalContext = createContext<AnimalContextType | undefined>(undefined);

export function AnimalProvider({ children }: { children: ReactNode }) {
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [farmId, setFarmId] = useState<string | null>(null);
    const { user } = useAuth();

    // Fetch user's default farm
    useEffect(() => {
        if (!user) {
            setAnimals([]);
            setFarmId(null);
            setIsLoading(false);
            return;
        }

        const fetchFarm = async () => {
            const { data, error } = await supabase
                .from('farms')
                .select('id')
                .eq('owner_id', user.id)
                .limit(1)
                .single();

            if (error) {
                console.error('Failed to fetch farm:', error);
                toast.error('Failed to load farm data');
                setIsLoading(false);
                return;
            }

            setFarmId(data.id);
        };

        fetchFarm();
    }, [user]);

    // Fetch animals once we have a farm
    const fetchAnimals = useCallback(async () => {
        if (!farmId || !user) return;

        setIsLoading(true);
        const { data, error } = await supabase
            .from('animals')
            .select('*')
            .eq('farm_id', farmId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch animals:', error);
            toast.error('Failed to load animals');
        } else {
            setAnimals((data as AnimalRow[]).map(toAnimal));
        }
        setIsLoading(false);
    }, [farmId, user]);

    useEffect(() => {
        fetchAnimals();
    }, [fetchAnimals]);

    const addAnimal = async (animal: Omit<Animal, 'id' | 'farm_id'>) => {
        if (!farmId || !user) {
            toast.error('No farm found. Please try again.');
            return;
        }

        const { data, error } = await supabase
            .from('animals')
            .insert({
                tag_number: animal.tagNumber,
                type: animal.type,
                sex: animal.sex,
                health_status: animal.healthStatus,
                vaccination_status: animal.vaccinationStatus,
                notes: animal.notes || null,
                image_url: animal.imageUrl || null,
                farm_id: farmId,
                owner_id: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to add animal:', error);
            toast.error('Failed to save animal record');
            return;
        }

        setAnimals(prev => [toAnimal(data as AnimalRow), ...prev]);
        toast.success('Animal record saved');
    };

    const updateAnimal = async (id: string, updated: Animal) => {
        const { error } = await supabase
            .from('animals')
            .update({
                tag_number: updated.tagNumber,
                type: updated.type,
                sex: updated.sex,
                health_status: updated.healthStatus,
                vaccination_status: updated.vaccinationStatus,
                notes: updated.notes || null,
                image_url: updated.imageUrl || null,
            })
            .eq('id', id);

        if (error) {
            console.error('Failed to update animal:', error);
            toast.error('Failed to update animal record');
            return;
        }

        setAnimals(prev => prev.map(a => (a.id === id ? { ...a, ...updated } : a)));
        toast.success('Animal record updated');
    };

    const deleteAnimal = async (id: string) => {
        // Soft delete
        const { error } = await supabase
            .from('animals')
            .update({ is_deleted: true, deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Failed to delete animal:', error);
            toast.error('Failed to remove animal record');
            return;
        }

        setAnimals(prev => prev.filter(a => a.id !== id));
        toast.success('Animal record removed');
    };

    const getLivestockSummary = (): LivestockSummary[] => {
        return animals.reduce(
            (acc, animal) => {
                const existing = acc.find(item => item.type === animal.type);
                if (existing) {
                    existing.count += 1;
                } else {
                    acc.push({ type: animal.type, count: 1 });
                }
                return acc;
            },
            [] as LivestockSummary[]
        );
    };

    const getTotalAnimals = (): number => animals.length;

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
                isLoading,
                addAnimal,
                updateAnimal,
                deleteAnimal,
                getLivestockSummary,
                getTotalAnimals,
                getHealthStats,
                refreshAnimals: fetchAnimals,
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
