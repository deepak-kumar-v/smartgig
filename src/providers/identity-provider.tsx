'use client';

import React, { createContext, useContext } from 'react';

interface IdentityContextType {
    userId: string;
    userRole: string | null;
    userName: string | null;
    userImage: string | null;
}

const IdentityContext = createContext<IdentityContextType>({
    userId: '',
    userRole: null,
    userName: null,
    userImage: null
});

export function useIdentity() {
    return useContext(IdentityContext);
}

interface IdentityProviderProps {
    children: React.ReactNode;
    userId: string;
    userRole: string | null;
    userName: string | null;
    userImage: string | null;
}

export function IdentityProvider({ children, userId, userRole, userName, userImage }: IdentityProviderProps) {
    return (
        <IdentityContext.Provider value={{ userId, userRole, userName, userImage }}>
            {children}
        </IdentityContext.Provider>
    );
}
