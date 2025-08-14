
export type SubscriptionPlan = 'Free' | 'Personal' | 'School';

export interface Subscription {
  plan: SubscriptionPlan;
  planGenerations: number;
  teamMemberLimit?: number; // Apenas para o plano 'School'
  renewalDate?: string;
  expiresAt?: string; // Data de expiração da assinatura (para pagamentos PIX únicos)
  isActive?: boolean; // Se a assinatura está ativa (não expirada)
}

export interface Team {
  id: string;
  name: string; // Nome da escola
  adminId: string; // ID do usuário que é admin da equipe
  memberLimit: number; // Limite de membros na equipe
}

export interface Invite {
  id: string;
  teamId: string;
  email: string; // Email do convidado
  token: string; // Token único para o link de convite
  expiresAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean; // Admin geral da plataforma
  usageCount: number;
  subscription: Subscription;
  teamId?: string; // ID da equipe à qual o usuário pertence
}

export interface LessonPlanInput {
  date: string;
  grade: string;
  subject: string;
  topic: string;
  schoolName: string;
  teacherName: string;
  educationLevel: 'Educação Infantil' | 'Ensino Fundamental' | 'Ensino Médio' | '';
}

export interface LessonPlan extends LessonPlanInput {
  id: string;
  bnccSkills: string[];
  objectives: string[];
  methodology: string;
  resources: string[];
  assessment: string[];
  createdAt: string;
  activities?: string[];
  isAdapted?: boolean;
  studentName?: string;
  studentNeeds?: string;
}
