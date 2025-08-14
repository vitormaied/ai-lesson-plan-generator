import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';

export const PixPaymentPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [paymentIntentId, setPaymentIntentId] = useState<string>('');
    const [amount, setAmount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [pixKey, setPixKey] = useState<string>('');
    const [pixCode, setPixCode] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState<number>(24 * 60 * 60); // 24 horas em segundos
    const [isSimulation, setIsSimulation] = useState<boolean>(false);

    useEffect(() => {
        // Extrair parâmetros da URL do hash
        const hash = window.location.hash;
        const queryString = hash.includes('?') ? hash.split('?')[1] : '';
        const urlParams = new URLSearchParams(queryString);
        const paymentId = urlParams.get('paymentIntentId');
        const amountParam = urlParams.get('amount');

        if (!paymentId || !amountParam) {
            setError('Informações de pagamento não encontradas.');
            setIsLoading(false);
            return;
        }

        setPaymentIntentId(paymentId);
        setAmount(parseInt(amountParam));
        
        // Verificar se é simulação baseado no ID do payment intent
        const isSimulationMode = paymentId.includes('test_pix');
        setIsSimulation(isSimulationMode);
        
        // Simular PIX code e chave (em produção, isso viria do Stripe)
        setPixKey('00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540519.905802BR5925GERADOR PLANO AULA IA6009SAO PAULO62070503***6304');
        setPixCode(`PIXCODE${paymentId.slice(-8)}`);
        
        setIsLoading(false);
    }, []);

    // Timer para expiração
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatAmount = (amount: number) => {
        return (amount / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    const copyPixCode = () => {
        navigator.clipboard.writeText(pixKey);
        alert('Código PIX copiado para a área de transferência!');
    };

    const { refreshUser } = useAuth();

    const simulatePayment = async () => {
        if (!isSimulation) return;

        try {
            const response = await fetch('/api/stripe/simulate-pix-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    paymentIntentId,
                    userId: currentUser?.id 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Atualizar dados do usuário antes de redirecionar
                const refreshResult = await refreshUser();
                
                if (refreshResult.success) {
                    alert('✅ Pagamento PIX realizado com sucesso! Seu plano foi atualizado para Personal. Redirecionando...');
                    window.location.hash = '#/app?payment=success&pix_simulation=true';
                } else {
                    alert('✅ Pagamento realizado, mas houve um problema ao atualizar os dados. Faça login novamente.');
                    window.location.hash = '#/login';
                }
            } else {
                alert('❌ Erro ao simular pagamento: ' + data.message);
            }
        } catch (error) {
            console.error('Error simulating payment:', error);
            alert('❌ Erro ao simular pagamento PIX.');
        }
    };

    const handleBack = () => {
        window.location.hash = '#/pricing';
    };

    if (error) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                    <p>{error}</p>
                    <button onClick={handleBack} className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">
                        Voltar aos Planos
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto p-6 text-center">
                <p>Carregando informações do pagamento PIX...</p>
            </div>
        );
    }

    if (timeLeft === 0) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Pagamento Expirado</h3>
                    <p>O tempo para pagamento via PIX expirou. Por favor, gere um novo código de pagamento.</p>
                    <button onClick={handleBack} className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">
                        Voltar aos Planos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Pagamento via PIX</h1>
                    <p className="text-gray-600">Finalize seu upgrade para o plano Personal</p>
                    {isSimulation && (
                        <div className="mt-4 bg-orange-100 border border-orange-300 text-orange-800 px-4 py-2 rounded-lg">
                            🧪 <strong>Modo de Desenvolvimento:</strong> Esta é uma simulação do pagamento PIX para testes.
                        </div>
                    )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-semibold text-gray-900">Valor:</span>
                        <span className="text-2xl font-bold text-green-600">{formatAmount(amount)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-semibold text-gray-900">Tempo restante:</span>
                        <span className="text-xl font-mono text-red-600">{formatTime(timeLeft)}</span>
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Como pagar:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Abra o app do seu banco</li>
                        <li>Escolha a opção PIX</li>
                        <li>Escaneie o QR Code ou copie o código</li>
                        <li>Confirme o pagamento</li>
                    </ol>
                </div>

                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6">
                    <div className="mb-4">
                        <div className="w-48 h-48 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500">QR Code PIX</span>
                            <br />
                            <small className="text-gray-400">(Simulação)</small>
                        </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">Ou copie o código PIX:</p>
                    
                    <div className="bg-gray-100 p-3 rounded border font-mono text-sm break-all mb-4">
                        {pixKey}
                    </div>
                    
                    <div className="space-y-3">
                        <button 
                            onClick={copyPixCode}
                            className="block w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">
                            📋 Copiar Código PIX
                        </button>
                        
                        {isSimulation && (
                            <button 
                                onClick={simulatePayment}
                                className="block w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium">
                                🧪 Simular Pagamento (Teste)
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800 text-sm">
                        <strong>💡 Dica:</strong> Após o pagamento, sua conta será automaticamente atualizada em alguns minutos. 
                        Você receberá uma confirmação e poderá começar a usar todos os recursos do plano Personal imediatamente.
                    </p>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={handleBack}
                        className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-medium">
                        Voltar aos Planos
                    </button>
                    
                    <button 
                        onClick={() => window.location.hash = '#/app'}
                        className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark font-medium">
                        Ir para o App
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Payment ID: {paymentIntentId.slice(-8)}
                    </p>
                </div>
            </div>
        </div>
    );
};