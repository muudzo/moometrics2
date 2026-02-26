import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/features/auth/context/AuthContext';

export interface Task {
    id: string;
    title: string;
    description: string | null;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
    due_date: string | null;
    completed_at: string | null;
    category: 'General' | 'Livestock' | 'Crops' | 'Equipment' | 'Finance';
    farm_id: string;
    owner_id: string;
    created_at: string;
    updated_at: string;
}

export interface TaskInput {
    title: string;
    description?: string;
    priority?: Task['priority'];
    status?: Task['status'];
    due_date?: string;
    category?: Task['category'];
}

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [farmId, setFarmId] = useState<string | null>(null);
    const { user } = useAuth();

    // Fetch user's default farm
    useEffect(() => {
        if (!user) {
            setTasks([]);
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

    const fetchTasks = useCallback(async () => {
        if (!farmId || !user) return;

        setIsLoading(true);
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('farm_id', farmId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch tasks:', error);
            toast.error('Failed to load tasks');
        } else {
            setTasks(data as Task[]);
        }
        setIsLoading(false);
    }, [farmId, user]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const addTask = async (task: TaskInput) => {
        if (!farmId || !user) {
            toast.error('No farm found');
            return;
        }

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                title: task.title,
                description: task.description || null,
                priority: task.priority || 'Medium',
                status: task.status || 'Pending',
                due_date: task.due_date || null,
                category: task.category || 'General',
                farm_id: farmId,
                owner_id: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to add task:', error);
            toast.error('Failed to save task');
            return;
        }

        setTasks(prev => [data as Task, ...prev]);
        toast.success('Task created');
    };

    const updateTask = async (id: string, updates: Partial<TaskInput>) => {
        const updateData: Record<string, unknown> = {};
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.description !== undefined) updateData.description = updates.description || null;
        if (updates.priority !== undefined) updateData.priority = updates.priority;
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.due_date !== undefined) updateData.due_date = updates.due_date || null;
        if (updates.category !== undefined) updateData.category = updates.category;

        const { error } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error('Failed to update task:', error);
            toast.error('Failed to update task');
            return;
        }

        setTasks(prev =>
            prev.map(t => (t.id === id ? { ...t, ...updateData } as Task : t))
        );
        toast.success('Task updated');
    };

    const toggleComplete = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const isCompleting = task.status !== 'Completed';
        const updateData = {
            status: isCompleting ? 'Completed' : 'Pending',
            completed_at: isCompleting ? new Date().toISOString() : null,
        };

        const { error } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error('Failed to toggle task:', error);
            toast.error('Failed to update task');
            return;
        }

        setTasks(prev =>
            prev.map(t => (t.id === id ? { ...t, ...updateData } as Task : t))
        );
        toast.success(isCompleting ? 'Task completed' : 'Task reopened');
    };

    const deleteTask = async (id: string) => {
        const { error } = await supabase
            .from('tasks')
            .update({ is_deleted: true, deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Failed to delete task:', error);
            toast.error('Failed to remove task');
            return;
        }

        setTasks(prev => prev.filter(t => t.id !== id));
        toast.success('Task removed');
    };

    // Computed stats
    const getTaskStats = () => ({
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'Pending').length,
        inProgress: tasks.filter(t => t.status === 'In Progress').length,
        completed: tasks.filter(t => t.status === 'Completed').length,
        overdue: tasks.filter(t =>
            t.due_date &&
            new Date(t.due_date) < new Date() &&
            t.status !== 'Completed' &&
            t.status !== 'Cancelled'
        ).length,
    });

    return {
        tasks,
        isLoading,
        addTask,
        updateTask,
        deleteTask,
        toggleComplete,
        getTaskStats,
        refreshTasks: fetchTasks,
    };
}
