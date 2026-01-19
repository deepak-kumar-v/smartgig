'use client';

import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export function useDeviceFingerprint() {
    const [fingerprint, setFingerprint] = useState<string | null>(null);

    useEffect(() => {
        const setFp = async () => {
            const fp = await FingerprintJS.load();
            const { visitorId } = await fp.get();
            setFingerprint(visitorId);
        };

        setFp();
    }, []);

    return fingerprint;
}
