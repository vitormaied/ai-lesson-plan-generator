import React, { useState } from 'react';
import type { LessonPlanInput, User, SubscriptionPlan } from '../types';
import { Sparkles, BrainCircuit, Star } from './Icons';

interface LessonPlanFormProps {
  user: User | null;
  onSubmit: (data: LessonPlanInput) => void;
  isLoading: boolean;
  onUpgrade: (plan: SubscriptionPlan) => void;
}

const Label: React.FC<{htmlFor: string; children: React.ReactNode}> = ({htmlFor, children}) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-200 disabled:cursor-not-allowed ${props.className || ''}`}/>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-200 disabled:cursor-not-allowed ${props.className || ''}`} />
);

export const LessonPlanForm: React.FC<LessonPlanFormProps> = ({ user, onSubmit, isLoading, onUpgrade }) => {
  const [formData, setFormData] = useState<LessonPlanInput>({
    date: new Date().toISOString().split('T')[0],
    grade: '',
    subject: '',
    topic: '',
    schoolName: '',
    teacherName: user?.email.split('@')[0] || '',
    educationLevel: '',
    lessonCount: 1,
  });

  const currentPlan = user?.subscription?.plan || 'Free';
  const isPremium = currentPlan !== 'Free';
  const usageCount = user?.usageCount || 0;
  const planLimit = user?.subscription?.planGenerations || 2;
  const isUnlimited = planLimit === -1; // Plano ilimitado
  const limitReached = !isUnlimited && usageCount >= planLimit;

  const plansLeft = isUnlimited ? 0 : planLimit - usageCount;

  // Verificar expiração da assinatura
  const expiresAt = user?.subscription?.expiresAt;
  const isExpiring = expiresAt && isPremium;
  
  const getDaysUntilExpiration = (): number | null => {
    if (!expiresAt) return null;
    const now = new Date();
    const expirationDate = new Date(expiresAt);
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysLeft = getDaysUntilExpiration();
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'lessonCount' ? parseInt(value, 10) : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(limitReached) return;
    onSubmit(formData);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
       <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
                <BrainCircuit className="h-8 w-8 text-primary mr-3" />
                <h2 className="text-2xl font-bold text-gray-800">Criar Plano de Aula</h2>
            </div>
            {user && (
                <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                    {isPremium && <Star className="h-4 w-4 mr-1.5 fill-current text-yellow-500" />}
                    Plano: {currentPlan}
                </div>
            )}
       </div>
       {!isPremium && !limitReached && (
           <div className="mb-4 text-center bg-blue-50 p-2 rounded-md text-sm text-blue-700">
               Você tem <strong>{plansLeft > 0 ? plansLeft : 0}</strong> de <strong>{planLimit}</strong> planos gratuitos restantes.
           </div>
       )}
       {isPremium && isUnlimited && !isExpiring && (
           <div className="mb-4 text-center bg-green-50 p-2 rounded-md text-sm text-green-700">
               ✅ <strong>Plano {currentPlan}</strong> - Gerações ilimitadas de planos de aula!
           </div>
       )}
       {isPremium && isUnlimited && isExpiring && daysLeft !== null && (
           <div className={`mb-4 text-center p-2 rounded-md text-sm ${
               isExpiringSoon 
                   ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' 
                   : 'bg-blue-50 text-blue-700'
           }`}>
               {isExpiringSoon ? '⚠️' : 'ℹ️'} <strong>Plano {currentPlan}</strong> - 
               {daysLeft > 0 ? ` Expira em ${daysLeft} dias` : ' Expirou'}
               {daysLeft > 0 && (
                   <div className="mt-1 text-xs">
                       Renove sua assinatura para continuar com acesso ilimitado
                   </div>
               )}
           </div>
       )}
       {limitReached && (
           <div className="mb-4 text-center bg-yellow-50 p-3 rounded-md text-yellow-800 border border-yellow-200">
               <p className="font-semibold">Seu limite de planos foi atingido.</p>
               <p className="text-sm">Faça o upgrade para gerar planos ilimitados.</p>
           </div>
       )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="schoolName">Nome da Escola</Label>
          <Input type="text" name="schoolName" id="schoolName" placeholder="Ex: Escola Modelo" value={formData.schoolName} onChange={handleChange} required disabled={limitReached || isLoading} />
        </div>
         <div>
          <Label htmlFor="teacherName">Nome do Professor(a)</Label>
          <Input type="text" name="teacherName" id="teacherName" placeholder="Ex: Prof. Silva" value={formData.teacherName} onChange={handleChange} required disabled={limitReached || isLoading} />
        </div>
        <div>
            <Label htmlFor="educationLevel">Nível de Ensino</Label>
            <Select name="educationLevel" id="educationLevel" value={formData.educationLevel} onChange={handleChange} required disabled={limitReached || isLoading}>
                <option value="" disabled>Selecione um nível</option>
                <option value="Educação Infantil">Educação Infantil</option>
                <option value="Ensino Fundamental">Ensino Fundamental</option>
                <option value="Ensino Médio">Ensino Médio</option>
            </Select>
        </div>
         <div>
          <Label htmlFor="grade">Turma / Série</Label>
          <Input type="text" name="grade" id="grade" placeholder="Ex: 3º ano B" value={formData.grade} onChange={handleChange} required disabled={limitReached || isLoading} />
        </div>
        <div>
          <Label htmlFor="subject">Disciplina</Label>
          <Input type="text" name="subject" id="subject" placeholder="Ex: Matemática" value={formData.subject} onChange={handleChange} required disabled={limitReached || isLoading} />
        </div>
         <div>
          <Label htmlFor="date">Data da Aula</Label>
          <Input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required disabled={limitReached || isLoading} />
        </div>
        <div>
          <Label htmlFor="topic">Conteúdo Específico</Label>
          <Input type="text" name="topic" id="topic" placeholder="Ex: Frações e números decimais" value={formData.topic} onChange={handleChange} required disabled={limitReached || isLoading} />
        </div>
        <div>
          <Label htmlFor="lessonCount">Quantidade de Aulas</Label>
          <Select name="lessonCount" id="lessonCount" value={formData.lessonCount} onChange={handleChange} required disabled={limitReached || isLoading}>
            <option value={1}>1 aula</option>
            <option value={2}>2 aulas</option>
            <option value={3}>3 aulas</option>
            <option value={4}>4 aulas</option>
            <option value={5}>5 aulas</option>
            <option value={6}>6 aulas</option>
            <option value={7}>7 aulas</option>
            <option value={8}>8 aulas</option>
          </Select>
          <p className="mt-1 text-xs text-gray-500">A IA analisará o conteúdo e poderá sugerir uma quantidade diferente se necessário</p>
        </div>
        
        {limitReached ? (
            <button
                type="button"
                onClick={() => onUpgrade('Personal')} // Hardcoded to 'Personal' for now
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors duration-200"
            >
                <Star className="mr-2 h-5 w-5 fill-current" />
                Fazer Upgrade Agora
            </button>
        ) : (
             <button
              type="submit"
              disabled={isLoading || limitReached}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Gerar Plano com IA
                </>
              )}
            </button>
        )}
      </form>
    </div>
  );
};