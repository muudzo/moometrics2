import { renderHook, act } from '@testing-library/react';
import { AnimalProvider, useAnimalContext, Animal } from '../AnimalContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReactNode } from 'react';

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const wrapper = ({ children }: { children: ReactNode }) => (
    <AnimalProvider>{children}</AnimalProvider>
);

describe('AnimalContext', () => {
    it('should start with an empty list of animals', () => {
        const { result } = renderHook(() => useAnimalContext(), { wrapper });
        expect(result.current.animals).toEqual([]);
    });

    it('should add an animal', () => {
        const { result } = renderHook(() => useAnimalContext(), { wrapper });
        const animal: Omit<Animal, 'id'> = {
            tagNumber: 'T001',
            type: 'Cow',
            sex: 'Female',
            healthStatus: 'Healthy',
            vaccinationStatus: 'Up to Date',
            notes: 'Initial record',
        };

        act(() => {
            result.current.addAnimal(animal);
        });

        expect(result.current.animals).toHaveLength(1);
        expect(result.current.animals[0]).toMatchObject(animal);
        expect(result.current.animals[0].id).toBeDefined();
    });

    it('should update an animal', () => {
        const { result } = renderHook(() => useAnimalContext(), { wrapper });
        const animal: Omit<Animal, 'id'> = {
            tagNumber: 'T001',
            type: 'Cow',
            sex: 'Female',
            healthStatus: 'Healthy',
            vaccinationStatus: 'Up to Date',
        };

        act(() => {
            result.current.addAnimal(animal);
        });

        const addedAnimal = result.current.animals[0];
        const updatedAnimal: Animal = {
            ...addedAnimal,
            healthStatus: 'Sick',
        };

        act(() => {
            result.current.updateAnimal(addedAnimal.id, updatedAnimal);
        });

        expect(result.current.animals[0].healthStatus).toBe('Sick');
    });

    it('should delete an animal', () => {
        const { result } = renderHook(() => useAnimalContext(), { wrapper });
        const animal: Omit<Animal, 'id'> = {
            tagNumber: 'T001',
            type: 'Cow',
            sex: 'Female',
            healthStatus: 'Healthy',
            vaccinationStatus: 'Up to Date',
        };

        act(() => {
            result.current.addAnimal(animal);
        });

        const addedAnimal = result.current.animals[0];
        expect(result.current.animals).toHaveLength(1);

        act(() => {
            result.current.deleteAnimal(addedAnimal.id);
        });

        expect(result.current.animals).toHaveLength(0);
    });

    it('should calculate health stats correctly', () => {
        const { result } = renderHook(() => useAnimalContext(), { wrapper });

        act(() => {
            result.current.addAnimal({ tagNumber: 'H1', type: 'Cow', sex: 'Male', healthStatus: 'Healthy', vaccinationStatus: 'Up to Date' });
            result.current.addAnimal({ tagNumber: 'S1', type: 'Goat', sex: 'Female', healthStatus: 'Sick', vaccinationStatus: 'Due' });
            result.current.addAnimal({ tagNumber: 'O1', type: 'Sheep', sex: 'Male', healthStatus: 'Under Observation', vaccinationStatus: 'Not Vaccinated' });
            result.current.addAnimal({ tagNumber: 'H2', type: 'Pig', sex: 'Female', healthStatus: 'Healthy', vaccinationStatus: 'Up to Date' });
        });

        const stats = result.current.getHealthStats();
        expect(stats).toEqual({
            healthy: 2,
            sick: 1,
            underObservation: 1,
        });
    });

    it('should calculate livestock summary correctly', () => {
        const { result } = renderHook(() => useAnimalContext(), { wrapper });

        act(() => {
            result.current.addAnimal({ tagNumber: 'C1', type: 'Cow', sex: 'Male', healthStatus: 'Healthy', vaccinationStatus: 'Up to Date' });
            result.current.addAnimal({ tagNumber: 'C2', type: 'Cow', sex: 'Female', healthStatus: 'Healthy', vaccinationStatus: 'Up to Date' });
            result.current.addAnimal({ tagNumber: 'G1', type: 'Goat', sex: 'Female', healthStatus: 'Healthy', vaccinationStatus: 'Up to Date' });
        });

        const summary = result.current.getLivestockSummary();
        expect(summary).toEqual(expect.arrayContaining([
            { type: 'Cow', count: 2 },
            { type: 'Goat', count: 1 }
        ]));
    });
});
