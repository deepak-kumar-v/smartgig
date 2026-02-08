'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function OAuthFlashListener() {
    useEffect(() => {
        // Simple cookie reader
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        };

        const flash = getCookie('oauth_flash');

        if (flash) {
            // Clear cookie immediately
            document.cookie = 'oauth_flash=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

            if (flash === 'account_exists_login') {
                toast.info("Welcome back!", {
                    description: "You already have an account, so we logged you in safely.",
                    duration: 5000,
                });
            } else if (flash === 'new_account_created') {
                toast.success("Account Created", {
                    description: "Welcome to SmartGIG! Let's get you set up.",
                    duration: 5000,
                });
            }
        }
    }, []);

    return null;
}
