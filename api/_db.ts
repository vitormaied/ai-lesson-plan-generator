
import type { User, SubscriptionPlan, Team, Invite } from '../../types';

// Internal type that includes the password for simulation purposes
export type StoredUser = User & { password?: string };

// This class will manage our in-memory database state
class Database {
    private users: StoredUser[];
    private teams: Team[];
    private invites: Invite[];
    private nextUserId: number;
    private nextTeamId: number;

    constructor() {
        this.users = [
            {
                id: '1',
                name: 'Administrador',
                email: 'admin@app.com',
                isAdmin: true,
                usageCount: 10,
                password: 'admin',
                subscription: { plan: 'School', planGenerations: 1000, teamMemberLimit: 10 },
                teamId: 't1'
            },
            {
                id: '2',
                name: 'Usuário Teste',
                email: 'user@app.com',
                isAdmin: false,
                usageCount: 2,
                password: 'user',
                subscription: { plan: 'Free', planGenerations: 2 }
            },
            {
                id: '3',
                name: 'Professor da Silva',
                email: 'teacher1@school.com',
                isAdmin: false,
                usageCount: 15,
                password: 'teacher',
                subscription: { plan: 'School', planGenerations: 1000, teamMemberLimit: 10 },
                teamId: 't1'
            }
        ];
        this.teams = [
            { id: 't1', name: 'Escola Exemplo', adminId: '1', memberLimit: 10 }
        ];
        this.invites = [];
        this.nextUserId = 4;
        this.nextTeamId = 2;
    }

    // User methods
    getUsers(): StoredUser[] {
        return this.users;
    }

    addUser(user: StoredUser) {
        this.users.push(user);
    }

    findUserByEmail(email: string): StoredUser | undefined {
        return this.users.find(u => u.email === email);
    }

    findUserById(id: string): StoredUser | undefined {
        return this.users.find(u => u.id === id);
    }

    getNextUserId(): string {
        const id = this.nextUserId;
        this.nextUserId++;
        return String(id);
    }

    // Team methods
    getTeams(): Team[] {
        return this.teams;
    }

    addTeam(team: Team) {
        this.teams.push(team);
    }

    findTeamById(teamId: string): Team | undefined {
        return this.teams.find(t => t.id === teamId);
    }

    findUsersByTeamId(teamId: string): StoredUser[] {
        return this.users.filter(u => u.teamId === teamId);
    }

    getNextTeamId(): string {
        const id = this.nextTeamId;
        this.nextTeamId++;
        return String(id);
    }

    // Invite methods
    getInvites(): Invite[] {
        return this.invites;
    }

    addInvite(invite: Invite) {
        this.invites.push(invite);
    }

    findInvite(token: string, email: string): Invite | undefined {
        return this.invites.find(inv => inv.token === token && inv.email === email);
    }

    removeInvite(invite: Invite) {
        this.invites = this.invites.filter(inv => inv.id !== invite.id);
    }

    // Helper to strip password from user object before returning
    sanitizeUser(user: StoredUser): User {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
    }
}

// Export a single instance of the Database class (Singleton pattern)
export const db = new Database();
