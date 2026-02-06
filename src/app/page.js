'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Bell, Cake, Quote, Sun, AlertTriangle, User } from 'lucide-react';

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], duty: {}, sys: [], quotes: [] });
  const [activeSlide, setActiveSlide] = useState(0);

  // Interval za osvežavanje
  useEffect(() => {
    const load = async () => {
      const [ann, bdays, tt, dt, sys, qt] = await Promise.all([
        supabase.from('announcements').select('*'),
        supabase.from('birthdays').select('*'),
        supabase.from('timetable').select('*'),
        supabase.from('duty_staff').select('*').single(),
        supabase.from('system_settings').select('*'),
        supabase.from('quotes').select('*')
      ]);
      setData({ ann: ann.data || [], bdays: bdays.data || [], tt: tt.data || [], duty: dt.data || {}, sys: sys.data || [], quotes: qt.data || [] });
    };
    load();
    const timer = setInterval(() => setNow(new Date()), 1000);
    const slider = setInterval(() => setActiveSlide(prev => (prev + 1) % 4), 10000); // Menja slajd na 10 sekundi
    const fetcher = setInterval(load, 30000);
    return () => { clearInterval(timer); clearInterval(slider); clearInterval(fetcher); };
  }, []);

  const status = useMemo(() => {
    const h = now.getHours(), m = now.getMinutes();
    const totalSec = (h * 3600) + (m * 60) + now.getSeconds();
    
    // Satnica (Podesi po potrebi)
    const bells = [
      { id: 1, s: 28800, e: 31500 }, { id: 2, s: 31800, e: 34500 }, // 1. i 2. čas
      { id: 3, s: 36000, e: 38700 }, { id: 4, s: 39000, e: 41700 }  // itd...
    ];
    
    const currentClass = bells.find(b => totalSec >= b.s && totalSec < b.e);
    const nextClass = bells.find(b => totalSec < b.s);
    
    // Logika za countdown
    let diff = 0;
    if (currentClass) diff = currentClass.e - totalSec;
    else if (nextClass) diff = nextClass.s - totalSec;
    
    const timer = diff > 0 ? `${Math.floor(diff/60)}:${(diff%60).toString().padStart(2,'0')}` : "00:00";
    
    // Nađi predmet za trenutni čas (primer logike)
    const dayName = ["Nedelja","Ponedeljak","Utorak","Sreda","Četvrtak","Petak","Subota"][now.getDay()];
    const activeSubject = data.tt.find(t => t.day === dayName && t.period === (currentClass?.id || nextClass?.id));

    return { 
      subject: activeSubject?.class_name || "SLOBODNO", 
      room: activeSubject?.room || "HOL", 
      isBreak: !currentClass,
      timer,
      emergency: data.sys.find(s => s.key === 'emergency')?.value === 'true',
      news: data.sys.find(s => s.key === 'breaking_news')?.value,
      video: { 
        on: data.sys.find(s => s.key === 'video_active')?.value === 'true', 
        url: data.sys.find(s => s.key === 'bg_video_url')?.value,
        mode: data.sys.find(s => s.key === 'video_mode')?.value 
      }
    };
  }, [now, data]);

  // Video embed helper
  const getVideoUrl = (url) => {
    if(!url) return "";
    const id = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&showinfo=0&rel=0`;
  };

  // UZBUNA
  if (status.emergency) return (
    <div className="fixed inset-0 bg-red-600 z-[9999] flex flex-col items-center justify-center text-white animate-pulse">
      <AlertTriangle size={300} />
      <h1 className="text-[15vw] font-black uppercase leading-none mt-10">UZBUNA</h1>
      <p className="text-4xl font-bold uppercase tracking-widest mt-4">Evakuacija odmah</p>
    </div>
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden font-sans text-white bg-slate-900 selection:bg-blue-500 selection:text-white">
      
      {/* 1. POZADINA (VIDEO ili GRADIJENT) */}
      <div className="absolute inset-0 z-0">
        {status.video.on && status.video.url ? (
          <div className="relative w-full h-full">
            <iframe className="w-full h-full scale-150 pointer-events-none" src={getVideoUrl(status.video.url)} frameBorder="0" allow="autoplay; encrypted-media"></iframe>
            {/* Overlay da tekst bude čitljiviji */}
            <div className={`absolute inset-0 bg-slate-900/${status.video.mode === 'fullscreen' ? '10' : '60'}`} />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 animate-gradient" />
        )}
      </div>

      {/* 2. GLAVNI LAYOUT (Sve je u kontejneru sa Z-10 da bude iznad videa) */}
      <div className="relative z-10 flex flex-col h-full p-8 lg:p-12 gap-8">
        
        {/* HEADER: LOGO + SAT */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
              <img src="/logo.png" className="w-14 h-14 object-contain opacity-90" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tighter italic uppercase drop-shadow-lg">Karađorđe</h1>
              <div className="h-1 w-20 bg-blue-500 rounded-full mt-2" />
            </div>
          </div>

          <div className="flex flex-col items-end">
             <div className="text-[7rem] leading-none font-black tracking-tighter drop-shadow-2xl font-mono">
               {now.getHours()}<span className="animate-pulse">:</span>{now.getMinutes().toString().padStart(2,'0')}
             </div>
             <p className="text-blue-300 uppercase font-bold tracking-[0.5em] text-sm">Beograd, Srbija</p>
          </div>
        </div>

        {/* SREDINA: GRID SISTEM */}
        <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
          
          {/* LEVO: STATUS ČASA (7 kolona) */}
          <div className="col-span-7 bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 shadow-2xl p-10 flex flex-col relative overflow-hidden group">
            {/* Ukrasni sjaj */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] group-hover:bg-blue-500/30 transition-all" />
            
            <div className="flex justify-between items-start mb-12">
               <span className={`px-6 py-2 rounded-full font-black uppercase text-sm tracking-widest border border-white/20 ${status.isBreak ? 'bg-orange-500/20 text-orange-300' : 'bg-green-500/20 text-green-300'}`}>
                 {status.isBreak ? '● Veliki odmor' : '● Čas u toku'}
               </span>
               <div className="text-right">
                 <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">{status.isBreak ? 'Do početka' : 'Do zvona'}</p>
                 <p className="text-6xl font-black font-mono tracking-tighter">{status.timer}</p>
               </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
               <h2 className="text-[5rem] lg:text-[7rem] leading-[0.9] font-black uppercase italic tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
                 {status.subject}
               </h2>
               <p className="text-2xl font-bold text-white/60 uppercase tracking-widest flex items-center gap-3">
                 KABINET: <span className="text-white bg-white/20 px-4 py-1 rounded-lg">{status.room}</span>
               </p>
            </div>

            {/* DEŽURNI NASTAVNIK - FIXIRANO DOLE */}
            <div className="mt-auto pt-8 border-t border-white/10 flex items-center gap-6">
               <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-600/40">
                 <User size={32} />
               </div>
               <div>
                 <p className="text-blue-300 text-xs font-black uppercase tracking-widest mb-1">Dežurni nastavnik</p>
                 <p className="text-2xl font-bold uppercase">{data.duty?.teacher_name || "Nema podataka"}</p>
               </div>
            </div>
          </div>

          {/* DESNO: SLAJDOVI (5 kolona) */}
          <div className="col-span-5 flex flex-col gap-6">
             {/* GORNJA KARTICA - SLAJDER */}
             <div className="flex-1 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[3rem] shadow-2xl p-10 relative overflow-hidden flex flex-col justify-center text-center border border-white/10">
                {/* Animirani sadržaj */}
                {activeSlide === 0 && (
                   <div className="animate-in fade-in zoom-in duration-700">
                      <Bell size={60} className="mx-auto mb-6 text-blue-200" />
                      <h3 className="text-xl font-black uppercase tracking-widest text-blue-200 mb-6">Obaveštenje</h3>
                      <p className="text-3xl font-bold italic leading-snug">"{data.ann[0]?.text || "Dobrodošli u školu!"}"</p>
                   </div>
                )}
                {activeSlide === 1 && (
                   <div className="animate-in slide-in-from-right duration-700">
                      <Sun size={80} className="mx-auto mb-6 text-yellow-300 animate-spin-slow" />
                      <h3 className="text-7xl font-black">24°C</h3>
                      <p className="mt-4 font-bold uppercase opacity-60">Sunčano</p>
                   </div>
                )}
                {activeSlide === 2 && (
                   <div className="animate-in slide-in-from-bottom duration-700">
                      <Cake size={60} className="mx-auto mb-6 text-pink-300" />
                      <h3 className="text-xl font-black uppercase tracking-widest text-pink-200 mb-6">Slavljenici</h3>
                      <div className="space-y-2">
                        {data.bdays.slice(0,3).map((b,i) => (
                           <div key={i} className="bg-white/10 p-3 rounded-xl font-bold uppercase">{b.name}</div>
                        ))}
                        {data.bdays.length === 0 && <p>Nema rođendana danas</p>}
                      </div>
                   </div>
                )}
                {activeSlide === 3 && (
                   <div className="animate-in fade-in duration-1000">
                      <Quote size={60} className="mx-auto mb-6 text-white/30" />
                      <p className="text-2xl font-medium italic mb-6">"{data.quotes[0]?.text}"</p>
                      <p className="font-black uppercase text-sm tracking-widest">— {data.quotes[0]?.author}</p>
                   </div>
                )}
                
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 h-2 bg-white/30 w-full">
                   <div className="h-full bg-white animate-[progress_10s_linear_infinite]" style={{width: '100%'}} />
                </div>
             </div>
          </div>
        </div>

        {/* FOOTER: MARQUEE VESTI */}
        {status.news && (
          <div className="h-20 bg-white/90 backdrop-blur-md rounded-2xl flex items-center overflow-hidden shadow-lg z-20">
             <div className="bg-blue-600 h-full px-8 flex items-center justify-center font-black uppercase text-white tracking-widest text-xl shrink-0">
               Info
             </div>
             <div className="flex-1 overflow-hidden whitespace-nowrap text-slate-900 text-2xl font-bold uppercase italic items-center flex">
               <div className="animate-marquee inline-block">
                 {status.news} &nbsp; • &nbsp; {status.news} &nbsp; • &nbsp; {status.news} &nbsp; • &nbsp; {status.news}
               </div>
             </div>
          </div>
        )}

      </div>

      <style jsx>{`
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .animate-spin-slow { animation: spin 10s linear infinite; }
      `}</style>
    </div>
  );
}