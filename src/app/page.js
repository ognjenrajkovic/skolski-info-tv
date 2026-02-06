'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, AlertTriangle, CloudSun, Quote, Bell, Lightbulb } from 'lucide-react';

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState({ ann: [], tt: [], duty: { teacher_name: 'Учитавање...' }, sys: [] });
  const [currentGradeSlide, setCurrentGradeSlide] = useState(0);
  const [weather, setWeather] = useState({ temp: '--', desc: 'Учитавање...' });

  const loadData = async () => {
    try {
      const { data: ann } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      const { data: tt } = await supabase.from('timetable').select('*');
      const { data: dt } = await supabase.from('duty_staff').select('*').single();
      const { data: sys = [] } = await supabase.from('system_settings').select('*');
      setData({ ann: ann || [], tt: tt || [], duty: dt || { teacher_name: 'Није унето' }, sys: sys || [] });
    } catch (e) { console.error(e); }
  };

  const fetchWeather = async () => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=44.77&longitude=20.48&current_weather=true`);
      const wData = await res.json();
      const codes = { 0: 'Ведро', 1: 'Претежно ведро', 2: 'Делимично облачно', 3: 'Облачно', 61: 'Киша', 95: 'Грмљавина' };
      setWeather({ temp: Math.round(wData.current_weather.temperature), desc: codes[wData.current_weather.weathercode] || 'Умерено облачно' });
    } catch (e) { setWeather({ temp: '--', desc: 'Прогноза недоступна' }); }
  };

  useEffect(() => {
    loadData(); fetchWeather();
    const t = setInterval(() => setNow(new Date()), 1000);
    const d = setInterval(loadData, 30000);
    const s = setInterval(() => setCurrentGradeSlide(prev => (prev + 1) % 4), 8000);
    return () => { clearInterval(t); clearInterval(d); clearInterval(s); };
  }, []);

  const info = useMemo(() => {
    const weekDate = new Date();
    const firstDay = new Date(weekDate.getFullYear(), 0, 1);
    const weekNum = Math.ceil((((weekDate - firstDay) / 86400000) + firstDay.getDay() + 1) / 7);
    const trenutnaSmena = weekNum % 2 === 0 ? 'parna' : 'neparna';
    const doba = now.getHours() < 14 ? 'prepodne' : 'popodne';
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

    const showLower = data.sys.find(s => s.key === 'show_lower_grades')?.value === 'true';
    const razredi = showLower ? [1,2,3,4,5,6,7,8] : [5,6,7,8];
    const aktRazred = razredi[currentGradeSlide % razredi.length];
    const filtriran = data.tt.filter(t => t.smena === trenutnaSmena && t.doba_dana === doba && t.cas === prikazujCas && t.razred === aktRazred);

    // RAZDVAJANJE OBAVESTENJA I CITATA
    const vesti = data.ann.filter(a => a.tip === 'VEST');
    const citati = data.ann.filter(a => a.tip === 'CITAT');

    return { 
      trenutnaSmena, doba, prikazujCas, tajmerLabel, preostalo, aktRazred, filtriran, vesti, citati,
      emergency: data.sys.find(s => s.key === 'emergency')?.value === 'true' 
    };
  }, [now, data, currentGradeSlide]);

  if (info.emergency) return (
    <div className="h-screen bg-red-600 flex flex-col items-center justify-center text-white p-20 text-center animate-pulse">
      <AlertTriangle size={300} />
      <h1 className="text-[12vw] font-black uppercase italic">УЗБУНА</h1>
      <p className="text-5xl font-bold uppercase mt-10 text-yellow-300">Хитно напустите објекат!</p>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-slate-100 text-slate-900 flex flex-col font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="h-[12vh] bg-white border-b-8 border-blue-600 flex items-center justify-between px-10 shadow-md">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-4xl shadow-lg">К</div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none italic">ОШ „Карађорђе”</h1>
            <p className="text-blue-600 font-bold uppercase text-sm tracking-[0.3em]">Информациони систем</p>
          </div>
        </div>
        <div className="flex items-center gap-10">
           <div className="text-right border-r-4 border-slate-200 pr-10">
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest mb-1">Смена</p>
              <p className="text-3xl font-black uppercase italic text-blue-700">{info.trenutnaSmena} / {info.doba}</p>
           </div>
           <div className="flex flex-col items-end">
             <div className="text-7xl font-black tabular-nums leading-none text-slate-900">{now.getHours()}:{now.getMinutes().toString().padStart(2,'0')}</div>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1 italic">{now.toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 p-8">
        {/* LEVO: TAJMER + RASPORED */}
        <div className="col-span-8 flex flex-col gap-6">
          <div className="bg-blue-600 rounded-[2.5rem] p-8 flex items-center justify-between shadow-xl text-white">
            <span className="text-4xl font-black uppercase italic">{info.tajmerLabel}:</span>
            <span className="text-[7rem] font-black tabular-nums leading-none">{info.preostalo}</span>
          </div>

          <div className="flex-1 bg-white rounded-[3rem] p-12 shadow-xl flex flex-col border-2 border-slate-200">
            <div className="flex justify-between items-center mb-10 border-b-8 border-blue-50">
               <h2 className="text-8xl font-black text-slate-900 uppercase italic">{info.aktRazred}. РАЗРЕД</h2>
               <div className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-4xl">{info.prikazujCas}. ЧАС</div>
            </div>
            <div className="flex flex-col gap-5">
               {info.filtriran.length > 0 ? info.filtriran.map((r, i) => (
                 <div key={i} className="flex justify-between items-center bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100">
                    <span className="text-7xl font-black text-slate-900">{r.razred}-{r.odeljenje}</span>
                    <span className="text-6xl font-black text-blue-600 uppercase italic">{r.predmet}</span>
                    <span className="text-7xl font-black bg-blue-100 text-blue-800 px-10 py-4 rounded-3xl">{r.kabinet}</span>
                 </div>
               )) : (
                 <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 italic font-black text-5xl uppercase">Одмор у току...</div>
               )}
            </div>
          </div>
        </div>

        {/* DESNO: VESTI + MISAO DANA + PROGNOZA */}
        <div className="col-span-4 flex flex-col gap-6">
           {/* PROGNOZA */}
           <div className="bg-white border-4 border-orange-400 rounded-[2.5rem] p-6 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-orange-500 font-black uppercase text-xs">Вождовац, Београд</p>
                <p className="text-6xl font-black text-slate-900">{weather.temp}°C</p>
                <p className="text-lg font-bold text-slate-500 uppercase">{weather.desc}</p>
              </div>
              <CloudSun size={80} className="text-orange-400" />
           </div>

           {/* VESTI - Gornji manji box */}
           <div className="bg-white border-4 border-blue-600 rounded-[2.5rem] p-8 shadow-xl flex flex-col h-1/3">
              <div className="mb-4 flex items-center gap-3 text-blue-600">
                 <Bell size={30} />
                 <h3 className="text-xl font-black uppercase italic">Вести</h3>
              </div>
              <div className="flex-1 flex items-center justify-center text-center">
                 {info.vesti.length > 0 ? (
                   <p className="text-2xl font-black leading-tight text-slate-800 uppercase italic">
                     {info.vesti[now.getSeconds() % info.vesti.length].sadrzaj}
                   </p>
                 ) : <p className="opacity-20">Нема нових вести</p>}
              </div>
           </div>

           {/* MISAO DANA - Donji box sa quote efektom */}
           <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl flex flex-col flex-1 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 opacity-10 text-white"><Quote size={150}/></div>
              <div className="mb-4 flex items-center gap-3 text-yellow-400">
                 <Lightbulb size={30} />
                 <h3 className="text-xl font-black uppercase italic">Мисао дана</h3>
              </div>
              <div className="flex-1 flex flex-col justify-center text-center px-4 relative z-10">
                 {info.citati.length > 0 ? (
                   <div key={now.getSeconds() % info.citati.length}>
                      <p className="text-3xl font-bold leading-snug text-white italic">
                        „{info.citati[now.getSeconds() % info.citati.length].sadrzaj}“
                      </p>
                   </div>
                 ) : <p className="text-white/20">Биди промена коју желиш да видиш...</p>}
              </div>
              <div className="mt-auto pt-4 border-t border-white/10 text-center">
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Дежурни наставник</p>
                 <p className="text-xl font-black text-white uppercase italic">{data.duty.teacher_name}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}