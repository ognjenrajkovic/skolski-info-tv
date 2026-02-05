'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Bell, Sun, Moon, MapPin, CloudSun, Thermometer, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SCHOOL_NAME = "ОШ „КАРАЂОРЂЕ”";

// RASPOREDI
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
    <div className="h-screen w-screen bg-[#F3F4F6] text-slate-900 p-6 overflow-hidden flex flex-col font-sans tracking-tight">
      
      {/* HEADER - SVETAO I ČIST */}
      <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-6">
            <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg">
                {status.isAfternoon ? <Moon size={32} /> : <Sun size={32} />}
            </div>
            <div>
                <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none">{SCHOOL_NAME}</h1>
                <p className="text-lg font-bold text-blue-600 uppercase mt-1">
                    {status.isAfternoon ? "Поподневна смена" : "Преподневна смена"}
                </p>
            </div>
        </div>
        <div className="flex items-center gap-10">
          <div className="text-right border-r-2 border-slate-100 pr-10">
            <p className="text-xl font-bold text-slate-400 uppercase mb-1 flex items-center justify-end gap-2">
              <Calendar size={20} /> {now.toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div className="text-7xl font-black tabular-nums text-slate-800">
              {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
              <span className="text-3xl text-blue-500 ml-1">:{now.getSeconds().toString().padStart(2, '0')}</span>
            </div>
          </div>
          <div className="flex flex-col items-center bg-orange-50 p-4 rounded-2xl border border-orange-100">
             <Thermometer className="text-orange-500 mb-1" size={24} />
             <span className="text-3xl font-black text-orange-600">{weather.temp}°C</span>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 gap-6 min-h-0">
        
        {/* LEVA KOLONA (70%) */}
        <div className="w-[70%] flex flex-col gap-6">
          
          {/* GLAVNI STATUS - BELI CARD SA JAKIM TEKSTOM */}
          <div className="flex-1 bg-white rounded-[3rem] shadow-md border border-slate-100 p-12 flex flex-col justify-center relative overflow-hidden">
             <div className="relative z-10">
                <span className="text-2xl font-bold uppercase tracking-widest text-slate-300 mb-4 block">Тренутно у току:</span>
                <h2 className={`text-[12rem] font-black leading-none tracking-tighter uppercase ${status.active.num > 0 ? 'text-blue-700' : 'text-emerald-600'}`}>
                    {status.active.label}
                </h2>
             </div>
             <Clock size={300} className="absolute -right-20 -bottom-20 text-slate-50 opacity-50" />
          </div>

          {/* HORIZONTALNA SATNICA - PREGLEDNA */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between px-10">
              {status.currentSchedule.filter(s => s.num > 0).map((slot, i) => (
                  <div key={i} className={`flex flex-col items-center px-4 py-2 rounded-2xl transition-all ${status.active.label === slot.label ? 'bg-blue-600 text-white shadow-lg scale-110' : 'opacity-30'}`}>
                      <span className="text-xl font-black">{slot.label}</span>
                      <span className="text-sm font-bold">{slot.start}</span>
                  </div>
              ))}
          </div>
        </div>

        {/* DESNA KOLONA (30%) - ROTACIJA SA JAKIM BOJAMA */}
        <div className="w-[30%] flex flex-col">
          <div className="flex-1 bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col relative">
             
             {/* TAB 0: OBAVESTENJA (Narandžasta tema) */}
             {activeTab === 0 && (
                 <div className="p-8 animate-in fade-in slide-in-from-bottom duration-500">
                    <h3 className="text-3xl font-black mb-8 text-orange-500 flex items-center gap-3 uppercase italic">
                        <Bell size={32} fill="currentColor" /> Обавештења
                    </h3>
                    <div className="space-y-4">
                        {announcements.slice(0, 3).map((msg, i) => (
                            <div key={i} className="bg-orange-50 p-6 rounded-3xl border-l-8 border-orange-500 text-2xl font-bold text-orange-900 shadow-sm leading-tight">
                                {msg}
                            </div>
                        ))}
                    </div>
                 </div>
             )}

             {/* TAB 1: UCIONICE (Zelena tema) */}
             {activeTab === 1 && (
                 <div className="p-8 animate-in fade-in slide-in-from-bottom duration-500 h-full flex flex-col">
                    <h3 className="text-3xl font-black mb-8 text-emerald-600 flex items-center gap-3 uppercase italic">
                        <MapPin size={32} /> Учионице: {status.displayClassNum}. час
                    </h3>
                    <div className="space-y-3 overflow-hidden">
                        {Object.entries(classLocations[status.displayClassNum] || {}).map(([ode, pre], i) => (
                            <div key={i} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-3xl font-black text-slate-800">{ode}</span>
                                <span className="text-xl font-bold text-emerald-600 italic">{pre}</span>
                            </div>
                        ))}
                    </div>
                 </div>
             )}

             {/* TAB 2: VREME (Plava tema) */}
             {activeTab === 2 && (
                 <div className="p-8 animate-in fade-in slide-in-from-bottom duration-500 h-full flex flex-col items-center justify-center text-center">
                    <div className="bg-blue-50 p-10 rounded-full mb-6">
                        <CloudSun size={100} className="text-blue-500" />
                    </div>
                    <h3 className="text-4xl font-black mb-2 uppercase text-slate-800">Прогноза</h3>
                    <span className="text-[7rem] font-black text-blue-600 leading-none">{weather.temp}°C</span>
                    <p className="text-xl font-bold text-slate-400 mt-4 tracking-[0.2em] uppercase">Београд</p>
                 </div>
             )}

             {/* PROGRESS BAR - INDIKATOR ROTACIJE */}
             <div className="absolute bottom-0 left-0 w-full h-2 bg-slate-50">
                 <div className="h-full bg-blue-500 animate-[progress_15s_linear_infinite]" />
             </div>
          </div>
        </div>

      </div>

      <style jsx>{` @keyframes progress { from { width: 0%; } to { width: 100%; } } `}</style>
    </div>
  );
}