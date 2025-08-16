
import React, { useState, useCallback, useEffect } from 'react';
import type { LessonPlan, LessonPlanInput } from './types';
import { BrainCircuit, LogOut, ShieldCheck, DollarSign, Users, User } from './components/Icons';
import { generateLessonPlan, generateActivities, generateAdaptedActivities, generateInclusionPlan } from './services/geminiService';
import { useLessonPlanHistory } from './hooks/useLessonPlanHistory';
import { AuthProvider, useAuth } from './hooks/useAuth.tsx';
import { LessonPlanForm } from './components/LessonPlanForm';
import { LessonPlanDisplay } from './components/LessonPlanDisplay';
import { HistoryPanel } from './components/HistoryPanel';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import { TeamManagementPage } from './pages/TeamManagementPage';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { UserProfilePage } from './pages/UserProfilePage';
import { StripeTestPage } from './pages/StripeTestPage';
import { PixPaymentSimulationPage } from './pages/PixPaymentSimulationPage';

const LessonPlannerApp = () => {
  const [currentPlan, setCurrentPlan] = useState<LessonPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubLoading, setIsSubLoading] = useState<{[key: string]: boolean}>({});
  const [error, setError] = useState<string | null>(null);
  
  const auth = useAuth();
  const { currentUser, incrementUsage, upgradeSubscription } = auth;
  const { history, addPlanToHistory, updatePlanInHistory, removePlanFromHistory, isLoaded: historyIsLoaded } = useLessonPlanHistory(currentUser?.id || null);

  useEffect(() => {
    if (historyIsLoaded && history.length > 0 && !currentPlan) {
      setCurrentPlan(history[0]);
    }
  }, [historyIsLoaded, history, currentPlan]);

  // Limpar plano atual quando usuário muda (login/logout)
  useEffect(() => {
    setCurrentPlan(null);
    setError(null);
  }, [currentUser?.id]);

  // Check for payment success/failure in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');
    
    if (paymentStatus === 'success' && sessionId) {
      setError(null);
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg z-50';
      successDiv.innerHTML = '✅ Pagamento realizado com sucesso! Sua assinatura foi ativada.';
      document.body.appendChild(successDiv);
      
      // Remove after 5 seconds
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 5000);
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    } else if (paymentStatus === 'cancelled') {
      setError('Pagamento cancelado. Você pode tentar novamente quando quiser.');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }
  }, []);

  const getApiKey = () => {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_API_KEY environment variable not set");
    }
    return apiKey;
  };

  const handleGeneratePlan = useCallback(async (data: LessonPlanInput) => {
    if (!currentUser) {
        setError("Você precisa estar logado para gerar um plano.");
        return;
    }
    
    const limit = currentUser.subscription.planGenerations;
    const usage = currentUser.usageCount;

    if (usage >= limit) {
        setError("Você atingiu o limite de gerações de planos para sua assinatura. Faça o upgrade para continuar.");
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setCurrentPlan(null);

    try {
      const apiKey = getApiKey();
      // First, increment usage count via API
      const incrementResponse = await incrementUsage();
      if (!incrementResponse.success) {
          throw new Error(incrementResponse.message || "Não foi possível atualizar sua contagem de uso.");
      }

      // If usage is successfully incremented, generate the plan
      const generatedContent = await generateLessonPlan(apiKey, data);
      const newPlan: LessonPlan = {
        ...data,
        ...generatedContent,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setCurrentPlan(newPlan);
      addPlanToHistory(newPlan);

    } catch (err) {
        if (err instanceof Error) { setError(err.message); } 
        else { setError('Ocorreu um erro desconhecido.'); }
    } finally {
      setIsLoading(false);
    }
  }, [addPlanToHistory, currentUser, incrementUsage]);
  
  const handleGenerateActivities = useCallback(async (plan: LessonPlan) => {
    if (!plan) return;
    setIsSubLoading(prev => ({...prev, activities: true}));
    setError(null);
    try {
        const apiKey = getApiKey();
        const result = await generateActivities(apiKey, plan);
        const updatedPlan = { ...plan, activities: result.activities };
        setCurrentPlan(updatedPlan);
        updatePlanInHistory(updatedPlan);
    } catch(err) {
         if (err instanceof Error) { setError(err.message); } else { setError('Falha ao gerar atividades.'); }
    } finally {
        setIsSubLoading(prev => ({...prev, activities: false}));
    }
  }, [updatePlanInHistory]);

  const handleGenerateAdaptedActivities = useCallback(async (plan: LessonPlan) => {
    if (!plan) return;
    setIsSubLoading(prev => ({...prev, adaptedActivities: true}));
    setError(null);
    try {
        const apiKey = getApiKey();
        const result = await generateAdaptedActivities(apiKey, plan);
        const updatedPlan = { ...plan, activities: result.activities };
        setCurrentPlan(updatedPlan);
        updatePlanInHistory(updatedPlan);
    } catch(err) {
         if (err instanceof Error) { setError(err.message); } else { setError('Falha ao gerar atividades adaptadas.'); }
    } finally {
        setIsSubLoading(prev => ({...prev, adaptedActivities: false}));
    }
  }, [updatePlanInHistory]);

  const handleGenerateInclusionPlan = useCallback(async (plan: LessonPlan, studentNeeds: string, studentName?: string) => {
    if (!plan || !studentNeeds.trim()) return;
    setIsSubLoading(prev => ({...prev, inclusion: true}));
    setError(null);
    try {
        const apiKey = getApiKey();
        const adaptedContent = await generateInclusionPlan(apiKey, plan, studentNeeds, studentName);
        
        const newAdaptedPlan: LessonPlan = {
            ...plan, 
            ...adaptedContent,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            isAdapted: true,
            studentName: studentName || '',
            studentNeeds: studentNeeds,
        };

        addPlanToHistory(newAdaptedPlan);
        setCurrentPlan(newAdaptedPlan);
    } catch(err) {
         if (err instanceof Error) { setError(err.message); } else { setError('Falha ao gerar plano de inclusão.'); }
    } finally {
        setIsSubLoading(prev => ({...prev, inclusion: false}));
    }
  }, [addPlanToHistory]);

  const handleSelectPlan = (plan: LessonPlan) => {
    setCurrentPlan(plan);
    setError(null);
  };
  
  const handleDeletePlan = (planId: string) => {
    const newHistory = history.filter(p => p.id !== planId);
    removePlanFromHistory(planId);
    if (currentPlan?.id === planId) {
      setCurrentPlan(newHistory[0] || null);
    }
  };

  const handleUpdatePlan = (updatedPlan: LessonPlan) => {
      setCurrentPlan(updatedPlan);
      updatePlanInHistory(updatedPlan);
  };

  return (
    <>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 max-w-7xl mx-auto" role="alert">
            <strong className="font-bold">Erro! </strong>
            <span className="block sm:inline">{error}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setError(null)}>
                <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Fechar</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </span>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
        <div className="lg:col-span-4">
          <LessonPlanForm 
            user={currentUser}
            onSubmit={handleGeneratePlan} 
            isLoading={isLoading}
            onUpgrade={upgradeSubscription}
          />
          <HistoryPanel 
            history={history} 
            onSelectPlan={handleSelectPlan} 
            onDeletePlan={handleDeletePlan}
            isLoaded={historyIsLoaded}
          />
        </div>
        <div className="lg:col-span-8">
           <div className="h-full">
              <LessonPlanDisplay 
                  plan={currentPlan} 
                  onUpdatePlan={handleUpdatePlan}
                  onGenerateActivities={handleGenerateActivities}
                  onGenerateAdaptedActivities={handleGenerateAdaptedActivities}
                  onGenerateInclusionPlan={handleGenerateInclusionPlan}
                  isSubLoading={isSubLoading}
              />
           </div>
        </div>
      </div>
    </>
  );
};

