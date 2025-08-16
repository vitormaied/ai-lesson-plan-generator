import React from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { CheckCircle, Star, Users } from '../components/Icons';
import { loadStripe } from '@stripe/stripe-js';

const PricingCard = ({ plan, price, description, features, isPopular, onSelectPlan, onSelectPixPlan, ctaText, showPaymentOptions }: {
    plan: string;
    price: string;
    description: string;
    features: string[];
    isPopular?: boolean;
    onSelectPlan: () => void;
    onSelectPixPlan?: () => void;
    ctaText: string;
    showPaymentOptions?: boolean;
}) => (
    <div className={`relative border-2 rounded-lg p-8 flex flex-col ${isPopular ? 'border-primary' : 'border-gray-200'}`}>
        {isPopular && (
            <div className="absolute top-0 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">Mais Popular</div>
        )}
        <h3 className="text-2xl font-bold text-gray-800">{plan}</h3>
        <p className="mt-4 text-gray-500">{description}</p>
        <div className="mt-6">
            <span className="text-4xl font-extrabold text-gray-900">{price}</span>
            <span className="text-base font-medium text-gray-500">/mês</span>
        </div>
        <ul className="mt-8 space-y-4 text-gray-600 flex-grow">
            {features.map((feature, index) => (
                <li key={index} className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        {showPaymentOptions ? (
            <div className="mt-8 space-y-3">
                <button 
                    onClick={onSelectPlan}
                    className={`block w-full py-3 px-6 rounded-md text-center font-medium ${isPopular ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-100 text-primary hover:bg-gray-200'}`}>
                    💳 {ctaText} - Cartão
                </button>
                {onSelectPixPlan && (
                    <button 
                        onClick={onSelectPixPlan}
                        className="block w-full py-3 px-6 rounded-md text-center font-medium bg-green-600 text-white hover:bg-green-700">
                        🇧🇷 {ctaText} - PIX
                    </button>
                )}
            </div>
        ) : (
            <button 
                onClick={onSelectPlan}
                className={`mt-8 block w-full py-3 px-6 rounded-md text-center font-medium ${isPopular ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-100 text-primary hover:bg-gray-200'}`}>
                {ctaText}
            </button>
        )}
    </div>
);

export const PricingPage: React.FC = () => {
    const { currentUser } = useAuth();

    const handleSelectPlan = async (plan: 'Personal' | 'School') => {
        if (!currentUser) {
            window.location.hash = '#/login';
            return;
        }

        let priceId = '';
        if (plan === 'Personal') {
            priceId = 'price_1RwpNy7vYeqK9fZIrp9q5bnd'; // Personal Plan Price ID (LIVE)
        } else if (plan === 'School') {
            priceId = 'price_1RwpOx7vYeqK9fZI1YbfzxIy'; // School Plan Price ID (LIVE)
        }

        if (!priceId) {
            alert('Plano não encontrado.');
            return;
        }

        try {
            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ priceId, userId: currentUser.id }),
            });

            const data = await response.json();

            if (response.ok) {
                const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);
                if (stripe) {
                    stripe.redirectToCheckout({ sessionId: data.sessionId });
                }
            } else {
                alert(data.message || 'Erro ao iniciar o processo de pagamento.');
            }
        } catch (error) {
            console.error('Error initiating checkout:', error);
            alert('Ocorreu um erro ao iniciar o processo de pagamento.');
        }
    };

    const handleSelectPixPlan = async (plan: 'Personal' | 'School') => {
        if (!currentUser) {
            window.location.hash = '#/login';
            return;
        }

        // Redirect to PIX simulation page
        const paymentId = `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        window.location.hash = `#/pix-payment?paymentId=${paymentId}&plan=${plan}`;
    };

    const currentPlan = currentUser?.subscription.plan || 'Free';

    return (
        <div className="bg-white">
            <div className="container mx-auto px-6 py-16 text-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">Planos Flexíveis para Cada Professor</h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">Escolha o plano que melhor se adapta à sua necessidade e otimize seu tempo.</p>
            </div>

            <div className="container mx-auto px-6 pb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-5xl mx-auto">
                    <PricingCard 
                        plan="Free"
                        price="R$0"
                        description="Para experimentar o poder da nossa IA."
                        features={[
                            '2 Gerações de Planos de Aula',
                            'Acesso a todos os recursos básicos',
                            'Suporte da comunidade'
                        ]}
                        onSelectPlan={() => { /* No action */ }}
                        ctaText={currentPlan === 'Free' ? 'Seu Plano Atual' : 'Plano Gratuito'}
                    />
                    <PricingCard 
                        plan="Personal"
                        price="R$19,90"
                        isPopular
                        description="Para professores que querem produtividade máxima."
                        features={[
                            'Gerações de Planos Ilimitadas',
                            'Histórico de planos completo',
                            'Exportação em PDF e DOCX',
                            'Suporte prioritário'
                        ]}
                        onSelectPlan={() => handleSelectPlan('Personal')}
                        onSelectPixPlan={() => handleSelectPixPlan('Personal')}
                        ctaText={currentPlan === 'Personal' ? 'Seu Plano Atual' : 'Fazer Upgrade'}
                        showPaymentOptions={currentPlan !== 'Personal'}
                    />
                    <PricingCard 
                        plan="School"
                        price="Contato"
                        description="Uma solução completa para sua instituição de ensino."
                        features={[
                            'Tudo do plano Personal',
                            'Gerenciamento de professores',
                            'Faturamento centralizado',
                            'Dashboard administrativo'
                        ]}
                        onSelectPlan={() => handleSelectPlan('School')}
                        onSelectPixPlan={() => handleSelectPixPlan('School')}
                        ctaText={'Contatar Vendas'}
                        showPaymentOptions={currentPlan !== 'School'}
                    />
                </div>
            </div>
        </div>
    );
};