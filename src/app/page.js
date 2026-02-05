'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Bell, Sun, Moon, MapPin, CloudSun, Thermometer, Calendar, Quote, Cake, AlertTriangle, Radio } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SCHOOL_NAME = "ОШ „КАРАЂОРЂЕ”";

const MORNING_SCHEDULE = [
  { num: 1, label: "1. ЧАС", start: "08:00", end: "08:45" },
  { num: 0, label: "ОДМОР", start: "08:45", end: "08:50" },
  { num: 2, label: "2. ЧАС", start: "08:50", end: "09:35" },
  { num: 0, label: "В. ОДМОР", start: "09:35", end: "10:00" },
  { num: 3, label: "3. ЧАС", start: "10:00", end: "10:45" },
  { num: 0, label: "ОДМОР", start: "10:45", end: "10:50" },
  { num: 4, label: "4. ЧАС", start: "10:50", end: "11:35" },
  { num: 0, label: "ОДМОР", start: "11:35", end: "11:40" },
  { num: 5, label: "5. ЧАС", start: "11:40", end: "12:25" },
  { num: 6, label: "6. ЧАС", start: "12:30", end: "13:15" },
  { num: 7, label: "7. ЧАС", start: "13:15", end: "14:00" },
];

const AFTERNOON_SCHEDULE = [
  { num: 1, label: "1. ЧАС", start: "14:00", end: "14:45" },
  { num: 0, label: "ОДМОР", start: "14:45", end: "14:50" },
  { num: 2, label: "2. ЧАС", start: "14:50", end: "15:35" },
  { num: 0, label: "В. ОДМОР", start: "15:35", end: "16:00" },
  { num: 3, label: "3. ЧАС", start: "16:00", end: "16:45" },
  { num: 0, label: "ОДМОР", start: "16:45", end: "16:50" },
  { num: 4, label: "4. ЧАС", start: "16:50", end: "17:35" },
  { num: 0, label: "ОДМОР", start: "17:35", end: "17:40" },
  { num: 5, label: "5. ЧАС", start: "17:40", end: "18:25" },
  { num: 6, label: "6. ЧАС", start: "18:30", end: "19:15" },
  { num: 7, label: "7. ЧАС", start: "19:15", end: "20:00" },
];

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [announcements, setAnnouncements] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [weather, setWeather] = useState({ temp: '--' });
  const [emergency, setEmergency] = useState('НОРМАЛНО');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const rotation = setInterval(() => setActiveTab((prev) => (prev + 1) % 3), 12000);
    
    // АУТО РЕЛОАД сваких 30 минута ради стабилности
    const autoReload = setInterval(() => window.location.reload(), 1800000);

    const fetchWeather = () => {
        fetch('https://api.open-meteo.com/v1/forecast?latitude=44.81&longitude=20.46&current_weather=true')
        .then(res => res.json())
        .then(data => setWeather({ temp: Math.round(data.current_weather.temperature) }))
        .catch(() => {});
    };
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 900000);
    
    return () => { 
        clearInterval(timer); 
        clearInterval(rotation); 
        clearInterval(weatherInterval); 
        clearInterval(autoReload);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('realtime_updates').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchData = async () => {
    const { data: ann } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    const { data: bdays } = await supabase.from('birthdays').select('*');
    const { data: sys } = await supabase.from('system_settings').select('*').eq('key', 'emergency').single();
    if (ann) setAnnouncements(ann);
    if (bdays) setBirthdays(bdays);
    if (sys) setEmergency(sys.value);
  };

  const status = useMemo(() => {
    const hour = now.getHours();
    const currentMin = hour * 60 + now.getMinutes();
    const isMorning = hour < 14; 
    const schedule = isMorning ? MORNING_SCHEDULE : AFTERNOON_SCHEDULE;
    
    const activeSlot = schedule.find(s => {
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      return currentMin >= (sh * 60 + sm) && currentMin < (eh * 60 + em);
    });

    let progress = 0;
    if (activeSlot) {
      const [sh, sm] = activeSlot.start.split(':').map(Number);
      const [eh, em] = activeSlot.end.split(':').map(Number);
      const startSec = sh * 3600 + sm * 60;
      const endSec = eh * 3600 + em * 60;
      const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      progress = Math.min(Math.max(((nowSec - startSec) / (endSec - startSec)) * 100, 0), 100);
    }
    return { active: activeSlot || { label: "ВАН НАСТАВЕ", num: -1 }, progress, isMorning, schedule };
  }, [now]);

  if (emergency === "УЗБУНА") {
    return (
      <div className="h-screen w-screen bg-red-900 flex flex-col items-center justify-center text-white p-10">
        <div className="animate-ping mb-12 bg-white rounded-full p-10 text-red-600">
            <AlertTriangle size={180} />
        </div>
        <h1 className="text-[14vh] font-black leading-none mb-6">УЗБУНА</h1>
        <div className="bg-white text-red-900 px-20 py-10 rounded-[4rem] text-[6vh] font-black uppercase shadow-[0_0_100px_rgba(255,255,255,0.3)] tracking-tighter">
            Евакуација у току - пратите особље!
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#0F172A] text-white p-[2vh] flex flex-col font-sans overflow-hidden">
      
      {/* HEADER - NEW DARK PREMIUM */}
      <div className="h-[12vh] bg-white/5 backdrop-blur-xl rounded-[2.5rem] flex justify-between items-center px-[4vh] border border-white/10 mb-[2vh]">
        <div className="flex items-center gap-[3vh]">
          <div className="bg-blue-600 p-[2vh] rounded-[2rem] shadow-[0_0_30px_rgba(37,99,235,0.4)]">
            {status.isMorning ? <Sun size={40} /> : <Moon size={40} />}
          </div>
          <div>
            <h1 className="text-[4.5vh] font-black tracking-tighter leading-none mb-1">{SCHOOL_NAME}</h1>
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-[0.2em] text-[1.5vh]">
                <Radio size={14} className="animate-pulse" /> Систем активан • {status.isMorning ? "Смена А" : "Смена Б"}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-[6vh]">
          <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
             <Thermometer className="text-orange-400" size={24} />
             <span className="text-[3.5vh] font-black tabular-nums">{weather.temp}°C</span>
          </div>
          <div className="text-right border-l border-white/10 pl-10">
            <p className="text-[2vh] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
               {now.toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div className="text-[6vh] font-black tabular-nums leading-none tracking-tighter">
              {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
              <span className="text-[3vh] text-blue-500 opacity-60 ml-1">:{now.getSeconds().toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-[2vh] min-h-0">
        {/* LEVA STRANA - GLAVNI SAT */}
        <div className="w-[68%] flex flex-col gap-[2vh]">
          <div className="flex-1 bg-gradient-to-br from-white/5 to-transparent rounded-[4rem] flex flex-col items-center justify-center relative border border-white/5 shadow-2xl overflow-hidden">
             
             {/* BACKGROUND NUMBER DECORATION */}
             <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] text-[50vh] font-black italic select-none">
                {status.active.num > 0 ? status.active.num : ""}
             </div>
             
             <div className="relative h-[60vh] w-[60vh] flex items-center justify-center">
                <svg className="absolute h-full w-full rotate-[-90deg]">
                    <circle cx="50%" cy="50%" r="46%" stroke="rgba(255,255,255,0.03)" strokeWidth="40" fill="transparent" />
                    <circle cx="50%" cy="50%" r="46%" stroke={status.active.num > 0 ? "#2563eb" : "#10b981"} strokeWidth="40" fill="transparent" 
                            strokeDasharray="100%" strokeDashoffset={`${100 - status.progress}%`} strokeLinecap="round" 
                            className="transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(37,99,235,0.5)]" 
                            style={{strokeDasharray: '1445', strokeDashoffset: 1445 - (1445 * status.progress) / 100}} />
                </svg>
                <div className="text-center z-10">
                    <span className="text-[2.5vh] font-black text-slate-500 uppercase tracking-[0.5em] block mb-2">Тренутно</span>
                    <h2 className={`text-[12vh] font-black leading-none tracking-tighter uppercase italic ${status.active.num > 0 ? 'text-white' : 'text-emerald-400 animate-pulse'}`}>
                        {status.active.label}
                    </h2>
                    {status.active.num > 0 && (
                        <div className="mt-[4vh] text-[6vh] font-black text-blue-500 tabular-nums bg-blue-500/10 px-10 py-2 rounded-full border border-blue-500/20">
                            {Math.round(status.progress)}%
                        </div>
                    )}
                </div>
             </div>
          </div>

          {/* DONJI RASPORED - SMANJEN DA STANE SVE */}
          <div className="h-[12vh] bg-white/5 backdrop-blur-md rounded-[2.5rem] flex justify-around items-center px-4 border border-white/10">
              {status.schedule.filter(s => s.num > 0).map((s, i) => (
                  <div key={i} className={`flex flex-col items-center px-[1.5vw] py-[1vh] rounded-[1.5rem] transition-all duration-500 ${status.active.label === s.label ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'opacity-20'}`}>
                      <span className="text-[1.8vh] font-black">{s.label}</span>
                      <span className="text-[1.2vh] font-bold opacity-60 tracking-widest">{s.start}</span>
                  </div>
              ))}
          </div>
        </div>

        {/* DESNA STRANA - ROTACIJA */}
        <div className="w-[32%] flex flex-col bg-white/5 rounded-[4rem] border border-white/10 relative overflow-hidden">
            <div className="flex-1 p-[4vh] overflow-hidden">
                {activeTab === 0 && (
                  <div className="animate-in fade-in duration-1000">
                    <h3 className="text-[3vh] font-black text-orange-400 flex items-center gap-4 mb-[4vh] uppercase italic tracking-tighter">
                      <Bell size={32} /> Обавештења
                    </h3>
                    <div className="space-y-[2vh]">
                        {announcements.slice(0, 4).map((a, i) => (
                          <div key={i} className="bg-white/5 p-[3vh] rounded-[2rem] border-l-[8px] border-orange-500 text-[2.5vh] font-bold leading-tight shadow-xl">
                            {a.text}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                {activeTab === 1 && (
                  <div className="animate-in slide-in-from-right duration-1000">
                    <h3 className="text-[3vh] font-black text-pink-400 flex items-center gap-4 mb-[4vh] uppercase italic tracking-tighter">
                      <Cake size={32} /> Рођендани
                    </h3>
                    <div className="space-y-[1.5vh]">
                        {birthdays.length > 0 ? birthdays.map((b, i) => (
                          <div key={i} className="flex justify-between items-center bg-gradient-to-r from-pink-500/10 to-transparent p-[2.5vh] rounded-[2rem] border border-pink-500/20 text-[3vh] font-black">
                            <span>{b.name}</span>
                            <span className="text-[1.8vh] bg-white/10 px-4 py-1 rounded-full">{b.class_name}</span>
                          </div>
                        )) : <div className="mt-20 text-center text-slate-600 font-black uppercase tracking-[0.3em]">Нема рођендана</div>}
                    </div>
                  </div>
                )}
                {activeTab === 2 && (
                  <div className="animate-in zoom-in duration-1000 h-full flex flex-col items-center justify-center text-center">
                    <div className="bg-blue-600/20 p-[5vh] rounded-[4rem] mb-[4vh]">
                        <CloudSun size={100} className="text-blue-400" />
                    </div>
                    <h3 className="text-[3vh] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Тренутна Прогноза</h3>
                    <span className="text-[12vh] font-black leading-none">{weather.temp}°C</span>
                    <p className="text-[2vh] font-black text-blue-500 mt-6 tracking-[0.5em] uppercase">Београд</p>
                  </div>
                )}
            </div>
            
            {/* ТАЈМЕР РОТАЦИЈЕ */}
            <div className="h-[1vh] w-full bg-white/5">
                <div className="h-full bg-blue-600 transition-all duration-[12000ms] animate-[progress_12s_linear_infinite]" />
            </div>
        </div>
      </div>

      <style jsx>{` @keyframes progress { from { width: 0%; } to { width: 100%; } } `}</style>
    </div>
  );
}