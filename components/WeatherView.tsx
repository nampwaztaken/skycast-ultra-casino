
import React, { useState, useEffect } from 'react';
import { getRealWeather, getAIWeatherInsight } from '../services/gemini';
import { User, WeatherData } from '../types';

interface Props {
  user: User;
  onLogin: (name: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const WeatherView: React.FC<Props> = ({ user, onLogin, searchQuery, onSearchChange }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [insight, setInsight] = useState("Loading atmospheric data...");
  const [loading, setLoading] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isSimulated, setIsSimulated] = useState(false);

  const fetchWeather = async (city: string) => {
    setLoading(true);
    setIsSimulated(false);
    const data = await getRealWeather(city);
    if (data) {
      setWeather(data);
      // Check if description indicates fallback
      if (data.description.includes("satellite simulation") || data.description.includes("sensors providing estimated")) {
        setIsSimulated(true);
      }
      const advice = await getAIWeatherInsight(data.city, data.condition, data.temp);
      setInsight(advice);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWeather("San Francisco");
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchWeather(searchQuery);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1e3a8a] to-[#1e1b4b] min-h-screen flex flex-col items-center p-6 text-white font-sans">
      <div className="w-full max-w-md">
        {/* Header / Account Toggle */}
        <header className="flex justify-between items-center mb-8 px-2">
          <div onClick={() => setShowAccount(!showAccount)} className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all">
              <span className="text-xl">👤</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Account</p>
              <p className="font-bold">{user.isLoggedIn ? user.username : "Sign In"}</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-black italic tracking-tighter">SKYCAST CLOUD</h1>
          </div>
        </header>

        {showAccount && !user.isLoggedIn && (
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 mb-8 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4">Cloud Auth</h3>
            <input 
              type="text" 
              placeholder="Username" 
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 mb-4 outline-none focus:border-white/40"
            />
            <button 
              onClick={() => onLogin(tempName || "User")}
              className="w-full bg-white text-blue-900 font-black py-3 rounded-xl hover:bg-blue-50 transition-all"
            >
              Link Account
            </button>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 shadow-2xl border border-white/10 relative overflow-hidden">
          {isSimulated && (
            <div className="absolute top-4 left-0 w-full flex justify-center pointer-events-none">
              <span className="bg-orange-500/80 backdrop-blur-sm text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-orange-400/50 animate-pulse">
                Uplink Congested - Estimated Data
              </span>
            </div>
          )}

          <form onSubmit={handleSearchSubmit} className="mb-8 mt-4">
            <div className="relative group">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search city..."
                className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all group-hover:border-white/30"
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity">
                🔍
              </button>
            </div>
          </form>

          {loading ? (
            <div className="text-center py-20 animate-pulse">
              <p className="text-4xl">🛰️</p>
              <p className="mt-4 text-xs font-black uppercase tracking-widest opacity-40">Syncing with satellites...</p>
            </div>
          ) : weather && (
            <div className="animate-in fade-in duration-700">
              <div className="text-center mb-10">
                <p className="text-lg opacity-70 font-medium">{weather.city}</p>
                <h2 className="text-8xl font-thin my-2">{weather.temp}°</h2>
                <div className="flex items-center justify-center space-x-2">
                  <p className="text-xl font-black uppercase tracking-widest">{weather.condition}</p>
                </div>
                <p className="text-xs opacity-60 mt-2 font-medium px-4">{weather.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-black/20 p-5 rounded-3xl border border-white/5">
                  <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Humidity</span>
                  <p className="text-xl font-bold">{weather.humidity}</p>
                </div>
                <div className="bg-black/20 p-5 rounded-3xl border border-white/5">
                  <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Wind</span>
                  <p className="text-xl font-bold">{weather.windSpeed}</p>
                </div>
              </div>

              <div className="bg-blue-500/20 p-6 rounded-3xl border border-blue-400/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-3xl">🤖</div>
                <h3 className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-3">AI Advisory</h3>
                <p className="text-sm italic leading-relaxed opacity-90">{insight}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <p className="mt-12 text-[10px] font-black opacity-20 uppercase tracking-[0.2em] text-center max-w-xs">
        System 4.0 // Satellite Sync Verified
      </p>
    </div>
  );
};

export default WeatherView;
