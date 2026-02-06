'use client'
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bell, Quote, Cake, AlertTriangle, Sun, User, Clock, QrCode, Music } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], duty: null, quotes: [], sys: [] });
  const [activeTab, setActiveTab] = useState(0);
  const audioRef = useRef(null);

  const fetchData = async () => {
    try {
      const [ann, bdays, tt, dt, sys, qt] = await Promise.all([
        supabase.from('announcements').select('*'),
        supabase.from('birthdays').select('*'),
        supabase.from('timetable').select('*'),
        supabase.from('duty_staff').select('*').single(),
        supabase.from('system_settings').select('*'),
        supabase.from('quotes').select('*')
      ]);
      setData({ ann: ann.data || [], bdays: bdays.data || [], tt: tt.data || [], duty: dt.data, sys: sys.data || [], quotes: qt.data || [] });
    } catch (e) { console.log(e); }
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    const r = setInterval(() => setActiveTab(prev => (prev + 1) % 4), 15000);
    const f = setInterval(fetchData, 30000);
    return () => { clearInterval(t); clearInterval(r); clearInterval(f); };
  }, []);

  // MUZIKA LOGIKA
  useEffect(() => {
    const isPlaying = data.sys?.find(s => s.key === 'music_active')?.value === 'true';
    if (audioRef.current) {
      if (isPlaying) { audioRef.current.play().catch(() => {}); }
      else { audioRef.current.pause(); }
    }
  }, [data.sys]);

  const status = useMemo(() => {
    const totalSec = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    const isMorning = (now.getHours() * 60 + now.getMinutes()) < (14 * 60);
    const shiftSetting = data.sys?.find(s => s.key === 'current_morning_shift')?.value || 'Parna';
    const activeShift = isMorning ? shiftSetting : (shiftSetting === 'Parna' ? 'Neparna' : 'Parna');
    const days = ["Nedelja", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Subota"];
    
    const bell = [
      { n: 1, s: 28800, e: 31500 }, { n: 2, s: 31800, e: 34500 }, { n: 3, s: 36000, e: 38700 },
      { n: 4, s: 39000, e: 41700 }, { n: 5, s: 42000, e: 44700 }, { n: 6, s: 45000, e: 47700 },
      { n: 1, s: 50400, e: 53100 }, { n: 2, s: 53400, e: 56100 }, { n: 3, s: 57600, e: 60300 }
    ];

    let current = bell.find(b => totalSec >= b.s && totalSec < b.e);
    let next = bell.find(b => totalSec < b.s);
    let isBreak = !current;
    let target = current ? current.e : (next ? next.s : 0);
    let diff = target - totalSec;
    let countdown = diff > 0 ? `${Math.floor(diff/60)}:${(diff%60).toString().padStart(2,'0')}` : "0:00";

    const activeClass = data.tt?.find(t => t.day === days[now.getDay()] && t.shift === activeShift && t.period === (current ? current.n : (next ? next.n : 0)));

    return { activeClass, countdown, isBreak, current, emergency: data.sys?.find(s => s.key === 'emergency')?.value, breaking: data.sys?.find(s => s.key === 'breaking_news')?.value };
  }, [now, data]);

  if (status.emergency === 'УЗБУНА') return (
    <div className="h-screen w-screen bg-red-600 flex flex-col items-center justify-center text-white animate-pulse">
      <AlertTriangle size={300} /><h1 className="text-[20vh] font-black">УЗБУНА</h1>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-[#F0F2F5] p-6 flex flex-col gap-6 overflow-hidden font-sans text-slate-900">
      <audio ref={audioRef} src={data.sys?.find(s => s.key === 'bg_music_url')?.value} loop />

      {/* HEADER */}
      <div className="h-[14vh] bg-white rounded-[3.5rem] shadow-xl flex items-center justify-between px-12 border border-white/50 relative">
        <div className="flex items-center gap-8">
           <img src="/logo.png" className="h-24 w-24 object-contain" alt="Logo" />
           <div>
             <h1 className="text-[5vh] font-black uppercase italic tracking-tighter leading-none">ОШ „КАРАЂОРЂЕ”</h1>
             <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm mt-2">Digitalni Informativni Sistem</p>
           </div>
        </div>
        <div className="flex items-center gap-10">
           <div className="bg-blue-50 px-10 py-4 rounded-[2.5rem] border border-blue-100 text-center shadow-inner">
              <p className="text-[1.2vh] font-black text-blue-400 uppercase">{status.isBreak ? 'Do početka' : 'Do kraja časa'}</p>
              <p className="text-[5.5vh] font-black tabular-nums leading-none text-blue-600">{status.countdown}</p>
           </div>
           <div className="text-[8.5vh] font-black tracking-tighter tabular-nums">
             {now.getHours()}:{now.getMinutes().toString().padStart(2, '0')}
           </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* LEVO: FOCUS PANEL */}
        <div className="w-[65%] bg-white rounded-[4rem] shadow-2xl border border-white p-12 flex flex-col items-center justify-center relative overflow-hidden">
           <div className="absolute top-12 left-12 flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${status.isBreak ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-bounce'}`} />
              <span className="font-black uppercase tracking-widest text-slate-400">{status.isBreak ? 'Veliki odmor' : `${status.current?.n}. čas u toku`}</span>
           </div>

           {status.activeClass ? (
             <div className="text-center animate-in zoom-in duration-700">
                <p className="text-[4vh] font-black text-blue-600 uppercase tracking-[0.5rem] italic mb-4 opacity-40">{status.isBreak ? 'Sledeći čas' : 'Trenutno na nastavi'}</p>
                <h2 className="text-[18vh] font-black text-slate-900 leading-none italic uppercase tracking-tighter">{status.activeClass.class_name}</h2>
                <div className="mt-10 flex items-center justify-center gap-8">
                   <div className="h-[2px] w-24 bg-slate-100" />
                   <div className="text-[8vh] font-black text-blue-600 bg-blue-50 px-16 py-4 rounded-[3.5rem] border border-blue-100 shadow-sm">{status.activeClass.room}</div>
                   <div className="h-[2px] w-24 bg-slate-100" />
                </div>
             </div>
           ) : (
             <div className="text-center opacity-20"><Clock size={200} /><p className="text-5xl font-black uppercase mt-6 tracking-tighter">Nema nastave</p></div>
           )}

           <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t border-slate-50 pt-10">
              <div className="flex gap-12">
                 <div>
                    <p className="text-[1.2vh] font-black text-slate-400 uppercase tracking-widest">Nastavnik na dužnosti</p>
                    <p className="text-[3.2vh] font-black text-slate-800 uppercase italic tracking-tight">{data.duty?.teacher_name || '---'}</p>
                 </div>
                 <div className="h-12 w-[2px] bg-slate-100" />
                 <div>
                    <p className="text-[1.2vh] font-black text-slate-400 uppercase tracking-widest">Dežurni učenici</p>
                    <p className="text-[2.5vh] font-black text-slate-500 uppercase italic tracking-tight">{data.duty?.student_names || '---'}</p>
                 </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner"><QrCode size={70} className="text-slate-800" /></div>
           </div>
        </div>

        {/* DESNO: SLAJDOVI */}
        <div className="w-[35%] flex flex-col gap-6">
          <div className="flex-1 bg-slate-900 rounded-[4rem] shadow-2xl p-12 flex flex-col justify-center relative overflow-hidden">
             {activeTab === 0 && (
               <div className="animate-in slide-in-from-right duration-700">
                  <div className="flex items-center gap-4 text-orange-400 mb-8"><Bell size={40}/><h3 className="font-black text-[3vh] uppercase italic tracking-widest">Obaveštenje</h3></div>
                  {data.ann?.[0]?.image_url && <img src={data.ann[0].image_url} className="w-full h-64 object-cover rounded-[3rem] mb-8 border-4 border-white/10 shadow-2xl" />}
                  <p className="text-[4vh] font-black leading-tight text-white italic">"{data.ann?.[0]?.text || "Dobrodošli u školu!"}"</p>
               </div>
             )}
             {activeTab === 1 && (
               <div className="animate-in zoom-in duration-700 text-center text-white">
                  <Sun size={150} className="mx-auto text-amber-400 mb-8" />
                  <h3 className="text-[13vh] font-black leading-none tracking-tighter">24°C</h3>
                  <p className="text-amber-400 font-black text-[3.5vh] uppercase mt-4 tracking-[0.5rem]">Beograd</p>
               </div>
             )}
             {activeTab === 2 && (
               <div className="animate-in slide-in-from-bottom duration-700 text-white">
                  <div className="flex items-center gap-4 text-pink-400 mb-8"><Cake size={40}/><h3 className="font-black text-[3vh] uppercase italic tracking-widest">Rođendani</h3></div>
                  <div className="space-y-6">
                     {data.bdays.slice(0, 3).map((b, i) => (
                       <div key={i} className="flex justify-between items-center bg-white/5 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                          <span className="text-[4vh] font-black tracking-tighter">{b.name}</span>
                          <span className="bg-pink-500 px-8 py-2 rounded-2xl text-[2vh] font-black uppercase shadow-lg shadow-pink-900/50">{b.class_name}</span>
                       </div>
                     ))}
                  </div>
               </div>
             )}
             {activeTab === 3 && (
               <div className="animate-in fade-in duration-1000 text-center text-white">
                  <Quote size={80} className="mx-auto text-white/10 mb-8" />
                  <p className="text-[4.5vh] font-black italic text-white leading-tight">"{data.quotes[0]?.text || "Znanje je moć."}"</p>
                  <div className="w-20 h-2 bg-blue-500 mx-auto my-10 rounded-full" />
                  <p className="text-blue-400 font-black uppercase text-[2.5vh] tracking-[0.3em]">— {data.quotes[0]?.author || "Mudrost"}</p>
               </div>
             )}
             <div className="absolute bottom-0 left-0 h-3 bg-blue-600 animate-[progress_15s_linear_infinite]" />
          </div>
        </div>
      </div>

      {/* FOOTER: BREAKING NEWS */}
      {status.breaking && (
        <div className="h-[8vh] bg-blue-600 rounded-[2.5rem] flex items-center overflow-hidden shadow-2xl border-2 border-blue-400">
           <div className="bg-white text-blue-600 px-12 h-full flex items-center font-black italic text-[2.8vh] z-10 shadow-2xl uppercase tracking-tighter">HITO</div>
           <div className="flex-1 whitespace-nowrap overflow-hidden">
              <p className="inline-block animate-marquee text-white text-[3.5vh] font-black uppercase italic tracking-wider">
                 {status.breaking} &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; {status.breaking} &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; {status.breaking}
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