'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Bell, Calendar, Sun, Moon, MapPin, CloudSun, Thermometer } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SCHOOL_NAME = "ОШ „КАРАЂОРЂЕ”";

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [announcements, setAnnouncements] = useState([]);
  const [weather, setWeather] = useState({ temp: '--', code: 0 });
  const [activeTab, setActiveTab] = useState(0); // 0: Обавештења, 1: Распоред, 2: Прогноза

  // 1. ПРЕЦИЗАН САТ И AUTO-RELOAD
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const reload = setInterval(() => window.location.reload(), 60000);
    const rotation = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 3);
    }, 15000); // Ротација сваких 15 секунди

    return () => { clearInterval(timer); clearInterval(reload); clearInterval(rotation); }
  }, []);

  // 2. ВРЕМЕНСКА ПРОГНОЗА (Open-Meteo API)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=44.81&longitude=20.46&current_weather=true');
        const data = await res.json();
        setWeather({ temp: Math.round(data.current_weather.temperature), code: data.current_weather.weathercode });
      } catch (e) { console.error("Weather error", e); }
    };
    fetchWeather();
  }, []);

  // 3. SUPABASE ОБАВЕШТЕЊА
  useEffect(() => {
    const fetchNotes = async () => {
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (data) setAnnouncements(data.map(a => a.text));
    };
    fetchNotes();
  }, []);

  const status = useMemo(() => {
    const hour = now.getHours();
    const currentMin = hour * 60 + now.getMinutes();
    const isAfternoon = hour >= 13;
    // Овде користимо твоју сатницу из претходног кода
    const currentSchedule = isAfternoon ? afternoonSchedule : morningSchedule; 
    let active = currentSchedule.find(s => {
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      return currentMin >= (sh * 60 + sm) && currentMin < (eh * 60 + em);
    }) || { label: "ВАН НАСТАВЕ", num: -1 };
    
    return { active, isAfternoon };
  }, [now]);

  return (
    <div className="h-screen w-screen bg-[#0f172a] text-white p-6 overflow-hidden flex flex-col font-sans">
      
      {/* HEADER - ФИКСАН */}
      <div className="flex justify-between items-center mb-6 bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
        <h1 className="text-4xl font-black tracking-tighter text-blue-400 uppercase leading-none">
          {SCHOOL_NAME} <span className="text-white opacity-40 mx-2">|</span> 
          <span className="text-2xl text-slate-300">{status.isAfternoon ? "ПОПОДНЕ" : "ПРЕПОДНЕ"}</span>
        </h1>
        <div className="text-right flex items-center gap-10">
          <div className="flex flex-col items-end leading-none">
            <span className="text-xl font-bold text-blue-300 uppercase mb-1">
              {now.toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <div className="text-7xl font-black tabular-nums">
              {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
              <span className="text-3xl text-blue-500 opacity-80">:{now.getSeconds().toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 gap-6 min-h-0">
        
        {/* ЛЕВА ЗОНА - ТРЕНУТНО СТАЊЕ (60%) */}
        <div className="w-[60%] flex flex-col gap-6">
          <div className={`flex-1 rounded-[4rem] flex flex-col justify-center p-16 relative overflow-hidden shadow-2xl transition-colors duration-1000 ${
            status.active.num > 0 ? "bg-gradient-to-br from-blue-600 to-indigo-900" : "bg-gradient-to-br from-emerald-600 to-teal-900"
          }`}>
            <span className="text-3xl font-bold uppercase tracking-[0.3em] opacity-60 mb-4">Тренутно:</span>
            <h2 className="text-[12rem] font-black leading-none tracking-tighter italic drop-shadow-2xl">
              {status.active.label}
            </h2>
            <div className="absolute top-10 right-10">
               {status.active.num > 0 ? <Sun size={100} className="opacity-20" /> : <Moon size={100} className="opacity-20" />}
            </div>
          </div>
          
          {/* МАЛА ПРОГНОЗА УГАО (Интегрисана у леву зону) */}
          <div className="bg-slate-800/80 p-8 rounded-[3rem] flex items-center justify-around border border-slate-700">
             <div className="flex items-center gap-4">
                <Thermometer size={48} className="text-orange-500" />
                <span className="text-6xl font-black">{weather.temp}°C</span>
             </div>
             <div className="h-12 w-[2px] bg-slate-700" />
             <div className="flex items-center gap-4">
                <CloudSun size={48} className="text-blue-400" />
                <span className="text-3xl font-bold uppercase tracking-widest text-slate-400">Београд</span>
             </div>
          </div>
        </div>

        {/* ДЕСНА ЗОНА - РОТИРАЈУЋИ ИНФО (40%) */}
        <div className="w-[40%] bg-slate-900/50 rounded-[4rem] border-4 border-slate-800 flex flex-col overflow-hidden relative shadow-inner">
          
          {/* TAB 0: ОБАВЕШТЕЊА */}
          {activeTab === 0 && (
            <div className="p-10 animate-in fade-in slide-in-from-right duration-700 flex flex-col h-full">
              <h3 className="text-4xl font-black mb-8 text-orange-500 flex items-center gap-4 uppercase italic">
                <Bell size={40} /> Обавештења
              </h3>
              <div className="space-y-6">
                {announcements.slice(0, 4).map((msg, i) => (
                  <div key={i} className="bg-white/5 p-8 rounded-[2.5rem] border-l-[12px] border-orange-500 text-3xl font-bold leading-tight">
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 1: РАСПОРЕД УЧИОНИЦА */}
          {activeTab === 1 && (
            <div className="p-10 animate-in fade-in slide-in-from-right duration-700 h-full flex flex-col">
              <h3 className="text-4xl font-black mb-8 text-emerald-400 flex items-center gap-4 uppercase italic">
                <MapPin size={40} /> Учионице
              </h3>
              <div className="grid grid-cols-1 gap-4">
                 {/* Овде убацујеш логику за приказ кабинета коју смо већ писали */}
                 <div className="text-5xl font-black p-6 bg-white/5 rounded-3xl text-center border border-white/10">
                    Приказ у изради...
                 </div>
              </div>
            </div>
          )}

          {/* TAB 2: ДЕТАЉНА ПРОГНОЗА */}
          {activeTab === 2 && (
            <div className="p-10 animate-in fade-in slide-in-from-right duration-700 h-full flex flex-col items-center justify-center text-center">
              <CloudSun size={150} className="text-blue-400 mb-6" />
              <h3 className="text-5xl font-black mb-4 uppercase">Време Данас</h3>
              <span className="text-[8rem] font-black leading-none">{weather.temp}°C</span>
              <p className="text-2xl font-bold text-slate-400 mt-4 uppercase tracking-widest italic">ОШ „Карађорђе” Инфо</p>
            </div>
          )}

          {/* ТАЈМЕР РОТАЦИЈЕ (Индикатор на дну) */}
          <div className="absolute bottom-0 left-0 h-2 bg-blue-500 transition-all duration-[15000ms] linear" 
               style={{ width: '100%', key: activeTab }} />
        </div>

      </div>
    </div>
  );
}

// Подаци за распоред (मॉर्निंग/आफ्टरनून) - исти као пре...