import type { User } from '../types';

// Helper to strip password from user object before returning
const sanitizeUser = (user: any): User => {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
};

export const api = {
  login: async (email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Ocorreu um erro.' };
      }

      return { success: true, user: sanitizeUser(data.user) };

    } catch (error) {
      console.error("Network or other error:", error);
      return { success: false, message: 'Não foi possível conectar ao servidor.' };
    }
  },

  // As outras funções da API (register, etc.) serão migradas aqui nos próximos passos.
  // Por enquanto, vamos deixá-las como funções vazias para não quebrar o resto da aplicação.

  register: async (name: string, email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Ocorreu um erro.' };
      }

      return { success: true, user: sanitizeUser(data.user) };

    } catch (error) {
      console.error("Network or other error:", error);
      return { success: false, message: 'Não foi possível conectar ao servidor.' };
    }
  },

  incrementUsage: async (userId: string): Promise<{ success: boolean }> => {
    try {
      const response = await fetch('/api/users/increment-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Failed to increment usage:", data.message);
        return { success: false };
      }

      return { success: true };

    } catch (error) {
      console.error("Network or other error:", error);
      return { success: false };
    }
  },

  upgradeUser: async (userId: string): Promise<{ success: boolean; user?: User }> => {
    try {
      const response = await fetch('/api/users/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Ocorreu um erro.' };
      }

      return { success: true, user: sanitizeUser(data.user) };

    } catch (error) {
      console.error("Network or other error:", error);
      return { success: false, message: 'Não foi possível conectar ao servidor.' };
    }
  },

  getAdminStats: async (): Promise<{ totalUsers: number; premiumUsers: number; plansGenerated: number }> => {
    // Admin stats API was removed - returning mock data
    console.warn('Admin stats API not available');
    return { totalUsers: 0, premiumUsers: 0, plansGenerated: 0 };
  },

  getAllUsers: async (): Promise<User[]> => {
    // Admin users API was removed - returning empty array
    console.warn('Admin users API not available');
    return [];
  },

  getTeamMembers: async (teamId: string): Promise<User[]> => {
    try {
      const response = await fetch(`/api/teams/members?teamId=${teamId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      return await response.json();
    } catch (error) {
      console.error("Network or other error:", error);
      return [];
    }
  },

  inviteTeamMember: async (teamId: string, email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/teams/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId, email }),
      });
      const data = await response.json();
      return { success: response.ok, ...data };
    } catch (error) {
      console.error("Network or other error:", error);
      return { success: false, message: 'Não foi possível conectar ao servidor.' };
    }
  },

  acceptTeamInvite: async (token: string, email: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const response = await fetch('/api/teams/invites/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email }),
      });
      const data = await response.json();
      return { success: response.ok, user: data.user, message: data.message };
    } catch (error) {
      console.error("Network or other error:", error);
      return { success: false, message: 'Não foi possível conectar ao servidor.' };
    }
  },

  removeTeamMember: async (userIdToRemove: string, teamId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/teams/members/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIdToRemove, teamId }),
      });
      const data = await response.json();
      return { success: response.ok, message: data.message };
    } catch (error) {
      console.error("Network or other error:", error);
      return { success: false, message: 'Não foi possível conectar ao servidor.' };
    }
  },

  updateUserProfile: async (userId: string, name: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const response = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, name }),
      });
      const data = await response.json();
      return { success: response.ok, user: data.user, message: data.message };
    } catch (error) {
      console.error("Network or other error:", error);
      return { success: false, message: 'Não foi possível conectar ao servidor.' };
    }
  }
};