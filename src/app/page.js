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
    const r = setInterval(() => setActiveTab(prev => (prev + 1) % 4), 12000);
    const f = setInterval(fetchData, 45000);
    return () => { clearInterval(t); clearInterval(r); clearInterval(f); };
  }, []);

  const status = useMemo(() => {
    const h = now.getHours(); const m = now.getMinutes(); const s = now.getSeconds();
    const totalSec = (h * 3600) + (m * 60) + s;
    const isMorning = (h * 60 + m) < (14 * 60);
    const shiftSetting = data.sys?.find(s => s.key === 'current_morning_shift')?.value || 'Parna';
    const activeShift = isMorning ? shiftSetting : (shiftSetting === 'Parna' ? 'Neparna' : 'Parna');
    const days = ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"];
    
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
      activeClass, countdown, isBreak: !current,
      emergency: data.sys?.find(s => s.key === 'emergency')?.value === 'true', 
      breaking: data.sys?.find(s => s.key === 'breaking_news')?.value,
      video: { 
        active: data.sys?.find(s => s.key === 'video_active')?.value === 'true', 
        url: data.sys?.find(s => s.key === 'bg_video_url')?.value, 
        mode: data.sys?.find(s => s.key === 'video_mode')?.value 
      }
    };
  }, [now, data]);

  // Handle Video URL
  const getEmbedUrl = (url) => {
    if (!url) return '';
    let id = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&rel=0&showinfo=0`;
  };

  if (status.emergency) return (
    <div className="h-screen w-screen bg-red-700 flex flex-col items-center justify-center text-white p-20 z-[9999] fixed top-0 left-0">
      <AlertTriangle size={300} className="animate-bounce" />
      <h1 className="text-[25vh] font-black uppercase tracking-tighter leading-none">УЗБУНА</h1>
      <p className="text-6xl font-black uppercase italic animate-pulse mt-10 text-center">ЕВАКУАЦИЈА У ТОКУ! ПРАТИТЕ ПЛАН ИЗЛАСКА!</p>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] flex flex-col p-6 gap-6 overflow-hidden relative font-sans text-slate-900">
      
      {/* 1. VIDEO LAYER (Apsolutno ili Full Screen) */}
      {status.video.active && status.video.url && (
        <div className={`fixed inset-0 overflow-hidden ${status.video.mode === 'fullscreen' ? 'z-[100]' : 'z-[-1]'}`}>
          <div className="absolute inset-0 bg-black/20 z-10" /> {/* Dark overlay za bolju citljivost */}
          <iframe 
            className="w-full h-full scale-[1.35]"
            src={getEmbedUrl(status.video.url)}
            frameBorder="0" allow="autoplay; encrypted-media"
          />
          {status.video.mode === 'fullscreen' && (
            <div className="absolute top-10 right-10 z-[101] bg-white/20 backdrop-blur-xl p-6 rounded-full text-white font-black animate-pulse">
              FULL SCREEN МОД AKTИBAH
            </div>
          )}
        </div>
      )}

      {/* 2. HEADER (15% Visine) */}
      <div className="h-[15vh] bg-white/95 backdrop-blur-md rounded-[3.5rem] shadow-2xl flex items-center justify-between px-16 z-[10] border-b-8 border-blue-600">
        <div className="flex items-center gap-10">
          <div className="bg-slate-900 p-4 rounded-3xl"><img src="/logo.png" className="h-20 invert" /></div>
          <div>
            <h1 className="text-[6vh] font-black uppercase italic tracking-tighter leading-none">ОШ „КАРАЂОРЂЕ”</h1>
            <p className="text-blue-600 font-bold uppercase tracking-[0.5em] text-sm mt-2">Дигитални информативни систем</p>
          </div>
        </div>
        
        {/* Sat i Tajmer u jednom kontejneru - BEZ PRAZNINE IZNAD */}
        <div className="flex items-center gap-12">
          <div className="bg-blue-600 text-white px-10 py-5 rounded-[3rem] shadow-2xl text-center min-w-[280px]">
            <p className="text-[1.4vh] font-black uppercase mb-1 opacity-60 tracking-widest">
              {status.isBreak ? 'До почетка часа' : 'До краја часа'}
            </p>
            <p className="text-[7vh] font-black leading-none tabular-nums tracking-tighter">{status.countdown}</p>
          </div>
          <div className="text-[10vh] font-black tracking-tighter tabular-nums leading-none">
            {now.getHours()}:{now.getMinutes().toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* 3. MAIN SECTION (75% Visine) */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 z-[10]">
        
        {/* LEVO: TRENUTNI ČAS (8 od 12 kolona) */}
        <div className="col-span-8 bg-white/95 backdrop-blur-xl rounded-[4.5rem] shadow-2xl p-16 flex flex-col border border-white relative overflow-hidden">
          <div className="flex items-center gap-5 mb-10">
            <div className={`w-6 h-6 rounded-full ${status.isBreak ? 'bg-orange-500 animate-pulse shadow-[0_0_20px_orange]' : 'bg-emerald-500 shadow-[0_0_20px_green]'}`} />
            <span className="text-[3.5vh] font-black uppercase text-slate-400 tracking-widest italic">
              {status.isBreak ? 'ВЕЛИКИ ОДМОР' : 'НАСТАВА У ТОКУ'}
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center">
            {status.activeClass ? (
              <div className="text-center w-full animate-in zoom-in duration-500">
                <p className="text-[4vh] font-black text-blue-500 uppercase tracking-[0.8rem] mb-6 opacity-40">
                  {status.isBreak ? 'СЛЕДЕЋИ ЧАС' : 'ТРЕНУТНО ОДЕЉЕЊЕ'}
                </p>
                <h2 className="text-[20vh] font-black text-slate-950 leading-[0.8] tracking-tighter uppercase italic mb-12">
                  {status.activeClass.class_name}
                </h2>
                <div className="text-[10vh] font-black text-white bg-slate-950 px-28 py-8 rounded-[4rem] inline-block shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-b-[12px] border-blue-600">
                  {status.activeClass.room}
                </div>
              </div>
            ) : (
              <div className="text-center opacity-10">
                <Clock size={350} />
                <p className="text-7xl font-black uppercase mt-12 tracking-tighter italic">Тишина у холу</p>
              </div>
            )}
          </div>

          {/* DEŽURSTVO NA DNU */}
          <div className="mt-auto pt-12 border-t-8 border-slate-50 flex justify-between items-center">
             <div className="grid grid-cols-2 gap-24">
                <div className="flex flex-col gap-2">
                   <p className="text-slate-400 font-black uppercase text-sm tracking-[0.3em]">Наставник на дужности</p>
                   <p className="text-[4.5vh] font-black uppercase italic leading-none text-slate-900">{data.duty?.teacher_name || '---'}</p>
                </div>
                <div className="flex flex-col gap-2 border-l-4 border-slate-100 pl-12">
                   <p className="text-slate-400 font-black uppercase text-sm tracking-[0.3em]">Дежурни ученици</p>
                   <p className="text-[2.8vh] font-bold uppercase text-slate-500 italic">{data.duty?.student_names || '---'}</p>
                </div>
             </div>
             <div className="bg-slate-950 p-6 rounded-[2.5rem] shadow-2xl transform rotate-3 hover:rotate-0 transition-transform">
                <QrCode size={90} className="text-white" />
             </div>
          </div>
        </div>

        {/* DESNO: SLAJDOVI (4 od 12 kolona) */}
        <div className="col-span-4 bg-slate-950 rounded-[4.5rem] shadow-2xl relative overflow-hidden flex flex-col p-14 border-b-[20px] border-blue-600">
          
          {/* Obaveštenja */}
          {activeTab === 0 && (
            <div className="animate-in slide-in-from-right duration-700 h-full flex flex-col justify-center">
               <div className="flex items-center gap-5 text-blue-400 mb-10"><Bell size={55}/><h3 className="font-black text-[4vh] uppercase italic tracking-tight">ВAЖНО</h3></div>
               {data.ann?.[0]?.image_url && (
                 <div className="relative group">
                   <img src={data.ann[0].image_url} className="w-full h-80 object-cover rounded-[3.5rem] mb-10 border-4 border-white/10 shadow-2xl shadow-blue-900/20" />
                   <div className="absolute inset-0 rounded-[3.5rem] bg-gradient-to-t from-slate-950 to-transparent opacity-40" />
                 </div>
               )}
               <p className="text-[5vh] font-black leading-[1.1] text-white italic tracking-tight">"{data.ann?.[0]?.text || "Добродошли у ОШ Карађорђе!"}"</p>
            </div>
          )}

          {/* Vreme / Prognoza */}
          {activeTab === 1 && (
            <div className="animate-in zoom-in duration-700 h-full flex flex-col justify-center text-center">
               <div className="bg-white/5 p-12 rounded-[4rem] backdrop-blur-xl border border-white/5">
                 <Sun size={220} className="mx-auto text-amber-400 mb-10 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)] animate-pulse" />
                 <h3 className="text-[16vh] font-black text-white leading-none tracking-tighter">24°C</h3>
                 <p className="text-blue-400 font-black text-[4.5vh] uppercase tracking-[0.6em] mt-8">БЕОГРАД</p>
               </div>
            </div>
          )}

          {/* Rođendani */}
          {activeTab === 2 && (
            <div className="animate-in slide-in-from-bottom duration-700 h-full flex flex-col justify-center">
               <div className="flex items-center gap-5 text-pink-500 mb-12"><Cake size={60}/><h3 className="font-black text-[4vh] uppercase italic">СЛАВЉЕНИЦИ</h3></div>
               <div className="space-y-6">
                  {data.bdays.slice(0, 3).length > 0 ? data.bdays.slice(0, 3).map((b, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 p-8 rounded-[2.5rem] border-l-[12px] border-pink-500 shadow-xl backdrop-blur-md">
                       <span className="text-[4vh] font-black tracking-tighter text-white uppercase">{b.name}</span>
                       <span className="bg-pink-500 text-white px-8 py-2 rounded-2xl text-[2.2vh] font-black uppercase">{b.class_name}</span>
                    </div>
                  )) : <p className="text-slate-500 text-3xl font-bold italic">Данас немамо рођендана...</p>}
               </div>
            </div>
          )}

          {/* Citati */}
          {activeTab === 3 && (
            <div className="animate-in fade-in duration-1000 h-full flex flex-col justify-center text-center">
               <Quote size={120} className="mx-auto text-white/5 mb-10" />
               <p className="text-[5.5vh] font-black italic text-white leading-tight px-4">"{data.quotes[0]?.text || "Знање је једино благо које се дељењем увећава."}"</p>
               <div className="w-24 h-3 bg-blue-600 mx-auto my-12 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)]" />
               <p className="text-blue-400 font-black uppercase text-[3.5vh] tracking-[0.4em]">— {data.quotes[0]?.author || "Народна пословица"}</p>
            </div>
          )}

          {/* Progress Bar (Timer za slajd) */}
          <div className="absolute bottom-0 left-0 h-4 bg-blue-600 transition-all duration-1000 animate-[progress_12s_linear_infinite]" />
        </div>
      </div>

      {/* 4. FOOTER: BREAKING NEWS (10% Visine) */}
      {status.breaking && (
        <div className="h-[10vh] bg-blue-700 rounded-[3rem] flex items-center overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-4 border-blue-400 z-[10] relative">
          <div className="bg-white text-blue-800 px-16 h-full flex items-center font-black italic text-[4vh] z-20 shadow-2xl uppercase tracking-tighter">ВЕСТИ</div>
          <div className="flex-1 whitespace-nowrap overflow-hidden">
            <p className="inline-block animate-marquee text-white text-[5vh] font-black uppercase italic tracking-widest leading-none py-2">
              {status.breaking} &nbsp;&nbsp;&nbsp; ★ &nbsp;&nbsp;&nbsp; {status.breaking} &nbsp;&nbsp;&nbsp; ★ &nbsp;&nbsp;&nbsp; {status.breaking}
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: inline-block; animation: marquee 35s linear infinite; }
        .font-sans { font-family: 'Inter', system-ui, -apple-system, sans-serif !important; }
      `}</style>
    </div>
  );
}