
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';
import { Users, DollarSign, FileText, ShieldCheck, Star } from '../components/Icons';

const StatCard: React.FC<{icon: React.ReactNode, title: string, value: string | number, color: string}> = ({ icon, title, value, color }) => (
    <div className={`bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 border-l-4 ${color}`}>
        <div className="text-3xl">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);


export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<{ totalUsers: number; premiumUsers: number; plansGenerated: number } | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [statsData, usersData] = await Promise.all([
                    api.getAdminStats(),
                    api.getAllUsers()
                ]);
                setStats(statsData);
                setUsers(usersData);
            } catch (error) {
                console.error("Failed to fetch admin data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return <div className="text-center p-10">Carregando dashboard...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard do Administrador</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={<Users className="text-blue-500"/>} title="Total de Usuários" value={stats?.totalUsers ?? '...'} color="border-blue-500"/>
                <StatCard icon={<DollarSign className="text-green-500"/>} title="Contas Premium" value={stats?.premiumUsers ?? '...'} color="border-green-500"/>
                <StatCard icon={<FileText className="text-indigo-500"/>} title="Planos Gerados" value={stats?.plansGenerated ?? '...'} color="border-indigo-500"/>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Gerenciamento de Usuários</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uso</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.isPremium ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 flex items-center">
                                                <Star size={12} className="mr-1.5 fill-current"/> Premium
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Free</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.usageCount} planos</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.isAdmin && (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 flex items-center">
                                                <ShieldCheck size={12} className="mr-1.5"/> Admin
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
