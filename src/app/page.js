'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Bell, Sun, Moon, MapPin, CloudSun, Thermometer, Calendar, Quote, Cake, AlertTriangle, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SCHOOL_NAME = "ОШ „КАРАЂОРЂЕ”";

// --- SATNICE ---
const morningSchedule = [
  { num: 1, label: "1. ČAS", start: "08:00", end: "08:45" },
  { num: 0, label: "ODMOR", start: "08:45", end: "08:50" },
  { num: 2, label: "2. ČAS", start: "08:50", end: "09:35" },
  { num: 0, label: "V. ODMOR", start: "09:35", end: "10:00" },
  { num: 3, label: "3. ČAS", start: "10:00", end: "10:45" },
  { num: 0, label: "ODMOR", start: "10:45", end: "10:50" },
  { num: 4, label: "4. ČAS", start: "10:50", end: "11:35" },
  { num: 0, label: "ODMOR", start: "11:35", end: "11:40" },
  { num: 5, label: "5. ČAS", start: "11:40", end: "12:25" },
];

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [announcements, setAnnouncements] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [quote, setQuote] = useState({ text: "Znanje je moć.", author: "Narodna poslovica" });
  const [emergency, setEmergency] = useState(null); // Za "UZBUNA" mod
  const [weather, setWeather] = useState({ temp: '--' });
  const [activeTab, setActiveTab] = useState(0);

  // 1. TAJMERE I ROTACIJA
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const reload = setInterval(() => window.location.reload(), 600000); // Reload na 10 min radi stabilnosti
    const rotation = setInterval(() => setActiveTab((prev) => (prev + 1) % 4), 12000); 
    return () => { clearInterval(timer); clearInterval(reload); clearInterval(rotation); }
  }, []);

  // 2. PODACI IZ SUPABASE-A
  useEffect(() => {
    const fetchData = async () => {
      // Obavještenja
      const { data: ann } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (ann) setAnnouncements(ann.map(a => a.text));

      // Rođendani (danas)
      const { data: bdays } = await supabase.from('birthdays').select('*');
      if (bdays) setBirthdays(bdays);

      // Misao dana
      const { data: q } = await supabase.from('quotes').select('*').limit(1);
      if (q && q[0]) setQuote(q[0]);

      // Emergency Mode
      const { data: em } = await supabase.from('system_settings').select('*').eq('key', 'emergency').single();
      if (em) setEmergency(em.value);
    };
    fetchData();
    // Realtime osluškivanje za hitne slučajeve
    const sub = supabase.channel('system').on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, fetchData).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  // 3. LOGIKA ZA PROGRESS BAR ČASA
  const status = useMemo(() => {
    const hour = now.getHours();
    const min = now.getMinutes();
    const totalSec = min * 60 + now.getSeconds();
    const currentMin = hour * 60 + min;
    const isAfternoon = hour >= 13;
    const sched = morningSchedule; // Ovdje možeš dodati i popodnevnu
    
    let activeSlot = sched.find(s => {
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      return currentMin >= (sh * 60 + sm) && currentMin < (eh * 60 + em);
    });

    // Izračun procenta završenog časa
    let progress = 0;
    if (activeSlot) {
      const [sh, sm] = activeSlot.start.split(':').map(Number);
      const [eh, em] = activeSlot.end.split(':').map(Number);
      const startSec = sh * 3600 + sm * 60;
      const endSec = eh * 3600 + em * 60;
      const nowSec = hour * 3600 + totalSec;
      progress = ((nowSec - startSec) / (endSec - startSec)) * 100;
    }

    return { active: activeSlot || { label: "VAN NASTAVE", num: -1 }, progress, isAfternoon };
  }, [now]);

  // AKO JE UZBUNA AKTIVNA - PRIKAŽI SAMO TO
  if (emergency === "UZBUNA") {
    return (
      <div className="h-screen w-screen bg-red-600 flex flex-col items-center justify-center text-white p-10 animate-pulse">
        <AlertTriangle size={300} strokeWidth={3} />
        <h1 className="text-[15rem] font-black tracking-tighter uppercase mt-10">UZBUNA</h1>
        <p className="text-6xl font-bold uppercase tracking-widest text-red-100">Pratite uputstva dežurnog osoblja!</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] text-slate-900 p-8 flex flex-col font-sans selection:bg-blue-100">
      
      {/* 1. TOP ALERT BAR (Ako postoji važno obaveštenje) */}
      {announcements[0]?.includes("VAŽNO") && (
        <div className="mb-6 bg-orange-500 text-white p-4 rounded-3xl flex items-center justify-center gap-4 animate-bounce shadow-lg shadow-orange-200">
          <Zap size={32} fill="currentColor" />
          <span className="text-3xl font-black uppercase tracking-tighter text-center">{announcements[0]}</span>
        </div>
      )}

      {/* 2. HEADER */}
      <div className="flex justify-between items-center mb-8 bg-white p-8 rounded-[3rem] shadow-[0_15px_50px_rgba(0,0,0,0.04)] border border-white">
        <div className="flex items-center gap-8">
          <div className="bg-blue-600 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200">
            <Clock size={48} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-6xl font-[1000] text-slate-800 tracking-tighter uppercase leading-none italic">{SCHOOL_NAME}</h1>
            <p className="text-xl font-black text-blue-500 mt-2 uppercase tracking-widest opacity-80 flex items-center gap-2">
              <Sun size={20} /> Digitalni Info Panel
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-12 bg-slate-50 p-4 px-8 rounded-[2.5rem] border border-slate-100">
          <div className="text-right">
            <p className="text-2xl font-black text-slate-400 uppercase tracking-tighter mb-1 leading-none">
              {now.toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div className="text-8xl font-[1000] tabular-nums text-slate-800 leading-none">
              {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
              <span className="text-4xl text-blue-500 font-black opacity-50 ml-1">:{now.getSeconds().toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN GRID */}
      <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
        
        {/* LIJEVO: STATUS ČASA (7 Kolona) */}
        <div className="col-span-7 flex flex-col gap-8">
          <div className="flex-1 bg-white rounded-[4rem] shadow-sm border border-slate-100 p-16 flex flex-col items-center justify-center relative overflow-hidden group">
             
             {/* KRUŽNI PROGRESS BAR */}
             <div className="relative h-[500px] w-[500px] flex items-center justify-center">
                <svg className="absolute inset-0 h-full w-full rotate-[-90deg]">
                  <circle cx="250" cy="250" r="230" stroke="currentColor" strokeWidth="30" fill="transparent" className="text-slate-50" />
                  <circle cx="250" cy="250" r="230" stroke="currentColor" strokeWidth="30" fill="transparent" 
                          strokeDasharray={1445} strokeDashoffset={1445 - (1445 * status.progress) / 100}
                          className={`transition-all duration-1000 ${status.active.num > 0 ? 'text-blue-600' : 'text-emerald-500'}`} strokeLinecap="round" />
                </svg>
                <div className="text-center z-10">
                  <span className="text-4xl font-black text-slate-300 uppercase tracking-widest block mb-4">Trenutno:</span>
                  <h2 className={`text-[11rem] font-[1000] leading-none tracking-tighter italic ${status.active.num > 0 ? 'text-slate-800' : 'text-emerald-600'}`}>
                    {status.active.label}
                  </h2>
                  {status.active.num > 0 && <span className="text-5xl font-black text-blue-500 mt-6 block">{Math.round(status.progress)}%</span>}
                </div>
             </div>
             
             <div className="absolute top-10 left-10 opacity-5 font-black text-[15rem] leading-none select-none italic text-blue-900">{status.active.num > 0 ? status.active.num : ''}</div>
          </div>
        </div>

        {/* DESNO: ROTIRAJUĆE INFORMACIJE (5 Kolona) */}
        <div className="col-span-5 flex flex-col gap-8">
          
          <div className="flex-1 bg-white rounded-[4rem] shadow-2xl border-4 border-white overflow-hidden flex flex-col relative">
             
             <div className="p-12 flex-grow">
               {activeTab === 0 && (
                 <div className="animate-in fade-in zoom-in duration-700">
                    <h3 className="text-5xl font-[1000] text-orange-500 flex items-center gap-5 uppercase italic mb-10 tracking-tighter">
                      <Bell size={60} fill="currentColor" /> Obavještenja
                    </h3>
                    <div className="space-y-6">
                        {announcements.slice(0, 3).map((msg, i) => (
                            <div key={i} className="bg-orange-50 p-8 rounded-[2.5rem] border-l-[15px] border-orange-500 text-3xl font-black text-slate-700 leading-tight">
                              {msg}
                            </div>
                        ))}
                    </div>
                 </div>
               )}

               {activeTab === 1 && (
                 <div className="animate-in fade-in zoom-in duration-700 h-full flex flex-col">
                    <h3 className="text-5xl font-[1000] text-pink-500 flex items-center gap-5 uppercase italic mb-10 tracking-tighter">
                      <Cake size={60} fill="currentColor" /> Rođendani
                    </h3>
                    <div className="grid grid-cols-1 gap-6 mt-10">
                        {birthdays.length > 0 ? birthdays.map((b, i) => (
                          <div key={i} className="flex justify-between items-center bg-pink-50 p-8 rounded-[2.5rem] border-2 border-pink-100">
                             <span className="text-5xl font-black text-pink-700 italic">{b.name}</span>
                             <span className="text-3xl font-bold bg-white px-6 py-2 rounded-full text-pink-500">{b.class}</span>
                          </div>
                        )) : (
                          <p className="text-3xl text-slate-300 font-bold italic text-center mt-20 uppercase tracking-widest">Danas nema rođendana</p>
                        )}
                    </div>
                 </div>
               )}

               {activeTab === 2 && (
                 <div className="animate-in fade-in zoom-in duration-700 h-full flex flex-col justify-center items-center text-center p-10">
                    <Quote size={120} className="text-blue-200 mb-8" />
                    <h4 className="text-5xl font-[1000] text-slate-800 leading-[1.1] italic mb-8 tracking-tight">"{quote.text}"</h4>
                    <p className="text-3xl font-black text-blue-500 uppercase tracking-widest">— {quote.author}</p>
                 </div>
               )}

               {activeTab === 3 && (
                 <div className="animate-in fade-in zoom-in duration-700 h-full flex flex-col">
                    <h3 className="text-5xl font-[1000] text-emerald-500 flex items-center gap-5 uppercase italic mb-10 tracking-tighter">
                      <MapPin size={60} fill="currentColor" /> Kabineti
                    </h3>
                    <div className="grid grid-cols-1 gap-4 overflow-hidden">
                        {/* Ovdje renderuj kabinete */}
                        <div className="p-8 bg-slate-50 rounded-[2.5rem] text-4xl font-black text-center text-slate-400 italic border-2 border-dashed border-slate-200">Podaci se učitavaju...</div>
                    </div>
                 </div>
               )}
             </div>

             {/* PROGRESS TIMER BAR NA DNU */}
             <div className="h-4 w-full bg-slate-100 flex items-center">
                <div className="h-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all duration-1000 animate-[progress_12s_linear_infinite]" />
             </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
      `}</style>
    </div>
  );
}