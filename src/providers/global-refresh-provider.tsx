'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface GlobalRefreshContextType {
    refreshVersion: number;
    triggerRefresh: () => void;
}

const GlobalRefreshContext = createContext<GlobalRefreshContextType>({
    refreshVersion: 0,
    triggerRefresh: () => {},
});

export function useGlobalRefresh(): GlobalRefreshContextType {
    return useContext(GlobalRefreshContext);
}

export function GlobalRefreshProvider({ children }: { children: React.ReactNode }) {
    const [refreshVersion, setRefreshVersion] = useState(0);

    const triggerRefresh = useCallback(() => {
        setRefreshVersion(v => v + 1);
    }, []);

    return (
        <GlobalRefreshContext.Provider value={{ refreshVersion, triggerRefresh }}>
            {children}
        </GlobalRefreshContext.Provider>
    );
}
