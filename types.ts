
export enum AppMode {
  WEATHER = 'WEATHER',
  CASINO = 'CASINO'
}

export type CasinoGame = 'LOBBY' | 'MINES' | 'PLINKO' | 'BLACKJACK' | 'POKER';

export interface User {
  username: string;
  balance: number;
  isLoggedIn: boolean;
  joinedDate: string;
}

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: string;
  windSpeed: string;
  description: string;
}

export interface GameState {
  balance: number;
  lastWin: number;
  history: Array<string>;
}
