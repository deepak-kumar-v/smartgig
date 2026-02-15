'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassModal } from '@/components/ui/glass-modal';
import Link from 'next/link';
import {
    CreditCard, Building, Plus, Trash2, ArrowLeft, Shield,
    CheckCircle, Star, AlertCircle, Loader2, Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import {
    getPaymentMethods, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod,
    type PaymentMethod, getPaymentMethodDisplay
} from '@/lib/payments-service';

export default function PaymentMethodsPage() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addType, setAddType] = useState<'card' | 'bank' | 'upi'>('card');
    const [adding, setAdding] = useState(false);

    // Card form state
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');
    const [cardName, setCardName] = useState('');

    // Bank form state
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [routingNumber, setRoutingNumber] = useState('');

    // UPI form state
    const [upiId, setUpiId] = useState('');

    useEffect(() => {
        loadMethods();
    }, []);

    const loadMethods = async () => {
        setLoading(true);
        const data = await getPaymentMethods();
        setMethods(data);
        setLoading(false);
    };

    const formatCardNumber = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(.{4})/g, '$1 ').trim();
    };

    const formatExpiry = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 4);
        if (digits.length >= 2) {
            return `${digits.slice(0, 2)}/${digits.slice(2)}`;
        }
        return digits;
    };

    const handleSetDefault = async (id: string) => {
        await setDefaultPaymentMethod(id);
        const updated = methods.map(m => ({ ...m, isDefault: m.id === id }));
        setMethods(updated);
        toast.success('Default payment method updated');
    };

    const handleDelete = async (id: string) => {
        const success = await removePaymentMethod(id);
        if (success) {
            setMethods(methods.filter(m => m.id !== id));
            toast.success('Payment method removed');
        } else {
            toast.error('Failed to remove payment method');
        }
    };

    const handleAddMethod = async () => {
        // Validate required fields
        if (addType === 'card') {
            if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16 || !cardExpiry || !cardCvc || !cardName) {
                toast.error('Please fill in all card details');
                return;
            }
        } else if (addType === 'bank') {
            if (!bankName || !accountNumber || !routingNumber) {
                toast.error('Please fill in all bank details');
                return;
            }
        } else if (addType === 'upi') {
            if (!upiId || !upiId.includes('@')) {
                toast.error('Please enter a valid UPI ID');
                return;
            }
        }

        setAdding(true);
        try {
            const methodData: any = { type: addType, isDefault: methods.length === 0 };

            if (addType === 'card') {
                methodData.cardLast4 = cardNumber.replace(/\s/g, '').slice(-4);
                methodData.cardBrand = cardNumber.startsWith('4') ? 'Visa' : 'Mastercard';
                methodData.cardExpiryMonth = parseInt(cardExpiry.split('/')[0]);
                methodData.cardExpiryYear = 2000 + parseInt(cardExpiry.split('/')[1] || '0');
                methodData.cardholderName = cardName;
            } else if (addType === 'bank') {
                methodData.accountLast4 = accountNumber.slice(-4);
                methodData.bankName = bankName;
                methodData.routingNumber = routingNumber;
                methodData.accountType = 'checking';
            } else if (addType === 'upi') {
                methodData.upiId = upiId;
                methodData.upiProvider = upiId.split('@')[1];
            }

            const newMethod = await addPaymentMethod(methodData);
            setMethods([...methods, newMethod]);
            setShowAddModal(false);
            toast.success('Payment method added successfully');

            // Reset forms
            setCardNumber('');
            setCardExpiry('');
            setCardCvc('');
            setCardName('');
            setBankName('');
            setAccountNumber('');
            setRoutingNumber('');
            setUpiId('');
        } catch (error) {
            toast.error('Failed to add payment method');
        }
        setAdding(false);
    };

    return (
        <>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/payments" className="text-zinc-500 hover:text-white text-sm inline-flex items-center gap-1 mb-2">
                            <ArrowLeft className="w-4 h-4" />Back to Payments
                        </Link>
                        <h1 className="text-2xl font-bold text-white">Payment Methods</h1>
                        <p className="text-zinc-400">Manage your cards, bank accounts, and UPI</p>
                    </div>
                    <GlassButton variant="primary" onClick={() => setShowAddModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />Add New
                    </GlassButton>
                </div>

                {/* Security Notice */}
                <GlassCard className="p-4 border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-emerald-400" />
                        <p className="text-emerald-400 text-sm">
                            Your payment information is encrypted and securely stored using bank-level security.
                        </p>
                    </div>
                </GlassCard>

                {/* Payment Methods List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                        </div>
                    ) : methods.length === 0 ? (
                        <GlassCard className="p-12 text-center">
                            <CreditCard className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <p className="text-zinc-400">No payment methods added yet</p>
                            <GlassButton variant="primary" className="mt-4" onClick={() => setShowAddModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />Add Payment Method
                            </GlassButton>
                        </GlassCard>
                    ) : (
                        methods.map((method) => (
                            <GlassCard key={method.id} className="p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method.type === 'card' ? 'bg-indigo-500/20' :
                                            method.type === 'bank' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                                            }`}>
                                            {method.type === 'card'
                                                ? <CreditCard className="w-6 h-6 text-indigo-400" />
                                                : method.type === 'bank'
                                                    ? <Building className="w-6 h-6 text-emerald-400" />
                                                    : <Smartphone className="w-6 h-6 text-rose-400" />
                                            }
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-white font-medium">
                                                    {getPaymentMethodDisplay(method)}
                                                </p>
                                                {method.isDefault && (
                                                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            {method.type === 'card' && method.cardExpiryMonth && (
                                                <p className="text-zinc-500 text-sm">
                                                    Expires {method.cardExpiryMonth}/{method.cardExpiryYear}
                                                </p>
                                            )}
                                            {method.type === 'bank' && (
                                                <p className="text-zinc-500 text-sm">
                                                    Checking Account
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!method.isDefault && (
                                            <GlassButton variant="ghost" size="sm" onClick={() => handleSetDefault(method.id)}>
                                                <Star className="w-4 h-4 mr-1" />Set Default
                                            </GlassButton>
                                        )}
                                        <GlassButton
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(method.id)}
                                            disabled={method.isDefault}
                                        >
                                            <Trash2 className="w-4 h-4 text-rose-400" />
                                        </GlassButton>
                                    </div>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            </div>

            {/* Add Payment Method Modal */}
            <GlassModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Payment Method">
                <div className="space-y-6">
                    {/* Type Selector */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setAddType('card')}
                            className={`flex-1 p-4 rounded-xl border transition-all ${addType === 'card'
                                ? 'border-indigo-500 bg-indigo-500/10'
                                : 'border-zinc-700 bg-zinc-800/50'
                                }`}
                        >
                            <CreditCard className={`w-6 h-6 mx-auto mb-2 ${addType === 'card' ? 'text-indigo-400' : 'text-zinc-500'}`} />
                            <p className={`text-sm ${addType === 'card' ? 'text-indigo-400' : 'text-zinc-400'}`}>Card</p>
                        </button>
                        <button
                            onClick={() => setAddType('bank')}
                            className={`flex-1 p-4 rounded-xl border transition-all ${addType === 'bank'
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-zinc-700 bg-zinc-800/50'
                                }`}
                        >
                            <Building className={`w-6 h-6 mx-auto mb-2 ${addType === 'bank' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                            <p className={`text-sm ${addType === 'bank' ? 'text-emerald-400' : 'text-zinc-400'}`}>Bank</p>
                        </button>
                        <button
                            onClick={() => setAddType('upi')}
                            className={`flex-1 p-4 rounded-xl border transition-all ${addType === 'upi'
                                ? 'border-rose-500 bg-rose-500/10'
                                : 'border-zinc-700 bg-zinc-800/50'
                                }`}
                        >
                            <Smartphone className={`w-6 h-6 mx-auto mb-2 ${addType === 'upi' ? 'text-rose-400' : 'text-zinc-500'}`} />
                            <p className={`text-sm ${addType === 'upi' ? 'text-rose-400' : 'text-zinc-400'}`}>UPI</p>
                        </button>
                    </div>

                    {/* Card Form */}
                    {addType === 'card' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Card Number</label>
                                <GlassInput
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                    placeholder="1234 5678 9012 3456"
                                    maxLength={19}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">Expiry</label>
                                    <GlassInput
                                        value={cardExpiry}
                                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                        placeholder="MM/YY"
                                        maxLength={5}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">CVC</label>
                                    <GlassInput
                                        value={cardCvc}
                                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="123"
                                        maxLength={4}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Cardholder Name</label>
                                <GlassInput
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>
                    )}

                    {/* Bank Form */}
                    {addType === 'bank' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Bank Name</label>
                                <GlassInput
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    placeholder="Chase Bank"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Account Number</label>
                                <GlassInput
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                                    placeholder="123456789"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">Routing Number</label>
                                <GlassInput
                                    value={routingNumber}
                                    onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                    placeholder="021000021"
                                    maxLength={9}
                                />
                            </div>
                        </div>
                    )}

                    {/* UPI Form */}
                    {addType === 'upi' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">UPI ID</label>
                                <GlassInput
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    placeholder="username@bank"
                                />
                                <p className="text-zinc-500 text-xs">e.g. john@okaxis, 9876543210@paytm</p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <GlassButton variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
                            Cancel
                        </GlassButton>
                        <GlassButton variant="primary" className="flex-1" onClick={handleAddMethod} disabled={adding}>
                            {adding ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</>
                            ) : (
                                <><Plus className="w-4 h-4 mr-2" />Add Method</>
                            )}
                        </GlassButton>
                    </div>
                </div>
            </GlassModal>
        </>
    );
}
