'use client'
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Bell, Quote, Cake, AlertTriangle, Sun, 
  BookOpen, User, Users, Clock, QrCode, Music, Volume2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SCHOOL_NAME = "ОШ „КАРАЂОРЂЕ”";

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], duty: null, quotes: [], sys: [] });
  const [activeTab, setActiveTab] = useState(0);
  const audioRef = useRef(null);

  const fetchData = async () => {
    try {
      const [ann, bdays, tt, duty, quotes, sys] = await Promise.all([
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('birthdays').select('*'),
        supabase.from('timetable').select('*').order('period', { ascending: true }),
        supabase.from('duty_staff').select('*').single(),
        supabase.from('quotes').select('*'),
        supabase.from('system_settings').select('*')
      ]);
      setData({ ann: ann.data || [], bdays: bdays.data || [], tt: tt.data || [], duty: duty.data, quotes: quotes.data || [], sys: sys.data || [] });
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(interval); clearInterval(timer); };
  }, []);

  // MUZIKA LOGIKA
  useEffect(() => {
    const musicUrl = data.sys?.find(s => s.key === 'bg_music_url')?.value;
    const isPlaying = data.sys?.find(s => s.key === 'music_active')?.value === 'true';
    if (audioRef.current) {
      if (isPlaying && musicUrl) {
        audioRef.current.src = musicUrl;
        audioRef.current.play().catch(e => console.log("Autoplay blocked"));
      } else {
        audioRef.current.pause();
      }
    }
  }, [data.sys]);

  const status = useMemo(() => {
    const hour = now.getHours();
    const min = now.getMinutes();
    const sec = now.getSeconds();
    const currentTotalSec = (hour * 60 + min) * 60 + sec;
    
    const isMorning = (hour * 60 + min) < (14 * 60); 
    const morningShiftSetting = data.sys?.find(s => s.key === 'current_morning_shift')?.value || 'Parna';
    const activeShift = isMorning ? morningShiftSetting : (morningShiftSetting === 'Parna' ? 'Neparna' : 'Parna');
    const days = ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"];
    const currentDay = days[now.getDay()];

    const bellSchedule = [
      { num: 1, start: "08:00", end: "08:45" }, { num: 2, start: "08:50", end: "09:35" },
      { num: 3, start: "10:00", end: "10:45" }, { num: 4, start: "10:50", end: "11:35" },
      { num: 5, start: "11:40", end: "12:25" }, { num: 6, start: "12:30", end: "13:15" },
      { num: 7, start: "13:15", end: "14:00" },
      { num: 1, start: "14:00", end: "14:45" }, { num: 2, start: "14:50", end: "15:35" },
      { num: 3, start: "16:00", end: "16:45" }, { num: 4, start: "16:50", end: "17:35" },
      { num: 5, start: "17:40", end: "18:25" }, { num: 6, start: "18:30", end: "19:15" },
      { num: 7, start: "19:15", end: "20:00" }
    ];

    let currentSlot = null;
    let nextSlot = null;
    let countdown = "";
    let isBreak = true;

    for (let i = 0; i < bellSchedule.length; i++) {
      const [sh, sm] = bellSchedule[i].start.split(':').map(Number);
      const [eh, em] = bellSchedule[i].end.split(':').map(Number);
      const startSec = (sh * 60 + sm) * 60;
      const endSec = (eh * 60 + em) * 60;

      if (currentTotalSec >= startSec && currentTotalSec < endSec) {
        currentSlot = bellSchedule[i];
        isBreak = false;
        const diff = endSec - currentTotalSec;
        countdown = `${Math.floor(diff / 60)}:${(diff % 60).toString().padStart(2, '0')}`;
        break;
      }
      
      if (currentTotalSec < startSec) {
        nextSlot = bellSchedule[i];
        const diff = startSec - currentTotalSec;
        countdown = `${Math.floor(diff / 60)}:${(diff % 60).toString().padStart(2, '0')}`;
        break;
      }
    }

    const tt = data.tt?.filter(t => t.day === currentDay && t.shift === activeShift && t.time_of_day === (isMorning ? "Pre podne" : "Posle podne")) || [];
    const activeClass = tt.find(t => t.period === (currentSlot ? currentSlot.num : nextSlot?.num));

    return { 
      currentSlot, nextSlot, isBreak, countdown, activeClass,
      dobaDana: isMorning ? "ПРЕ ПОДНЕ" : "ПОСЛЕ ПОДНЕ", 
      currentDay, 
      emergency: data.sys?.find(s => s.key === 'emergency')?.value,
      breaking: data.sys?.find(s => s.key === 'breaking_news')?.value
    };
  }, [now, data]);

  useEffect(() => {
    const rotation = setInterval(() => setActiveTab(prev => (prev + 1) % 4), 15000);
    return () => clearInterval(rotation);
  }, []);

  if (status.emergency === "УЗБУНА") {
    return (
      <div className="h-screen w-screen bg-red-600 flex flex-col items-center justify-center text-white">
        <AlertTriangle size={300} className="animate-bounce mb-8" />
        <h1 className="text-[18vh] font-black uppercase">УЗБУНА</h1>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#f8fafc] text-slate-900 p-6 flex flex-col gap-6 overflow-hidden font-sans">
      <audio ref={audioRef} loop />

      {/* HEADER */}
      <div className="h-[12vh] flex items-center justify-between px-10 bg-white rounded-[3rem] shadow-xl border border-slate-100">
        <div className="flex items-center gap-8">
          <img src="/logo.png" className="h-20 w-20 object-contain" alt="Logo" />
          <div>
            <h1 className="text-[4.5vh] font-black tracking-tighter uppercase italic leading-none">{SCHOOL_NAME}</h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="bg-slate-900 text-white px-4 py-1 rounded-xl text-[1.6vh] font-black">{status.dobaDana}</span>
              <span className="text-slate-400 text-[1.8vh] font-bold uppercase">{status.currentDay}</span>
            </div>
          </div>
        </div>
        
        {/* COUNTDOWN CIRCLE */}
        <div className="flex items-center gap-6 bg-blue-50 px-8 py-3 rounded-full border border-blue-100 shadow-inner">
           <Clock className="text-blue-600 animate-pulse" size={40} />
           <div className="text-left">
              <p className="text-[1.2vh] font-black text-blue-400 uppercase leading-none">{status.isBreak ? 'До почетка часа' : 'До краја часа'}</p>
              <p className="text-[5vh] font-black tabular-nums leading-none text-blue-600">{status.countdown}</p>
           </div>
        </div>

        <div className="text-[7vh] font-black tracking-tighter text-slate-900">
          {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* LEVO: FOCUS MOD (SAMO JEDAN ČAS) */}
        <div className="w-[62%] bg-white rounded-[4rem] p-12 flex flex-col justify-center items-center shadow-2xl border border-slate-100 relative overflow-hidden">
          
          <div className="absolute top-10 left-12 flex items-center gap-3">
             <div className={`w-4 h-4 rounded-full ${status.isBreak ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-bounce'}`} />
             <span className="font-black uppercase tracking-widest text-slate-400 text-sm">
               {status.isBreak ? 'Велики одмор' : `${status.currentSlot?.num}. час у току`}
             </span>
          </div>

          <div className="text-center space-y-8">
             <div className="text-[4vh] font-black text-blue-600 uppercase tracking-[0.5rem] opacity-50 italic">
               {status.isBreak ? 'Следећи час' : 'Тренутно у кабинетима'}
             </div>
             
             {status.activeClass ? (
               <>
                 <h2 className="text-[18vh] font-black text-slate-900 leading-none tracking-tighter uppercase italic">
                   {status.activeClass.class_name}
                 </h2>
                 <div className="flex items-center justify-center gap-6">
                    <div className="h-[2px] w-20 bg-slate-200" />
                    <span className="text-[8vh] font-black text-blue-600 bg-blue-50 px-12 py-4 rounded-[3rem] shadow-sm border border-blue-100">
                      {status.activeClass.room}
                    </span>
                    <div className="h-[2px] w-20 bg-slate-200" />
                 </div>
               </>
             ) : (
               <div className="flex flex-col items-center opacity-20">
                  <BookOpen size={150} />
                  <p className="text-4xl font-black uppercase mt-6">Нема часова</p>
               </div>
             )}
          </div>

          <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t pt-10 border-slate-50">
             <div className="flex gap-10">
                <div className="flex items-center gap-4">
                  <User size={40} className="text-slate-300" />
                  <div>
                    <p className="text-[1.2vh] font-bold text-slate-400 uppercase tracking-widest">Дежурни наставник</p>
                    <p className="text-[2.8vh] font-black text-slate-700 uppercase italic">{data.duty?.teacher_name || '---'}</p>
                  </div>
                </div>
             </div>
             {/* QR KOD ZA UČENIKE */}
             <div className="flex flex-col items-center bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm">
                <QrCode size={60} className="text-slate-800" />
                <p className="text-[1vh] font-black uppercase mt-2 text-slate-400">Скенирај за сајт</p>
             </div>
          </div>
        </div>

        {/* DESNO: SLAJDOVI */}
        <div className="w-[38%] flex flex-col gap-6">
          <div className="flex-1 bg-slate-900 rounded-[4rem] relative overflow-hidden p-12 flex flex-col justify-center shadow-2xl">
            {activeTab === 0 && (
              <div className="animate-in slide-in-from-right duration-500">
                <div className="flex items-center gap-6 mb-10 text-orange-400"><Bell size={50} /><h3 className="font-black text-[3.5vh] uppercase italic tracking-widest">Обавештење</h3></div>
                {data.ann?.[0]?.image_url && <img src={data.ann[0].image_url} className="w-full h-64 object-cover rounded-[2.5rem] mb-8 border-4 border-white/5" />}
                <p className="text-[4vh] font-black leading-tight text-white italic">"{data.ann?.[0]?.text || "Мислите на будућност!"}"</p>
              </div>
            )}
            {activeTab === 1 && (
              <div className="animate-in zoom-in duration-500 flex flex-col items-center text-center text-white">
                 <Sun size={150} className="text-amber-400 mb-8" />
                 <h3 className="text-[13vh] font-black leading-none tracking-tighter">24°C</h3>
                 <p className="text-amber-400 font-black text-[3.5vh] uppercase mt-4 tracking-[0.5rem]">Београд</p>
              </div>
            )}
            {activeTab === 2 && (
              <div className="animate-in slide-in-from-bottom duration-500 text-white">
                <div className="flex items-center gap-6 mb-10 text-pink-400"><Cake size={50} /><h3 className="font-black text-[3.5vh] uppercase italic">Срећан рођендан!</h3></div>
                <div className="space-y-6">
                  {data.bdays.slice(0, 3).map((b, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 p-8 rounded-[3rem] border border-white/5 shadow-inner">
                      <span className="text-[4vh] font-black tracking-tighter">{b.name}</span>
                      <span className="bg-pink-500 text-white px-10 py-2 rounded-2xl text-[2.2vh] font-black uppercase shadow-lg shadow-pink-900/50">{b.class_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 3 && (
              <div className="animate-in fade-in duration-1000 text-center text-white px-4">
                 <Quote size={100} className="text-white/10 mx-auto mb-10" />
                 <p className="text-[4.5vh] font-black italic leading-tight text-white">"{data.quotes[0]?.text || "Буди промена."}"</p>
                 <div className="w-24 h-2 bg-blue-500 mx-auto my-12 rounded-full" />
                 <p className="text-blue-400 font-black uppercase text-[2.8vh] tracking-widest">— {data.quotes[0]?.author || "Мудрост"}</p>
              </div>
            )}
            <div className="absolute bottom-0 left-0 h-3 bg-blue-500 animate-[progress_15s_linear_infinite]" />
          </div>
        </div>
      </div>

      {/* BREAKING NEWS BAR */}
      {status.breaking && (
        <div className="h-[7vh] bg-blue-600 rounded-[2rem] flex items-center overflow-hidden shadow-2xl border-2 border-blue-400">
           <div className="bg-white text-blue-600 h-full px-10 flex items-center font-black italic text-[2.5vh] z-10 shadow-xl uppercase tracking-tighter">ВАЖНО</div>
           <div className="flex-1 whitespace-nowrap">
              <p className="inline-block animate-[marquee_20s_linear_infinite] text-white text-[3vh] font-bold uppercase pl-[100%] italic tracking-wider">
                 {status.breaking} • {status.breaking} • {status.breaking}
              </p>
           </div>
        </div>
      )}

      <style jsx>{`
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
}