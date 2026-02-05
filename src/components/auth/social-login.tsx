'use client';

import React from 'react';
import { GlassButton } from '@/components/ui/glass-button';
import { Github, Mail } from 'lucide-react';
import { loginWithGoogle, loginWithGithub } from '@/actions/auth-actions';

export function SocialLogin() {
    return (
        <div className="flex gap-4">
            <form action={loginWithGithub} className="w-full">
                <GlassButton variant="secondary" className="w-full text-xs h-10 border-white/10 hover:bg-white/5" data-testid="login-github-btn">
                    <Github className="w-4 h-4 mr-2" /> GitHub
                </GlassButton>
            </form>
            <form action={loginWithGoogle} className="w-full">
                <GlassButton variant="secondary" className="w-full text-xs h-10 border-white/10 hover:bg-white/5" data-testid="login-google-btn">
                    <Mail className="w-4 h-4 mr-2" /> Google
                </GlassButton>
            </form>
        </div>
    );
}

export function SocialLoginDivider() {
    return (
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0f1115] px-2 text-white/30">Or continue with</span>
            </div>
        </div>
    );
}
