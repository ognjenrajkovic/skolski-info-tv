'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Bell, Cake, Quote, MapPin, User, AlertTriangle } from 'lucide-react';

export default function TVPage() {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], duty: {}, sys: [], quotes: [] });
  const [slide, setSlide] = useState(0);

  // Učitavanje podataka uz proveru grešaka
  const loadData = async () => {
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
        duty: dt.data || { teacher_name: 'Није унето' },
        sys: sys.data || [],
        quotes: qt.data || []
      });
    } catch (e) { console.error("Greška u bazi:", e); }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setNow(new Date()), 1000); // Sat
    const refresher = setInterval(loadData, 30000); // Osvežavanje podataka
    const slider = setInterval(() => setSlide(prev => (prev + 1) % 4), 10000); // Slajdovi

    return () => { clearInterval(timer); clearInterval(refresher); clearInterval(slider); };
  }, []);

  // Logika za smene i časove
  const status = useMemo(() => {
    const mins = now.getHours() * 60 + now.getMinutes();
    
    // Prosta satnica (početak i kraj časa u minutima)
    const timetable = [
      { id: 1, s: 480, e: 525 }, // 08:00 - 08:45
      { id: 2, s: 530, e: 575 }, // 08:50 - 09:35
      { id: 3, s: 595, e: 640 }, // 09:55 - 10:40
      { id: 4, s: 645, e: 690 }, // 10:45 - 11:30
      { id: 5, s: 695, e: 740 }, // 11:35 - 12:20
      { id: 6, s: 745, e: 790 }, // 12:25 - 13:10
    ];

    const current = timetable.find(t => mins >= t.s && mins < t.e);
    const next = timetable.find(t => mins < t.s);
    
    // Računanje tajmera
    let target = 0;
    let label = "";
    
    if (current) {
      target = current.e * 60;
      label = "ДО КРАЈА ЧАСА";
    } else if (next) {
      target = next.s * 60;
      label = (next.id === 3) ? "ВЕЛИКИ ОДМОР" : "ОДМОР";
    } else {
      label = "КРАЈ НАСТАВЕ";
    }

    const diff = target - ((now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds());
    const timer = diff > 0 ? `${Math.floor(diff/60)}:${(diff%60).toString().padStart(2,'0')}` : "00:00";

    // Dan u nedelji
    const days = ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"];
    const today = days[now.getDay()];

    // Pronađi čas u bazi
    const activeClass = data.tt.find(t => t.day === today && t.period === (current ? current.id : (next ? next.id : 0)));
    
    // Provera za uzbunu i vesti
    const emergency = data.sys.find(s => s.key === 'emergency')?.value === 'true';
    const news = data.sys.find(s => s.key === 'breaking_news')?.value || '';

    return { timer, label, activeClass, emergency, news };
  }, [now, data]);

  // EKRAN ZA UZBUNU
  if (status.emergency) return (
    <div className="h-screen bg-red-600 flex flex-col items-center justify-center text-white z-50">
      <AlertTriangle size={200} className="animate-bounce mb-8"/>
      <h1 className="text-[15vw] font-black uppercase leading-none">УЗБУНА</h1>
      <p className="text-4xl mt-4 font-bold uppercase">Хитно напустите објекат</p>
    </div>
  );

  return (
    <div className="h-screen bg-slate-100 flex flex-col overflow-hidden font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="h-24 bg-white border-b-4 border-blue-600 flex items-center justify-between px-8 shadow z-10">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center font-black text-blue-600">Ш</div>
          <div>
            <h1 className="text-2xl font-black uppercase italic">Основна Школа</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Информациони систем</p>
          </div>
        </div>
        <div className="text-5xl font-black tabular-nums text-slate-800">
          {now.getHours()}:{now.getMinutes().toString().padStart(2,'0')}
        </div>
      </div>

      {/* GLAVNI SADRŽAJ (GRID) */}
      <div className="flex-1 p-6 grid grid-cols-3 gap-6">
        
        {/* LEVO: STATUS (2 Kolone) */}
        <div className="col-span-2 flex flex-col gap-6">
          <div className="flex-1 bg-white rounded-3xl shadow-sm border p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <p className="text-sm font-black uppercase text-slate-400 tracking-widest mb-4">{status.label}</p>
            <div className="text-[8rem] font-black leading-none mb-8 text-blue-600 tabular-nums">{status.timer}</div>
            
            {status.activeClass ? (
              <div className="w-full">
                <h2 className="text-5xl font-black uppercase mb-4 text-slate-800">{status.activeClass.class_name}</h2>
                <div className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-3 rounded-full text-2xl font-bold uppercase">
                  <MapPin size={24}/> {status.activeClass.room}
                </div>
              </div>
            ) : (
              <div className="opacity-30 text-4xl font-black uppercase">Нема наставе</div>
            )}
          </div>

          <div className="h-24 bg-blue-600 rounded-2xl text-white flex items-center px-8 shadow-lg">
             <div className="bg-white/20 p-3 rounded-full mr-4"><User/></div>
             <div>
               <p className="text-xs uppercase font-bold opacity-70">Дежурни наставник</p>
               <p className="text-2xl font-black uppercase">{data.duty?.teacher_name || 'Непознат'}</p>
             </div>
          </div>
        </div>

        {/* DESNO: SLAJDOVI (1 Kolona) */}
        <div className="col-span-1 bg-slate-800 rounded-3xl p-8 text-white relative flex flex-col justify-center text-center shadow-xl border-t-8 border-slate-600">
          {slide === 0 && (
            <div className="animate-pulse">
              <Bell className="mx-auto mb-6 w-16 h-16 text-yellow-400"/>
              <h3 className="text-xl font-bold uppercase text-slate-400 mb-4">Обавештење</h3>
              <p className="text-2xl font-bold leading-tight">"{data.ann[0]?.text || 'Добродошли'}"</p>
            </div>
          )}
          {slide === 1 && (
            <div>
              <Cake className="mx-auto mb-6 w-16 h-16 text-pink-400"/>
              <h3 className="text-xl font-bold uppercase text-pink-200 mb-4">Рођендани</h3>
              {data.bdays.length > 0 ? data.bdays.slice(0,3).map((b,i) => (
                <div key={i} className="bg-white/10 p-2 mb-2 rounded font-bold uppercase">{b.name}</div>
              )) : <p>Нема рођендана</p>}
            </div>
          )}
          {slide === 2 && (
            <div>
              <Quote className="mx-auto mb-6 w-16 h-16 text-blue-300"/>
              <p className="text-xl italic mb-4">"{data.quotes[0]?.text}"</p>
              <p className="font-bold uppercase text-sm opacity-60">- {data.quotes[0]?.author}</p>
            </div>
          )}
          {slide === 3 && (
            <div>
               <Clock className="mx-auto mb-6 w-16 h-16 text-emerald-400"/>
               <p className="text-2xl font-black">{now.getDate()}. {now.toLocaleString('default', { month: 'long' })}</p>
               <p className="text-lg opacity-50 uppercase">{now.getFullYear()}</p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER: VESTI */}
      {status.news && (
        <div className="bg-yellow-400 text-yellow-900 py-3 px-4 font-black text-xl uppercase overflow-hidden whitespace-nowrap flex items-center shadow-inner">
          <span className="bg-yellow-600 text-white px-3 py-1 rounded mr-4 text-sm">ВЕСТИ</span>
          <marquee scrollamount="10">{status.news}  *** {status.news}  *** {status.news}</marquee>
        </div>
      )}
    </div>
  );
}