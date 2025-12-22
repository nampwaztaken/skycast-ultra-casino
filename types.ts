
export type CasinoGame = 'LOBBY' | 'MINES' | 'PLINKO' | 'BLACKJACK' | 'POKER';

export interface UserProfile {
  uid: string;
  fullName: string;
  username: string;
  password?: string;
  balance: number;
  joinedDate: string;
}

export interface User {
  username: string;
  balance: number;
  isLoggedIn: boolean;
  joinedDate: string;
}

export interface GameState {
  balance: number;
  lastWin: number;
  history: Array<string>;
}

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: string;
  windSpeed: string;
  sources?: { uri: string; title: string }[];
}

// Added for the Update Patch system
export interface SystemConfig {
  minRequiredVersion: number;
  maintenanceMode: boolean;
  alertMessage?: string;
}
