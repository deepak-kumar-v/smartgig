import React from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { db } from '@/lib/db';
import {
    Users, Search, Filter, MoreVertical,
    Shield, ShieldAlert, ShieldCheck, Mail,
    Calendar, Briefcase, Ban, CheckCircle
} from 'lucide-react';

async function getUsers() {
    const users = await db.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            clientProfile: {
                select: {
                    _count: { select: { jobPosts: true } }
                }
            },
            freelancerProfile: {
                select: {
                    _count: { select: { proposals: true } }
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    return users;
}

export default async function AdminUsersPage() {
    const users = await getUsers();

    const stats = {
        total: users.length,
        clients: users.filter(u => u.role === 'CLIENT').length,
        freelancers: users.filter(u => u.role === 'FREELANCER').length,
        admins: users.filter(u => u.role === 'ADMIN').length,
    };

    return (
        <DashboardShell role="admin">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">User Management</h1>
                        <p className="text-sm text-zinc-400">Manage all platform users</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-violet-500/20">
                                <Users className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{stats.total}</div>
                                <div className="text-xs text-zinc-500">Total Users</div>
                            </div>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20">
                                <Briefcase className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{stats.clients}</div>
                                <div className="text-xs text-zinc-500">Clients</div>
                            </div>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/20">
                                <Shield className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{stats.freelancers}</div>
                                <div className="text-xs text-zinc-500">Freelancers</div>
                            </div>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-rose-500/20">
                                <ShieldAlert className="w-5 h-5 text-rose-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{stats.admins}</div>
                                <div className="text-xs text-zinc-500">Admins</div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Search & Filters */}
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 text-sm"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:border-zinc-700 text-sm">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>

                {/* Users Table */}
                <GlassCard className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="text-left px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">User</th>
                                    <th className="text-left px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Role</th>
                                    <th className="text-left px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Activity</th>
                                    <th className="text-left px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Joined</th>
                                    <th className="text-right px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-zinc-900/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-medium text-sm">
                                                    {user.name?.split(' ').map(n => n[0]).join('') || '?'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">{user.name || 'Unknown'}</div>
                                                    <div className="text-xs text-zinc-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${user.role === 'ADMIN'
                                                ? 'bg-rose-500/20 text-rose-400'
                                                : user.role === 'CLIENT'
                                                    ? 'bg-blue-500/20 text-blue-400'
                                                    : 'bg-emerald-500/20 text-emerald-400'
                                                }`}>
                                                {user.role === 'ADMIN' && <ShieldAlert className="w-3 h-3" />}
                                                {user.role === 'CLIENT' && <Briefcase className="w-3 h-3" />}
                                                {user.role === 'FREELANCER' && <Shield className="w-3 h-3" />}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.emailVerified ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                    Unverified
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-zinc-400">
                                                {user.role === 'CLIENT' && user.clientProfile ? (
                                                    <span>{user.clientProfile._count.jobPosts} jobs posted</span>
                                                ) : user.role === 'FREELANCER' && user.freelancerProfile ? (
                                                    <span>{user.freelancerProfile._count.proposals} proposals</span>
                                                ) : (
                                                    <span className="text-zinc-600">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Verify User">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors" title="Suspend User">
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                                <button className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="More Actions">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {users.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                            <p className="text-zinc-500">No users found</p>
                        </div>
                    )}
                </GlassCard>
            </div>
        </DashboardShell>
    );
}
