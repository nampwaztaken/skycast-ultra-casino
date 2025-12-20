
import React, { useState, useEffect } from 'react';
import { AppMode, User } from './types';
import WeatherView from './components/WeatherView';
import CasinoView from './components/CasinoView';

const SECRET_CODE = "777-JACKPOT";

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.WEATHER);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('skycast_user');
    return saved ? JSON.parse(saved) : {
      username: "Guest",
      balance: 1000,
      isLoggedIn: false,
      joinedDate: new Date().toLocaleDateString()
    };
  });

  useEffect(() => {
    localStorage.setItem('skycast_user', JSON.stringify(user));
  }, [user]);

  const setBalance = (updater: number | ((prev: number) => number)) => {
    setUser(prev => {
      const nextBalance = typeof updater === 'function' ? updater(prev.balance) : updater;
      return { ...prev, balance: Math.max(0, nextBalance) };
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.toUpperCase() === SECRET_CODE) {
      setMode(AppMode.CASINO);
      setSearchQuery("");
    }
  };

  const handleLogin = (username: string) => {
    setUser(prev => ({ ...prev, username, isLoggedIn: true }));
  };

  const handleExitCasino = () => {
    setMode(AppMode.WEATHER);
  };

  return (
    <div className="min-h-screen">
      {mode === AppMode.WEATHER ? (
        <WeatherView 
          user={user}
          onLogin={handleLogin}
          searchQuery={searchQuery} 
          onSearchChange={handleSearch} 
        />
      ) : (
        <CasinoView 
          balance={user.balance} 
          setBalance={setBalance} 
          onExit={handleExitCasino} 
        />
      )}
    </div>
  );
};

export default App;
