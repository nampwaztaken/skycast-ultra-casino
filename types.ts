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

// Added WeatherData interface to fix missing member error
export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: string;
  windSpeed: string;
  sources?: Array<{uri: string, title?: string}>;
}