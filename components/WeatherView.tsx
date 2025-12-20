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
  const [insight, setInsight] = useState("Synchronizing with orbital sensors...");
  const [loading, setLoading] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [tempName, setTempName] = useState("");

  const fetchWeather = async (city: string) => {
    setLoading(true);
    try {
      const data = await getRealWeather(city);
      if (data) {
        setWeather(data);
        const advice = await getAIWeatherInsight(data.city, data.condition, data.temp);
        setInsight(advice);
      }
    } catch (e) {
      console.error("Failed to fetch weather", e);
    } finally {
      setLoading(false);
    }
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
    <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617] min-h-screen flex flex-col items-center p-6 text-white font-sans">
      <div className="w-full max-w-md">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div onClick={() => setShowAccount(!showAccount)} className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-all">
              <span className="text-xl">👤</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">User Profile</p>
              <p className="font-bold text-sm">{user.isLoggedIn ? user.username : "Guest User"}</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-black italic tracking-tight text-blue-400">SKYCAST ULTRA</h1>
            <p className="text-[8px] font-bold opacity-30 uppercase tracking-[0.2em]">Atmos Monitor v4.2</p>
          </div>
        </header>

        {showAccount && !user.isLoggedIn && (
          <div className="bg-white/5 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/10 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-50">Cloud Account Sync</h3>
            <input 
              type="text" 
              placeholder="Enter User ID" 
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 mb-4 outline-none focus:border-blue-500/50 transition-all"
            />
            <button 
              onClick={() => { onLogin(tempName || "SkyUser"); setShowAccount(false); }}
              className="w-full bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-500 transition-all shadow-lg"
            >
              Link Satellite ID
            </button>
          </div>
        )}

        <div className="bg-white/[0.03] backdrop-blur-md rounded-[3rem] p-8 shadow-2xl border border-white/10 relative">
          <form onSubmit={handleSearchSubmit} className="mb-10">
            <div className="relative">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search global coordinates..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 hover:opacity-100 transition-opacity">
                🔍
              </button>
            </div>
          </form>

          {loading ? (
            <div className="text-center py-24 animate-pulse">
              <div className="text-5xl mb-6">📡</div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Polling Satellite Uplink...</p>
            </div>
          ) : weather && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center mb-12">
                <p className="text-sm font-bold opacity-40 tracking-widest uppercase mb-1">{weather.city}</p>
                <div className="relative inline-block">
                   <h2 className="text-9xl font-extralight tracking-tighter">{Math.round(weather.temp)}°</h2>
                </div>
                <p className="text-2xl font-black uppercase tracking-[0.2em] mt-2 text-blue-200">{weather.condition}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-black/40 p-5 rounded-[2rem] border border-white/5 flex flex-col items-center">
                  <span className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-1">Humidity</span>
                  <p className="text-xl font-bold">{weather.humidity}</p>
                </div>
                <div className="bg-black/40 p-5 rounded-[2rem] border border-white/5 flex flex-col items-center">
                  <span className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-1">Wind Velocity</span>
                  <p className="text-xl font-bold">{weather.windSpeed}</p>
                </div>
              </div>

              <div className="bg-blue-500/5 p-6 rounded-[2.5rem] border border-blue-400/10 relative overflow-hidden group">
                <div className="absolute -right-2 -top-2 p-4 opacity-5 text-4xl group-hover:opacity-10 transition-opacity">🤖</div>
                <h3 className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3">Orbital Insight</h3>
                <p className="text-xs italic leading-relaxed text-blue-100/80">{insight}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-12 flex flex-col items-center space-y-2">
        <div className="h-px w-12 bg-white/10"></div>
        <p className="text-[8px] font-black opacity-20 uppercase tracking-[0.4em] text-center">
          Quantum Core Sync Active
        </p>
      </div>
    </div>
  );
};

export default WeatherView;