'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Bell, Sun, Moon, MapPin, CloudSun, Thermometer } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SCHOOL_NAME = "ОШ „КАРАЂОРЂЕ”";

// --- ДЕФИНИЦИЈЕ РАСПОРЕДА ВАН КОМПОНЕНТЕ ДА НЕ БИ БИЛО ГРЕШКЕ ---
const morningSchedule = [
  { num: 1, label: "1. ЧАС", start: "08:00", end: "08:45" },
  { num: 0, label: "ОДМОР", start: "08:45", end: "08:50" },
  { num: 2, label: "2. ЧАС", start: "08:50", end: "09:35" },
  { num: 0, label: "В. ОДМОР", start: "09:35", end: "10:00" },
  { num: 3, label: "3. ЧАС", start: "10:00", end: "10:45" },
  { num: 0, label: "ОДМОР", start: "10:45", end: "10:50" },
  { num: 4, label: "4. ЧАС", start: "10:50", end: "11:35" },
  { num: 0, label: "ОДМОР", start: "11:35", end: "11:40" },
  { num: 5, label: "5. ЧАС", start: "11:40", end: "12:25" },
];

const afternoonSchedule = [
  { num: 1, label: "1. ЧАС", start: "14:00", end: "14:45" },
  { num: 0, label: "ОДМОР", start: "14:45", end: "14:50" },
  { num: 2, label: "2. ЧАС", start: "14:50", end: "15:35" },
  { num: 0, label: "В. ОДМОР", start: "15:35", end: "16:00" },
  { num: 3, label: "3. ЧАС", start: "16:00", end: "16:45" },
  { num: 0, label: "ОДМОР", start: "16:45", end: "16:50" },
  { num: 4, label: "4. ЧАС", start: "16:50", end: "17:35" },
  { num: 0, label: "ОДМОР", start: "17:35", end: "17:40" },
  { num: 5, label: "5. ЧАС", start: "17:40", end: "18:25" },
];

