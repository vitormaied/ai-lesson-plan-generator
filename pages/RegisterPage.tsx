
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { BrainCircuit } from '../components/Icons';

export const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const auth = useAuth();

    const validateName = (name: string): string | null => {
        if (!name.trim()) return 'O nome é obrigatório.';
        if (name.trim().length < 2) return 'O nome deve ter pelo menos 2 caracteres.';
        if (name.trim().length > 50) return 'O nome deve ter no máximo 50 caracteres.';
        if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim())) return 'O nome deve conter apenas letras e espaços.';
        return null;
    };

    const validateEmail = (email: string): string | null => {
        if (!email) return 'O email é obrigatório.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Digite um email válido.';
        return null;
    };

    const validatePassword = (password: string): string | null => {
        if (!password) return 'A senha é obrigatória.';
        if (password.length < 6) return 'A senha deve ter no mínimo 6 caracteres.';
        if (password.length > 50) return 'A senha deve ter no máximo 50 caracteres.';
        if (!/[A-Za-z]/.test(password)) return 'A senha deve conter pelo menos uma letra.';
        if (!/[0-9]/.test(password)) return 'A senha deve conter pelo menos um número.';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate all fields
        const nameError = validateName(name);
        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);

        if (nameError) {
            setError(nameError);
            return;
        }
        if (emailError) {
            setError(emailError);
            return;
        }
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setError(null);
        setIsLoading(true);
        const response = await auth.register(name.trim(), email, password);
        if (!response.success) {
            setError(response.message || 'Falha no registro.');
        }
        // On success, the AppRouter will handle the redirect
        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <BrainCircuit className="mx-auto h-12 w-auto text-primary" />
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Crie sua conta gratuita
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Já tem uma conta?{' '}
                        <a href="#/login" className="font-medium text-primary hover:text-primary-dark">
                            Faça o login aqui
                        </a>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-md">{error}</p>}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="name" className="sr-only">Nome Completo</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="appearance-none rounded-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Seu nome completo"
                            />
                        </div>
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Seu melhor email"
                            />
                        </div>
                         <div>
                            <label htmlFor="password" className="sr-only">Senha</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Senha (mínimo 6 caracteres)"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
                        >
                            {isLoading ? 'Criando conta...' : 'Criar Conta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
