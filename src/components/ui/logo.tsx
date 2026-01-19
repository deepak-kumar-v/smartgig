import React from 'react';

export const Logo = ({ className }: { className?: string }) => {
    return (
        <div className={`flex items-center gap-2 font-display font-bold text-xl tracking-tight text-white select-none ${className}`}>
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/30">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-white"
                >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
            </div>
            <span>Smart<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300">GIG</span></span>
        </div>
    );
};
