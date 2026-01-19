'use client';

import { useEffect } from 'react';
import { useDeviceFingerprint } from '@/hooks/use-device-fingerprint';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function SecurityProvider({ children }: { children: React.ReactNode }) {
    const fingerprint = useDeviceFingerprint();
    const router = useRouter();

    useEffect(() => {
        if (!fingerprint) return;

        const checkDevice = async () => {
            try {
                const res = await fetch('/api/security/device', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deviceHash: fingerprint })
                });

                const data = await res.json();

                if (data.banned) {
                    toast.error('Access Denied', {
                        description: data.message,
                        duration: 10000,
                    });
                    // Force logout or redirect to ban page
                    // router.push('/banned'); // Assuming a ban page exists or just home
                    // For now, maybe just redirect to home or show error
                }
            } catch (error) {
                console.error('Security check error', error);
            }
        };

        checkDevice();
    }, [fingerprint, router]);

    return <>{children}</>;
}
