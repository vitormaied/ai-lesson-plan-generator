import { dbConnect, UserModel } from '../_db_mongo.js';

/**
 * Verifica se a assinatura do usuário está expirada e a reverte para Free se necessário
 */
export async function checkAndUpdateExpiredSubscriptions(userId: string) {
  try {
    await dbConnect();
    const user = await UserModel.findOne({ id: userId });
    
    if (!user || !user.subscription) {
      return { user, wasExpired: false };
    }

    const subscription = user.subscription;
    
    // Se não tem expiresAt, é provavelmente uma assinatura recorrente (Stripe), não expira
    if (!subscription.expiresAt) {
      return { user, wasExpired: false };
    }

    const now = new Date();
    const expirationDate = new Date(subscription.expiresAt);
    
    // Verificar se a assinatura expirou
    if (now > expirationDate && subscription.isActive) {
      console.log(`[Subscription] User ${user.email} subscription expired. Reverting to Free plan.`);
      
      // Reverter para plano gratuito
      user.subscription = {
        plan: 'Free',
        planGenerations: 2,
        isActive: true,
        // Remover campos de expiração
      };
      
      await user.save();
      return { user, wasExpired: true };
    }
    
    return { user, wasExpired: false };
  } catch (error) {
    console.error('[Subscription Checker] Error:', error);
    return { user: null, wasExpired: false };
  }
}

/**
 * Verifica quantos dias restam na assinatura
 */
export function getDaysUntilExpiration(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  
  const now = new Date();
  const expirationDate = new Date(expiresAt);
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Formata a data de expiração para exibição
 */
export function formatExpirationDate(expiresAt?: string): string | null {
  if (!expiresAt) return null;
  
  const date = new Date(expiresAt);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}