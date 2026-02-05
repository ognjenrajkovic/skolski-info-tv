'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Bell, Info, Calendar, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SCHOOL_NAME = "ОШ „КАРАЂОРЂЕ”";

// PODACI ZA RASPORED (Primer za prikaz tokom odmora)
const classLocations = {
  1: { "5-1": "Математика (к. 2)", "6-2": "Српски (к. 8)", "8-3": "Физика (к. 12)" },
  2: { "5-1": "Српски (к. 8)", "7-1": "Биологија (к. 5)", "8-2": "Историја (к. 3)" },
  // Dodaj ostale časove...
};

const schedules = {
  morning: [
    { num: 1, label: "1. ЧАС", start: "08:00", end: "08:45" },
    { num: 0, label: "МАЛИ ОДМОР", start: "08:45", end: "08:50" },
    { num: 2, label: "2. ЧАС", start: "08:50", end: "09:35" },
    { num: 0, label: "ВЕЛИКИ ОДМОР", start: "09:35", end: "10:00" },
    { num: 3, label: "3. ЧАС", start: "10:00", end: "10:45" },
    { num: 0, label: "МАЛИ ОДМОР", start: "10:45", end: "10:50" },
    { num: 4, label: "4. ЧАС", start: "10:50", end: "11:35" },
    { num: 0, label: "МАЛИ ОДМОР", start: "11:35", end: "11:40" },
    { num: 5, label: "5. ЧАС", start: "11:40", end: "12:25" },
  ],
  afternoon: [
    { num: 1, label: "1. ЧАС", start: "14:00", end: "14:45" },
    { num: 0, label: "МАЛИ ОДМОР", start: "14:45", end: "14:50" },
    { num: 2, label: "2. ЧАС", start: "14:50", end: "15:35" },
    { num: 0, label: "ВЕЛИКИ ОДМОР", start: "15:35", end: "16:00" },
    { num: 3, label: "3. ЧАС", start: "16:00", end: "16:45" },
    { num: 0, label: "МАЛИ ОДМОР", start: "16:45", end: "16:50" },
    { num: 4, label: "4. ЧАС", start: "16:50", end: "17:35" },
    { num: 0, label: "МАЛИ ОДМОР", start: "17:35", end: "17:40" },
    { num: 5, label: "5. ЧАС", start: "17:40", end: "18:25" },
  ]
};

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    // AUTO RELOAD na svakih 60 minuta radi stabilnosti
    const reload = setInterval(() => window.location.reload(), 3600000);
    return () => { clearInterval(timer); clearInterval(reload); }
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
    const currentSchedule = isAfternoon ? schedules.afternoon : schedules.morning;
    
    let activeSlot = currentSchedule.find(slot => {
      const [sh, sm] = slot.start.split(':').map(Number);
      const [eh, em] = slot.end.split(':').map(Number);
      return currentMin >= (sh * 60 + sm) && currentMin < (eh * 60 + em);
    });

    // Pronađi sledeći čas ako je trenutno odmor
    let nextClassNum = null;
    if (activeSlot && activeSlot.num === 0) {
      const next = currentSchedule.find(s => s.num > 0 && (Number(s.start.split(':')[0]) * 60 + Number(s.start.split(':')[1])) > currentMin);
      if (next) nextClassNum = next.num;
    }

    return { 
      active: activeSlot || { label: "ВАН НАСТАВЕ", num: -1 }, 
      nextClassNum,
      isAfternoon,
      currentSchedule 
    };
  }, [now]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-8 flex flex-col font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] shadow-xl border-b-8 border-blue-600 mb-10">
        <div className="flex items-center gap-8">
          <div className="bg-blue-600 p-6 rounded-full text-white shadow-2xl">
            {status.isAfternoon ? <Moon size={48} /> : <Sun size={48} />}
          </div>
          <div>
            <h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase">{SCHOOL_NAME}</h1>
            <p className="text-2xl font-bold text-blue-600 mt-2 uppercase">
              {status.isAfternoon ? "Поподневна смена" : "Преподневна смена"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10rem] font-black tabular-nums tracking-tighter text-slate-800 leading-[0.8]">
            {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
            <span className="text-5xl text-blue-500 font-bold ml-2">:{now.getSeconds().toString().padStart(2, '0')}</span>
          </div>
          <p className="text-2xl font-bold text-slate-400 mt-4 uppercase tracking-widest">
            {now.toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10 flex-grow">
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-10">
          
          {/* DINAMIČKI PANEL (Čas ili Raspored za odmor) */}
          <div className={`p-12 rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col min-h-[500px] transition-all duration-1000 ${
            status.active.num > 0 ? "bg-blue-700" : "bg-emerald-600"
          } text-white`}>
            
            {status.active.num === 0 ? (
              // PRIKAZ TOKOM ODMORA
              <div className="relative z-10 w-full animate-in fade-in duration-700">
                <p className="text-3xl font-bold opacity-80 uppercase tracking-widest mb-6">Следећи час: {status.nextClassNum}. час</p>
                <h2 className="text-6xl font-black mb-10 border-b border-white/20 pb-6 uppercase italic tracking-tighter">Распоред кабинета:</h2>
                <div className="grid grid-cols-1 gap-4 overflow-hidden">
                  {Object.entries(classLocations[status.nextClassNum] || {}).map(([ode, pre], i) => (
                    <div key={i} className="flex justify-between items-center bg-white/10 p-5 rounded-2xl border-l-8 border-white">
                      <span className="text-4xl font-black">{ode}</span>
                      <span className="text-3xl font-bold italic">{pre}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // PRIKAZ TOKOM ČASA
              <div className="relative z-10 flex flex-col justify-center h-full animate-in zoom-in duration-500">
                <span className="text-3xl font-black bg-white/20 px-8 py-3 rounded-full backdrop-blur-md uppercase tracking-widest w-fit mb-8">Тренутно:</span>
                <h2 className="text-[13rem] font-black leading-none tracking-tighter drop-shadow-2xl italic">{status.active.label}</h2>
              </div>
            )}
            <Clock size={400} className="absolute -right-20 -bottom-20 opacity-5 rotate-12" />
          </div>

          {/* SATNICA (Pregled dana) */}
          <div className="bg-white/90 backdrop-blur-xl border border-white p-10 rounded-[3.5rem] shadow-xl flex-grow">
             <div className="grid grid-cols-2 gap-6">
              {status.currentSchedule.map((slot, i) => (
                <div key={i} className={`flex justify-between items-center p-5 rounded-2xl transition-all ${
                  status.active.label === slot.label ? "bg-blue-600 text-white scale-105 shadow-2xl" : "bg-slate-50 text-slate-400 font-bold"
                }`}>
                  <span className="text-2xl font-black uppercase">{slot.label}</span>
                  <span className="text-2xl font-mono">{slot.start} — {slot.end}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* OBAVEŠTENJA (Narandžasta desna strana) */}
        <div className="col-span-12 lg:col-span-5">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 p-12 rounded-[5rem] shadow-2xl h-full text-white border-b-[20px] border-orange-800 relative overflow-hidden">
            <h3 className="text-5xl font-black mb-12 flex items-center gap-6 uppercase tracking-tighter italic">
              <Bell size={50} fill="white" className="animate-bounce" /> Обавештења
            </h3>
            <div className="space-y-8 relative z-10">
              {announcements.map((msg, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-md p-8 rounded-[3rem] border-l-[15px] border-white text-3xl font-black leading-tight shadow-xl animate-in slide-in-from-right duration-700">
                  {msg}
                </div>
              ))}
              {announcements.length === 0 && <p className="text-3xl text-center mt-40 opacity-30 italic font-bold tracking-widest uppercase">Нема нових порука</p>}
            </div>
            <Info size={400} className="absolute -bottom-20 -right-20 opacity-10 -rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
}