'use client';

import React, { useState, useTransition, use } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassTextarea } from '@/components/ui/glass-textarea';
import { Shield, CreditCard, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
// import { createServiceOrder } from '@/lib/services'; // In a real app we'd use a server action that calls this

export default function ServiceCheckoutPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [step, setStep] = useState<'review' | 'payment' | 'success'>('review');
    const [requirements, setRequirements] = useState('');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const serviceId = resolvedParams.id;

    const handleConfirm = async () => {
        setStep('payment');
    };

    const handlePayment = () => {
        startTransition(async () => {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            // In real app: call createServiceOrder(serviceId, 'basic', requirements)
            setStep('success');
            toast.success("Order placed successfully!");
        });
    };

    if (step === 'success') {
        return (
            <div className="min-h-screen pt-32 px-6 flex justify-center">
                <GlassCard variant="heavy" className="max-w-md w-full p-8 text-center h-fit animate-in fade-in zoom-in-95">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Order Confirmed!</h1>
                    <p className="text-zinc-400 mb-8">
                        The freelancer has been notified. You can track the progress in your orders dashboard.
                    </p>
                    <GlassButton className="w-full" onClick={() => router.push('/client/contracts')}>
                        Go to Orders
                    </GlassButton>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 pb-20 px-6">
            <div className="container mx-auto max-w-4xl">
                <h1 className="text-3xl font-bold text-white mb-8">Secure Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Flow */}
                    <div className="lg:col-span-2 space-y-6">
                        {step === 'review' && (
                            <GlassCard className="p-6">
                                <h2 className="text-xl font-bold text-white mb-4">1. Project Requirements</h2>
                                <p className="text-sm text-zinc-400 mb-4">
                                    Describe what you need for this order. Be as specific as possible.
                                </p>
                                <GlassTextarea
                                    placeholder="I need a..."
                                    rows={6}
                                    value={requirements}
                                    onChange={(e: any) => setRequirements(e.target.value)}
                                />
                                <div className="mt-6 flex justify-end">
                                    <GlassButton onClick={handleConfirm} disabled={!requirements}>
                                        Continue to Payment <ArrowRight className="w-4 h-4 ml-2" />
                                    </GlassButton>
                                </div>
                            </GlassCard>
                        )}

                        {step === 'payment' && (
                            <GlassCard className="p-6 animate-in slide-in-from-right-8">
                                <h2 className="text-xl font-bold text-white mb-4">2. Payment Method</h2>
                                <div className="space-y-4 mb-6">
                                    <div className="p-4 rounded-xl border border-indigo-500/50 bg-indigo-500/10 flex items-center justify-between cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="w-5 h-5 text-indigo-400" />
                                            <div>
                                                <div className="font-medium text-white">Visa ending in 4242</div>
                                                <div className="text-xs text-zinc-400">Expires 12/28</div>
                                            </div>
                                        </div>
                                        <div className="w-4 h-4 rounded-full border border-indigo-500 bg-indigo-500 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border border-white/10 hover:bg-white/5 flex items-center justify-between cursor-pointer transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="font-bold text-white px-2">Pay<span className="text-blue-400">Pal</span></div>
                                            <div className="text-sm text-zinc-400">user@example.com</div>
                                        </div>
                                        <div className="w-4 h-4 rounded-full border border-zinc-600" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <button onClick={() => setStep('review')} className="text-zinc-400 hover:text-white text-sm">
                                        Back to Requirements
                                    </button>
                                    <GlassButton variant="primary" onClick={handlePayment} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50">
                                        {isPending ? "Processing..." : "Pay & Start Order"} <Lock className="w-3 h-3 ml-2" />
                                    </GlassButton>
                                </div>
                            </GlassCard>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="space-y-6">
                        <GlassCard className="p-6">
                            <h3 className="font-bold text-white mb-4">Order Summary</h3>
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                                <div className="w-12 h-12 bg-zinc-800 rounded-lg" /> {/* Svc Img */}
                                <div>
                                    <div className="font-medium text-white text-sm line-clamp-1">Service Title Placeholder</div>
                                    <div className="text-xs text-zinc-500">Standard Package</div>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-zinc-400">
                                    <span>Subtotal</span>
                                    <span className="text-white">$500.00</span>
                                </div>
                                <div className="flex justify-between text-zinc-400">
                                    <span>Service Fee</span>
                                    <span className="text-white">$25.00</span>
                                </div>
                                <div className="pt-2 mt-2 border-t border-white/10 flex justify-between font-bold text-white text-lg">
                                    <span>Total</span>
                                    <span>$525.00</span>
                                </div>
                            </div>
                        </GlassCard>
                        <div className="flex items-center gap-2 text-xs text-emerald-400 justify-center">
                            <Shield className="w-3 h-3" />
                            <span>Payments are secured with Escrow Protection</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
