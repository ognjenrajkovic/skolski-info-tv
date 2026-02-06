'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, AlertTriangle, Info, MapPin } from 'lucide-react';

export default function SchoolDisplay() {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], duty: {}, sys: [], quotes: [] });
  const [slideIndex, setSlideIndex] = useState(0);

  // 1. DATA FETCHING
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
      setData({ 
        ann: ann.data || [], 
        bdays: bdays.data || [], 
        tt: tt.data || [], 
        duty: dt.data || {}, 
        sys: sys.data || [], 
        quotes: qt.data || [] 
      });
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
    const clockInterval = setInterval(() => setNow(new Date()), 1000);
    const dataInterval = setInterval(fetchData, 30000); // Svakih 30s osvežava podatke
    const slideInterval = setInterval(() => setSlideIndex(prev => (prev + 1) % 4), 10000); // 10s slajd

    return () => { clearInterval(clockInterval); clearInterval(dataInterval); clearInterval(slideInterval); };
  }, []);

  // 2. LOGIKA SATNICE I STATUSA
  const status = useMemo(() => {
    const totalMinutes = (now.getHours() * 60) + now.getMinutes();
    
    // Fiksna satnica (Standardna srpska škola) - Prilagodi ako treba
    // Pretvaramo sve u minute od ponoći radi lakšeg računanja
    const shifts = {
      1: { s: 8*60, e: 8*60+45 },    // 1. čas: 08:00 - 08:45
      2: { s: 8*60+50, e: 9*60+35 }, // 2. čas: 08:50 - 09:35
      3: { s: 9*60+55, e: 10*60+40 },// 3. čas: 09:55 - 10:40 (Veliki odmor pre ovoga)
      4: { s: 10*60+45, e: 11*60+30 },
      5: { s: 11*60+35, e: 12*60+20 },
      6: { s: 12*60+25, e: 13*60+10 },
    };
    // Popodnevna smena (+6h recimo) - ovo je primer, prilagodi.

    let currentPeriod = null;
    let nextPeriod = null;
    let breakType = null; // 'mali', 'veliki', 'nema'

    // Prosta logika za primer (samo pre podne radi stabilnosti)
    Object.entries(shifts).forEach(([key, val]) => {
      if (totalMinutes >= val.s && totalMinutes < val.e) currentPeriod = parseInt(key);
    });

    // Ako nije čas, nađi sledeći
    if (!currentPeriod) {
      Object.entries(shifts).forEach(([key, val]) => {
        if (totalMinutes < val.s && !nextPeriod) nextPeriod = parseInt(key);
      });
    }

    // Tajmer logika
    let targetTime = 0;
    let label = '';
    
    if (currentPeriod) {
      targetTime = shifts[currentPeriod].e * 60; // u sekundama
      label = 'ДО КРАЈА ЧАСА';
    } else if (nextPeriod) {
      targetTime = shifts[nextPeriod].s * 60;
      label = (nextPeriod === 3) ? 'ВЕЛИКИ ОДМОР' : 'ОДМОР';
    } else {
      label = 'КРАЈ НАСТАВЕ';
    }

    const nowSec = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    const diff = targetTime - nowSec;
    const timer = diff > 0 ? `${Math.floor(diff/60)}:${(diff%60).toString().padStart(2,'0')}` : "00:00";

    // Nađi predmet iz baze
    const dayNames = ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"];
    const currentDay = dayNames[now.getDay()];
    
    // Tražimo u bazi čas koji odgovara trenutnom periodu
    const activeClass = data.tt.find(t => t.day === currentDay && t.period == (currentPeriod || nextPeriod));

    return {
      period: currentPeriod,
      next: nextPeriod,
      label,
      timer,
      activeClass,
      emergency: data.sys.find(s => s.key === 'emergency')?.value === 'true',
      news: data.sys.find(s => s.key === 'breaking_news')?.value
    };
  }, [now, data]);

  // 3. HITAN SLUČAJ (UZBUNA)
  if (status.emergency) return (
    <div className="h-screen w-screen bg-red-600 flex flex-col items-center justify-center text-white z-50 fixed inset-0">
      <AlertTriangle size={300} className="animate-bounce mb-10" />
      <h1 className="text-[20vh] font-black uppercase tracking-tighter leading-none">УЗБУНА</h1>
      <p className="text-5xl font-bold uppercase mt-8 animate-pulse">МОЛИМО НАПУСТИТЕ ОБЈЕКАТ</p>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-[#F0F4F8] flex flex-col font-sans text-slate-900 overflow-hidden">
      
      {/* HEADER (15%) - Bela traka */}
      <div className="h-[15vh] bg-white border-b-4 border-blue-600 flex items-center justify-between px-10 shadow-lg z-20">
        <div className="flex items-center gap-6">
          <img src="/logo.png" alt="Logo" className="h-24 w-auto" />
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-800">ОШ „КАРАЂОРЂЕ”</h1>
            <p className="text-blue-600 font-bold uppercase text-sm tracking-[0.4em]">ИНФОРМАТИВНИ СИСТЕМ</p>
          </div>
        </div>
        
        {/* Sat i Tajmer */}
        <div className="flex items-center gap-12">
           <div className="text-right">
             <p className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-widest">{status.label}</p>
             <p className={`text-6xl font-black tabular-nums ${status.period ? 'text-blue-600' : 'text-orange-500'}`}>{status.timer}</p>
           </div>
           <div className="h-16 w-1 bg-slate-200"></div>
           <div className="text-[5rem] font-black tabular-nums leading-none tracking-tight text-slate-900">
             {now.getHours()}:{now.getMinutes().toString().padStart(2, '0')}
           </div>
        </div>
      </div>

      {/* BODY (77%) - Grid Layout */}
      <div className="flex-1 grid grid-cols-12 p-8 gap-8">
        
        {/* LEVA STRANA (STATUS) - 8 Kolona */}
        <div className="col-span-8 flex flex-col gap-6">
           
           {/* Glavna kartica časa */}
           <div className="flex-1 bg-white rounded-[2rem] shadow-xl border border-white p-12 flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-4 bg-blue-600" />
              
              {status.activeClass ? (
                <>
                  <p className="text-2xl font-black uppercase text-slate-300 tracking-[0.5em] mb-8">
                    {status.period ? 'ТРЕНУТНО СЕ ОДРЖАВА' : 'СЛЕДЕЋИ ЧАС'}
                  </p>
                  <h2 className="text-[8rem] leading-[0.9] font-black uppercase text-slate-900 mb-8 italic tracking-tighter">
                    {status.activeClass.class_name}
                  </h2>
                  <div className="inline-block bg-slate-900 text-white text-5xl font-black px-12 py-6 rounded-full shadow-2xl">
                    <MapPin className="inline mr-4 mb-2" size={40}/>
                    {status.activeClass.room}
                  </div>
                </>
              ) : (
                <div className="opacity-20">
                  <p className="text-6xl font-black uppercase">НЕМА НАСТАВЕ</p>
                </div>
              )}
           </div>

           {/* Kartica Dežurstvo */}
           <div className="h-32 bg-blue-600 rounded-[1.5rem] shadow-xl flex items-center px-10 justify-between text-white">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-white/20 rounded-full"><User size={32} /></div>
                <div>
                   <p className="text-xs font-bold uppercase opacity-60 tracking-widest">ДЕЖУРНИ НАСТАВНИК</p>
                   <p className="text-3xl font-black uppercase">{data.duty.teacher_name || '---'}</p>
                </div>
              </div>
              <div className="text-right opacity-40">
                <p className="font-black text-sm">ШКОЛСКА<br/>ГОДИНА</p>
                <p className="text-2xl font-black">2023/24</p>
              </div>
           </div>
        </div>

        {/* DESNA STRANA (SLAJDOVI) - 4 Kolone */}
        <div className="col-span-4 bg-slate-800 rounded-[2rem] shadow-2xl p-10 text-white relative flex flex-col justify-center text-center border-b-[16px] border-slate-900">
           
           {slideIndex === 0 && (
             <div className="animate-in fade-in zoom-in duration-500">
               <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"><Bell size={40}/></div>
               <h3 className="text-xl font-bold uppercase text-blue-300 tracking-widest mb-6">ОБАВЕШТЕЊЕ</h3>
               <p className="text-3xl font-bold leading-snug">"{data.ann[0]?.text || "Добродошли!"}"</p>
             </div>
           )}

           {slideIndex === 1 && (
             <div className="animate-in slide-in-from-right duration-500">
               <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"><Cake size={40} className="text-pink-400"/></div>
               <h3 className="text-xl font-bold uppercase text-pink-300 tracking-widest mb-6">ДАНАС СЛАВЕ</h3>
               <div className="space-y-3">
                 {data.bdays.slice(0,4).map((b,i) => (
                   <div key={i} className="bg-white/5 p-3 rounded-lg font-bold uppercase border-l-4 border-pink-500 text-left">
                     {b.name} <span className="float-right text-pink-300">{b.class_name}</span>
                   </div>
                 ))}
                 {data.bdays.length === 0 && <p className="opacity-50 italic">Нема рођендана данас.</p>}
               </div>
             </div>
           )}

           {slideIndex === 2 && (
             <div className="animate-in fade-in duration-500">
               <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"><Quote size={40}/></div>
               <p className="text-2xl italic mb-6">"{data.quotes[0]?.text}"</p>
               <p className="font-black uppercase tracking-widest text-blue-400">- {data.quotes[0]?.author}</p>
             </div>
           )}

            {slideIndex === 3 && (
             <div className="animate-in fade-in duration-500">
               <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"><Info size={40} className="text-emerald-400"/></div>
               <h3 className="text-xl font-bold uppercase text-emerald-300 tracking-widest mb-6">ВАЖНИ ТЕЛЕФОНИ</h3>
               <ul className="text-xl font-bold space-y-4">
                 <li>Секретаријат: 011/123-456</li>
                 <li>Педагог: 011/123-457</li>
                 <li>Директор: 011/123-458</li>
               </ul>
             </div>
           )}
           
           {/* Indikatori slajda */}
           <div className="absolute bottom-8 left-0 w-full flex justify-center gap-2">
             {[0,1,2,3].map(i => (
               <div key={i} className={`h-2 rounded-full transition-all ${slideIndex === i ? 'w-8 bg-blue-500' : 'w-2 bg-slate-600'}`} />
             ))}
           </div>
        </div>
      </div>

      {/* FOOTER (8%) - Vesti */}
      {status.news && (
        <div className="h-[8vh] bg-amber-400 flex items-center overflow-hidden z-20">
           <div className="bg-amber-600 h-full px-10 flex items-center font-black text-white uppercase text-xl z-10 shadow-lg">ВЕСТИ</div>
           <div className="flex-1 whitespace-nowrap overflow-hidden flex items-center">
             <div className="animate-marquee inline-block text-2xl font-black uppercase text-slate-900">
               {status.news} &nbsp; • &nbsp; {status.news} &nbsp; • &nbsp; {status.news} &nbsp; • &nbsp; {status.news}
             </div>
           </div>
        </div>
      )}

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
}