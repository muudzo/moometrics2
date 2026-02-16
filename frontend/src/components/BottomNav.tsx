import { navigationItems } from '../constants/app-constants';
import { cn } from './ui/utils';

interface BottomNavProps {
    activeComponent: string;
    setActiveComponent: (component: string) => void;
}

export function BottomNav({ activeComponent, setActiveComponent }: BottomNavProps) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-background border-t border-border flex items-center justify-around px-2 pb-safe md:hidden z-50">
            {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeComponent === item.component;

                return (
                    <button
                        key={item.component}
                        onClick={() => setActiveComponent(item.component)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-xl transition-all",
                            isActive ? "bg-primary/10" : ""
                        )}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-wider">{item.title}</span>
                    </button>
                );
            })}
        </nav>
    );
}
