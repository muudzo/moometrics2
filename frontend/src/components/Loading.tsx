import { Skeleton } from './ui/skeleton';

export function Loading() {
    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-[250px]" />
                <Skeleton className="h-10 w-[120px]" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                ))}
            </div>

            <div className="space-y-4">
                <Skeleton className="h-8 w-[200px]" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-48 w-full" />
                    ))}
                </div>
            </div>
        </div>
    );
}
