'use client'
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bell, Quote, Cake, AlertTriangle, Sun, User, Clock, QrCode } from 'lucide-react';
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
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(() => setNow(new Date()), 1000);
    const r = setInterval(() => setActiveTab(prev => (prev + 1) % 4), 10000);
    const f = setInterval(fetchData, 30000);
    return () => { clearInterval(t); clearInterval(r); clearInterval(f); };
  }, []);

  const status = useMemo(() => {
    const h = now.getHours(); const m = now.getMinutes(); const s = now.getSeconds();
    const totalSec = (h * 3600) + (m * 60) + s;
    const isMorning = (h * 60 + m) < (14 * 60);
    const shiftSetting = data.sys?.find(s => s.key === 'current_morning_shift')?.value || 'Parna';
    const activeShift = isMorning ? shiftSetting : (shiftSetting === 'Parna' ? 'Neparna' : 'Parna');
    const days = ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"];
    
    // Satnica 
    const bell = [
      { n: 1, s: 28800, e: 31500 }, { n: 2, s: 31800, e: 34500 }, { n: 3, s: 36000, e: 38700 },
      { n: 4, s: 39000, e: 41700 }, { n: 5, s: 42000, e: 44700 }, { n: 6, s: 45000, e: 47700 },
      { n: 1, s: 50400, e: 53100 }, { n: 2, s: 53400, e: 56100 }, { n: 3, s: 57600, e: 60300 }
    ];

    let current = bell.find(b => totalSec >= b.s && totalSec < b.e);
    let next = bell.find(b => totalSec < b.s);
    let target = current ? current.e : (next ? next.s : 0);
    let diff = target - totalSec;
    let countdown = diff > 0 ? `${Math.floor(diff/60)}:${(diff%60).toString().padStart(2,'0')}` : "00:00";

    const activeClass = data.tt?.find(t => t.day === days[now.getDay()] && t.shift === activeShift && t.period === (current ? current.n : (next ? next.n : 0)));

    return { 
      activeClass, countdown, 
      isBreak: !current, 
      emergency: data.sys?.find(s => s.key === 'emergency')?.value === 'true', 
      breaking: data.sys?.find(s => s.key === 'breaking_news')?.value,
      video: { active: data.sys?.find(s => s.key === 'video_active')?.value === 'true', url: data.sys?.find(s => s.key === 'bg_video_url')?.value, mode: data.sys?.find(s => s.key === 'video_mode')?.value }
    };
  }, [now, data]);

  if (status.emergency) return (
    <div className="h-screen w-screen bg-red-700 flex flex-col items-center justify-center text-white p-20 z-[9999] absolute top-0 left-0">
      <AlertTriangle size={300} className="animate-bounce" />
      <h1 className="text-[25vh] font-black uppercase tracking-tighter">УЗБУНА</h1>
      <p className="text-6xl font-black uppercase italic animate-pulse">Напустите објекат одмах!</p>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col p-6 gap-6 overflow-hidden relative font-sans">
      
      {/* VIDEO BACKGROUND LAYER */}
      {status.video.active && (
        <div className={`absolute inset-0 z-0 overflow-hidden ${status.video.mode === 'fullscreen' ? 'z-[50]' : 'z-[-1]'}`}>
          <iframe 
            className="w-full h-full scale-[1.5]"
            src={`${status.video.url}?autoplay=1&mute=1&controls=0&loop=1&playlist=${status.video.url.split('/').pop()}`}
            frameBorder="0" allow="autoplay; encrypted-media"
          />
          {status.video.mode === 'fullscreen' && (
            <button onClick={fetchData} className="absolute top-10 right-10 bg-white/20 hover:bg-white/40 p-5 rounded-full z-[60] backdrop-blur-xl text-white font-black uppercase">X</button>
          )}
        </div>
      )}

      {/* HEADER (Fixed Height) */}
      <div className="h-[15vh] bg-white/90 backdrop-blur-md rounded-[3rem] shadow-2xl flex items-center justify-between px-16 z-10 border-b-8 border-blue-600">
        <div className="flex items-center gap-10">
          <img src="/logo.png" className="h-24" />
          <div>
            <h1 className="text-[5.5vh] font-black uppercase tracking-tighter leading-none">ОШ „КАРАЂОРЂЕ”</h1>
            <p className="text-blue-600 font-black uppercase tracking-[0.4em] text-sm mt-1">Дигитални информативни систем</p>
          </div>
        </div>
        <div className="flex gap-10 items-center">
          <div className="bg-blue-600 text-white px-12 py-5 rounded-[2.5rem] shadow-xl text-center min-w-[300px]">
            <p className="text-[1.5vh] font-bold uppercase mb-1 opacity-70">{status.isBreak ? 'До почетка' : 'До краја часа'}</p>
            <p className="text-[6.5vh] font-black leading-none tabular-nums">{status.countdown}</p>
          </div>
          <div className="text-[9.5vh] font-black tracking-tighter tabular-nums leading-none">
            {now.getHours()}:{now.getMinutes().toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT (Grid based to prevent overlapping) */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 z-10">
        
        {/* LEFT: STATUS PANEL */}
        <div className="col-span-8 bg-white/95 backdrop-blur-md rounded-[4rem] shadow-2xl p-16 flex flex-col border border-white">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-6 h-6 rounded-full ${status.isBreak ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[3vh] font-black uppercase text-slate-400 tracking-widest italic">
              {status.isBreak ? 'ВЕЛИКИ ОДМОР' : 'ЧАС ЈЕ У ТОКУ'}
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center">
            {status.activeClass ? (
              <div className="text-center w-full">
                <h2 className="text-[16vh] font-black text-slate-950 leading-[0.8] tracking-tighter uppercase italic mb-10">
                  {status.activeClass.class_name}
                </h2>
                <div className="text-[9vh] font-black text-blue-600 bg-blue-50 px-24 py-8 rounded-[4rem] inline-block border-4 border-blue-100 shadow-2xl">
                  {status.activeClass.room}
                </div>
              </div>
            ) : (
              <div className="text-center opacity-10">
                <Clock size={300} />
                <p className="text-6xl font-black uppercase mt-10">Настава није у току</p>
              </div>
            )}
          </div>

          <div className="mt-auto pt-12 border-t-4 border-slate-50 flex justify-between items-end">
             <div className="grid grid-cols-2 gap-20">
                <div>
                   <p className="text-slate-400 font-black uppercase text-sm mb-2 tracking-widest">Дежурни наставник</p>
                   <p className="text-[3.5vh] font-black uppercase italic leading-none">{data.duty?.teacher_name || '---'}</p>
                </div>
                <div>
                   <p className="text-slate-400 font-black uppercase text-sm mb-2 tracking-widest">Дежурни ученици</p>
                   <p className="text-[2.2vh] font-bold uppercase text-slate-500">{data.duty?.student_names || '---'}</p>
                </div>
             </div>
             <div className="bg-slate-950 text-white p-5 rounded-[2rem] border-4 border-blue-600 shadow-2xl">
                <QrCode size={80} />
             </div>
          </div>
        </div>

        {/* RIGHT: SLIDES */}
        <div className="col-span-4 bg-slate-950 rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col p-14 border-b-[15px] border-blue-600">
          {activeTab === 0 && (
            <div className="animate-in slide-in-from-right duration-500 h-full flex flex-col justify-center">
               <h3 className="text-blue-400 font-black text-[3vh] uppercase italic mb-8 flex items-center gap-4"><Bell size={40}/> Обавештење</h3>
               {data.ann?.[0]?.image_url && <img src={data.ann[0].image_url} className="w-full h-80 object-cover rounded-[3rem] mb-10 border-4 border-white/10" />}
               <p className="text-[4.5vh] font-black leading-tight text-white italic">"{data.ann?.[0]?.text || "Добродошли!"}"</p>
            </div>
          )}
          {activeTab === 1 && (
            <div className="animate-in zoom-in duration-500 h-full flex flex-col justify-center text-center">
               <Sun size={200} className="mx-auto text-amber-400 mb-10 animate-pulse" />
               <h3 className="text-[15vh] font-black text-white leading-none tracking-tighter">24°C</h3>
               <p className="text-blue-400 font-black text-[4vh] uppercase tracking-[0.6em] mt-5">БЕОГРАД</p>
            </div>
          )}
          {/* Progress Bar na dnu slajda */}
          <div className="absolute bottom-0 left-0 h-4 bg-blue-600 transition-all duration-1000 animate-[progress_10s_linear_infinite]" />
        </div>
      </div>

      {/* FOOTER: MARQUEE */}
      {status.breaking && (
        <div className="h-[9vh] bg-blue-700 rounded-[2.5rem] flex items-center overflow-hidden shadow-2xl border-4 border-blue-500 z-10">
          <div className="bg-white text-blue-800 px-16 h-full flex items-center font-black italic text-[3.5vh] z-20">ВЕСТИ</div>
          <div className="flex-1 whitespace-nowrap overflow-hidden">
            <p className="inline-block animate-marquee text-white text-[4.5vh] font-black uppercase italic tracking-widest leading-none py-2">
              {status.breaking} &nbsp;&nbsp;&nbsp; ★ &nbsp;&nbsp;&nbsp; {status.breaking} &nbsp;&nbsp;&nbsp; ★ &nbsp;&nbsp;&nbsp; {status.breaking}
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: inline-block; animation: marquee 30s linear infinite; }
      `}</style>
    </div>
  );
}