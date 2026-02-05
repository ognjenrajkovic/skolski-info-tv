'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Bell, Thermometer, Quote, Cake, AlertTriangle, BookOpen, Sun, Cloud, CloudRain, Snowflake } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SCHOOL_NAME = "ОШ „КАРАЂОРЂЕ”";

const SCHEDULE_TIMES = [
  { num: 1, label: "1. ЧАС", start: "08:00", end: "08:45" },
  { num: 0, label: "ОДМОР", start: "08:45", end: "08:50" },
  { num: 2, label: "2. ЧАС", start: "08:50", end: "09:35" },
  { num: 0, label: "В. ОДМОР", start: "09:35", end: "10:00" },
  { num: 3, label: "3. ЧАС", start: "10:00", end: "10:45" },
  { num: 0, label: "ОДМОР", start: "10:45", end: "10:50" },
  { num: 4, label: "4. ЧАС", start: "10:50", end: "11:35" },
  { num: 0, label: "ОДМОР", start: "11:35", end: "11:40" },
  { num: 5, label: "5. ЧАС", start: "11:40", end: "12:25" },
  { num: 6, label: "6. ЧАС", start: "12:30", end: "13:15" },
  { num: 7, label: "7. ЧАС", start: "13:15", end: "14:00" },
  { num: 1, label: "1. ЧАС", start: "14:00", end: "14:45" },
  { num: 2, label: "2. ЧАС", start: "14:50", end: "15:35" },
  { num: 3, label: "3. ЧАС", start: "16:00", end: "16:45" },
  { num: 4, label: "4. ЧАС", start: "16:50", end: "17:35" },
  { num: 5, label: "5. ЧАС", start: "17:40", end: "18:25" },
  { num: 6, label: "6. ЧАС", start: "18:30", end: "19:15" },
  { num: 7, label: "7. ЧАС", start: "19:15", end: "20:00" },
];

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [announcements, setAnnouncements] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [weather, setWeather] = useState({ temp: '--', code: 0 });
  const [emergency, setEmergency] = useState('НОРМАЛНО');
  const [morningShift, setMorningShift] = useState('Parna');
  const [activeTab, setActiveTab] = useState(0);

  const fetchData = async () => {
    try {
      const { data: ann } = await supabase.from('announcements').select('*');
      const { data: bdays } = await supabase.from('birthdays').select('*');
      const { data: tt } = await supabase.from('timetable').select('*');
      const { data: sys } = await supabase.from('system_settings').select('*');
      
      setAnnouncements(ann || []);
      setBirthdays(bdays || []);
      setTimetable(tt || []);
      
      if (sys) {
        const em = sys.find(s => s.key === 'emergency');
        const sh = sys.find(s => s.key === 'current_morning_shift');
        if (em) setEmergency(em.value);
        if (sh) setMorningShift(sh.value);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const rotation = setInterval(() => setActiveTab((prev) => (prev + 1) % 4), 12000);
    
    fetch('https://api.open-meteo.com/v1/forecast?latitude=44.81&longitude=20.46&current_weather=true')
      .then(res => res.json())
      .then(data => setWeather({ temp: Math.round(data.current_weather.temperature), code: data.current_weather.weathercode }))
      .catch(() => {});

    return () => { clearInterval(timer); clearInterval(rotation); };
  }, []);

  const status = useMemo(() => {
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const isMorning = now.getHours() < 14;
    
    const activeSlot = SCHEDULE_TIMES.find(s => {
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      return currentMin >= (sh * 60 + sm) && currentMin < (eh * 60 + em);
    });

    let progress = 0;
    if (activeSlot) {
      const [sh, sm] = activeSlot.start.split(':').map(Number);
      const [eh, em] = activeSlot.end.split(':').map(Number);
      const startSec = sh * 3600 + sm * 60;
      const endSec = eh * 3600 + em * 60;
      const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      progress = Math.min(Math.max(((nowSec - startSec) / (endSec - startSec)) * 100, 0), 100);
    }

    const days = ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"];
    const currentDay = days[now.getDay()];
    const activeShiftInSchool = isMorning ? morningShift : (morningShift === 'Parna' ? 'Neparna' : 'Parna');
    
    // Filtriranje rasporeda - dodata provera za num
    const currentRooms = (timetable || []).filter(t => 
      t.day === currentDay && 
      t.shift === activeShiftInSchool && 
      t.period === (activeSlot ? activeSlot.num : -1)
    );

    return { activeSlot: activeSlot || { label: "ВАН НАСТАВЕ", num: -1 }, progress, isMorning, currentDay, activeShiftInSchool, currentRooms };
  }, [now, timetable, morningShift]);

  const WeatherIcon = ({ code }) => {
    if (code === 0) return <Sun className="text-yellow-400" size={60} />;
    if (code < 4) return <Cloud className="text-slate-400" size={60} />;
    if (code < 70) return <CloudRain className="text-blue-400" size={60} />;
    return <Snowflake className="text-blue-200" size={60} />;
  };

  if (emergency === "УЗБУНА") {
    return (
      <div className="h-screen w-screen bg-red-700 flex flex-col items-center justify-center text-white p-10">
        <AlertTriangle size={300} className="animate-pulse mb-10" />
        <h1 className="text-[15vh] font-black uppercase">УЗБУНА</h1>
        <p className="text-[5vh] font-bold">ЕВАКУАЦИЈА У ТОКУ</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#F1F5F9] p-[1.5vh] flex flex-col font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="h-[12vh] bg-white rounded-[2.5rem] shadow-sm flex justify-between items-center px-[5vh] mb-[1.5vh] border border-white">
        <div className="flex items-center gap-[4vh]">
          {/* LOGO FIKS - Dodat / ispred putanje */}
          <img src="/logo.png" alt="Logo" className="h-[8vh] w-auto object-contain" />
          <div>
            <h1 className="text-[4.5vh] font-black uppercase tracking-tighter leading-none">{SCHOOL_NAME}</h1>
            <span className="text-blue-500 font-bold uppercase tracking-widest text-[1.8vh]">{status.activeShiftInSchool} Смена</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[2vh] font-bold text-slate-400 uppercase leading-none">{status.currentDay}</p>
          <div className="text-[6vh] font-black tabular-nums leading-none">
            {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
            <span className="text-blue-400 text-[3vh]">:{now.getSeconds().toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-[1.5vh] min-h-0">
        
        {/* LEVA STRANA - VELIKI PROGRESS */}
        <div className="w-[60%] bg-white rounded-[4rem] shadow-xl flex flex-col items-center justify-center border border-white relative overflow-hidden">
             <div className="relative h-[60vh] w-[60vh] flex items-center justify-center">
                <svg className="absolute h-full w-full rotate-[-90deg]">
                    <circle cx="50%" cy="50%" r="46%" stroke="#F1F5F9" strokeWidth="45" fill="transparent" />
                    <circle cx="50%" cy="50%" r="46%" stroke={status.activeSlot.num > 0 ? "#2563eb" : "#10b981"} strokeWidth="45" fill="transparent" 
                            strokeDasharray="1445" strokeDashoffset={1445 - (1445 * status.progress) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="text-center z-10">
                    <span className="text-[2.5vh] font-bold text-slate-300 uppercase tracking-[0.3em] block mb-2">Тренутно</span>
                    <h2 className="text-[10vh] font-black leading-none text-slate-800 italic uppercase px-4">{status.activeSlot.label}</h2>
                </div>
             </div>
        </div>

        {/* DESNA STRANA - ROTACIJA */}
        <div className="w-[40%] bg-white rounded-[4rem] shadow-xl flex flex-col relative overflow-hidden border border-white">
          <div className="flex-1 p-[5vh] overflow-hidden">
            
            {/* 0. OBAVEŠTENJA + VREME */}
            {activeTab === 0 && (
              <div className="animate-in fade-in duration-500 h-full flex flex-col">
                <div className="flex justify-between items-center mb-8 bg-slate-50 p-6 rounded-[2rem]">
                   <div>
                      <h3 className="text-[4.5vh] font-black text-slate-800 leading-none">{weather.temp}°C</h3>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Београд</p>
                   </div>
                   <WeatherIcon code={weather.code} />
                </div>
                <h3 className="text-[3vh] font-black text-orange-500 mb-6 uppercase flex items-center gap-3"><Bell /> Обавештења</h3>
                <div className="space-y-4">
                  {(announcements || []).slice(0, 3).map((a, i) => (
                    <div key={i} className="bg-orange-50 p-6 rounded-[2rem] border-l-[10px] border-orange-500 text-[2.4vh] font-bold text-slate-700">{a.text}</div>
                  ))}
                  {announcements.length === 0 && <p className="text-slate-300 italic">Нема нових обавештења...</p>}
                </div>
              </div>
            )}

            {/* 1. RASPORED KABINETA ZA OVAJ ČAS */}
            {activeTab === 1 && (
              <div className="animate-in slide-in-from-right duration-500 h-full">
                <h3 className="text-[3vh] font-black text-blue-600 mb-6 uppercase flex items-center gap-3"><BookOpen /> Кабинети</h3>
                <p className="text-slate-400 mb-6 font-bold uppercase italic text-sm">Сада: {status.activeSlot.label}</p>
                <div className="grid grid-cols-1 gap-3">
                  {status.currentRooms.length > 0 ? status.currentRooms.slice(0, 6).map((r, i) => (
                    <div key={i} className="flex justify-between items-center bg-blue-50 p-5 rounded-[2.5rem] border border-blue-100 shadow-sm">
                      <span className="text-[3vh] font-black text-slate-700">{r.class_name}</span>
                      <span className="bg-white px-6 py-1 rounded-full font-black text-blue-600 border border-blue-100">{r.room}</span>
                    </div>
                  )) : <div className="text-center py-20 text-slate-200 font-black uppercase text-xl italic leading-tight">Није унет распоред<br/>за овај час</div>}
                </div>
              </div>
            )}

            {/* 2. ROĐENDANI */}
            {activeTab === 2 && (
              <div className="animate-in slide-in-from-right duration-500 h-full">
                <h3 className="text-[3vh] font-black text-pink-500 mb-8 uppercase flex items-center gap-3"><Cake /> Рођендани</h3>
                <div className="space-y-4">
                  {(birthdays || []).slice(0, 5).map((b, i) => (
                    <div key={i} className="flex justify-between items-center bg-pink-50 p-6 rounded-[2rem] border border-pink-100">
                      <span className="text-[3vh] font-black text-pink-700">{b.name}</span>
                      <span className="bg-white px-4 py-1 rounded-full text-pink-500 font-bold">{b.class_name}</span>
                    </div>
                  ))}
                  {birthdays.length === 0 && <p className="text-slate-300 italic">Данас нема рођендана.</p>}
                </div>
              </div>
            )}

            {/* 3. CITATI */}
            {activeTab === 3 && (
              <div className="animate-in zoom-in duration-500 h-full flex flex-col items-center justify-center text-center p-6">
                <Quote size={80} className="text-blue-100 mb-8" />
                <p className="text-[3.5vh] font-black italic text-slate-800 leading-tight italic">
                  {announcements.length > 0 ? `"${announcements[0]?.text}"` : '"Знање је моћ."'}
                </p>
              </div>
            )}

          </div>
          {/* PROGRESS BAR - 6px na dnu */}
          <div className="h-[6px] w-full bg-slate-50">
            <div className="h-full bg-blue-600 animate-[progress_12s_linear_infinite]" />
          </div>
        </div>
      </div>
      <style jsx>{` @keyframes progress { from { width: 0%; } to { width: 100%; } } `}</style>
    </div>
  );
}