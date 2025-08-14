
import { useState, useEffect, useCallback } from 'react';
import type { LessonPlan } from '../types';

const getHistoryKey = (userId: string | null) => {
  return userId ? `lessonPlanHistory_${userId}` : 'lessonPlanHistory_anonymous';
};

export const useLessonPlanHistory = (userId: string | null = null) => {
  const [history, setHistory] = useState<LessonPlan[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const historyKey = getHistoryKey(userId);
    try {
      const storedHistory = localStorage.getItem(historyKey);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      } else {
        // Verificar se existe histórico antigo (sem userId) para migrar
        const oldHistory = localStorage.getItem('lessonPlanHistory');
        if (oldHistory && userId) {
          const parsedOldHistory = JSON.parse(oldHistory);
          // Migrar para o novo formato
          localStorage.setItem(historyKey, oldHistory);
          localStorage.removeItem('lessonPlanHistory'); // Remover o antigo
          setHistory(parsedOldHistory);
          console.log('Migrated old lesson plan history to user-specific storage');
        } else {
          // Se mudou de usuário, limpar o estado
          setHistory([]);
        }
      }
    } catch (error) {
      console.error("Failed to load history from localStorage:", error);
      setHistory([]);
    }
    setIsLoaded(true);
  }, [userId]); // Adicionar userId como dependência

  const saveHistory = useCallback((newHistory: LessonPlan[]) => {
    const historyKey = getHistoryKey(userId);
    try {
      // Sort by creation date, newest first
      const sortedHistory = [...newHistory].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistory(sortedHistory);
      localStorage.setItem(historyKey, JSON.stringify(sortedHistory));
    } catch (error) {
      console.error("Failed to save history to localStorage:", error);
    }
  }, [userId]);

  const addPlanToHistory = useCallback((plan: LessonPlan) => {
    saveHistory([plan, ...history]);
  }, [history, saveHistory]);

  const updatePlanInHistory = useCallback((updatedPlan: LessonPlan) => {
    const newHistory = history.map(plan =>
      plan.id === updatedPlan.id ? updatedPlan : plan
    );
    saveHistory(newHistory);
  }, [history, saveHistory]);


  const removePlanFromHistory = useCallback((planId: string) => {
    const newHistory = history.filter(p => p.id !== planId);
    saveHistory(newHistory);
  }, [history, saveHistory]);

  return { history, addPlanToHistory, updatePlanInHistory, removePlanFromHistory, isLoaded };
};
