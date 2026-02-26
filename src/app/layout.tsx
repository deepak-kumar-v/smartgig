import { Metadata } from 'next'
import { Manrope, Inter } from 'next/font/google'
import './globals.css'
import { SecurityProvider } from '@/components/providers/security-provider';
import { Providers } from '@/providers/providers';
import { Toaster } from 'sonner';
import { OAuthBanner } from '@/components/auth/oauth-banner';
import { auth } from '@/lib/auth';
import { SystemIntelligenceProvider } from '@/components/system-intelligence/system-intelligence-provider';
import { assertSystemIntelligenceIntegrity } from '@/system/intelligence-registry';

// Governance Lockdown — crash immediately if version drift in production
if (process.env.NODE_ENV === 'production') {
    assertSystemIntelligenceIntegrity();
}

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
    title: 'SmartGIG | The Future of Work',
    description: 'AI-Enabled Freelancing Platform',
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth();

    return (
        <html lang="en" className="dark scroll-smooth">
            <body className={`${manrope.variable} ${inter.variable} font-sans bg-background text-foreground overflow-x-hidden selection:bg-indigo-500/30`}>
                <Providers session={session}>
                    <SecurityProvider>
                        <SystemIntelligenceProvider>
                            <OAuthBanner />
                            {children}
                            <Toaster position="top-center" richColors theme="dark" />
                        </SystemIntelligenceProvider>
                    </SecurityProvider>
                </Providers>
            </body>
        </html>
    )
}

