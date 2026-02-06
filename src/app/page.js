'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, AlertTriangle, CloudSun, Quote, Bell, Lightbulb, GraduationCap } from 'lucide-react';

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState({ ann: [], tt: [], duty: { teacher_name: '---' }, sys: [] });
  const [currentSlide, setCurrentSlide] = useState(0); 
  const [weather, setWeather] = useState({ temp: '--', desc: 'Учитавање...' });

  const loadData = async () => {
    const { data: ann } = await supabase.from('announcements').select('*');
    const { data: tt } = await supabase.from('timetable').select('*');
    const { data: dt } = await supabase.from('duty_staff').select('*').single();
    const { data: sys } = await supabase.from('system_settings').select('*');
    setData({ ann: ann || [], tt: tt || [], duty: dt || { teacher_name: 'Није унето' }, sys: sys || [] });
  };

  useEffect(() => {
    loadData();
    // REAL-TIME PRETPLATA: Sluša promene u system_settings (za uzbunu) i announcements
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', theme: 'public' }, () => loadData())
      .subscribe();

    const t = setInterval(() => setNow(new Date()), 1000);
    const s = setInterval(() => setCurrentSlide(prev => prev + 1), 8000);
    
    // Vremenska prognoza bez ključa (Open-Meteo)
    const fetchWeather = async () => {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=44.77&longitude=20.48&current_weather=true`);
      const wData = await res.json();
      setWeather({ temp: Math.round(wData.current_weather.temperature), desc: 'Вождовац' });
    };
    fetchWeather();

    return () => { 
      clearInterval(t); clearInterval(s); 
      supabase.removeChannel(channel);
    };
  }, []);

  const info = useMemo(() => {
    // 1. Logika Smene (Parna/Neparna za bazu)
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil((((now - firstDay) / 86400000) + firstDay.getDay() + 1) / 7);
    const tipNedelje = weekNum % 2 === 0 ? 'parna' : 'neparna';
    const dobaDanas = now.getHours() < 14 ? 'prepodne' : 'popodne';
    
    // 2. SATNICA ZVONA (Unesi ovde tačne minute tvoje škole)
    const mins = now.getHours() * 60 + now.getMinutes();
    const raspored = [
      { c: 1, s: 480, e: 525 },  // 08:00 - 08:45
      { c: 2, s: 530, e: 575 },  // 08:50 - 09:35
      { c: 3, s: 595, e: 640 },  // 09:55 - 10:40 (Veliki odmor primer)
      { c: 4, s: 645, e: 690 },  // 10:45 - 11:30
      { c: 5, s: 695, e: 740 },  // 11:35 - 12:20
      { c: 6, s: 745, e: 790 },  // 12:25 - 13:10
      { c: 7, s: 795, e: 840 }   // 13:15 - 14:00
    ];

    const tekuci = raspored.find(r => mins >= r.s && mins < r.e);
    const sledeci = raspored.find(r => mins < r.s);
    
    let label = "КРАЈ СМЕНЕ";
    let preostalo = "00:00";
    let aktuelniCas = tekuci ? tekuci.c : (sledeci ? sledeci.c : 1);

    if (tekuci) {
      label = "ДО КРАЈА ЧАСА";
      const diffSekunde = (tekuci.e * 60) - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
      preostalo = `${Math.floor(diffSekunde / 60)}:${(diffSekunde % 60).toString().padStart(2, '0')}`;
    } else if (sledeci) {
      label = "ДО ПОЧЕТКА ЧАСА";
      const diffSekunde = (sledeci.s * 60) - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
      preostalo = `${Math.floor(diffSekunde / 60)}:${(diffSekunde % 60).toString().padStart(2, '0')}`;
    }

    const mojiRazredi = tipNedelje === 'parna' ? [6, 8] : [5, 7];
    const aktRazred = mojiRazredi[currentSlide % mojiRazredi.length];
    const filtriran = data.tt.filter(t => t.smena === tipNedelje && t.doba_dana === dobaDanas && t.cas === aktuelniCas && t.razred === aktRazred);

    return { 
      tipNedelje, dobaDanas, aktuelniCas, label, preostalo, aktRazred, filtriran,
      emergency: data.sys.find(s => s.key === 'emergency')?.value === 'true',
      vesti: data.ann.filter(a => a.tip === 'VEST' || a.tip === 'RODJENDAN'),
      citati: data.ann.filter(a => a.tip === 'CITAT')
    };
  }, [now, data, currentSlide]);

  if (info.emergency) return (
    <div className="h-screen bg-red-600 flex flex-col items-center justify-center text-white p-20 text-center animate-[pulse_0.5s_infinite]">
      <AlertTriangle size={300} />
      <h1 className="text-[15vw] font-black leading-none">УЗБУНА</h1>
      <p className="text-6xl font-bold uppercase mt-10">Хитно напустите објекат!</p>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-blue-50 text-slate-900 flex flex-col font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="h-[14vh] bg-white border-b-8 border-blue-600 flex items-center justify-between px-12 shadow-2xl relative z-20">
        <div className="flex items-center gap-10">
          <img src="/logo.png" className="h-24 object-contain shadow-sm" alt="Logo" 
               onError={(e) => e.target.src = "https://via.placeholder.com/100?text=LOGO"} />
          <div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none text-blue-900">ОШ „Карађорђе”</h1>
            <div className="flex gap-4 mt-2">
              <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest">
                {info.dobaDanas === 'prepodne' ? 'Пре подне' : 'По подне'}
              </span>
              <span className="bg-slate-100 text-slate-500 px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest italic">
                {info.tipNedelje} недеља
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-12">
           <div className="text-right border-r-4 border-blue-50 pr-12">
             <div className="text-8xl font-black tabular-nums leading-none tracking-tighter text-slate-900">
                {now.getHours()}:{now.getMinutes().toString().padStart(2,'0')}
             </div>
             <p className="text-xl font-bold text-blue-600 uppercase tracking-[0.2em]">{now.toLocaleDateString('sr-RS', { weekday: 'long' })}</p>
           </div>
           <div className="bg-orange-500 text-white p-6 rounded-3xl shadow-lg flex flex-col items-center min-w-[140px]">
              <CloudSun size={40} />
              <span className="text-4xl font-black leading-none mt-2">{weather.temp}°C</span>
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-10 p-10 bg-gradient-to-br from-blue-50 to-white">
        
        {/* LEVO: TAJMER + RASPORED */}
        <div className="col-span-8 flex flex-col gap-8">
          
          {/* Tajmer Box - Glassmorphism */}
          <div className="bg-blue-600 rounded-[3rem] p-10 flex items-center justify-between shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10">
              <span className="text-4xl font-black italic opacity-80 block mb-2">{info.label}</span>
              <span className="text-[9rem] font-black tabular-nums leading-none tracking-tighter drop-shadow-lg">
                {info.preostalo}
              </span>
            </div>
            <div className="relative z-10 bg-white/20 backdrop-blur-md p-8 rounded-[2rem] border border-white/30 text-center min-w-[200px]">
               <p className="text-xl font-black uppercase opacity-80">Тренутно</p>
               <p className="text-7xl font-black">{info.aktuelniCas}. ЧАС</p>
            </div>
          </div>

          {/* Glavna Tabela */}
          <div className="flex-1 bg-white rounded-[4rem] p-12 shadow-[0_30px_60px_rgba(0,0,0,0.08)] border-2 border-blue-100 flex flex-col relative">
            <div className="flex justify-between items-center mb-10 border-b-8 border-blue-50 pb-8">
               <h2 className="text-9xl font-black text-blue-900 italic uppercase leading-none tracking-tighter">
                 {info.aktRazred}. <span className="text-slate-300">РАЗРЕД</span>
               </h2>
               <div className="flex items-center gap-4 bg-slate-100 px-6 py-3 rounded-2xl">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                  <span className="text-xl font-black text-slate-500 uppercase">Уживо</span>
               </div>
            </div>

            <div className="flex flex-col gap-6">
               {info.filtriran.length > 0 ? info.filtriran.map((r, i) => (
                 <div key={i} className="flex justify-between items-center bg-white p-10 rounded-[2.5rem] border-2 border-slate-50 shadow-sm hover:border-blue-300 transition-all">
                    <span className="text-[6rem] font-black text-slate-900 leading-none">{r.razred}-{r.odeljenje}</span>
                    <span className="text-6xl font-black text-blue-600 uppercase italic tracking-tighter">{r.predmet}</span>
                    <span className="text-7xl font-black bg-blue-900 text-white px-12 py-5 rounded-[2rem] shadow-xl">
                      {r.kabinet}
                    </span>
                 </div>
               )) : (
                 <div className="m-auto text-center py-20">
                    <Clock size={100} className="mx-auto text-slate-200 mb-6" />
                    <p className="text-5xl font-black text-slate-200 uppercase italic tracking-widest">Чекање на почетак часа...</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* DESNO: INFO TABLA */}
        <div className="col-span-4 flex flex-col gap-8">
           
           {/* Info / Vesti */}
           <div className="bg-white border-4 border-blue-600 rounded-[3rem] p-10 shadow-xl flex-1 flex flex-col relative">
              <div className="flex items-center gap-4 text-blue-600 mb-8 border-b-2 border-slate-50 pb-4">
                 <Bell size={40} strokeWidth={3} />
                 <h3 className="text-3xl font-black uppercase italic">Инфо Блок</h3>
              </div>
              <div className="flex-1 flex flex-col justify-center text-center">
                 {info.vesti.length > 0 ? (
                    <div key={currentSlide} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <p className="text-5xl font-black leading-[1.1] text-slate-900 uppercase italic">
                         {info.vesti[currentSlide % info.vesti.length].sadrzaj}
                       </p>
                    </div>
                 ) : <p className="text-slate-300 italic text-2xl uppercase font-black">Нема нових вести</p>}
              </div>
           </div>

           {/* Misao Dana / Dezurstvo */}
           <div className="bg-blue-900 rounded-[3rem] p-10 shadow-2xl flex flex-col flex-1 relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 p-6 opacity-10"><Quote size={120} /></div>
              <div className="flex items-center gap-4 mb-8 text-blue-400">
                 <Lightbulb size={40} strokeWidth={3} />
                 <h3 className="text-3xl font-black uppercase italic text-white">Мисао дана</h3>
              </div>
              <div className="flex-1 flex flex-col justify-center text-center italic text-4xl font-bold leading-relaxed px-4">
                 „{info.citati[currentSlide % info.citati.length]?.sadrzaj || 'Учење је једино што ум никада не исцрпљује.'}“
              </div>
              <div className="mt-8 pt-8 border-t border-white/10 text-center">
                 <p className="text-xs font-black uppercase text-blue-400 tracking-[0.3em] mb-3">Дежурни наставник</p>
                 <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
                    <p className="text-3xl font-black uppercase italic text-yellow-400">{data.duty.teacher_name}</p>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}