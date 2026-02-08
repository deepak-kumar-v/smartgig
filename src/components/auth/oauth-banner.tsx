'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility exists

type BannerType = 'success' | 'warning';

interface BannerState {
    show: boolean;
    type: BannerType;
    message: string;
    subMessage?: string;
}

export function OAuthBanner() {
    const router = useRouter();
    const [banner, setBanner] = useState<BannerState>({ show: false, type: 'success', message: '' });

    useEffect(() => {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        };

        const flash = getCookie('oauth_flash');

        if (flash) {
            // Clear cookie immediately
            document.cookie = 'oauth_flash=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

            let newState: BannerState = { show: true, type: 'success', message: '' };

            switch (flash) {
                case 'account_exists_login': // Signup -> Existing
                    newState = {
                        show: true,
                        type: 'success',
                        message: 'Account already exists.',
                        subMessage: 'Redirecting to your dashboard.'
                    };
                    break;
                case 'login_existing': // Login -> Existing
                    newState = {
                        show: true,
                        type: 'success',
                        message: 'Welcome back!',
                        subMessage: 'Redirecting to your dashboard.'
                    };
                    break;
                case 'signup_new': // Signup -> New
                    newState = {
                        show: true,
                        type: 'warning',
                        message: 'Welcome to SmartGig!',
                        subMessage: 'Let’s set up your account.'
                    };
                    break;
                case 'new_account_created': // Login -> New
                    newState = {
                        show: true,
                        type: 'warning',
                        message: 'No account found.',
                        subMessage: 'We’ve created one for you — please complete setup.'
                    };
                    break;
                default:
                    newState = { show: false, type: 'success', message: '' };
            }

            if (newState.show) {
                setBanner(newState);
                // Auto dismiss after 2.5s
                setTimeout(() => {
                    setBanner(prev => ({ ...prev, show: false }));
                }, 2500);
            }
        }
    }, []);

    if (!banner.show) return null;

    return (
        <div className={cn(
            "w-full py-3 px-4 flex items-center justify-center gap-3 shadow-md animate-in slide-in-from-top-2 duration-300 pointer-events-none sticky top-0 z-50",
            banner.type === 'success' ? "bg-emerald-50 text-emerald-900 border-b border-emerald-200" : "bg-amber-50 text-amber-900 border-b border-amber-200"
        )}>
            {banner.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm font-medium">
                <span>{banner.message}</span>
                {banner.subMessage && (
                    <span className={cn(
                        "font-normal opacity-90",
                        banner.type === 'success' ? "text-emerald-700" : "text-amber-700"
                    )}>
                        {banner.subMessage}
                    </span>
                )}
            </div>
            {banner.type === 'success' && (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600 ml-2" />
            )}
        </div>
    );
}
