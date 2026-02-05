import { Metadata } from 'next'
import { Manrope, Inter } from 'next/font/google'
import './globals.css'
import { SecurityProvider } from '@/components/providers/security-provider';
import { Providers } from '@/providers/providers';
import { Toaster } from 'sonner';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
    title: 'SmartGIG | The Future of Work',
    description: 'AI-Enabled Freelancing Platform',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark scroll-smooth">
            <body className={`${manrope.variable} ${inter.variable} font-sans bg-background text-foreground overflow-x-hidden selection:bg-indigo-500/30`}>
                <Providers>
                    <SecurityProvider>
                        {children}
                        <Toaster position="top-center" richColors theme="dark" />
                    </SecurityProvider>
                </Providers>
            </body>
        </html>
    )
}

