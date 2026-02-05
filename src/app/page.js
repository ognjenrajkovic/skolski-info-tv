'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Bell, Info, Calendar, LayoutDashboard, Sun, Moon, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SCHOOL_NAME = "ОШ „КАРАЂОРЂЕ”";

// PODACI ZA RASPORED PO UČIONICAMA
const classLocations = {
  1: { "5-1": "Мат (2)", "6-2": "Српски (8)", "8-3": "Физ (12)" },
  2: { "5-1": "Српски (8)", "7-1": "Биол (5)", "8-2": "Ист (3)" },
  3: { "5-2": "Гео (4)", "6-1": "Ликовно (1)", "7-3": "Хемија (10)" },
  4: { "1-1": "Српски (2)", "7-1": "Математика (8)", "5-3": "Техничко (кб)" },
  5: { "6-1": "Физичко", "8-1": "Енглески (7)", "7-2": "Инф (лаб)" },
};

const schedules = {
  morning: [
    { num: 1, label: "1. ЧАС", start: "08:00", end: "08:45" },
    { num: 0, label: "ОДМОР", start: "08:45", end: "08:50" },
    { num: 2, label: "2. ЧАС", start: "08:50", end: "09:35" },
    { num: 0, label: "В. ОДМОР", start: "09:35", end: "10:00" },
    { num: 3, label: "3. ЧАС", start: "10:00", end: "10:45" },
    { num: 0, label: "ОДМОР", start: "10:45", end: "10:50" },
    { num: 4, label: "4. ЧАС", start: "10:50", end: "11:35" },
    { num: 0, label: "ОДМОР", start: "11:35", end: "11:40" },
    { num: 5, label: "5. ЧАС", start: "11:40", end: "12:25" },
  ],
  afternoon: [
    { num: 1, label: "1. ЧАС", start: "14:00", end: "14:45" },
    { num: 0, label: "ОДМОР", start: "14:45", end: "14:50" },
    { num: 2, label: "2. ЧАС", start: "14:50", end: "15:35" },
    { num: 0, label: "В. ОДМОР", start: "15:35", end: "16:00" },
    { num: 3, label: "3. ЧАС", start: "16:00", end: "16:45" },
    { num: 0, label: "ОДМОР", start: "16:45", end: "16:50" },
    { num: 4, label: "4. ЧАС", start: "16:50", end: "17:35" },
    { num: 0, label: "ОДМОР", start: "17:35", end: "17:40" },
    { num: 5, label: "5. ЧАС", start: "17:40", end: "18:25" },
  ]
};

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    
    // NOVO: AUTO RELOAD SVAKIH 1 MINUT (60000 ms)
    const reload = setInterval(() => window.location.reload(), 60000);
    
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

    let nextClassNum = null;
    let currentClassNum = activeSlot?.num || null;

    if (activeSlot && activeSlot.num === 0) {
      const next = currentSchedule.find(s => s.num > 0 && (Number(s.start.split(':')[0]) * 60 + Number(s.start.split(':')[1])) > currentMin);
      if (next) nextClassNum = next.num;
    }

    return { 
      active: activeSlot || { label: "ВАН НАСТАВЕ", num: -1 }, 
      currentClassNum: currentClassNum > 0 ? currentClassNum : nextClassNum,
      isAfternoon,
      currentSchedule 
    };
  }, [now]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-900 p-6 flex flex-col font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-lg border-b-4 border-blue-600 mb-6">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-4 rounded-full text-white shadow-lg">
            {status.isAfternoon ? <Moon size={32} /> : <Sun size={32} />}
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">{SCHOOL_NAME}</h1>
            <p className="text-xl font-bold text-blue-600 uppercase italic">
              {status.isAfternoon ? "Поподневна смена" : "Преподневна смена"}
            </p>
          </div>
        </div>
        <div className="text-right flex items-center gap-8">
           <p className="text-xl font-bold text-slate-400 uppercase tracking-widest text-right">
            {now.toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <div className="text-8xl font-black tabular-nums tracking-tighter text-slate-800 border-l-4 border-slate-100 pl-8">
            {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
            <span className="text-4xl text-blue-500 font-bold ml-1 opacity-70">:{now.getSeconds().toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-grow">
        
        {/* LIJEVA STRANA (Gornji: Čas i Obaveštenja) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          {/* CENTRALNI PANEL: ČAS + OBAVEŠTENJA */}
          <div className="bg-white rounded-[3.5rem] shadow-xl border border-white flex flex-col overflow-hidden h-full">
            <div className={`p-10 flex justify-between items-center text-white ${status.active.num > 0 ? "bg-blue-700" : "bg-emerald-600"}`}>
              <div>
                <p className="text-2xl font-bold opacity-80 uppercase tracking-widest">Тренутно:</p>
                <h2 className="text-[9rem] font-black leading-none tracking-tighter drop-shadow-lg">{status.active.label}</h2>
              </div>
              <div className="text-right">
                 <Clock size={120} className="opacity-20 mb-4" />
              </div>
            </div>

            {/* OBAVEŠTENJA UNUTAR CENTRALNOG PANELA */}
            <div className="p-10 flex-grow bg-slate-50">
               <h3 className="text-3xl font-black mb-6 flex items-center gap-4 text-orange-600 uppercase tracking-tighter">
                <Bell size={36} fill="currentColor" /> Најновије објаве
              </h3>
              <div className="space-y-4">
                {announcements.slice(0, 3).map((msg, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border-l-[12px] border-orange-500 text-3xl font-extrabold shadow-sm text-slate-700">
                    {msg}
                  </div>
                ))}
                {announcements.length === 0 && <p className="text-2xl italic text-slate-300">Нема активних обавештења...</p>}
              </div>
            </div>
          </div>

          {/* MALA SATNICA DANA (Donja letvica) */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-md flex justify-around border border-slate-100">
             {status.currentSchedule.filter(s => s.num > 0).map((slot, i) => (
               <div key={i} className={`px-6 py-2 rounded-2xl font-black text-xl ${status.active.label === slot.label ? "bg-blue-600 text-white" : "text-slate-300"}`}>
                 {slot.label} <span className="text-sm font-normal block text-center opacity-60">{slot.start}</span>
               </div>
             ))}
          </div>
        </div>

        {/* DESNA STRANA (Raspored časova/učionica) */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-slate-800 rounded-[3.5rem] shadow-2xl h-full p-10 text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10">
              <h3 className="text-3xl font-black mb-8 flex items-center gap-4 text-emerald-400 uppercase tracking-tighter">
                <MapPin size={36} /> Учионице: {status.currentClassNum}. час
              </h3>
              <div className="space-y-4">
                {Object.entries(classLocations[status.currentClassNum] || {}).map(([ode, pre], i) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border-b border-white/10">
                    <span className="text-4xl font-black text-white">{ode}</span>
                    <span className="text-2xl font-bold text-emerald-300 italic">{pre}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Donji dio desnog panela za estetiku */}
            <div className="mt-auto opacity-20 flex justify-center">
                <LayoutDashboard size={100} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}