const classLocations = {
  1: { "5-1": "Мат (2)", "6-2": "Српски (8)", "8-3": "Физ (12)" },
  2: { "5-1": "Српски (8)", "7-1": "Биол (5)", "8-2": "Ист (3)" },
  3: { "5-2": "Гео (4)", "6-1": "Лик (1)", "7-3": "Хем (10)" },
  4: { "1-1": "Српски (2)", "7-1": "Мат (8)", "5-3": "Тех (кб)" },
  5: { "6-1": "Физ", "8-1": "Енг (7)", "7-2": "Инф (лаб)" },
};

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [announcements, setAnnouncements] = useState([]);
  const [weather, setWeather] = useState({ temp: '--', code: 0 });
  const [activeTab, setActiveTab] = useState(0); 

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const reload = setInterval(() => window.location.reload(), 60000);
    const rotation = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 3);
    }, 15000); 

    return () => { clearInterval(timer); clearInterval(reload); clearInterval(rotation); }
  }, []);

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

  useEffect(() => {
    const fetchNotes = async () => {
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (data) setAnnouncements(data.map(a => a.text));
    };
    fetchNotes();
    const channel = supabase.channel('realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => fetchNotes()).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const status = useMemo(() => {
    const hour = now.getHours();
    const currentMin = hour * 60 + now.getMinutes();
    const isAfternoon = hour >= 13;
    const currentSchedule = isAfternoon ? afternoonSchedule : morningSchedule; 
    
    let activeSlot = currentSchedule.find(s => {
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      return currentMin >= (sh * 60 + sm) && currentMin < (eh * 60 + em);
    });

    let displayClassNum = activeSlot?.num || null;
    if (activeSlot && activeSlot.num === 0) {
        const next = currentSchedule.find(s => s.num > 0 && (Number(s.start.split(':')[0]) * 60 + Number(s.start.split(':')[1])) > currentMin);
        if (next) displayClassNum = next.num;
    }

    return { 
        active: activeSlot || { label: "ВАН НАСТАВЕ", num: -1 }, 
        isAfternoon,
        displayClassNum: displayClassNum || 1 
    };
  }, [now]);

  return (
    <div className="h-screen w-screen bg-[#020617] text-white p-6 overflow-hidden flex flex-col font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 bg-slate-900/80 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-6">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-900/20">
                {status.isAfternoon ? <Moon size={40} /> : <Sun size={40} />}
            </div>
            <div>
                <h1 className="text-4xl font-black tracking-tighter text-white uppercase leading-none">{SCHOOL_NAME}</h1>
                <p className="text-xl font-bold text-blue-500 uppercase mt-1 tracking-widest">
                    {status.isAfternoon ? "Поподневна смена" : "Преподневна смена"}
                </p>
            </div>
        </div>
        <div className="text-right flex items-center gap-10">
          <div className="flex flex-col items-end leading-none border-r border-slate-800 pr-10">
            <span className="text-xl font-bold text-slate-500 uppercase mb-2">
              {now.toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <div className="text-8xl font-black tabular-nums tracking-tighter">
              {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
              <span className="text-4xl text-blue-500 ml-1 opacity-80">:{now.getSeconds().toString().padStart(2, '0')}</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
             <Thermometer className="text-orange-500 mb-1" size={30} />
             <span className="text-4xl font-black">{weather.temp}°C</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 gap-6 min-h-0">
        
        {/* LEVA ZONA (60%) - TRENUTNI ČAS */}
        <div className="w-[60%] flex flex-col h-full">
          <div className={`flex-1 rounded-[4.5rem] flex flex-col justify-center p-20 relative overflow-hidden shadow-2xl transition-all duration-1000 ${
            status.active.num > 0 ? "bg-gradient-to-br from-blue-700 to-indigo-950" : "bg-gradient-to-br from-emerald-600 to-teal-950"
          }`}>
            <div className="relative z-10">
                <span className="text-3xl font-bold uppercase tracking-[0.4em] text-white/50 mb-6 block">Тренутно:</span>
                <h2 className="text-[14rem] font-black leading-[0.8] tracking-tighter italic drop-shadow-2xl">
                {status.active.label}
                </h2>
            </div>
            <Clock size={500} className="absolute -right-32 -bottom-32 opacity-5 rotate-12" />
          </div>
        </div>

        {/* DESNA ZONA (40%) - ROTACIJA */}
        <div className="w-[40%] bg-slate-900/40 rounded-[4.5rem] border-2 border-slate-800 flex flex-col overflow-hidden relative shadow-2xl backdrop-blur-sm">
          
          <div className="p-12 flex-grow">
            {activeTab === 0 && (
                <div className="animate-in fade-in slide-in-from-right duration-700">
                <h3 className="text-4xl font-black mb-10 text-orange-500 flex items-center gap-4 uppercase italic">
                    <Bell size={44} className="animate-pulse" /> Обавештења
                </h3>
                <div className="space-y-6">
                    {announcements.slice(0, 3).map((msg, i) => (
                    <div key={i} className="bg-slate-800/50 p-8 rounded-[3rem] border-l-[16px] border-orange-500 text-3xl font-bold shadow-lg leading-tight">
                        {msg}
                    </div>
                    ))}
                    {announcements.length === 0 && <p className="text-2xl text-slate-600 italic">Нема нових порука...</p>}
                </div>
                </div>
            )}

            {activeTab === 1 && (
                <div className="animate-in fade-in slide-in-from-right duration-700 h-full">
                <h3 className="text-4xl font-black mb-10 text-emerald-400 flex items-center gap-4 uppercase italic">
                    <MapPin size={44} /> Учионице: {status.displayClassNum}. час
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    {Object.entries(classLocations[status.displayClassNum] || {}).map(([ode, pre], i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-800/80 p-6 rounded-[2rem] border-b-2 border-slate-700">
                            <span className="text-4xl font-black text-white">{ode}</span>
                            <span className="text-3xl font-bold text-emerald-400 italic">{pre}</span>
                        </div>
                    ))}
                </div>
                </div>
            )}

            {activeTab === 2 && (
                <div className="animate-in fade-in slide-in-from-right duration-700 h-full flex flex-col items-center justify-center text-center">
                <CloudSun size={180} className="text-blue-400 mb-8" />
                <h3 className="text-5xl font-black mb-4 uppercase tracking-tighter">Прогноза Данас</h3>
                <span className="text-[10rem] font-black leading-none text-white">{weather.temp}°C</span>
                <p className="text-3xl font-bold text-slate-500 mt-6 uppercase tracking-widest">Београд</p>
                </div>
            )}
          </div>

          {/* PROGRESS BAR ZA ROTACIJU */}
          <div className="absolute bottom-0 left-0 h-3 bg-blue-600/50 w-full overflow-hidden">
             <div className="h-full bg-blue-500 animate-[progress_15s_linear_infinite]" />
          </div>
        </div>
      </div>
      
      {/* CSS ЗА PROGRESS BAR */}
      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}