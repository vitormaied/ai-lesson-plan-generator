
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { User, Star, FileText, DollarSign, Edit3, Save, XCircle } from '../components/Icons';

export const UserProfilePage: React.FC = () => {
    const { currentUser, updateProfile } = useAuth();
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(currentUser?.name || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    if (!currentUser) {
        return <div className="text-center p-10 text-red-500">Você precisa estar logado para ver esta página.</div>;
    }

    const { name, email, usageCount, subscription } = currentUser;
    const isPremium = subscription.plan !== 'Free';

    const handleNameSave = async () => {
        if (!editedName.trim()) {
            setError('O nome não pode estar vazio');
            return;
        }

        if (editedName.trim() === name) {
            setIsEditingName(false);
            return;
        }

        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        const response = await updateProfile(editedName.trim());
        
        if (response.success) {
            setIsEditingName(false);
            setSuccessMessage('Nome atualizado com sucesso!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } else {
            setError(response.message || 'Erro ao salvar nome');
        }
        
        setIsSaving(false);
    };

    const handleNameCancel = () => {
        setEditedName(name || '');
        setIsEditingName(false);
        setError(null);
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <div className="flex items-center space-x-4 mb-6">
                <User className="h-12 w-12 text-primary" />
                <h1 className="text-3xl font-bold text-gray-800">Perfil do Usuário</h1>
            </div>

            {/* Messages */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                    {successMessage}
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                        <span className="font-semibold text-gray-600 w-32">Nome:</span>
                        {isEditingName ? (
                            <div className="flex items-center space-x-2 flex-1">
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                    placeholder="Seu nome completo"
                                    disabled={isSaving}
                                />
                                <button
                                    onClick={handleNameSave}
                                    disabled={isSaving}
                                    className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                                    title="Salvar"
                                >
                                    {isSaving ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                </button>
                                <button
                                    onClick={handleNameCancel}
                                    disabled={isSaving}
                                    className="p-1 text-gray-600 hover:text-gray-700 disabled:opacity-50"
                                    title="Cancelar"
                                >
                                    <XCircle className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className="text-gray-800 flex-1">{name || 'Nome não informado'}</span>
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className="p-1 text-gray-600 hover:text-primary ml-2"
                                    title="Editar nome"
                                >
                                    <Edit3 className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center">
                    <span className="font-semibold text-gray-600 w-32">Email:</span>
                    <span className="text-gray-800">{email}</span>
                </div>

                <div className="flex items-center">
                    <span className="font-semibold text-gray-600 w-32">Plano Atual:</span>
                    <span className="text-gray-800 flex items-center">
                        {subscription.plan}
                        {isPremium && <Star className="h-4 w-4 ml-2 fill-current text-yellow-500" />}
                    </span>
                </div>

                <div className="flex items-center">
                    <span className="font-semibold text-gray-600 w-32">Planos Gerados:</span>
                    <span className="text-gray-800">{usageCount} de {subscription.planGenerations}</span>
                </div>

                {subscription.plan === 'Free' && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md mt-6">
                        <p className="font-semibold mb-2">Aproveite ao máximo!</p>
                        <p className="text-sm">Seu plano gratuito permite gerar até {subscription.planGenerations} planos. Faça upgrade para ter acesso ilimitado e mais recursos.</p>
                    </div>
                )}

                <div className="mt-8 pt-4 border-t border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Gerenciar Assinatura</h2>
                    <p className="text-gray-600 mb-4">Para alterar seu plano ou ver mais detalhes sobre os benefícios, visite nossa página de planos.</p>
                    <a href="#/pricing" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Ver Planos e Preços
                    </a>
                </div>
            </div>
        </div>
    );
};
