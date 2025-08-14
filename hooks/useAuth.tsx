import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { User, SubscriptionPlan } from '../types';
import { api } from '../services/api';

const AUTH_USER_KEY = 'lessonPlanAuthUser';

interface AuthContextType {
    currentUser: User | null;
    isLoaded: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string; }>;
    register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string; }>;
    logout: () => void;
    incrementUsage: () => Promise<{ success: boolean; message?: string; }>;
    upgradeSubscription: (plan: SubscriptionPlan) => Promise<{ success: boolean; message?: string; }>;
    updateProfile: (name: string) => Promise<{ success: boolean; message?: string; }>;
    refreshUser: () => Promise<{ success: boolean; message?: string; }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem(AUTH_USER_KEY);
            if (storedUser) {
                setCurrentUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to load user from localStorage:", error);
            setCurrentUser(null);
        }
        setIsLoaded(true);
    }, []);

    const updateUserSession = (user: User | null) => {
        setCurrentUser(user);
        if (user) {
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(AUTH_USER_KEY);
        }
    };
    
    const login = useCallback(async (email: string, password: string) => {
        const response = await api.login(email, password);
        if (response.success && response.user) {
            updateUserSession(response.user);
        }
        return response;
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        const response = await api.register(name, email, password);
        if (response.success && response.user) {
            updateUserSession(response.user);
        }
        return response;
    }, []);

    const logout = useCallback(() => {
        updateUserSession(null);
        // Limpar qualquer estado local específico do usuário se necessário
        window.location.hash = '#/';
    }, []);
    
    const incrementUsage = useCallback(async () => {
        if (!currentUser) return { success: false, message: "Usuário não autenticado." };

        const response = await api.incrementUsage(currentUser.id);
        
        if (response.success) {
            // Update user in local state only if API call is successful
            const updatedUser = { ...currentUser, usageCount: currentUser.usageCount + 1 };
            updateUserSession(updatedUser);
        }

        return response;
    }, [currentUser]);
    
    const upgradeSubscription = useCallback(async (plan: SubscriptionPlan) => {
        if(!currentUser) return { success: false, message: "Usuário não autenticado." };

        // For now, the plan parameter is not used in the backend, it defaults to 'Personal'
        const response = await api.upgradeUser(currentUser.id);
        
        if (response.success && response.user) {
            updateUserSession(response.user);
            alert(`Upgrade para o plano ${response.user.subscription.plan} realizado com sucesso!`);
        }
        return response;
    }, [currentUser]);

    const updateProfile = useCallback(async (name: string) => {
        if(!currentUser) return { success: false, message: "Usuário não autenticado." };

        const response = await api.updateUserProfile(currentUser.id, name);
        
        if (response.success && response.user) {
            updateUserSession(response.user);
        }
        return response;
    }, [currentUser]);

    const refreshUser = useCallback(async () => {
        if(!currentUser) return { success: false, message: "Usuário não autenticado." };

        try {
            const refreshResponse = await fetch('/api/users/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: currentUser.id }),
            });

            const data = await refreshResponse.json();
            
            if (refreshResponse.ok && data.success && data.user) {
                updateUserSession(data.user);
                return { success: true, message: "Dados do usuário atualizados." };
            } else {
                return { success: false, message: data.message || "Erro ao atualizar dados do usuário." };
            }
        } catch (error) {
            return { success: false, message: "Erro ao conectar com o servidor." };
        }
    }, [currentUser]);

    const value = { currentUser, isLoaded, login, register, logout, incrementUsage, upgradeSubscription, updateProfile, refreshUser };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};