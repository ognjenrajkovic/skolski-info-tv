'use client'
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bell, Quote, Cake, AlertTriangle, Sun, User, Clock, QrCode, Music, Users } from 'lucide-react';
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
    const f = setInterval(fetchData, 60000);
    return () => { clearInterval(t); clearInterval(r); clearInterval(f); };
  }, []);

  useEffect(() => {
    const isPlaying = data.sys?.find(s => s.key === 'music_active')?.value === 'true';
    if (audioRef.current) {
      isPlaying ? audioRef.current.play().catch(() => {}) : audioRef.current.pause();
    }
  }, [data.sys]);

  const status = useMemo(() => {
    const h = now.getHours(); const m = now.getMinutes(); const s = now.getSeconds();
    const totalSec = (h * 3600) + (m * 60) + s;
    const isMorning = (h * 60 + m) < (14 * 60);
    const shiftSetting = data.sys?.find(s => s.key === 'current_morning_shift')?.value || 'Parna';
    const activeShift = isMorning ? shiftSetting : (shiftSetting === 'Parna' ? 'Neparna' : 'Parna');
    const days = ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"];
    
    // Satnica (Primer)
    const bell = [
      { n: 1, s: 28800, e: 31500 }, { n: 2, s: 31800, e: 34500 }, { n: 3, s: 36000, e: 38700 },
      { n: 4, s: 39000, e: 41700 }, { n: 5, s: 42000, e: 44700 }, { n: 6, s: 45000, e: 47700 }
    ];

    let current = bell.find(b => totalSec >= b.s && totalSec < b.e);
    let next = bell.find(b => totalSec < b.s);
    let target = current ? current.e : (next ? next.s : 0);
    let diff = target - totalSec;
    let countdown = diff > 0 ? `${Math.floor(diff/60)}:${(diff%60).toString().padStart(2,'0')}` : "00:00";

    const activeClass = data.tt?.find(t => t.day === days[now.getDay()] && t.shift === activeShift && t.period === (current ? current.n : (next ? next.n : 0)));

    return { activeClass, countdown, isBreak: !current, current, emergency: data.sys?.find(s => s.key === 'emergency')?.value, breaking: data.sys?.find(s => s.key === 'breaking_news')?.value };
  }, [now, data]);

  if (status.emergency === 'УЗБУНА') return (
    <div className="h-screen w-screen bg-red-700 flex flex-col items-center justify-center text-white p-20 text-center">
      <AlertTriangle size={300} className="animate-bounce" />
      <h1 className="text-[20vh] font-black uppercase">УЗБУНА</h1>
      <p className="text-5xl font-bold uppercase italic">Напустите објекат према плану евакуације</p>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-[#F0F2F5] p-6 flex flex-col gap-6 overflow-hidden font-sans text-slate-900">
      <audio ref={audioRef} src={data.sys?.find(s => s.key === 'bg_music_url')?.value} loop />

      {/* HEADER */}
      <div className="h-[15vh] bg-white rounded-[3rem] shadow-xl flex items-center justify-between px-16 border-b-8 border-blue-600">
        <div className="flex items-center gap-10">
           <img src="/logo.png" className="h-24 w-24 object-contain" />
           <div>
             <h1 className="text-[5.5vh] font-black uppercase italic tracking-tighter leading-none">ОШ „КАРАЂОРЂЕ”</h1>
             <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-sm mt-2">Дигитални информативни систем</p>
           </div>
        </div>
        <div className="flex items-center gap-12">
           <div className="bg-blue-50 px-12 py-4 rounded-[2.5rem] border border-blue-100 text-center">
              <p className="text-[1.2vh] font-black text-blue-400 uppercase mb-1">{status.isBreak ? 'До почетка' : 'До краја часа'}</p>
              <p className="text-[6vh] font-black tabular-nums leading-none text-blue-700">{status.countdown}</p>
           </div>
           <div className="text-[9vh] font-black tracking-tighter tabular-nums leading-none">
             {now.getHours()}:{now.getMinutes().toString().padStart(2, '0')}
           </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* LEVO: INFO PANEL */}
        <div className="w-[64%] bg-white rounded-[4rem] shadow-2xl p-12 flex flex-col border border-slate-100 overflow-hidden">
           {/* GORNJI DEO: STATUS */}
           <div className="flex items-center gap-3 mb-10">
              <div className={`w-5 h-5 rounded-full ${status.isBreak ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="font-black uppercase tracking-widest text-slate-400 text-xl">
                {status.isBreak ? 'ВЕЛИКИ ОДМОР' : `${status.current?.n}. ЧАС У ТОКУ`}
              </span>
           </div>

           {/* SREDINA: GLAVNI PRIKAZ (Pravilno centrirano) */}
           <div className="flex-1 flex flex-col justify-center items-center text-center">
             {status.activeClass ? (
               <div className="animate-in zoom-in duration-500 w-full">
                  <p className="text-[3.5vh] font-black text-blue-500 uppercase tracking-[0.6rem] mb-6 italic opacity-50">
                    {status.isBreak ? 'СЛЕДЕЋИ ЧАС' : 'ТРЕНУТНО У КАБИНЕТУ'}
                  </p>
                  <h2 className="text-[18vh] font-black text-slate-900 leading-[0.9] italic uppercase tracking-tighter mb-10">
                    {status.activeClass.class_name}
                  </h2>
                  <div className="text-[9vh] font-black text-white bg-slate-900 px-20 py-6 rounded-[3.5rem] inline-block shadow-2xl border-b-8 border-blue-600">
                    {status.activeClass.room}
                  </div>
               </div>
             ) : (
               <div className="flex flex-col items-center opacity-10">
                  <Clock size={250} />
                  <p className="text-6xl font-black uppercase mt-10">Нема наставе</p>
               </div>
             )}
           </div>

           {/* DONJI DEO: DEŽURSTVO (U sopstvenom redu, nema preklapanja) */}
           <div className="mt-10 pt-10 border-t-4 border-slate-50 grid grid-cols-2 gap-10">
              <div className="flex items-center gap-6">
                 <div className="bg-slate-100 p-5 rounded-3xl text-slate-600"><User size={40}/></div>
                 <div>
                    <p className="text-[1.4vh] font-black text-slate-400 uppercase tracking-widest mb-1">Дежурни наставник</p>
                    <p className="text-[3vh] font-black text-slate-800 uppercase italic leading-tight">{data.duty?.teacher_name || '---'}</p>
                 </div>
              </div>
              <div className="flex items-center justify-end gap-6">
                 <div className="text-right">
                    <p className="text-[1.4vh] font-black text-slate-400 uppercase tracking-widest mb-1">Инфо за ученике</p>
                    <p className="text-[2.2vh] font-bold text-slate-500 uppercase tracking-tighter leading-tight">Скенирајте за распоред</p>
                 </div>
                 <div className="bg-white p-3 rounded-2xl border-4 border-slate-900 shadow-xl"><QrCode size={65} /></div>
              </div>
           </div>
        </div>

        {/* DESNO: SLAJDOVI */}
        <div className="w-[36%] flex flex-col gap-6">
          <div className="flex-1 bg-slate-900 rounded-[4rem] shadow-2xl p-14 flex flex-col justify-center relative overflow-hidden border-b-[12px] border-blue-700">
             {activeTab === 0 && (
               <div className="animate-in slide-in-from-right duration-700">
                  <div className="flex items-center gap-5 text-blue-400 mb-10"><Bell size={50}/><h3 className="font-black text-[3.5vh] uppercase italic">ОБАВЕШТЕЊЕ</h3></div>
                  {data.ann?.[0]?.image_url && <img src={data.ann[0].image_url} className="w-full h-72 object-cover rounded-[3rem] mb-8 border-4 border-white/10" />}
                  <p className="text-[4.2vh] font-black leading-tight text-white italic">"{data.ann?.[0]?.text || "Добродошли!"}"</p>
               </div>
             )}
             {activeTab === 1 && (
               <div className="animate-in zoom-in duration-700 text-center text-white">
                  <Sun size={180} className="mx-auto text-amber-400 mb-10 animate-pulse" />
                  <h3 className="text-[14vh] font-black leading-none tracking-tighter">24°C</h3>
                  <p className="text-blue-400 font-black text-[4vh] uppercase mt-4 tracking-[0.5rem]">БЕОГРАД</p>
               </div>
             )}
             {activeTab === 2 && (
               <div className="animate-in slide-in-from-bottom duration-700 text-white">
                  <div className="flex items-center gap-5 text-pink-500 mb-10"><Cake size={50}/><h3 className="font-black text-[3.5vh] uppercase italic">РОЂЕНДАНИ</h3></div>
                  <div className="space-y-6">
                     {data.bdays.slice(0, 3).map((b, i) => (
                       <div key={i} className="flex justify-between items-center bg-white/5 p-8 rounded-[2.5rem] border-l-8 border-pink-500 shadow-xl">
                          <span className="text-[3.8vh] font-black tracking-tighter uppercase">{b.name}</span>
                          <span className="bg-pink-500 px-8 py-2 rounded-2xl text-[2vh] font-black uppercase">{b.class_name}</span>
                       </div>
                     ))}
                  </div>
               </div>
             )}
             {activeTab === 3 && (
               <div className="animate-in fade-in duration-1000 text-center text-white">
                  <Quote size={100} className="mx-auto text-white/5 mb-10" />
                  <p className="text-[4.5vh] font-black italic text-white leading-tight">"{data.quotes[0]?.text || "Знање је моћ."}"</p>
                  <div className="w-24 h-3 bg-blue-600 mx-auto my-12 rounded-full" />
                  <p className="text-blue-400 font-black uppercase text-[3vh] tracking-[0.3em]">— {data.quotes[0]?.author || "Мудрост"}</p>
               </div>
             )}
             <div className="absolute bottom-0 left-0 h-4 bg-blue-600 animate-[progress_12s_linear_infinite]" />
          </div>
        </div>
      </div>

      {/* FOOTER: MARQUEE */}
      {status.breaking && (
        <div className="h-[9vh] bg-blue-700 rounded-[2.5rem] flex items-center overflow-hidden shadow-2xl border-4 border-blue-500">
           <div className="bg-white text-blue-800 px-14 h-full flex items-center font-black italic text-[3vh] z-10 shadow-2xl uppercase">ВЕСТИ</div>
           <div className="flex-1 whitespace-nowrap overflow-hidden">
              <p className="inline-block animate-marquee text-white text-[4vh] font-black uppercase italic tracking-widest">
                 {status.breaking} &nbsp;&nbsp;&nbsp; ★ &nbsp;&nbsp;&nbsp; {status.breaking} &nbsp;&nbsp;&nbsp; ★ &nbsp;&nbsp;&nbsp; {status.breaking}
              </p>
           </div>
        </div>
      )}

      <style jsx>{`
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: inline-block; animation: marquee 25s linear infinite; }
      `}</style>
    </div>
  );
}