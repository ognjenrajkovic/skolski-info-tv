'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Bell, Info, Calendar, LayoutDashboard, Send, Trash2, ShieldCheck, Sun, Moon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SCHOOL_NAME = "TEHNIČKA ŠKOLA";
const ADMIN_PIN = "2024"; 

// SATNICA ZA OBE SMENE
const schedules = {
  morning: [
    { label: "1. Čas", start: "08:00", end: "08:45" },
    { label: "Mali odmor", start: "08:45", end: "08:50" },
    { label: "2. Čas", start: "08:50", end: "09:35" },
    { label: "Veliki odmor", start: "09:35", end: "10:00" },
    { label: "3. Čas", start: "10:00", end: "10:45" },
    { label: "Mali odmor", start: "10:45", end: "10:50" },
    { label: "4. Čas", start: "10:50", end: "11:35" },
    { label: "Mali odmor", start: "11:35", end: "11:40" },
    { label: "5. Čas", start: "11:40", end: "12:25" },
    { label: "Mali odmor", start: "12:25", end: "12:30" },
    { label: "6. Čas", start: "12:30", end: "13:15" },
    { label: "Mali odmor", start: "13:15", end: "13:20" },
    { label: "7. Čas", start: "13:20", end: "14:05" },
  ],
  afternoon: [
    { label: "1. Čas", start: "14:00", end: "14:45" },
    { label: "Mali odmor", start: "14:45", end: "14:50" },
    { label: "2. Čas", start: "14:50", end: "15:35" },
    { label: "Veliki odmor", start: "15:35", end: "16:00" },
    { label: "3. Čas", start: "16:00", end: "16:45" },
    { label: "Mali odmor", start: "16:45", end: "16:50" },
    { label: "4. Čas", start: "16:50", end: "17:35" },
    { label: "Mali odmor", start: "17:35", end: "17:40" },
    { label: "5. Čas", start: "17:40", end: "18:25" },
    { label: "Mali odmor", start: "18:25", end: "18:30" },
    { label: "6. Čas", start: "18:30", end: "19:15" },
    { label: "Mali odmor", start: "19:15", end: "19:20" },
    { label: "7. Čas", start: "19:20", end: "20:05" },
  ]
};

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [announcements, setAnnouncements] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (data) setAnnouncements(data.map(a => a.text));
    };
    fetchAnnouncements();
    const channel = supabase.channel('realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => fetchAnnouncements()).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // ODREĐIVANJE SMENE I STATUSA
  const status = useMemo(() => {
    const hour = now.getHours();
    const currentMin = hour * 60 + now.getMinutes();
    const isAfternoonShift = hour >= 14;
    const currentSchedule = isAfternoonShift ? schedules.afternoon : schedules.morning;
    
    for (let slot of currentSchedule) {
      const [sh, sm] = slot.start.split(':').map(Number);
      const [eh, em] = slot.end.split(':').map(Number);
      if (currentMin >= (sh * 60 + sm) && currentMin < (eh * 60 + em)) {
        return { ...slot, remaining: (eh * 60 + em) - currentMin, isAfternoon: isAfternoonShift, schedule: currentSchedule };
      }
    }
    return { label: "Nema nastave", remaining: null, isAfternoon: isAfternoonShift, schedule: currentSchedule };
  }, [now]);

  const handlePublish = async () => {
    if (newNote) {
      const { error } = await supabase.from('announcements').insert([{ text: newNote }]);
      if (!error) setNewNote("");
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-900 p-8 flex flex-col font-sans overflow-hidden">
      
      {/* GORNJI PANEL - SAT I DATUM */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm mb-8 border border-white">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-lg shadow-blue-200">
            {status.isAfternoon ? <Moon size={40} /> : <Sun size={40} />}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{SCHOOL_NAME}</h1>
            <p className="text-xl font-bold text-blue-600 mt-1 uppercase tracking-tighter">
              {status.isAfternoon ? "Poslepodnevna smena" : "Prepodnevna smena"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="text-8xl font-black tabular-nums tracking-tighter text-slate-800 flex items-baseline gap-2">
            {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
            <span className="text-4xl text-blue-500 font-bold opacity-80">:{now.getSeconds().toString().padStart(2, '0')}</span>
          </div>
          <p className="text-xl font-bold text-slate-400 mt-1 uppercase">
            {now.toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-grow">
        {/* LEVO: TRENUTNI ČAS I RASPORED */}
        <div className="col-span-7 flex flex-col gap-8">
          
          {/* GLAVNI STATUS BOX */}
          <div className={`p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-center transition-all duration-700 ${
            status.label.includes("Čas") ? "bg-gradient-to-br from-blue-600 to-blue-800 text-white" : "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white"
          }`}>
            <div className="relative z-10">
              <span className="text-2xl font-bold bg-white/20 px-6 py-2 rounded-full backdrop-blur-md uppercase tracking-widest">
                {status.label.includes("Čas") ? "Nastava u toku" : "Pauza / Slobodno"}
              </span>
              <h2 className="text-[9.5rem] font-black leading-none my-6 tracking-tighter">{status.label}</h2>
              
              {status.remaining !== null && (
                <div className="mt-4 max-w-2xl">
                  <div className="flex justify-between items-end mb-4 font-black text-3xl">
                    <span className="flex items-center gap-3"><Clock size={36} /> Još {status.remaining} minuta</span>
                  </div>
                  <div className="h-5 w-full bg-black/20 rounded-full overflow-hidden border border-white/20">
                    <div 
                      className="h-full bg-white shadow-[0_0_20px_white] transition-all duration-1000 ease-linear"
                      style={{ width: `${(status.remaining / 45) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Dekoracija u pozadini */}
            <div className="absolute -right-20 -bottom-20 opacity-10 scale-[3.0] rotate-12">
               <Clock size={200} />
            </div>
          </div>

          {/* RASPORED ZVONJENJA */}
          <div className="bg-white/80 backdrop-blur-md border border-white p-10 rounded-[3rem] shadow-xl flex-grow">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-700 uppercase">
              <LayoutDashboard size={28} className="text-blue-600" /> Kompletan raspored zvonjenja
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {status.schedule.map((slot, i) => (
                <div key={i} className={`flex justify-between items-center p-5 rounded-3xl transition-all ${
                  status.label === slot.label 
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-200 scale-105" 
                  : "bg-slate-100/50 text-slate-500 font-bold"
                }`}>
                  <span className="text-xl font-black uppercase tracking-tight">{slot.label}</span>
                  <span className="text-xl font-mono">{slot.start} — {slot.end}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DESNO: OBAVEŠTENJA */}
        <div className="col-span-5 flex flex-col gap-8">
          <div className="bg-gradient-to-b from-orange-400 to-orange-600 p-10 rounded-[4rem] shadow-2xl text-white flex-grow relative overflow-hidden border-b-[16px] border-orange-700">
            <h3 className="text-4xl font-black mb-10 flex items-center gap-4 uppercase tracking-tighter italic">
              <Bell size={44} className="animate-bounce" /> Vesti i Obaveštenja
            </h3>
            <div className="space-y-6 relative z-10">
              {announcements.map((msg, idx) => (
                <div key={idx} className="bg-white/20 backdrop-blur-lg p-8 rounded-[2.5rem] border-l-[12px] border-white text-3xl font-extrabold leading-tight shadow-lg animate-in fade-in slide-in-from-right duration-500">
                  {msg}
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center mt-32 opacity-50 italic">
                  <Info size={100} className="mx-auto mb-4 opacity-20" />
                  <p className="text-2xl">Trenutno nema novih vesti.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ADMIN PANEL - MINIMALAN */}
      <div className="mt-8 flex justify-center">
        {!isAdmin ? (
          <button 
            onClick={() => { const p = prompt("Unesite PIN:"); if(p === ADMIN_PIN) setIsAdmin(true); }}
            className="opacity-20 hover:opacity-100 transition-opacity text-slate-400 flex items-center gap-2 font-bold"
          >
            <ShieldCheck size={20} /> Administracija sistema
          </button>
        ) : (
          <div className="bg-slate-900 p-4 rounded-3xl flex gap-4 w-full max-w-4xl shadow-2xl animate-in slide-in-from-bottom duration-300">
            <input 
              className="flex-1 bg-slate-800 border-none p-4 rounded-2xl text-white outline-none focus:ring-2 ring-blue-500 text-xl"
              placeholder="Napišite važno obaveštenje..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button onClick={handlePublish} className="bg-blue-600 text-white px-8 rounded-2xl font-black hover:bg-blue-500 transition-all flex items-center gap-2">
              <Send size={24} /> POŠALJI
            </button>
            <button onClick={async () => { if(confirm("Obriši sve?")) await supabase.from('announcements').delete().neq('id', '0'); }} className="bg-red-600 text-white px-6 rounded-2xl hover:bg-red-500">
              <Trash2 size={24} />
            </button>
            <button onClick={() => setIsAdmin(false)} className="text-slate-400 px-4">X</button>
          </div>
        )}
      </div>
    </div>
  );
}