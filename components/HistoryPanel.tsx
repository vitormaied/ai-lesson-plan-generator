
import React from 'react';
import type { LessonPlan } from '../types';
import { History, Trash2, FileText } from './Icons';

interface HistoryPanelProps {
  history: LessonPlan[];
  onSelectPlan: (plan: LessonPlan) => void;
  onDeletePlan: (planId: string) => void;
  isLoaded: boolean;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelectPlan, onDeletePlan, isLoaded }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <div className="flex items-center mb-4">
        <History className="h-7 w-7 text-primary mr-3" />
        <h3 className="text-xl font-bold text-gray-800">Histórico de Planos</h3>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {!isLoaded && <p className="text-gray-500">Carregando histórico...</p>}
        {isLoaded && history.length === 0 && (
          <p className="text-center text-gray-500 py-4">Nenhum plano salvo ainda.</p>
        )}
        {isLoaded && history.map(plan => (
          <div key={plan.id} className="group flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-primary hover:bg-opacity-10 transition-colors duration-200">
            <button onClick={() => onSelectPlan(plan)} className="flex-grow text-left">
              <p className="font-semibold text-gray-700 group-hover:text-primary">
                {plan.subject}: {plan.topic} {plan.isAdapted && <span className="font-normal text-secondary">(Adaptado)</span>}
              </p>
              <p className="text-sm text-gray-500">{new Date(plan.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} - {plan.grade}</p>
            </button>
            <div className="flex items-center space-x-2 ml-2">
              <button onClick={() => onSelectPlan(plan)} className="p-1 text-gray-400 hover:text-primary transition-colors" title="Ver Plano">
                  <FileText size={18} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDeletePlan(plan.id); }} className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Excluir Plano">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
