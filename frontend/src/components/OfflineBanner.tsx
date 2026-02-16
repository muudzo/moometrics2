
import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Analytics } from "../lib/tracking";
import { offlineService } from '@/services/offline_service';
import { cn } from '@/components/ui/utils';

export function OfflineBanner() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [queueLength, setQueueLength] = useState(0);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => {
            setIsOnline(false);
            Analytics.trackEvent('offline_mode_enabled');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const checkQueue = async () => {
            const queue = await offlineService.getQueue();
            setQueueLength(queue.length);
        };

        const interval = setInterval(checkQueue, 3000);
        checkQueue();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    if (isOnline && queueLength === 0) return null;

    return (
        <div className={cn(
            "w-full px-4 py-2 flex items-center justify-between text-white text-xs font-medium transition-colors",
            isOnline ? "bg-blue-500" : "bg-orange-500"
        )}>
            <div className="flex items-center gap-2">
                {isOnline ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                    <WifiOff className="w-3 h-3" />
                )}
                <span>
                    {isOnline
                        ? `Syncing ${queueLength} pending record${queueLength === 1 ? '' : 's'}...`
                        : "Offline Mode - Recording locally"}
                </span>
            </div>
            {!isOnline && (
                <span className="opacity-80">Data will sync when back online</span>
            )}
        </div>
    );
}
