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
    const [ann, bdays, tt, duty, quotes, sys] = await Promise.all([
      supabase.from('announcements').select('*'),
      supabase.from('birthdays').select('*'),
      supabase.from('timetable').select('*'),
      supabase.from('duty_staff').select('*').single(),
      supabase.from('quotes').select('*'),
      supabase.from('system_settings').select('*')
    ]);
    setData({ ann: ann.data || [], bdays: bdays.data || [], tt: tt.data || [], duty: duty.data, quotes: quotes.data || [], sys: sys.data || [] });
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setNow(new Date()), 1000);
    const rotation = setInterval(() => setActiveTab(prev => (prev + 1) % 4), 10000);
    return () => { clearInterval(timer); clearInterval(rotation); };
  }, []);

  // MUZIKA
  useEffect(() => {
    const isPlaying = data.sys?.find(s => s.key === 'music_active')?.value === 'true';
    if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(() => {});
      else audioRef.current.pause();
    }
  }, [data.sys]);

  const status = useMemo(() => {
    const h = now.getHours(); const m = now.getMinutes();
    const totalMin = h * 60 + m;
    const isMorning = totalMin < (14 * 60);
    const days = ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"];
    const currentDay = days[now.getDay()];
    const shiftSetting = data.sys?.find(s => s.key === 'current_morning_shift')?.value || 'Parna';
    const activeShift = isMorning ? shiftSetting : (shiftSetting === 'Parna' ? 'Neparna' : 'Parna');
    
    // Satnica (samo uprošćeno za primer, koristi tvoju punu listu)
    const bell = [{ n: 1, s: 480, e: 525 }, { n: 2, s: 530, e: 575 }, { n: 3, s: 600, e: 645 }]; 
    const current = bell.find(b => totalMin >= b.s && totalMin < b.e);
    const activeClass = data.tt?.find(t => t.day === currentDay && t.shift === activeShift && t.period === (current ? current.n : 1));

    return { activeClass, isBreak: !current, emergency: data.sys?.find(s => s.key === 'emergency')?.value, breaking: data.sys?.find(s => s.key === 'breaking_news')?.value };
  }, [now, data]);

  if (status.emergency === 'УЗБУНА') return <div className="h-screen w-screen bg-red-600 text-white flex items-center justify-center text-[15vh] font-black">УЗБУНА!</div>;

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col p-6 gap-6 overflow-hidden font-sans text-slate-900">
      <audio ref={audioRef} src={data.sys?.find(s => s.key === 'bg_music_url')?.value} loop />

      {/* HEADER (15% visine) */}
      <div className="h-[15vh] bg-white rounded-[3rem] shadow-xl flex items-center justify-between px-12 border border-slate-100">
        <h1 className="text-[5vh] font-black italic uppercase tracking-tighter">ОШ „КАРАЂОРЂЕ”</h1>
        <div className="text-[8vh] font-black tabular-nums">{now.getHours()}:{now.getMinutes().toString().padStart(2, '0')}</div>
      </div>

      {/* MAIN (75% visine) */}
      <div className="h-[75vh] flex gap-6">
        {/* LEVO: FOKUS NA ČAS */}
        <div className="flex-1 bg-white rounded-[4rem] shadow-2xl flex flex-col items-center justify-center border border-slate-100 relative">
          <div className="absolute top-10 text-slate-400 font-black uppercase tracking-widest">Тренутни статус</div>
          {status.activeClass ? (
            <div className="text-center">
              <div className="text-[18vh] font-black leading-none text-slate-900">{status.activeClass.class_name}</div>
              <div className="text-[8vh] font-black text-blue-600 mt-4 bg-blue-50 px-10 py-2 rounded-3xl inline-block uppercase italic">{status.activeClass.room}</div>
            </div>
          ) : (
            <div className="text-4xl font-black text-slate-300 italic uppercase">Одмор / Нема наставе</div>
          )}
        </div>

        {/* DESNO: SLAJDOVI (35% širine) */}
        <div className="w-[35%] bg-slate-900 rounded-[4rem] p-10 text-white flex flex-col justify-center relative shadow-2xl">
          {activeTab === 0 && <div className="animate-in fade-in">
            <h3 className="text-orange-400 text-2xl font-black uppercase mb-6 flex items-center gap-2"><Bell/> Важно</h3>
            <p className="text-[4vh] font-bold leading-tight italic">{data.ann?.[0]?.text || "Нема нових обавештења."}</p>
          </div>}
          {activeTab === 1 && <div className="text-center animate-in zoom-in">
            <Sun size={100} className="mx-auto text-amber-400 mb-6" />
            <div className="text-[10vh] font-black">24°C</div>
            <p className="text-2xl font-bold uppercase tracking-widest">Београд</p>
          </div>}
          <div className="absolute bottom-0 left-0 h-2 bg-blue-600 w-full animate-pulse" />
        </div>
      </div>

      {/* FOOTER (10% visine ako ima Breaking News) */}
      {status.breaking && (
        <div className="h-[8vh] bg-blue-600 rounded-[2rem] flex items-center overflow-hidden shadow-lg">
          <div className="bg-white text-blue-600 px-6 font-black h-full flex items-center text-xl italic z-10">ВЕСТИ</div>
          <div className="flex-1 whitespace-nowrap animate-marquee text-white text-3xl font-bold italic uppercase">
            {status.breaking} &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; {status.breaking}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: inline-block; animation: marquee 15s linear infinite; }
      `}</style>
    </div>
  );
}