const AppRouter = () => {
    const [route, setRoute] = useState(window.location.hash || '#/');
    const auth = useAuth();
    
    // Calculate routeWithoutQuery outside useEffect so it's available in renderContent
    const routeWithoutQuery = route.split('?')[0];
    
    useEffect(() => {
        const handleHashChange = () => {
            setRoute(window.location.hash || '#/');
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);
    
    useEffect(() => {
        if (!auth.isLoaded) return;
        
        const publicPages = ['#/', '#/login', '#/register', '#/pricing', '#/accept-invite'];
        const protectedPages = ['#/app', '#/admin', '#/team', '#/profile', '#/pix-payment'];

        const isPublicPage = publicPages.includes(routeWithoutQuery);
        const isProtectedPage = protectedPages.includes(routeWithoutQuery);

        // Rule 1: A logged-in user on a public page (except pricing) should be in the app.
        if (auth.currentUser && isPublicPage && routeWithoutQuery !== '#/pricing') {
            window.location.hash = '#/app';
            return;
        }

        // Rule 2: A logged-out user trying to access a protected page. Send them to login.
        if (!auth.currentUser && isProtectedPage) {
            window.location.hash = '#/login';
            return;
        }
        
        // Rule 3: A logged-in, non-admin user trying to access the admin page. Send them to the app.
        if (auth.currentUser && !auth.currentUser.isAdmin && route === '#/admin') {
            window.location.hash = '#/app';
            return;
        }

        // Rule 4: A user trying to access team management without being a team admin.
        if (auth.currentUser && route === '#/team' && auth.currentUser.subscription.plan !== 'School') {
             window.location.hash = '#/app';
            return;
        }

    }, [auth.isLoaded, auth.currentUser, route]);

    const renderContent = () => {
        if (!auth.isLoaded) {
            return <div className="flex items-center justify-center h-[calc(100vh-200px)]">Carregando...</div>;
        }

        switch (routeWithoutQuery) {
            case '#/login':
                return <LoginPage />;
            case '#/register':
                return <RegisterPage />;
            case '#/pricing':
                return <PricingPage />;
            case '#/accept-invite':
                return <AcceptInvitePage />;
            case '#/team':
                return auth.currentUser ? <TeamManagementPage /> : null;
            case '#/profile':
                return <UserProfilePage user={auth.currentUser} />;
            case '#/app':
                return auth.currentUser ? <LessonPlannerApp /> : null;
            case '#/admin':
                return auth.currentUser?.isAdmin ? <AdminDashboard /> : null;
            case '#/stripe-test':
                return <StripeTestPage />;
            case '#/pix-payment':
                return auth.currentUser ? <PixPaymentSimulationPage /> : null;
            case '#/':
            default:
                return <LandingPage />;
        }
    };
    
    const isAppContentPage = ['#/app', '#/admin', '#/pricing', '#/team'].includes(route);
    const isLandingPage = route === '#/' || !route;
    const mainContentPadding = isLandingPage ? "" : "p-4 sm:p-6 lg:p-8";
    const logoLink = auth.currentUser ? '#/app' : '#/';

    const isSchoolAdmin = auth.currentUser?.subscription.plan === 'School';

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <a href={logoLink} className="flex items-center">
                        <BrainCircuit className="h-10 w-10 text-primary" />
                        <h1 className="ml-3 text-2xl sm:text-3xl font-bold text-gray-800">
                            Gerador de Plano de Aula IA
                        </h1>
                    </a>
                    <nav className="flex items-center space-x-4">
                        {auth.currentUser ? (
                            <>
                                <a href="#/pricing" className="text-sm font-medium text-gray-600 hover:text-primary flex items-center">
                                   <DollarSign className="h-5 w-5 mr-1.5" /> Planos
                                </a>
                                <a href="#/profile" className="text-sm font-medium text-gray-600 hover:text-primary flex items-center">
                                   <User className="h-5 w-5 mr-1.5" /> Perfil
                                </a>
                                {isSchoolAdmin && (
                                     <a href="#/team" className="text-sm font-medium text-gray-600 hover:text-primary flex items-center">
                                       <Users className="h-5 w-5 mr-1.5" /> Equipe
                                    </a>
                                )}
                                {auth.currentUser.isAdmin && (
                                    <a href="#/admin" className="text-sm font-medium text-gray-600 hover:text-primary flex items-center">
                                       <ShieldCheck className="h-5 w-5 mr-1.5" /> Dashboard
                                    </a>
                                )}
                                {import.meta.env.DEV && (
                                    <a href="#/stripe-test" className="text-sm font-medium text-orange-600 hover:text-orange-700">
                                        🧪 Stripe Test
                                    </a>
                                )}
                                <span className="text-sm text-gray-600">Olá, {auth.currentUser.name || auth.currentUser.email.split('@')[0]}</span>
                                <button onClick={auth.logout} className="text-sm font-medium text-gray-600 hover:text-primary flex items-center">
                                    <LogOut className="h-5 w-5 mr-1.5" /> Sair
                                </button>
                            </>
                        ) : (
                            <>
                                <a href="#/pricing" className={`text-sm font-medium ${route === '#/pricing' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>Planos</a>
                                <a href="#/login" className={`text-sm font-medium ${route === '#/login' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>Login</a>
                                <a href="#/register" className="text-sm font-medium text-white bg-primary px-3 py-2 rounded-md hover:bg-primary-dark">Registrar</a>
                            </>
                        )}
                    </nav>
                </div>
            </header>
            <main className={mainContentPadding}>
                {renderContent()}
            </main>
            {isAppContentPage && (
                 <footer className="text-center py-4 text-gray-500 text-sm">
                    <p>Desenvolvido com React, Tailwind CSS e Gemini API.</p>
                </footer>
            )}
        </div>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
}
