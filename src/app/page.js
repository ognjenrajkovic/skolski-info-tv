'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, AlertTriangle, CloudSun, Quote, Bell, MapPin } from 'lucide-react';

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState({ ann: [], tt: [], duty: {}, sys: [] });
  const [currentGradeSlide, setCurrentGradeSlide] = useState(0); // Za rotaciju 5, 6, 7, 8 razred
  const [weather, setWeather] = useState({ temp: '--', desc: 'Учитавање...' });

  const loadData = async () => {
    const { data: ann } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    const { data: tt } = await supabase.from('timetable').select('*');
    const { data: dt } = await supabase.from('duty_staff').select('*').single();
    const { data: sys } = await supabase.from('system_settings').select('*');
    setData({ ann: ann || [], tt: tt || [], duty: dt || {}, sys: sys || [] });
  };

  // Vremenska prognoza (Primer za Beograd/Srbiju)
  const fetchWeather = async () => {
    try {
      // Ovde ubaci svoj API ključ od OpenWeatherMap-a
      // const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Belgrade&units=metric&appid=TVOJ_KEY&lang=sr`);
      // const wData = await res.json();
      // setWeather({ temp: Math.round(wData.main.temp), desc: wData.weather[0].description });
      setWeather({ temp: 18, desc: 'Претежно сунчано' }); // Demo
    } catch (e) { console.error("Weather error", e); }
  };

  useEffect(() => {
    loadData(); fetchWeather();
    const t = setInterval(() => setNow(new Date()), 1000);
    const d = setInterval(loadData, 30000);
    const s = setInterval(() => setCurrentGradeSlide(prev => (prev + 1) % 4), 8000); // Menja razred svakih 8s
    return () => { clearInterval(t); clearInterval(d); clearInterval(s); };
  }, []);

  const info = useMemo(() => {
    // 1. Logika Smene
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const weekNum = Math.ceil((((date - firstDay) / 86400000) + firstDay.getDay() + 1) / 7);
    const trenutnaSmena = weekNum % 2 === 0 ? 'parna' : 'neparna';

    // 2. Doba dana
    const sati = now.getHours();
    const doba = sati < 14 ? 'prepodne' : 'popodne';

    // 3. Tajmer i Časovi
    const mins = now.getHours() * 60 + now.getMinutes();
    const rasporedSati = [
      { c: 1, s: 480, e: 525 }, { c: 2, s: 530, e: 575 }, { c: 3, s: 595, e: 640 },
      { c: 4, s: 645, e: 690 }, { c: 5, s: 695, e: 740 }, { c: 6, s: 745, e: 790 }, { c: 7, s: 795, e: 840 }
    ];

    const tekuci = rasporedSati.find(r => mins >= r.s && mins < r.e);
    const sledeci = rasporedSati.find(r => mins < r.s);

    let tajmerLabel = "КРАЈ НАСТАВЕ";
    let preostalo = "00:00";
    let prikazujCas = tekuci ? tekuci.c : (sledeci ? sledeci.c : 0);

    if (tekuci) {
      tajmerLabel = "ДО КРАЈА ЧАСА";
      const diff = tekuci.e * 60 - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
      preostalo = `${Math.floor(diff/60)}:${(diff%60).toString().padStart(2,'0')}`;
    } else if (sledeci) {
      tajmerLabel = "ДО ПОЧЕТКА ЧАСА";
      const diff = sledeci.s * 60 - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
      preostalo = `${Math.floor(diff/60)}:${(diff%60).toString().padStart(2,'0')}`;
    }

    // 4. Filtriranje Bulk Rasporeda (Razredi 5-8 ili svi)
    const showLower = data.sys.find(s => s.key === 'show_lower_grades')?.value === 'true';
    const dostupniRazredi = showLower ? [1,2,3,4,5,6,7,8] : [5,6,7,8];
    const trenutniRazredZaPrikaz = dostupniRazredi[currentGradeSlide % dostupniRazredi.length];

    const filtriranRaspored = data.tt.filter(t => 
      t.smena === trenutnaSmena && 
      t.doba_dana === doba && 
      t.cas === prikazujCas &&
      t.razred === trenutniRazredZaPrikaz
    );

    return {
      trenutnaSmena, doba, prikazujCas, tajmerLabel, preostalo, 
      trenutniRazredZaPrikaz, filtriranRaspored,
      emergency: data.sys.find(s => s.key === 'emergency')?.value === 'true'
    };
  }, [now, data, currentGradeSlide]);

  if (info.emergency) return (
    <div className="h-screen bg-red-700 flex flex-col items-center justify-center text-white p-20 text-center">
      <AlertTriangle size={300} className="animate-bounce mb-10" />
      <h1 className="text-[15vw] font-black leading-none">УЗБУНА</h1>
      <p className="text-6xl font-bold uppercase mt-10">Хитно напустите објекат по плану евакуације!</p>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
      
      {/* HEADER TRAKA */}
      <div className="h-[12vh] bg-gradient-to-r from-blue-900 via-blue-800 to-black border-b-4 border-blue-500 flex items-center justify-between px-10">
        <div className="flex items-center gap-6">
          <div className="bg-white p-2 rounded-lg"><img src="/logo.png" className="h-16" alt="Logo" /></div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">ОШ „Карађорђе”</h1>
            <p className="text-blue-400 font-bold uppercase text-sm tracking-[0.3em]">Информациони систем</p>
          </div>
        </div>

        <div className="flex items-center gap-10">
           <div className="text-right border-r border-white/20 pr-10">
              <p className="text-blue-400 font-black uppercase text-xs tracking-widest leading-none mb-1">Смена</p>
              <p className="text-2xl font-black uppercase italic">{info.trenutnaSmena} / {info.doba === 'prepodne' ? 'Пре подне' : 'По подне'}</p>
           </div>
           <div className="flex flex-col items-end">
             <div className="text-6xl font-black tabular-nums leading-none">{now.getHours()}:{now.getMinutes().toString().padStart(2,'0')}</div>
             <p className="text-sm font-bold opacity-50 uppercase tracking-widest">{now.toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
           </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6">
        
        {/* LEVA STRANA: TAJMER + RASPORED (8 KOLONA) */}
        <div className="col-span-8 flex flex-col gap-6">
          
          {/* Tajmer Box */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between shadow-2xl">
            <span className="text-3xl font-black uppercase text-blue-500 italic ml-4">{info.tajmerLabel}:</span>
            <span className="text-8xl font-black tabular-nums text-white mr-4 leading-none">{info.preostalo}</span>
          </div>

          {/* Bulk Tabela Rasporeda */}
          <div className="flex-1 bg-white rounded-[2.5rem] p-10 flex flex-col shadow-inner overflow-hidden relative">
            <div className="flex justify-between items-end mb-8 border-b-4 border-slate-100 pb-4">
               <h2 className="text-6xl font-black text-slate-900 uppercase italic leading-none">
                 {info.trenutniRazredZaPrikaz}. РАЗРЕД
               </h2>
               <span className="bg-blue-600 text-white px-6 py-2 rounded-full font-black text-2xl uppercase">
                 {info.prikazujCas}. ЧАС
               </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
               {info.filtriranRaspored.length > 0 ? info.filtriranRaspored.map((r, i) => (
                 <div key={i} className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
                    <span className="text-5xl font-black text-slate-800">{r.razred}-{r.odeljenje}</span>
                    <span className="text-5xl font-bold text-blue-700 uppercase italic">{r.predmet}</span>
                    <span className="text-5xl font-black bg-slate-900 text-white px-8 py-2 rounded-xl">({r.kabinet})</span>
                 </div>
               )) : (
                 <div className="h-full flex items-center justify-center opacity-10">
                    <p className="text-6xl font-black uppercase italic">Нема података за овај разред</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* DESNA STRANA: VESTI, CITATI, PROGNOZA (4 KOLONE) */}
        <div className="col-span-4 flex flex-col gap-6">
           
           {/* Vremenska prognoza Box */}
           <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-8 text-white flex items-center justify-between shadow-xl">
              <div>
                <p className="text-xs font-black uppercase opacity-70 tracking-widest">Тренутно</p>
                <p className="text-6xl font-black">{weather.temp}°C</p>
                <p className="text-lg font-bold uppercase italic">{weather.desc}</p>
              </div>
              <CloudSun size={100} className="opacity-40" />
           </div>

           {/* Vesti / Citati Box */}
           <div className="flex-1 bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden">
              <div className="mb-8 flex items-center gap-3">
                 <Bell className="text-blue-500" />
                 <h3 className="text-xl font-black uppercase tracking-widest">Инфо Блок</h3>
              </div>

              <div className="flex-1 flex flex-col justify-center text-center">
                 {data.ann.length > 0 ? (
                   <div key={now.getSeconds() % data.ann.length} className="animate-in fade-in zoom-in duration-700">
                      {data.ann[0].tip === 'CITAT' ? <Quote size={40} className="mx-auto mb-6 opacity-20"/> : null}
                      <p className="text-3xl font-bold leading-snug uppercase italic">
                        "{data.ann[now.getSeconds() % data.ann.length].sadrzaj}"
                      </p>
                   </div>
                 ) : (
                   <p className="opacity-20 italic">Нема нових обавештења...</p>
                 )}
              </div>

              <div className="mt-auto pt-8 border-t border-white/10">
                 <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2 text-center">Дежурни наставник</p>
                 <div className="bg-white/5 p-4 rounded-2xl text-center text-2xl font-black uppercase border border-white/5">
                   {data.duty.teacher_name}
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}