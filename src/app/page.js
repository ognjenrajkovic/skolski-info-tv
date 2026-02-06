'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Bell, Cake, Quote, Sun, AlertTriangle } from 'lucide-react';

export default function MainDisplay() {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], duty: {}, sys: [], quotes: [] });
  const [slide, setSlide] = useState(0);

  const fetchData = async () => {
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

  useEffect(() => {
    fetchData();
    setInterval(() => setNow(new Date()), 1000);
    setInterval(fetchData, 60000);
    setInterval(() => setSlide(s => (s + 1) % 4), 10000);
  }, []);

  const status = useMemo(() => {
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const totalSec = (h * 3600) + (m * 60) + s;
    const isMorning = (h * 60 + m) < (14 * 60);
    const shift = data.sys.find(s => s.key === 'current_morning_shift')?.value || 'Parna';
    const activeShift = isMorning ? shift : (shift === 'Parna' ? 'Neparna' : 'Parna');
    const days = ["Nedelja", "Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota"];
    
    // Satnica (Fiksna za primer)
    const bell = [{ n: 1, s: 28800, e: 31500 }, { n: 2, s: 31800, e: 34500 }, { n: 3, s: 36000, e: 38700 }];
    const current = bell.find(b => totalSec >= b.s && totalSec < b.e);
    const next = bell.find(b => totalSec < b.s);
    const diff = (current ? current.e : (next ? next.s : 0)) - totalSec;
    const timer = diff > 0 ? `${Math.floor(diff/60)}:${(diff%60).toString().padStart(2,'0')}` : "00:00";

    const activeClass = data.tt.find(t => t.day === days[now.getDay()] && t.shift === activeShift && t.period === (current ? current.n : (next ? next.n : 0)));

    return { activeClass, timer, isBreak: !current, emergency: data.sys.find(s => s.key === 'emergency')?.value === 'true', news: data.sys.find(s => s.key === 'breaking_news')?.value, video: data.sys.find(s => s.key === 'video_active')?.value === 'true', videoUrl: data.sys.find(s => s.key === 'bg_video_url')?.value };
  }, [now, data]);

  if (status.emergency) return (
    <div className="h-screen w-screen bg-red-600 flex flex-col items-center justify-center text-white z-[9999] fixed top-0">
      <AlertTriangle size={300} className="animate-bounce" />
      <h1 className="text-[20vh] font-black uppercase tracking-tighter">UZBUNA</h1>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-[#0F172A] p-6 flex flex-col gap-6 overflow-hidden relative font-sans text-white">
      
      {/* 1. POZADINSKI VIDEO (AKO JE UKLJUČEN) */}
      {status.video && (
        <div className="absolute inset-0 z-0 opacity-40">
           <iframe className="w-full h-full scale-[1.5]" src={`https://www.youtube.com/embed/${status.videoUrl?.split('v=')[1]}?autoplay=1&mute=1&controls=0&loop=1`} frameBorder="0" />
        </div>
      )}

      {/* 2. HEADER (TOP BOX) */}
      <div className="h-[15vh] bg-white/10 backdrop-blur-xl rounded-[2rem] border-2 border-white/20 flex items-center justify-between px-12 z-10">
        <div className="flex items-center gap-6">
          <div className="bg-white p-3 rounded-2xl"><img src="/logo.png" className="h-16" /></div>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">Karađorđe</h1>
            <p className="text-blue-400 font-bold uppercase text-xs tracking-widest">Informacioni sistem</p>
          </div>
        </div>
        <div className="flex gap-8 items-center">
           <div className="bg-blue-600/30 px-8 py-4 rounded-3xl border border-blue-500/50 text-center">
              <p className="text-[1vh] font-black uppercase opacity-60">{status.isBreak ? 'Do početka' : 'Do kraja'}</p>
              <p className="text-5xl font-black tabular-nums">{status.timer}</p>
           </div>
           <div className="text-8xl font-black tabular-nums tracking-tighter">
             {now.getHours()}:{now.getMinutes().toString().padStart(2, '0')}
           </div>
        </div>
      </div>

      {/* 3. GLAVNI BLOKOVI (SREDINA) */}
      <div className="flex-1 grid grid-cols-3 gap-6 z-10 min-h-0">
        
        {/* LEVA STRANA: STATUS ČASA (2/3 ekrana) */}
        <div className="col-span-2 bg-white rounded-[3rem] p-12 flex flex-col text-slate-900 border-b-[15px] border-blue-600">
           <div className="flex items-center gap-3 mb-10">
              <div className={`w-4 h-4 rounded-full ${status.isBreak ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="font-black text-2xl uppercase text-slate-400 tracking-widest">
                {status.isBreak ? 'VELIKI ODMOR' : 'NASTAVA JE U TOKU'}
              </span>
           </div>

           <div className="flex-1 flex flex-col justify-center items-center text-center">
             {status.activeClass ? (
               <>
                 <h2 className="text-[18vh] font-black leading-none tracking-tighter italic mb-8">
                   {status.activeClass.class_name}
                 </h2>
                 <div className="bg-slate-900 text-white text-[8vh] font-black px-20 py-5 rounded-[3rem] shadow-2xl">
                   {status.activeClass.room}
                 </div>
               </>
             ) : (
               <div className="opacity-10 text-9xl font-black uppercase rotate-[-5deg]">KRAJ SMENE</div>
             )}
           </div>

           {/* DEŽURSTVO (FIKSIRANO NA DNU LEVE KARTICE) */}
           <div className="mt-auto pt-8 border-t-4 border-slate-50 flex justify-between items-end">
              <div>
                <p className="text-slate-400 font-black uppercase text-xs mb-1 tracking-widest">Dežurni Nastavnik</p>
                <p className="text-4xl font-black uppercase italic text-blue-600">{data.duty.teacher_name || '---'}</p>
              </div>
              <div className="bg-slate-100 p-4 rounded-2xl border-4 border-slate-900 shadow-lg">
                <Clock size={50} className="text-slate-900" />
              </div>
           </div>
        </div>

        {/* DESNA STRANA: SLAJDOVI */}
        <div className="col-span-1 bg-blue-600 rounded-[3rem] p-12 flex flex-col justify-center relative overflow-hidden shadow-2xl">
          {slide === 0 && (
            <div className="animate-in fade-in zoom-in duration-500 text-center">
              <Bell size={100} className="mx-auto mb-8 text-white/20" />
              <h3 className="text-3xl font-black uppercase italic mb-6">Obaveštenje</h3>
              <p className="text-4xl font-bold leading-tight italic">"{data.ann[0]?.text || "Dobrodošli!"}"</p>
            </div>
          )}
          {slide === 1 && (
            <div className="animate-in slide-in-from-right duration-500 text-center">
              <Sun size={150} className="mx-auto mb-8 text-yellow-400 animate-pulse" />
              <h3 className="text-[10vh] font-black leading-none">22°C</h3>
              <p className="text-2xl font-black uppercase tracking-[0.5em] mt-4 opacity-60">Beograd</p>
            </div>
          )}
          {slide === 2 && (
            <div className="animate-in slide-in-from-bottom duration-500">
              <Cake size={80} className="mb-6 text-pink-300" />
              <h3 className="text-3xl font-black uppercase mb-8 italic">Rođendani</h3>
              <div className="space-y-4">
                {data.bdays.slice(0, 3).map((b, i) => (
                  <div key={i} className="bg-white/10 p-5 rounded-2xl border-l-8 border-white font-black uppercase">
                    {b.name} ({b.class_name})
                  </div>
                ))}
              </div>
            </div>
          )}
          {slide === 3 && (
            <div className="animate-in fade-in duration-1000 text-center italic">
              <Quote size={80} className="mx-auto mb-8 text-white/10" />
              <p className="text-3xl font-bold leading-snug">"{data.quotes[0]?.text}"</p>
              <p className="mt-8 text-blue-200 font-black uppercase tracking-widest">— {data.quotes[0]?.author}</p>
            </div>
          )}
          {/* Progress bar slajda */}
          <div className="absolute bottom-0 left-0 h-3 bg-white/30 animate-[progress_10s_linear_infinite]" />
        </div>
      </div>

      {/* 4. FOOTER (HITNE VESTI) */}
      {status.news && (
        <div className="h-[8vh] bg-blue-800 rounded-[2rem] border-2 border-blue-400 flex items-center overflow-hidden z-10 shadow-2xl">
           <div className="bg-white text-blue-900 px-10 h-full flex items-center font-black italic text-2xl uppercase z-20">VESTI</div>
           <div className="flex-1 whitespace-nowrap overflow-hidden">
             <p className="inline-block animate-marquee text-white text-4xl font-black uppercase italic tracking-widest py-2">
               {status.news} &nbsp;&nbsp;&nbsp; ★ &nbsp;&nbsp;&nbsp; {status.news}
             </p>
           </div>
        </div>
      )}

      <style jsx>{`
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: inline-block; animation: marquee 20s linear infinite; }
      `}</style>
    </div>
  );
}