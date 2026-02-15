import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { Plus, Edit2, Eye, Trash2, Clock, DollarSign, Package } from 'lucide-react';

async function getServices() {
    const session = await auth();
    if (!session?.user) return null;

    return db.serviceListing.findMany({
        where: {
            freelancer: {
                userId: session.user.id
            }
        },
        include: {
            // packages: true, // Not in schema
            // category: true // Not in schema
            freelancer: true
        }
    });
}

export default async function FreelancerServicesPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const services = await getServices();

    if (!services) {
        // Handle case where user might not have a freelancer profile yet
        return (
            <>
                <div className="text-center py-20">
                    <h2 className="text-xl font-semibold text-white">Profile Setup Required</h2>
                    <p className="text-zinc-400 mt-2">Please complete your freelancer profile to post services.</p>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">My "Open to Work" Profiles</h1>
                    <p className="text-zinc-400">
                        Define your ideal projects and let clients apply to you.
                    </p>
                </div>
                <Link href="/freelancer/services/new">
                    <GlassButton variant="primary" asDiv>
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Listing
                    </GlassButton>
                </Link>
            </div>

            {services.length === 0 ? (
                <GlassCard className="p-12 text-center border-dashed border-zinc-700">
                    <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-zinc-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No Active Listings</h3>
                    <p className="text-zinc-400 max-w-md mx-auto mb-6">
                        You haven't posted any services yet. Create a listing to define your expertise, rates, and the type of work you're looking for.
                    </p>
                    <Link href="/freelancer/services/new">
                        <GlassButton variant="primary" asDiv>
                            Create Your First Listing
                        </GlassButton>
                    </Link>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <GlassCard key={service.id} className="p-0 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-medium text-violet-400">
                                        {service.category || 'General'}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 hover:bg-rose-500/10 rounded-lg text-zinc-400 hover:text-rose-400 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                                    {service.title}
                                </h3>
                                <p className="text-sm text-zinc-400 line-clamp-3 mb-6 min-h-[60px]">
                                    {service.description}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                        <Clock className="w-4 h-4" />
                                        {service.deliveryDays || 7} days avg
                                    </div>
                                    <div className="flex items-center gap-1 text-white font-medium">
                                        <span className="text-zinc-500 text-xs font-normal mr-1">Starting at</span>
                                        <DollarSign className="w-4 h-4 text-emerald-400" />
                                        {service.basePrice}
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-3 bg-white/5 border-t border-white/5 flex items-center justify-between">
                                <span className="text-xs text-zinc-500">
                                    Standard Package
                                </span>
                                <Link href={`/services/${service.id}`} className="text-xs font-medium text-violet-400 hover:text-violet-300 flex items-center gap-1">
                                    View Live <Eye className="w-3 h-3" />
                                </Link>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </>
    );
}
