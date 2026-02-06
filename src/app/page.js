'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, AlertTriangle, CloudSun, Quote, Bell, Lightbulb, GraduationCap } from 'lucide-react';

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState({ ann: [], tt: [], duty: { teacher_name: '---' }, sys: [], bells: [] });
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [weather, setWeather] = useState({ temp: '--', desc: 'Учитавање...' });

  const loadData = async () => {
    try {
      const { data: ann } = await supabase.from('announcements').select('*');
      const { data: tt } = await supabase.from('timetable').select('*');
      const { data: dt } = await supabase.from('duty_staff').select('*').single();
      const { data: sys } = await supabase.from('system_settings').select('*');
      const { data: bl } = await supabase.from('bell_schedule').select('*').order('cas');
      setData({ 
        ann: ann || [], 
        tt: tt || [], 
        duty: dt || { teacher_name: 'Није унето' }, 
        sys: sys || [], 
        bells: bl || [] 
      });
    } catch (e) {
      console.error("Greška pri učitavanju:", e);
    }
  };

  useEffect(() => {
    loadData();
    const channel = supabase.channel('tv-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => loadData())
      .subscribe();

    const t = setInterval(() => setNow(new Date()), 1000);
    const m = setInterval(() => setActiveModuleIndex(prev => prev + 1), 10000);
    
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=44.77&longitude=20.48&current_weather=true`);
        const wData = await res.json();
        setWeather({ temp: Math.round(wData.current_weather.temperature), desc: 'Београд' });
      } catch (e) { console.error(e); }
    };
    fetchWeather();

    return () => { 
      clearInterval(t); clearInterval(m); 
      supabase.removeChannel(channel);
    };
  }, []);

  const info = useMemo(() => {
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil((((now - firstDay) / 86400000) + firstDay.getDay() + 1) / 7);
    const tipNedelje = weekNum % 2 === 0 ? 'parna' : 'neparna';
    const dobaDanas = now.getHours() < 14 ? 'prepodne' : 'popodne';
    
    const mins = now.getHours() * 60 + now.getMinutes();
    const tekuci = data.bells.find(r => mins >= r.pocetak && mins < r.kraj);
    const sledeci = data.bells.find(r => mins < r.pocetak);
    
    let label = "КРАЈ СМЕНЕ";
    let preostalo = "00:00";
    let aktuelniCas = tekuci ? tekuci.c : (sledeci ? sledeci.c : 1);

    if (tekuci) {
      label = "ДО КРАЈА ЧАСА";
      const totalSecondsEnd = tekuci.kraj * 60;
      const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const diff = totalSecondsEnd - currentSeconds;
      preostalo = `${Math.floor(diff / 60)}:${(diff % 60).toString().padStart(2, '0')}`;
    } else if (sledeci) {
      label = "ДО ПОЧЕТКА ЧАСА";
      const totalSecondsStart = sledeci.pocetak * 60;
      const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const diff = totalSecondsStart - currentSeconds;
      preostalo = `${Math.floor(diff / 60)}:${(diff % 60).toString().padStart(2, '0')}`;
    }

    const mojiRazredi = tipNedelje === 'parna' ? [6, 8] : [5, 7];
    const aktRazred = mojiRazredi[Math.floor(now.getSeconds() / 10) % 2];
    const filtriran = data.tt.filter(t => t.smena === tipNedelje && t.doba_dana === dobaDanas && t.cas === aktuelniCas && t.razred === aktRazred);

    const moduli = [
      { id: 'vreme', label: 'ВРЕМЕНСКА ПРОГНОЗА' },
      { id: 'vesti', label: 'ВЕСТИ' },
      { id: 'rodjendani', label: 'РОЂЕНДАНИ' },
      { id: 'misao_dana', label: 'МИСАО ДАНА' }
    ].filter(m => data.sys.find(s => s.key === `show_${m.id}`)?.value === 'true');

    return { 
      tipNedelje, dobaDanas, aktuelniCas, label, preostalo, aktRazred, filtriran,
      aktivniModul: moduli[activeModuleIndex % moduli.length],
      emergency: data.sys.find(s => s.key === 'emergency')?.value === 'true'
    };
  }, [now, data, activeModuleIndex]);

  if (info.emergency) return (
    <div className="h-screen bg-red-600 flex flex-col items-center justify-center text-white p-20 text-center animate-pulse">
      <AlertTriangle size={200} className="mb-10" />
      <h1 className="text-[12vw] font-black leading-none uppercase italic">УЗБУНА</h1>
      <p className="text-5xl font-bold uppercase mt-10">Хитно напустите објекат!</p>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden italic">
      
      {/* HEADER */}
      <div className="h-[12vh] bg-white border-b-8 border-blue-600 flex items-center justify-between px-10 shadow-xl relative z-20">
        <div className="flex items-center gap-6">
          <img src="/logo.png" className="h-14 object-contain" alt="Logo" />
          <div>
            <h1 className="text-4xl font-black text-blue-900 uppercase leading-none tracking-tighter">ОШ „Карађорђе”</h1>
            <div className="flex gap-3 mt-1">
              <span className="bg-blue-600 text-white px-3 py-0.5 rounded-lg text-xs font-black uppercase">
                {info.dobaDanas === 'prepodne' ? 'ПРЕ ПОДНЕ' : 'ПО ПОДНЕ'}
              </span>
              <span className="bg-slate-100 text-slate-500 px-3 py-0.5 rounded-lg text-xs font-black uppercase tracking-widest">
                {info.tipNedelje} НЕДЕЉА
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-10">
           <div className="text-right border-r-4 border-slate-100 pr-10">
              <div className="text-7xl font-black tabular-nums leading-none text-slate-900">{now.getHours()}:{now.getMinutes().toString().padStart(2,'0')}</div>
              <p className="text-lg font-bold text-blue-600 uppercase tracking-widest">{now.toLocaleDateString('sr-RS', { weekday: 'long' })}</p>
           </div>
           <div className="bg-orange-500 text-white px-6 py-3 rounded-2xl flex flex-col items-center shadow-lg">
              <CloudSun size={32} />
              <span className="text-2xl font-black">{weather.temp}°C</span>
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 p-8">
        
        {/* LEVO: TAJMER + RASPORED */}
        <div className="col-span-8 flex flex-col gap-6">
          <div className="bg-blue-600 rounded-[3rem] p-8 flex items-center justify-between shadow-2xl text-white">
            <div>
              <span className="text-3xl font-black opacity-70 block uppercase mb-1">{info.label}</span>
              <span className="text-[9rem] font-black tabular-nums leading-none tracking-tighter drop-shadow-lg">{info.preostalo}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/20 text-center min-w-[180px]">
               <p className="text-xl font-black uppercase opacity-60">ЧАС</p>
               <p className="text-8xl font-black">{info.aktuelniCas}.</p>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[4rem] p-12 shadow-2xl border-2 border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-10 border-b-4 border-slate-50 pb-6">
               <h2 className="text-9xl font-black text-slate-900 uppercase italic leading-none">
                 {info.aktRazred}. <span className="text-blue-600">РАЗРЕД</span>
               </h2>
               <div className="flex items-center gap-3 bg-blue-50 px-5 py-2 rounded-full">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-ping"></div>
                  <span className="text-sm font-black text-blue-600 uppercase tracking-widest">Уживо</span>
               </div>
            </div>
            <div className="flex flex-col gap-5">
               {info.filtriran.length > 0 ? info.filtriran.map((r, i) => (
                 <div key={i} className="flex justify-between items-center bg-slate-50 p-10 rounded-[2.5rem] border-2 border-slate-100 shadow-sm transition-all hover:scale-[1.01]">
                    <span className="text-8xl font-black text-slate-900">{r.razred}-{r.odeljenje}</span>
                    <span className="text-6xl font-black text-blue-600 uppercase italic tracking-tighter">{r.predmet}</span>
                    <span className="text-7xl font-black bg-slate-900 text-white px-12 py-5 rounded-[2rem] shadow-xl">{r.kabinet}</span>
                 </div>
               )) : (
                 <div className="m-auto text-center opacity-20 italic">
                    <Clock size={80} className="mx-auto mb-4" />
                    <p className="text-4xl font-black uppercase">Чекање на почетак часа...</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* DESNO: MODULI */}
        <div className="col-span-4 flex flex-col gap-8">
           <div className="flex-1 bg-white border-[6px] border-blue-600 rounded-[4rem] p-10 shadow-2xl flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-4 text-blue-600 mb-8 border-b-2 border-slate-50 pb-4">
                 <h3 className="text-2xl font-black uppercase italic tracking-widest">{info.aktivniModul?.label || 'ИНФОРМАЦИЈЕ'}</h3>
              </div>
              
              <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
                 {info.aktivniModul?.id === 'vreme' && (
                    <div className="animate-in fade-in zoom-in duration-500">
                       <CloudSun size={150} className="text-blue-100 absolute -top-10 -right-10" />
                       <p className="text-[10rem] font-black text-slate-900 leading-none">{weather.temp}°C</p>
                       <p className="text-3xl font-bold text-slate-400 uppercase mt-4">Београд, Вождовац</p>
                    </div>
                 )}
                 
                 {info.aktivniModul?.id === 'vesti' && (
                    <div className="animate-in slide-in-from-bottom-10 duration-500">
                       <p className="text-5xl font-black text-slate-800 uppercase leading-tight italic">
                          {data.ann.find(a => a.tip === 'VEST')?.sadrzaj || 'Нема нових вести'}
                       </p>
                    </div>
                 )}

                 {info.aktivniModul?.id === 'rodjendani' && (
                    <div className="animate-in zoom-in duration-500">
                       <p className="text-[8rem] mb-4">🎂</p>
                       <p className="text-4xl font-black text-pink-600 uppercase italic">
                          {data.ann.find(a => a.tip === 'RODJENDAN')?.sadrzaj || 'Данас нема рођендана'}
                       </p>
                    </div>
                 )}

                 {info.aktivniModul?.id === 'misao_dana' && (
                    <div className="animate-in fade-in duration-500 space-y-6">
                       <Quote size={80} className="text-blue-50 mx-auto" />
                       <p className="text-4xl font-bold italic text-slate-800 leading-snug">
                          „{data.ann.find(a => a.tip === 'CITAT')?.sadrzaj || 'Срећно учење!'}“
                       </p>
                       <p className="text-2xl font-black text-blue-600 uppercase tracking-widest">
                          — {data.ann.find(a => a.tip === 'CITAT')?.autor || 'Анониман'}
                       </p>
                    </div>
                 )}
              </div>

              <div className="mt-auto bg-slate-900 text-white p-6 rounded-[2.5rem] text-center border-b-8 border-blue-500 shadow-lg">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2">Дежурни наставник</p>
                 <p className="text-3xl font-black uppercase italic italic">{data.duty.teacher_name}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}