import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../hooks/useAuth.tsx';

export const StripeTestPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const testStripeCheckout = async (plan: 'Personal' | 'School') => {
        if (!currentUser) {
            setMessage('Você precisa estar logado para testar');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            let priceId = '';
            if (plan === 'Personal') {
                priceId = 'price_1RvIm19xW0kbCEOQhBU8g8is';
            } else if (plan === 'School') {
                priceId = 'price_1RvInP9xW0kbCEOQEbtb4rD1';
            }

            console.log('Iniciando checkout com priceId:', priceId);
            console.log('UserId:', currentUser.id);

            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ priceId, userId: currentUser.id }),
            });

            const data = await response.json();
            console.log('Resposta da API:', data);

            if (response.ok) {
                const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);
                console.log('Stripe loaded:', !!stripe);
                
                if (stripe) {
                    const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
                    if (result.error) {
                        setMessage(`Erro no checkout: ${result.error.message}`);
                    }
                } else {
                    setMessage('Erro ao carregar Stripe');
                }
            } else {
                setMessage(`Erro da API: ${data.message || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('Erro no teste:', error);
            setMessage(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    const testWebhook = async () => {
        setMessage('Para testar webhook, use: stripe listen --forward-to localhost:3000/api/stripe/webhook');
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Teste da Integração Stripe</h1>
            
            {currentUser ? (
                <div className="bg-green-100 p-4 rounded mb-6">
                    <p>✅ Usuário logado: {currentUser.email}</p>
                    <p>Plano atual: {currentUser.subscription.plan}</p>
                </div>
            ) : (
                <div className="bg-red-100 p-4 rounded mb-6">
                    <p>❌ Usuário não logado</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="border p-4 rounded">
                    <h3 className="text-xl font-semibold mb-4">Teste Plano Personal</h3>
                    <p className="text-gray-600 mb-4">Price ID: price_1RvIm19xW0kbCEOQhBU8g8is</p>
                    <button
                        onClick={() => testStripeCheckout('Personal')}
                        disabled={loading || !currentUser}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        {loading ? 'Carregando...' : 'Testar Checkout Personal'}
                    </button>
                </div>

                <div className="border p-4 rounded">
                    <h3 className="text-xl font-semibold mb-4">Teste Plano School</h3>
                    <p className="text-gray-600 mb-4">Price ID: price_1RvInP9xW0kbCEOQEbtb4rD1</p>
                    <button
                        onClick={() => testStripeCheckout('School')}
                        disabled={loading || !currentUser}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                    >
                        {loading ? 'Carregando...' : 'Testar Checkout School'}
                    </button>
                </div>
            </div>

            <div className="border p-4 rounded mb-6">
                <h3 className="text-xl font-semibold mb-4">Teste de Webhook</h3>
                <button
                    onClick={testWebhook}
                    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                >
                    Instruções para Webhook
                </button>
            </div>

            <div className="border p-4 rounded mb-6">
                <h3 className="text-xl font-semibold mb-4">Cartões de Teste Stripe</h3>
                <div className="space-y-2 text-sm">
                    <p><strong>Sucesso:</strong> 4242 4242 4242 4242</p>
                    <p><strong>Falha:</strong> 4000 0000 0000 0002</p>
                    <p><strong>Requer autenticação:</strong> 4000 0025 0000 3155</p>
                    <p><strong>Data:</strong> Qualquer data futura</p>
                    <p><strong>CVC:</strong> Qualquer 3 dígitos</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded ${message.includes('Erro') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    <p>{message}</p>
                </div>
            )}

            <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Variáveis de Ambiente</h3>
                <div className="space-y-2 text-sm font-mono">
                    <p>VITE_STRIPE_PUBLISHABLE_KEY: {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? '✅ Configurada' : '❌ Não configurada'}</p>
                </div>
            </div>
        </div>
    );
};