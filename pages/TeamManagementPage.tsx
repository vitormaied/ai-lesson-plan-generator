import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { useAuth } from '../hooks/useAuth.tsx';
import { api } from '../services/api';
import { Users, Send, Trash2, ShieldCheck } from '../components/Icons';

export const TeamManagementPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [members, setMembers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    const fetchMembers = useCallback(async () => {
        if (!currentUser?.teamId) {
            setError("Você não parece pertencer a uma equipe escolar.");
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            const teamMembers = await api.getTeamMembers(currentUser.teamId);
            setMembers(teamMembers);
        } catch (err) {
            setError('Falha ao carregar os membros da equipe.');
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.teamId || !inviteEmail) return;

        setIsInviting(true);
        setError(null);

        try {
            const response = await api.inviteTeamMember(currentUser.teamId, inviteEmail);
            if (response.success) {
                alert(`Convite enviado para ${inviteEmail}`);
                setInviteEmail('');
                fetchMembers(); // Refresh member list
            } else {
                setError(response.message || 'Falha ao enviar o convite.');
            }
        } catch (err) {
            setError('Erro ao conectar com o servidor para enviar o convite.');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (memberId: string, memberEmail: string) => {
        if (!currentUser?.teamId) return;

        if (window.confirm(`Tem certeza que deseja remover ${memberEmail} da equipe?`)) {
            try {
                const response = await api.removeTeamMember(memberId, currentUser.teamId);
                if (response.success) {
                    alert(`${memberEmail} foi removido da equipe.`);
                    fetchMembers(); // Refresh member list
                } else {
                    setError(response.message || 'Falha ao remover o membro.');
                }
            } catch (err) {
                setError('Erro ao conectar com o servidor para remover o membro.');
            }
        }
    };

    if (isLoading) {
        return <div className="text-center p-10">Carregando gerenciamento da equipe...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">{error}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold text-gray-800">Gerenciamento da Equipe</h1>
            </div>

            {/* Invite Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Convidar Novo Membro</h2>
                <form onSubmit={handleInvite} className="flex items-center space-x-4">
                    <input 
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@docente.com"
                        required
                        className="flex-grow block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                    <button type="submit" disabled={isInviting} className="flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:bg-gray-400">
                        <Send size={16} className="mr-2" />
                        {isInviting ? 'Enviando...' : 'Enviar Convite'}
                    </button>
                </form>
            </div>

            {/* Members List */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Membros da Equipe ({members.length} / {currentUser?.subscription.teamMemberLimit})</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planos Gerados</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {members.map((member) => (
                                <tr key={member.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                                        {member.email}
                                        {member.id === currentUser?.id && <span className="ml-2 text-xs text-blue-600 font-semibold">(Você)</span>}
                                        {/* We need to fetch the team admin id to show this */}
                                        {/* {member.id === team.adminId && <ShieldCheck size={14} className="ml-2 text-yellow-500" />} */}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.usageCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button 
                                            onClick={() => handleRemoveMember(member.id, member.email)}
                                            className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                                            disabled={member.id === currentUser?.id} // Prevent admin from removing themselves
                                        >
                                            <Trash2 size={18} />
                                        </button>
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