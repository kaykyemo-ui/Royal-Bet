export enum PixKeyType {
  CPF = 'CPF',
  EMAIL = 'E-mail',
  PHONE = 'Telefone',
}

export interface UserProfile {
  fullName: string;
  birthDate: string;
  cpf: string;
  phone: string;
  email: string; // New field
  pixKeyType: PixKeyType;
  pixKey: string;
  password?: string; // Not stored in plain text in real app, but used for form state
  balance: number;   // User's current wallet balance
  totalSpent: number; // Total amount wagered by the user (used for game logic)
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
}

export enum AuthMode {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  RECOVERY = 'RECOVERY' // New mode for password reset
}