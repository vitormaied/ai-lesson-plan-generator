import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';

interface PixPaymentData {
  success: boolean;
  paymentId: string;
  pixCode: string;
  qrCodeData: string;
  amount: number;
  currency: string;
  expiresAt: string;
  plan: string;
  instructions: string[];
}

export const PixPaymentSimulationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [paymentData, setPaymentData] = useState<PixPaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    // Get payment data from URL params or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('paymentId');
    const plan = urlParams.get('plan');
    
    if (paymentId && plan && currentUser) {
      // Simulate creating PIX payment
      createPixPayment(plan as 'Personal' | 'School');
    } else {
      setError('Dados de pagamento não encontrados');
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (paymentData) {
      const interval = setInterval(() => {
        const now = new Date();
        const expires = new Date(paymentData.expiresAt);
        const diff = expires.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft('Expirado');
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [paymentData]);

  const createPixPayment = async (plan: 'Personal' | 'School') => {
    try {
      const priceId = plan === 'Personal' 
        ? 'price_1RwpNy7vYeqK9fZIrp9q5bnd' 
        : 'price_1RwpOx7vYeqK9fZI1YbfzxIy';

      const response = await fetch('/api/stripe/create-pix-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          priceId, 
          userId: currentUser!.id,
          customerEmail: currentUser!.email,
          customerName: currentUser!.name
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentData(data);
      } else {
        setError(data.message || 'Erro ao criar pagamento PIX');
      }
    } catch (error) {
      console.error('Error creating PIX payment:', error);
      setError('Erro ao criar pagamento PIX');
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = () => {
    if (paymentData) {
      navigator.clipboard.writeText(paymentData.pixCode);
      alert('Código PIX copiado!');
    }
  };

  const copyQRCode = () => {
    if (paymentData) {
      navigator.clipboard.writeText(paymentData.qrCodeData);
      alert('Dados do QR Code copiados!');
    }
  };

  const simulatePayment = async () => {
    if (!paymentData) return;
    
    // Simulate payment confirmation
    alert('Pagamento PIX simulado com sucesso! 🎉\n\nEm um ambiente real, você receberia a confirmação automaticamente após o pagamento.');
    
    // Redirect to success page
    window.location.hash = '#/app?payment=success&method=pix';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Gerando pagamento PIX...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Erro</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.hash = '#/pricing'}
              className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark">
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentData) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 text-white p-6 text-center">
            <div className="text-4xl mb-2">🇧🇷</div>
            <h1 className="text-2xl font-bold">Pagamento PIX</h1>
            <p className="text-green-100">{paymentData.plan} Plan</p>
          </div>

          {/* Payment Details */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-gray-800">
                R$ {(paymentData.amount / 100).toFixed(2)}
              </div>
              <div className="text-gray-600">
                Expira em: <span className="font-mono text-red-600">{timeLeft}</span>
              </div>
            </div>

            {/* QR Code Simulation */}
            <div className="bg-gray-100 p-6 rounded-lg text-center mb-6">
              <div className="text-6xl mb-4">📱</div>
              <p className="text-gray-600 mb-4">QR Code PIX</p>
              <div className="bg-white p-4 rounded border-2 border-dashed border-gray-300 font-mono text-xs break-all">
                {paymentData.qrCodeData.substring(0, 60)}...
              </div>
              <button 
                onClick={copyQRCode}
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                Copiar QR Code
              </button>
            </div>

            {/* PIX Code */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código PIX:
              </label>
              <div className="flex">
                <input 
                  type="text" 
                  value={paymentData.pixCode}
                  readOnly
                  className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 font-mono text-sm bg-gray-50"
                />
                <button 
                  onClick={copyPixCode}
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 text-sm">
                  Copiar
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Como pagar:</h3>
              <ol className="space-y-2">
                {paymentData.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Simulation Button */}
            <div className="border-t pt-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="text-yellow-600 text-xl mr-2">⚠️</div>
                  <div>
                    <p className="text-yellow-800 font-medium">Modo Demonstração</p>
                    <p className="text-yellow-700 text-sm">Este é um pagamento PIX simulado para demonstração.</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={simulatePayment}
                className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 font-medium">
                🎭 Simular Pagamento Realizado
              </button>
            </div>

            {/* Cancel */}
            <div className="text-center mt-4">
              <button 
                onClick={() => window.location.hash = '#/pricing'}
                className="text-gray-500 hover:text-gray-700 text-sm">
                Cancelar pagamento
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};