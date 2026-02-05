'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Bell, Sun, Moon, MapPin, CloudSun, Thermometer, Calendar, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SCHOOL_NAME = "ОШ „КАРАЂОРЂЕ”";

// --- РАСПОРЕДИ (Morning & Afternoon) ---
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
  const [weather, setWeather] = useState({ temp: '--' });
  const [activeTab, setActiveTab] = useState(0); 

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const reload = setInterval(() => window.location.reload(), 60000);
    const rotation = setInterval(() => setActiveTab((prev) => (prev + 1) % 3), 15000); 
    return () => { clearInterval(timer); clearInterval(reload); clearInterval(rotation); }
  }, []);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=44.81&longitude=20.46&current_weather=true')
      .then(res => res.json())
      .then(data => setWeather({ temp: Math.round(data.current_weather.temperature) }))
      .catch(() => {});
  }, []);

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
    const currentSchedule = isAfternoon ? afternoonSchedule : morningSchedule; 
    let activeSlot = currentSchedule.find(s => {
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      return currentMin >= (sh * 60 + sm) && currentMin < (eh * 60 + em);
    });
    let displayClassNum = activeSlot?.num || 1;
    if (activeSlot?.num === 0) {
        const next = currentSchedule.find(s => s.num > 0 && (Number(s.start.split(':')[0]) * 60 + Number(s.start.split(':')[1])) > currentMin);
        if (next) displayClassNum = next.num;
    }
    return { active: activeSlot || { label: "ВАН НАСТАВЕ", num: -1 }, isAfternoon, displayClassNum, currentSchedule };
  }, [now]);

  return (
    <div className="h-screen w-screen bg-[#F0F2F5] text-slate-900 p-8 overflow-hidden flex flex-col font-sans tracking-tight">
      
      {/* HEADER: Кристално чист са белим панелом */}
      <div className="flex justify-between items-center mb-8 bg-white p-8 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-white">
        <div className="flex items-center gap-8">
            <div className="bg-blue-600 p-5 rounded-[2rem] text-white shadow-xl shadow-blue-100">
                {status.isAfternoon ? <Moon size={40} /> : <Sun size={40} />}
            </div>
            <div>
                <h1 className="text-5xl font-[900] text-slate-800 uppercase tracking-tighter leading-none">{SCHOOL_NAME}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-4 py-1 rounded-full text-sm font-black uppercase ${status.isAfternoon ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                    {status.isAfternoon ? "Поподне" : "Преподне"}
                  </span>
                  <div className="h-2 w-2 rounded-full bg-slate-300" />
                  <p className="text-xl font-bold text-slate-400 uppercase tracking-widest leading-none">Смена</p>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-12">
          <div className="text-right border-r-4 border-slate-50 pr-12">
            <div className="flex items-center justify-end gap-3 text-2xl font-black text-slate-400 uppercase mb-2">
              <Calendar size={28} className="text-blue-500" />
              {now.toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div className="text-[6.5rem] font-[1000] tabular-nums text-slate-800 leading-none tracking-tighter">
              {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
              <span className="text-4xl text-blue-600 ml-2 font-black opacity-80">:{now.getSeconds().toString().padStart(2, '0')}</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center bg-white border-2 border-orange-50 p-5 rounded-[2rem] min-w-[140px]">
             <Thermometer className="text-orange-500 mb-1" size={32} />
             <span className="text-5xl font-[1000] text-slate-800">{weather.temp}°C</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 gap-8 min-h-0">
        
        {/* LEVA STRANA (72%) */}
        <div className="w-[72%] flex flex-col gap-8">
          
          {/* ТРЕНУТНИ ЧАС: Највећи фокус */}
          <div className="flex-1 bg-white rounded-[4rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-white p-16 flex flex-col justify-center relative overflow-hidden group">
             <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`h-4 w-4 rounded-full animate-ping ${status.active.num > 0 ? 'bg-blue-600' : 'bg-emerald-500'}`} />
                  <span className="text-3xl font-black uppercase tracking-[0.2em] text-slate-300">Тренутно:</span>
                </div>
                <h2 className={`text-[15rem] font-[1000] leading-[0.75] tracking-tighter uppercase italic ${status.active.num > 0 ? 'text-blue-700' : 'text-emerald-600'}`}>
                    {status.active.label}
                </h2>
             </div>
             <Clock size={400} className="absolute -right-32 -bottom-32 text-slate-50 opacity-60" />
          </div>

          {/* ДОЊА САТНИЦА: Хоризонтални преглед */}
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-white flex justify-between items-center px-12">
              {status.currentSchedule.filter(s => s.num > 0).map((slot, i) => (
                  <React.Fragment key={i}>
                    <div className={`flex flex-col items-center px-6 py-3 rounded-[1.5rem] transition-all duration-500 ${status.active.label === slot.label ? 'bg-blue-600 text-white shadow-2xl scale-125 z-20' : 'opacity-20 scale-90'}`}>
                        <span className="text-2xl font-[1000] tracking-tighter">{slot.label}</span>
                        <span className="text-base font-bold opacity-80">{slot.start}</span>
                    </div>
                    {i < 4 && <ChevronRight className="text-slate-100" size={32} />}
                  </React.Fragment>
              ))}
          </div>
        </div>

        {/* DESNA STRANA (28%) - РОТИРАЈУЋИ ИНФО */}
        <div className="w-[28%] flex flex-col">
          <div className="flex-1 bg-white rounded-[4rem] shadow-2xl border border-white overflow-hidden flex flex-col relative">
             
             {/* HEADER ДЕСНОГ ПАНЕЛА */}
             <div className="h-3 w-full bg-slate-50 flex">
                <div className={`h-full transition-all duration-1000 ${activeTab === 0 ? 'w-full bg-orange-500' : activeTab === 1 ? 'w-full bg-emerald-500' : 'w-full bg-blue-500'}`} 
                     style={{ width: '100%', animation: 'progress 15s linear infinite' }} />
             </div>

             {/* САДРЖАЈ ТАБОВА */}
             <div className="p-10 flex-grow">
               {activeTab === 0 && (
                   <div className="animate-in fade-in zoom-in duration-700">
                      <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 bg-orange-100 rounded-2xl text-orange-600"><Bell size={36} fill="currentColor" /></div>
                        <h3 className="text-4xl font-[1000] text-slate-800 uppercase tracking-tighter italic">Вести</h3>
                      </div>
                      <div className="space-y-5">
                          {announcements.slice(0, 3).map((msg, i) => (
                              <div key={i} className="bg-orange-50/50 p-7 rounded-[2.5rem] border-l-[12px] border-orange-500 text-2xl font-black text-slate-700 shadow-sm leading-tight">
                                  {msg}
                              </div>
                          ))}
                          {announcements.length === 0 && <p className="text-2xl text-slate-300 font-bold italic text-center mt-20 uppercase tracking-widest">Нема вести</p>}
                      </div>
                   </div>
               )}

               {activeTab === 1 && (
                   <div className="animate-in fade-in zoom-in duration-700">
                      <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600"><MapPin size={36} /></div>
                        <h3 className="text-4xl font-[1000] text-slate-800 uppercase tracking-tighter italic">Кабинети</h3>
                      </div>
                      <div className="space-y-3">
                          <p className="text-xl font-bold text-slate-400 mb-4 uppercase tracking-widest">{status.displayClassNum}. час:</p>
                          {Object.entries(classLocations[status.displayClassNum] || {}).map(([ode, pre], i) => (
                              <div key={i} className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                                  <span className="text-3xl font-[1000] text-slate-800 leading-none">{ode}</span>
                                  <span className="text-xl font-bold text-emerald-600 italic leading-none">{pre}</span>
                              </div>
                          ))}
                      </div>
                   </div>
               )}

               {activeTab === 2 && (
                   <div className="animate-in fade-in zoom-in duration-700 h-full flex flex-col items-center justify-center text-center">
                      <div className="bg-blue-50 p-12 rounded-[3rem] mb-8 border-2 border-blue-100 shadow-inner">
                          <CloudSun size={120} className="text-blue-500" />
                      </div>
                      <h3 className="text-4xl font-[1000] uppercase text-slate-800 tracking-tighter mb-2">Прогноза</h3>
                      <span className="text-[8.5rem] font-[1000] text-blue-600 leading-none tracking-tighter">{weather.temp}°C</span>
                      <p className="text-2xl font-black text-slate-400 mt-6 tracking-[0.3em] uppercase">Београд</p>
                   </div>
               )}
             </div>

             <div className="p-10 border-t border-slate-50 opacity-40">
                <p className="text-sm font-black text-slate-400 text-center uppercase tracking-[0.5em]">ОШ Карађорђе • Инфо Систем</p>
             </div>
          </div>
        </div>

      </div>

      <style jsx>{` 
        @keyframes progress { 
          from { transform: translateX(-100%); } 
          to { transform: translateX(0%); } 
        } 
      `}</style>
    </div>
  );
}