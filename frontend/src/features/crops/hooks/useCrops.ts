import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/features/auth/context/AuthContext';

export interface Crop {
    id: string;
    name: string;
    variety: string | null;
    planting_date: string;
    harvest_date: string | null;
    status: 'Planned' | 'Planted' | 'Growing' | 'Harvested' | 'Failed';
    area_hectares: number | null;
    notes: string | null;
    farm_id: string;
    owner_id: string;
    created_at: string;
    updated_at: string;
}

export interface CropInput {
    name: string;
    variety?: string;
    planting_date: string;
    harvest_date?: string;
    status?: Crop['status'];
    area_hectares?: number;
    notes?: string;
}

export function useCrops() {
    const [crops, setCrops] = useState<Crop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [farmId, setFarmId] = useState<string | null>(null);
    const { user } = useAuth();

    // Fetch user's default farm
    useEffect(() => {
        if (!user) {
            setCrops([]);
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
                setIsLoading(false);
                return;
            }
            setFarmId(data.id);
        };

        fetchFarm();
    }, [user]);

    const fetchCrops = useCallback(async () => {
        if (!farmId || !user) return;

        setIsLoading(true);
        const { data, error } = await supabase
            .from('crops')
            .select('*')
            .eq('farm_id', farmId)
            .eq('is_deleted', false)
            .order('planting_date', { ascending: false });

        if (error) {
            console.error('Failed to fetch crops:', error);
            toast.error('Failed to load crops');
        } else {
            setCrops(data as Crop[]);
        }
        setIsLoading(false);
    }, [farmId, user]);

    useEffect(() => {
        fetchCrops();
    }, [fetchCrops]);

    const addCrop = async (crop: CropInput) => {
        if (!farmId || !user) {
            toast.error('No farm found');
            return;
        }

        const { data, error } = await supabase
            .from('crops')
            .insert({
                name: crop.name,
                variety: crop.variety || null,
                planting_date: crop.planting_date,
                harvest_date: crop.harvest_date || null,
                status: crop.status || 'Planted',
                area_hectares: crop.area_hectares || null,
                notes: crop.notes || null,
                farm_id: farmId,
                owner_id: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to add crop:', error);
            toast.error('Failed to save crop');
            return;
        }

        setCrops(prev => [data as Crop, ...prev]);
        toast.success('Crop saved');
    };

    const updateCrop = async (id: string, updates: Partial<CropInput>) => {
        const updateData: Record<string, unknown> = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.variety !== undefined) updateData.variety = updates.variety || null;
        if (updates.planting_date !== undefined) updateData.planting_date = updates.planting_date;
        if (updates.harvest_date !== undefined) updateData.harvest_date = updates.harvest_date || null;
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.area_hectares !== undefined) updateData.area_hectares = updates.area_hectares || null;
        if (updates.notes !== undefined) updateData.notes = updates.notes || null;

        const { error } = await supabase
            .from('crops')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error('Failed to update crop:', error);
            toast.error('Failed to update crop');
            return;
        }

        setCrops(prev =>
            prev.map(c => (c.id === id ? { ...c, ...updateData } as Crop : c))
        );
        toast.success('Crop updated');
    };

    const deleteCrop = async (id: string) => {
        const { error } = await supabase
            .from('crops')
            .update({ is_deleted: true, deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Failed to delete crop:', error);
            toast.error('Failed to remove crop');
            return;
        }

        setCrops(prev => prev.filter(c => c.id !== id));
        toast.success('Crop removed');
    };

    return {
        crops,
        isLoading,
        addCrop,
        updateCrop,
        deleteCrop,
        refreshCrops: fetchCrops,
    };
}
