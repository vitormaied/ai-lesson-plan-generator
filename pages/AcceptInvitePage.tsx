
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { api } from '../services/api';
import { CheckCircle, XCircle } from '../components/Icons';

export const AcceptInvitePage: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unauthenticated'>('loading');
    const [message, setMessage] = useState('');
    const { currentUser, isLoaded, login } = useAuth();

    useEffect(() => {
        if (!isLoaded) return; // Wait for auth to load

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const email = urlParams.get('email');

        if (!token || !email) {
            setStatus('error');
            setMessage('Link de convite inválido ou incompleto.');
            return;
        }

        const handleAcceptInvite = async () => {
            if (!currentUser) {
                // If user is not logged in, redirect to login with invite info
                setStatus('unauthenticated');
                setMessage('Por favor, faça login ou registre-se para aceitar o convite.');
                // Optionally, store token/email in session storage to re-attempt after login
                sessionStorage.setItem('pendingInvite', JSON.stringify({ token, email }));
                window.location.hash = '#/login';
                return;
            }

            if (currentUser.email !== email) {
                setStatus('error');
                setMessage('Este convite é para outro e-mail. Por favor, faça login com o e-mail correto.');
                return;
            }

            try {
                const response = await api.acceptTeamInvite(token, email);
                if (response.success) {
                    setStatus('success');
                    setMessage('Convite aceito com sucesso! Sua conta agora faz parte da equipe escolar.');
                    // Update local user state if necessary (useAuth should handle this via login/register)
                    // For now, we rely on the login/register flow to update currentUser
                } else {
                    setStatus('error');
                    setMessage(response.message || 'Falha ao aceitar o convite.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Erro ao conectar com o servidor para aceitar o convite.');
            }
        };

        handleAcceptInvite();
    }, [isLoaded, currentUser, login]);

    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <h2 className="text-2xl font-bold text-gray-800">Processando Convite...</h2>
                        <p className="text-gray-600">Aguarde enquanto verificamos seu convite.</p>
                    </div>
                )}
                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800">Sucesso!</h2>
                        <p className="text-gray-600">{message}</p>
                        <a href="#/app" className="mt-6 inline-block px-6 py-3 text-lg font-semibold text-white bg-primary rounded-lg shadow-md hover:bg-primary-dark transition-colors">Ir para o Aplicativo</a>
                    </div>
                )}
                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="h-16 w-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800">Erro!</h2>
                        <p className="text-gray-600">{message}</p>
                        <a href="#/" className="mt-6 inline-block px-6 py-3 text-lg font-semibold text-white bg-gray-500 rounded-lg shadow-md hover:bg-gray-600 transition-colors">Voltar para o Início</a>
                    </div>
                )}
                {status === 'unauthenticated' && (
                    <div className="flex flex-col items-center">
                        <h2 className="text-2xl font-bold text-gray-800">{message}</h2>
                        <p className="text-gray-600">Você será redirecionado para a página de login.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
