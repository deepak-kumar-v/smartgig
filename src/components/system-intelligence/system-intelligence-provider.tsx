'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { resolveWithInheritance } from '@/system/intelligence-registry';

// ============================================================================
// System Intelligence Provider — Global Context
// ============================================================================

interface SystemIntelligenceContextType {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

const SystemIntelligenceContext = createContext<SystemIntelligenceContextType>({
    isOpen: false,
    open: () => { },
    close: () => { },
    toggle: () => { },
});

export function useSystemIntelligence() {
    return useContext(SystemIntelligenceContext);
}

const LazyOverlay = lazy(() => import('./system-intelligence-overlay'));

export function SystemIntelligenceProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

    // Keyboard: Ctrl+Shift+I to toggle, ESC to close
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                toggle();
            }
            if (e.key === 'Escape' && isOpen) {
                close();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, toggle, close]);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <SystemIntelligenceContext.Provider value={{ isOpen, open, close, toggle }}>
            {children}
            <FloatingTriggerButton onClick={open} />
            {isOpen && (
                <Suspense fallback={null}>
                    <LazyOverlay onClose={close} />
                </Suspense>
            )}
        </SystemIntelligenceContext.Provider>
    );
}

// ============================================================================
// Floating Trigger Button — Fixed Bottom-Right
// ============================================================================

function FloatingTriggerButton({ onClick }: { onClick: () => void }) {
    const [hover, setHover] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            title="System Intelligence"
            aria-label="Open System Intelligence Overlay"
            style={{
                position: 'fixed',
                bottom: '1.5rem',
                right: '1.5rem',
                width: '40px',
                height: '40px',
                background: hover ? '#1e293b' : '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: hover ? '#60a5fa' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'monospace',
                fontSize: '1rem',
                fontWeight: 700,
                zIndex: 9998,
                transition: 'all 150ms ease',
                boxShadow: hover ? '0 0 12px rgba(96,165,250,0.15)' : 'none',
            }}
        >
            ⚡
        </button>
    );
}

// ============================================================================
// Development Console Warning for Missing Metadata
// ============================================================================

export function useIntelligenceDevWarning(pathname: string) {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') return;
        const meta = resolveWithInheritance(pathname);
        if (!meta) {
            console.warn(
                `[System Intelligence] ⚠ No metadata registered for route: ${pathname}\n` +
                `This page violates System Intelligence standards.\n` +
                `Register metadata in src/system/intelligence-registry.ts\n` +
                `See /docs/system-intelligence-directive.md for rules.`
            );
        }
    }, [pathname]);
}
