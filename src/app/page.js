'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, AlertTriangle, CloudSun, Quote, Bell, Lightbulb, GraduationCap } from 'lucide-react';

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState({ ann: [], tt: [], duty: { teacher_name: 'Учитавање...' }, sys: [] });
  const [currentSlide, setCurrentSlide] = useState(0); 
  const [weather, setWeather] = useState({ temp: '--', desc: 'Учитавање...' });

  const loadData = async () => {
    try {
      const { data: ann } = await supabase.from('announcements').select('*');
      const { data: tt } = await supabase.from('timetable').select('*');
      const { data: dt } = await supabase.from('duty_staff').select('*').single();
      const { data: sys } = await supabase.from('system_settings').select('*');
      setData({ ann: ann || [], tt: tt || [], duty: dt || { teacher_name: 'Није унето' }, sys: sys || [] });
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadData();
    const t = setInterval(() => setNow(new Date()), 1000);
    const s = setInterval(() => setCurrentSlide(prev => prev + 1), 7000);
    return () => { clearInterval(t); clearInterval(s); };
  }, []);

  const info = useMemo(() => {
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil((((now - firstDay) / 86400000) + firstDay.getDay() + 1) / 7);
    const tipNedelje = weekNum % 2 === 0 ? 'parna' : 'neparna';
    const doba = now.getHours() < 14 ? 'prepodne' : 'popodne';
    
    // Logika koju si tražio: 6,8 su parni, 5,7 su neparni
    const mojiRazredi = tipNedelje === 'parna' ? [6, 8] : [5, 7];
    const aktRazred = mojiRazredi[currentSlide % mojiRazredi.length];

    // Tajmer logika
    const mins = now.getHours() * 60 + now.getMinutes();
    const rasporedSati = [
      { c: 1, s: 480, e: 525 }, { c: 2, s: 530, e: 575 }, { c: 3, s: 595, e: 640 },
      { c: 4, s: 645, e: 690 }, { c: 5, s: 695, e: 740 }, { c: 6, s: 745, e: 790 }, { c: 7, s: 795, e: 840 }
    ];
    const tekuci = rasporedSati.find(r => mins >= r.s && mins < r.e);
    const sledeci = rasporedSati.find(r => mins < r.s);
    
    let tajmerLabel = tekuci ? "ДО КРАЈА ЧАСА" : "ДО ПОЧЕТКА ЧАСА";
    let prikazujCas = tekuci ? tekuci.c : (sledeci ? sledeci.c : 1);
    
    const filtriran = data.tt.filter(t => t.smena === tipNedelje && t.doba_dana === doba && t.cas === prikazujCas && t.razred === aktRazred);

    return { tipNedelje, doba, prikazujCas, tajmerLabel, aktRazred, filtriran, 
             vesti: data.ann.filter(a => a.tip === 'VEST'),
             citati: data.ann.filter(a => a.tip === 'CITAT'),
             emergency: data.sys.find(s => s.key === 'emergency')?.value === 'true' };
  }, [now, data, currentSlide]);

  if (info.emergency) return <div className="h-screen bg-red-600 flex items-center justify-center text-white text-9xl font-black animate-pulse">УЗБУНА!</div>;

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">
      
      {/* HEADER SA LOGOOM */}
      <div className="h-[14vh] bg-white border-b-[10px] border-blue-600 flex items-center justify-between px-12 shadow-xl relative z-10">
        <div className="flex items-center gap-8">
          <div className="h-24 w-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl transform -rotate-3">
             <GraduationCap size={60} />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none text-slate-900">ОШ „Карађорђе”</h1>
            <p className="text-blue-600 font-black uppercase text-lg tracking-[0.4em] mt-1">Информациони систем</p>
          </div>
        </div>

        <div className="flex items-center gap-12">
           <div className="bg-slate-100 px-8 py-3 rounded-2xl border-2 border-slate-200 text-center">
              <p className="text-xs font-black text-slate-400 uppercase">Смена</p>
              <p className="text-3xl font-black text-blue-700 uppercase italic">{info.tipNedelje}</p>
           </div>
           <div className="text-right">
             <div className="text-8xl font-black tabular-nums leading-none tracking-tighter">{now.getHours()}:{now.getMinutes().toString().padStart(2,'0')}</div>
             <p className="text-xl font-bold text-slate-400 uppercase">{now.toLocaleDateString('sr-RS', { weekday: 'long' })}</p>
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-10 p-10">
        {/* LEVO: RASPORED */}
        <div className="col-span-8 flex flex-col gap-8">
          <div className="bg-slate-900 rounded-[3rem] p-8 flex items-center justify-between shadow-2xl border-b-8 border-blue-500 text-white">
            <span className="text-4xl font-black italic opacity-60">{info.tajmerLabel}</span>
            <div className="flex items-center gap-4">
               <Clock size={50} className="text-blue-400" />
               <span className="text-9xl font-black tabular-nums leading-none">00:00</span> 
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[4rem] p-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-2 border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-12 border-b-4 border-slate-50 pb-8">
               <h2 className="text-9xl font-black text-slate-900 italic uppercase">{info.aktRazred}. РАЗРЕД</h2>
               <div className="bg-blue-600 text-white px-10 py-5 rounded-full font-black text-5xl shadow-lg">
                 {info.prikazujCas}. ЧАС
               </div>
            </div>
            <div className="flex flex-col gap-6">
               {info.filtriran.length > 0 ? info.filtriran.map((r, i) => (
                 <div key={i} className="flex justify-between items-center bg-slate-50 p-10 rounded-[2.5rem] border-2 border-slate-100 hover:scale-[1.02] transition-transform">
                    <span className="text-8xl font-black text-slate-900">{r.razred}-{r.odeljenje}</span>
                    <span className="text-6xl font-black text-blue-600 uppercase italic">{r.predmet}</span>
                    <span className="text-7xl font-black bg-slate-900 text-white px-12 py-4 rounded-3xl">{r.kabinet}</span>
                 </div>
               )) : <div className="m-auto text-4xl font-black opacity-10 uppercase italic">Чекање на следећи час...</div>}
            </div>
          </div>
        </div>

        {/* DESNO: INFO */}
        <div className="col-span-4 flex flex-col gap-10">
           <div className="bg-white border-4 border-blue-600 rounded-[3rem] p-10 shadow-xl flex-1 flex flex-col">
              <div className="flex items-center gap-4 text-blue-600 mb-8">
                 <Bell size={40} strokeWidth={3} />
                 <h3 className="text-3xl font-black uppercase italic">Вести</h3>
              </div>
              <div className="flex-1 flex items-center justify-center text-center">
                 <p className="text-4xl font-black leading-tight text-slate-800 uppercase italic">
                   {info.vesti[currentSlide % info.vesti.length]?.sadrzaj || 'Нема нових вести'}
                 </p>
              </div>
           </div>

           <div className="bg-blue-600 rounded-[3rem] p-10 shadow-xl flex-1 flex flex-col text-white relative overflow-hidden">
              <Quote size={120} className="absolute -bottom-4 -right-4 opacity-20" />
              <div className="flex items-center gap-4 mb-8 text-blue-200">
                 <Lightbulb size={40} strokeWidth={3} />
                 <h3 className="text-3xl font-black uppercase italic text-white">Мисао дана</h3>
              </div>
              <div className="flex-1 flex items-center justify-center text-center italic text-4xl font-bold leading-snug">
                 „{info.citati[currentSlide % info.citati.length]?.sadrzaj || 'Срећно учење!'}“
              </div>
              <div className="mt-8 pt-8 border-t border-white/20 text-center">
                 <p className="text-xs font-black uppercase text-blue-200 tracking-widest mb-2">Дежурни наставник</p>
                 <p className="text-3xl font-black uppercase italic">{data.duty.teacher_name}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}