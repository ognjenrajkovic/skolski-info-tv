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
  const [quotes, setQuotes] = useState([]);
  const [weather, setWeather] = useState({ temp: '--' });
  const [emergency, setEmergency] = useState('НОРМАЛНО');
  const [activeTab, setActiveTab] = useState(0);

  // 1. Fetch data funkcija
  const fetchData = async () => {
    try {
      const { data: ann } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      const { data: bdays } = await supabase.from('birthdays').select('*');
      const { data: q } = await supabase.from('quotes').select('*');
      const { data: sys } = await supabase.from('system_settings').select('*').eq('key', 'emergency').single();
      
      if (ann) setAnnouncements(ann);
      if (bdays) setBirthdays(bdays);
      if (q) setQuotes(q);
      if (sys) setEmergency(sys.value);
    } catch (error) {
      console.error("Greška pri osvežavanju:", error);
    }
  };

  // 2. Real-time Subscription (FIX ZA INSTANT OSVEŽAVANJE)
  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData(); // Čim se bilo šta promeni u bilo kojoj tabeli, povuci nove podatke
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 3. Tajmeri i Vreme
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const rotation = setInterval(() => setActiveTab((prev) => (prev + 1) % 3), 15000);
    const autoReload = setInterval(() => { if (emergency !== 'УЗБУНА') window.location.reload(); }, 1800000);

    const fetchWeather = () => {
        fetch('https://api.open-meteo.com/v1/forecast?latitude=44.81&longitude=20.46&current_weather=true')
        .then(res => res.json())
        .then(data => setWeather({ temp: Math.round(data.current_weather.temperature) }))
        .catch(() => {});
    };
    fetchWeather();
    
    return () => { clearInterval(timer); clearInterval(rotation); clearInterval(autoReload); }
  }, [emergency]);

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
      progress = ((nowSec - startSec) / (endSec - startSec)) * 100;
    }
    return { active: activeSlot || { label: "ВАН НАСТАВЕ", num: -1 }, progress, isMorning, schedule };
  }, [now]);

  if (emergency === "УЗБУНА") {
    return (
      <div className="h-screen w-screen bg-red-700 flex flex-col items-center justify-center text-white p-10 overflow-hidden">
        <div className="absolute inset-0 bg-red-600 animate-[pulse_1s_infinite] opacity-50" />
        <AlertTriangle size={300} className="relative z-10 drop-shadow-2xl mb-10" />
        <h1 className="relative z-10 text-[18vh] font-[1000] leading-none mb-5 uppercase tracking-tighter drop-shadow-2xl">УЗБУНА</h1>
        <div className="relative z-10 bg-white text-red-700 px-20 py-8 rounded-[3rem] shadow-2xl">
            <p className="text-[6vh] font-black uppercase tracking-tight">Евакуација у току - Пратите наставнике</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#F1F5F9] text-slate-800 p-[1.5vh] flex flex-col font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="h-[12vh] bg-white rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.04)] flex justify-between items-center px-[4vh] mb-[1.5vh] border border-white">
        <div className="flex items-center gap-[3vh]">
          {/* LOGO MESTO */}
            <div className="flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Logo škole" 
                className="h-[9vh] w-auto drop-shadow-md hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = "https://via.placeholder.com/150?text=LOGO"; // Backup ako slika ne postoji
                }}  
              />
            </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-[2.2vh] rounded-[2.2rem] text-white shadow-xl shadow-blue-100">
             <Clock size={42} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[4.8vh] font-[1000] tracking-tighter text-slate-800 leading-none mb-1 uppercase">{SCHOOL_NAME}</h1>
            <div className="flex items-center gap-2 text-blue-500 font-bold uppercase tracking-[0.25em] text-[1.6vh]">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                {status.isMorning ? "Преподневна Смена" : "Поподневна Смена"}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-[6vh]">
          <div className="flex items-center gap-3 bg-slate-50/80 px-7 py-3 rounded-3xl border border-slate-100 shadow-inner">
             <Thermometer className="text-orange-500" size={28} />
             <span className="text-[3.8vh] font-black text-slate-700 tabular-nums">{weather.temp}°C</span>
          </div>
          <div className="text-right border-l-2 border-slate-100 pl-10">
            <p className="text-[2.2vh] font-black text-slate-300 uppercase leading-none mb-1 tracking-tight">
               {now.toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div className="text-[6.5vh] font-[1000] tabular-nums text-slate-800 leading-none tracking-tighter">
              {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
              <span className="text-[3vh] text-blue-400 font-bold ml-1">:{now.getSeconds().toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-[1.5vh] min-h-0">
        {/* LEVA STRANA */}
        <div className="w-[66%] flex flex-col gap-[1.5vh]">
          <div className="flex-1 bg-white rounded-[4.5rem] shadow-2xl p-8 flex flex-col items-center justify-center relative border border-white overflow-hidden">
             <div className="absolute top-10 left-10 opacity-[0.03] text-[40vh] font-[1000] italic select-none leading-none">
                {status.active.num > 0 ? status.active.num : ""}
             </div>
             
             <div className="relative h-[56vh] w-[56vh] flex items-center justify-center">
                <svg className="absolute h-full w-full rotate-[-90deg]">
                    <circle cx="50%" cy="50%" r="46%" stroke="#F1F5F9" strokeWidth="48" fill="transparent" />
                    <circle cx="50%" cy="50%" r="46%" stroke={status.active.num > 0 ? "#2563eb" : "#10b981"} strokeWidth="48" fill="transparent" 
                            strokeDasharray="1445" strokeDashoffset={1445 - (1445 * status.progress) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="text-center z-10 bg-white/10 backdrop-blur-sm p-10 rounded-full">
                    <span className="text-[2.5vh] font-black text-slate-300 uppercase tracking-[0.5em] block mb-2">Тренутно</span>
                    <h2 className={`text-[11vh] font-[1000] leading-[0.9] tracking-tighter uppercase italic ${status.active.num > 0 ? 'text-slate-800' : 'text-emerald-500'}`}>
                        {status.active.label}
                    </h2>
                    {status.active.num > 0 && (
                        <div className="mt-8 flex items-center justify-center gap-4 bg-slate-50 px-10 py-3 rounded-full border border-slate-100">
                            <span className="text-[5vh] font-[1000] text-blue-600 tabular-nums leading-none">{Math.round(status.progress)}%</span>
                        </div>
                    )}
                </div>
             </div>
          </div>

          <div className="h-[10vh] bg-white p-2 rounded-[3rem] shadow-lg flex justify-around items-center border border-white">
              {status.schedule.filter(s => s.num > 0).map((s, i) => (
                  <div key={i} className={`flex flex-col items-center px-[1.2vw] py-[0.5vh] rounded-[2rem] transition-all duration-500 ${status.active.label === s.label ? 'bg-blue-600 text-white shadow-xl scale-110' : 'opacity-20'}`}>
                      <span className="text-[2vh] font-black">{s.label}</span>
                      <span className="text-[1.2vh] font-bold opacity-60 uppercase">{s.start}</span>
                  </div>
              ))}
          </div>
        </div>

        {/* DESNA STRANA */}
        <div className="w-[34%] flex flex-col bg-white rounded-[4.5rem] shadow-2xl relative overflow-hidden border border-white">
            <div className="flex-1 p-[4.5vh] overflow-hidden">
                {activeTab === 0 && (
                  <div className="animate-in fade-in zoom-in duration-700">
                    <h3 className="text-[3.5vh] font-black text-orange-500 flex items-center gap-5 mb-[4.5vh] uppercase italic tracking-tighter">
                      <div className="bg-orange-100 p-3 rounded-2xl"><Bell size={36} fill="currentColor" /></div> Обавештења
                    </h3>
                    <div className="space-y-[2.5vh]">
                        {announcements.slice(0, 4).map((a, i) => (
                          <div key={i} className="bg-slate-50/50 p-[3vh] rounded-[2.5rem] border-l-[12px] border-orange-500 text-[2.8vh] font-[900] leading-[1.2] text-slate-700 shadow-sm">
                            {a.text}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                {activeTab === 1 && (
                  <div className="animate-in slide-in-from-right duration-700">
                    <h3 className="text-[3.5vh] font-black text-pink-500 flex items-center gap-5 mb-[4.5vh] uppercase italic tracking-tighter">
                      <div className="bg-pink-100 p-3 rounded-2xl"><Cake size={36} fill="currentColor" /></div> Рођендани
                    </h3>
                    <div className="space-y-[1.8vh]">
                        {birthdays.length > 0 ? birthdays.map((b, i) => (
                          <div key={i} className="flex justify-between items-center bg-gradient-to-r from-pink-50 to-transparent p-[2.5vh] rounded-[2.5rem] border border-pink-