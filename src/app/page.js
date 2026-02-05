'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Bell, Thermometer, Quote, Cake, AlertTriangle, BookOpen, GraduationCap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SCHOOL_NAME = "ОШ „КАРАЂОРЂЕ”";

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [announcements, setAnnouncements] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [weather, setWeather] = useState({ temp: '--' });
  const [emergency, setEmergency] = useState('НОРМАЛНО');
  const [activeTab, setActiveTab] = useState(0); // 0: Obaveštenja, 1: Rođendani, 2: Raspored, 3: Citati

  // 1. POLLING MEHANIZAM - Menja Realtime koji ne radi u bazi
  const fetchData = async () => {
    try {
      const { data: ann } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      const { data: bdays } = await supabase.from('birthdays').select('*');
      const { data: q } = await supabase.from('quotes').select('*');
      const { data: tt } = await supabase.from('timetable').select('*');
      const { data: sys } = await supabase.from('system_settings').select('*').eq('key', 'emergency').single();
      
      if (ann) setAnnouncements(ann);
      if (bdays) setBirthdays(bdays);
      if (q) setQuotes(q);
      if (tt) setTimetable(tt);
      if (sys && sys.value !== emergency) setEmergency(sys.value);
    } catch (e) {
      console.error("Greška pri povlačenju podataka:", e);
    }
  };

  useEffect(() => {
    fetchData(); // Prvo učitavanje
    const interval = setInterval(fetchData, 5000); // Provera na svakih 5 sekundi
    return () => clearInterval(interval);
  }, [emergency]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const rotation = setInterval(() => setActiveTab((prev) => (prev + 1) % 4), 15000);
    
    // Weather API
    fetch('https://api.open-meteo.com/v1/forecast?latitude=44.81&longitude=20.46&current_weather=true')
      .then(res => res.json())
      .then(data => setWeather({ temp: Math.round(data.current_weather.temperature) }))
      .catch(() => {});

    return () => { clearInterval(timer); clearInterval(rotation); };
  }, []);

  // 2. LOGIKA ZA SMENE I DAN
  const statusInfo = useMemo(() => {
    const days = ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"];
    const currentDay = days[now.getDay()];
    const hour = now.getHours();
    const isMorning = hour < 14;

    // Određivanje parne/neparne nedelje (ISO standard)
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    const isWeekEven = weekNo % 2 === 0;

    // Pravilo: Ako je parna nedelja, PARNA smena je prepodne
    const activeShift = isMorning 
      ? (isWeekEven ? "Парна" : "Непарна") 
      : (isWeekEven ? "Непарна" : "Парна");

    const filteredTimetable = timetable.filter(t => t.day === currentDay && t.shift === activeShift);

    return { currentDay, isMorning, activeShift, filteredTimetable };
  }, [now, timetable]);

  if (emergency === "УЗБУНА") {
    return (
      <div className="h-screen w-screen bg-red-700 flex flex-col items-center justify-center text-white p-10 overflow-hidden">
        <div className="absolute inset-0 bg-red-600 animate-pulse opacity-50" />
        <AlertTriangle size={300} className="relative z-10 mb-10 drop-shadow-2xl" />
        <h1 className="relative z-10 text-[18vh] font-black uppercase tracking-tighter leading-none">УЗБУНА</h1>
        <div className="relative z-10 bg-white text-red-700 px-20 py-8 rounded-[3rem] shadow-2xl mt-10">
          <p className="text-[6vh] font-black uppercase tracking-tight">Евакуација у току - Пратите наставнике</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#F1F5F9] text-slate-800 p-[1.5vh] flex flex-col font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="h-[12vh] bg-white rounded-[2.5rem] shadow-sm flex justify-between items-center px-[5vh] mb-[1.5vh] border border-white">
        <div className="flex items-center gap-[4vh]">
          <img src="/logo.png" alt="Logo" className="h-[8vh] w-auto" onError={(e) => {e.target.src="https://via.placeholder.com/100?text=LOGO"}} />
          <div>
            <h1 className="text-[4.5vh] font-[1000] tracking-tighter leading-none uppercase">{SCHOOL_NAME}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[1.8vh] font-bold text-blue-600 bg-blue-50 px-3 py-0.5 rounded-full uppercase tracking-widest">
                {statusInfo.activeShift} Смена
              </span>
              <span className="text-[1.8vh] font-bold text-slate-400 uppercase tracking-widest italic">
                {statusInfo.isMorning ? "Преподне" : "Поподне"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-[6vh]">
          <div className="flex items-center gap-3 bg-slate-50 px-6 py-2 rounded-2xl border border-slate-100">
             <Thermometer className="text-orange-500" size={24} />
             <span className="text-[3.5vh] font-black tabular-nums">{weather.temp}°C</span>
          </div>
          <div className="text-right border-l-2 border-slate-100 pl-8">
            <p className="text-[2vh] font-bold text-slate-400 uppercase leading-none mb-1">{statusInfo.currentDay}</p>
            <div className="text-[6vh] font-[1000] tabular-nums leading-none tracking-tighter">
              {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
              <span className="text-[3vh] text-blue-400 ml-1">:{now.getSeconds().toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-[1.5vh] min-h-0">
        {/* LEVA STRANA - VELIKI SAT I STATUS */}
        <div className="w-[60%] flex flex-col gap-[1.5vh]">
          <div className="flex-1 bg-white rounded-[4rem] shadow-xl flex flex-col items-center justify-center border border-white relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-transparent opacity-20" />
             <GraduationCap size={120} className="text-slate-100 absolute bottom-10 right-10" />
             
             <Clock size={100} className="text-blue-500 mb-8" />
             <h2 className="text-[14vh] font-[1000] leading-none tracking-tighter text-slate-800">
               {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
             </h2>
             <div className="mt-6 flex gap-4">
                <div className="bg-slate-800 text-white px-8 py-3 rounded-full text-[2.5vh] font-black uppercase tracking-widest shadow-lg">
                   Добро дошли
                </div>
             </div>
          </div>
        </div>

        {/* DESNA STRANA - DINAMIČKA ROTACIJA */}
        <div className="w-[40%] flex flex-col bg-white rounded-[4rem] shadow-xl relative overflow-hidden border border-white">
            <div className="flex-1 p-[5vh] overflow-hidden">
                
                {/* 0. OBAVEŠTENJA */}
                {activeTab === 0 && (
                  <div className="animate-in fade-in slide-in-from-right duration-500">
                    <h3 className="text-[3.5vh] font-black text-orange-500 flex items-center gap-4 mb-8 uppercase italic">
                      <Bell size={36} fill="currentColor" /> Обавештења
                    </h3>
                    <div className="space-y-4">
                        {announcements.length > 0 ? announcements.slice(0, 4).map((a, i) => (
                          <div key={i} className="bg-slate-50 p-6 rounded-[2.5rem] border-l-[10px] border-orange-500 text-[2.6vh] font-bold text-slate-700 shadow-sm leading-snug">
                            {a.text}
                          </div>
                        )) : <p className="text-slate-300 italic text-2xl font-bold">Тренутно нема обавештења...</p>}
                    </div>
                  </div>
                )}

                {/* 1. ROĐENDANI */}
                {activeTab === 1 && (
                  <div className="animate-in slide-in-from-right duration-500">
                    <h3 className="text-[3.5vh] font-black text-pink-500 flex items-center gap-4 mb-8 uppercase italic">
                      <Cake size={36} fill="currentColor" /> Рођендани
                    </h3>
                    <div className="space-y-4">
                        {birthdays.length > 0 ? birthdays.map((b, i) => (
                          <div key={i} className="flex justify-between items-center bg-pink-50 p-6 rounded-[2.5rem] border border-pink-100 text-[3.2vh] font-black text-pink-700">
                            <span>{b.name}</span>
                            <span className="text-[2vh] bg-white px-5 py-1 rounded-full shadow-sm">{b.class_name}</span>
                          </div>
                        )) : <div className="mt-20 text-center text-slate-300 font-black uppercase text-[2.2vh]">Данас нема рођендана 🎂</div>}
                    </div>
                  </div>
                )}

                {/* 2. RASPORED ČASOVA (PO ODELJENJIMA) */}
                {activeTab === 2 && (
                  <div className="animate-in fade-in duration-700">
                    <h3 className="text-[3.5vh] font-black text-blue-600 flex items-center gap-4 mb-8 uppercase italic">
                      <BookOpen size={36} fill="currentColor" /> Распоред Часова
                    </h3>
                    <div className="space-y-3">
                        {statusInfo.filteredTimetable.length > 0 ? statusInfo.filteredTimetable.slice(0, 6).map((t, i) => (
                          <div key={i} className="flex justify-between items-center bg-blue-50/50 p-5 rounded-[2rem] border border-blue-100">
                            <span className="text-[2.8vh] font-black text-slate-700">{t.class_name}</span>
                            <span className="text-[2.2vh] font-bold text-blue-600 bg-white px-5 py-1 rounded-full">{t.room}</span>
                          </div>
                        )) : <div className="mt-20 text-center text-slate-300 font-black uppercase text-[2.2vh]">Распоред није унет за ову смену</div>}
                    </div>
                  </div>
                )}

                {/* 3. CITATI */}
                {activeTab === 3 && (
                  <div className="animate-in zoom-in duration-700 h-full flex flex-col items-center justify-center text-center p-4">
                    <Quote size={80} className="text-blue-100 mb-8" />
                    {quotes.length > 0 ? (
                        <>
                            <h3 className="text-[3.8vh] font-black text-slate-800 italic leading-snug mb-10 px-4">
                              "{quotes[quotes.length-1].text}"
                            </h3>
                            <p className="text-[2.2vh] font-black text-blue-500 uppercase tracking-widest">— {quotes[quotes.length-1].author}</p>
                        </>
                    ) : <span className="text-slate-200 font-black text-[3vh] italic tracking-widest uppercase">Знање је моћ</span>}
                  </div>
                )}
            </div>
            
            {/* MINI PROGRESS BAR (4px) */}
            <div className="h-[4px] w-full bg-slate-50 flex items-center">
                <div className="h-full bg-blue-600 animate-[progress_15s_linear_infinite]" />
            </div>
        </div>
      </div>

      <style jsx>{` @keyframes progress { from { width: 0%; } to { width: 100%; } } `}</style>
    </div>
  );
}