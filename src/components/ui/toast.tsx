'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (type: ToastType, message: string, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const toastConfig: Record<ToastType, { icon: React.ElementType; bg: string; border: string; text: string }> = {
    success: { icon: CheckCircle, bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    error: { icon: AlertCircle, bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    info: { icon: Info, bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    const config = toastConfig[toast.type];
    const Icon = config.icon;

    React.useEffect(() => {
        const timer = setTimeout(onRemove, toast.duration || 5000);
        return () => clearTimeout(timer);
    }, [toast.duration, onRemove]);

    return (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${config.bg} ${config.border} shadow-lg backdrop-blur-sm animate-slide-in`}>
            <Icon className={`w-5 h-5 ${config.text}`} />
            <p className={`flex-1 ${config.text}`}>{toast.message}</p>
            <button onClick={onRemove} className="p-1 hover:bg-white/10 rounded transition-colors">
                <X className={`w-4 h-4 ${config.text}`} />
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string, duration = 5000) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, type, message, duration }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
                ))}
            </div>
            <style jsx global>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </ToastContext.Provider>
    );
}

// Convenience hooks
export function useToasts() {
    const { addToast } = useToast();
    return {
        success: (message: string) => addToast('success', message),
        error: (message: string) => addToast('error', message),
        warning: (message: string) => addToast('warning', message),
        info: (message: string) => addToast('info', message),
    };
}
