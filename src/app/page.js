'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Bell, Sun, Moon, MapPin, CloudSun, Thermometer, Calendar, Quote, Cake, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SCHOOL_NAME = "ОШ „КАРАЂОРЂЕ”";

// --- РАСПОРЕДИ ---
const MORNING_SCHEDULE = [
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
];

const AFTERNOON_SCHEDULE = [
  { num: 1, label: "1. ЧАС", start: "14:00", end: "14:45" },
  { num: 0, label: "ОДМОР", start: "14:45", end: "14:50" },
  { num: 2, label: "2. ЧАС", start: "14:50", end: "15:35" },
  { num: 0, label: "В. ОДМОР", start: "15:35", end: "16:00" },
  { num: 3, label: "3. ЧАС", start: "16:00", end: "16:45" },
  { num: 0, label: "ОДМОР", start: "16:45", end: "16:50" },
  { num: 4, label: "4. ЧАС", start: "16:50", end: "17:35" },
  { num: 0, label: "ОДМОР", start: "17:35", end: "17:40" },
  { num: 5, label: "5. ЧАС", start: "17:40", end: "18:25" },
  { num: 6, label: "6. ЧАС", start: "18:30", end: "19:15" },
];

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [announcements, setAnnouncements] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [weather, setWeather] = useState({ temp: '--' });
  const [emergency, setEmergency] = useState('НОРМАЛНО');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const rotation = setInterval(() => setActiveTab((prev) => (prev + 1) % 3), 15000);
    
    // Временска прогноза за Београд
    const fetchWeather = () => {
        fetch('https://api.open-meteo.com/v1/forecast?latitude=44.81&longitude=20.46&current_weather=true')
        .then(res => res.json())
        .then(data => setWeather({ temp: Math.round(data.current_weather.temperature) }))
        .catch(() => {});
    };
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 900000); // на 15 мин

    return () => { clearInterval(timer); clearInterval(rotation); clearInterval(weatherInterval); }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('realtime_updates').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchData = async () => {
    const { data: ann } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    const { data: bdays } = await supabase.from('birthdays').select('*');
    const { data: sys } = await supabase.from('system_settings').select('*').eq('key', 'emergency').single();
    if (ann) setAnnouncements(ann);
    if (bdays) setBirthdays(bdays);
    if (sys) setEmergency(sys.value);
  };

  const status = useMemo(() => {
    const hour = now.getHours();
    const currentMin = hour * 60 + now.getMinutes();
    const isMorning = hour < 13;
    const schedule = isMorning ? MORNING_SCHEDULE : AFTERNOON_SCHEDULE;
    
    const activeSlot = schedule.find(s => {
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
      progress = ((nowSec - startSec) / (endSec - startSec)) * 100;
    }
    return { active: activeSlot || { label: "ВАН НАСТАВЕ", num: -1 }, progress, isMorning, schedule };
  }, [now]);

  if (emergency === "УЗБУНА") {
    return (
      <div className="h-screen w-screen bg-red-700 flex flex-col items-center justify-center text-white animate-pulse p-20 text-center">
        <AlertTriangle size={300} />
        <h1 className="text-[15rem] font-black uppercase tracking-tighter leading-none">УЗБУНА</h1>
        <p className="text-6xl font-bold uppercase tracking-[0.2em] mt-10">Пратите упутства дежурних наставника!</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#F0F2F5] text-slate-900 p-8 flex flex-col font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl flex justify-between items-center mb-8 border border-white">
        <div className="flex items-center gap-6">
          <div className="bg-blue-600 p-5 rounded-[2rem] text-white shadow-lg">
            {status.isMorning ? <Sun size={48} /> : <Moon size={48} />}
          </div>
          <div>
            <h1 className="text-5xl font-[1000] tracking-tighter text-slate-800 uppercase leading-none">{SCHOOL_NAME}</h1>
            <p className="text-xl font-black text-blue-500 uppercase tracking-[0.2em] mt-1 italic">
              {status.isMorning ? "Преподневна смена" : "Поподневна смена"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4 bg-orange-50 p-4 px-6 rounded-3xl border border-orange-100">
             <Thermometer className="text-orange-500" size={32} />
             <span className="text-4xl font-black text-slate-700">{weather.temp}°Ц</span>
          </div>
          <div className="text-right border-l-4 border-slate-100 pl-10">
            <p className="text-2xl font-black text-slate-300 uppercase leading-none mb-1">
              {now.toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div className="text-7xl font-[1000] tabular-nums text-slate-800 leading-none">
              {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
              <span className="text-3xl text-blue-500 opacity-50 ml-1">:{now.getSeconds().toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-8 min-h-0">
        {/* LEVO: TRENUTNI ČAS */}
        <div className="w-2/3 flex flex-col gap-8">
          <div className="flex-1 bg-white rounded-[4rem] shadow-2xl p-16 flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute top-10 left-10 opacity-5 text-[20rem] font-black italic select-none">
                {status.active.num > 0 ? status.active.num : ""}
             </div>
             
             <svg className="h-[520px] w-[520px] rotate-[-90deg]">
                <circle cx="260" cy="260" r="235" stroke="#F8FAFC" strokeWidth="45" fill="transparent" />
                <circle cx="260" cy="260" r="235" stroke={status.active.num > 0 ? "#2563eb" : "#10b981"} strokeWidth="45" fill="transparent" 
                        strokeDasharray={1475} strokeDashoffset={1475 - (1475 * status.progress) / 100} strokeLinecap="round" className="transition-all duration-1000" />
             </svg>

             <div className="absolute text-center">
                <span className="text-3xl font-black text-slate-300 uppercase tracking-widest block mb-4">Тренутно:</span>
                <h2 className={`text-[11rem] font-[1000] leading-none tracking-tighter uppercase italic ${status.active.num > 0 ? 'text-slate-800' : 'text-emerald-500'}`}>
                    {status.active.label}
                </h2>
                {status.active.num > 0 && <span className="text-5xl font-black text-blue-500 mt-8 block">{Math.round(status.progress)}%</span>}
             </div>
          </div>

          {/* DONJA SATNICA */}
          <div className="bg-white p-6 rounded-[3rem] shadow-lg flex justify-around border border-white">
              {status.schedule.filter(s => s.num > 0).map((s, i) => (
                  <div key={i} className={`flex flex-col items-center px-6 py-2 rounded-2xl transition-all ${status.active.label === s.label ? 'bg-blue-600 text-white shadow-xl scale-110' : 'opacity-20'}`}>
                      <span className="text-2xl font-black">{s.label}</span>
                      <span className="text-base font-bold">{s.start}</span>
                  </div>
              ))}
          </div>
        </div>

        {/* DESNO: ROTACIJA */}
        <div className="w-1/3 flex flex-col gap-8">
          <div className="flex-1 bg-white rounded-[4rem] shadow-2xl overflow-hidden flex flex-col relative border-4 border-white">
              <div className="p-10 flex-grow">
                {activeTab === 0 && (
                  <div className="animate-in fade-in duration-700">
                    <h3 className="text-4xl font-black text-orange-500 flex items-center gap-4 mb-8 uppercase italic italic">
                      <Bell size={44} fill="currentColor" /> Обавештења
                    </h3>
                    <div className="space-y-6">
                        {announcements.slice(0, 3).map((a, i) => (
                          <div key={i} className="bg-orange-50 p-8 rounded-[2.5rem] border-l-[16px] border-orange-500 text-3xl font-black leading-tight text-slate-700">
                            {a.text}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                {activeTab === 1 && (
                  <div className="animate-in fade-in duration-700">
                    <h3 className="text-4xl font-black text-pink-500 flex items-center gap-4 mb-8 uppercase italic italic">
                      <Cake size={44} fill="currentColor" /> Рођендани
                    </h3>
                    <div className="space-y-4">
                        {birthdays.length > 0 ? birthdays.map((b, i) => (
                          <div key={i} className="flex justify-between items-center bg-pink-50 p-6 rounded-3xl border-2 border-pink-100 text-4xl font-black text-pink-700">
                            <span>{b.name}</span>
                            <span className="text-2xl bg-white px-5 py-1 rounded-full">{b.class_name}</span>
                          </div>
                        )) : <p className="text-center text-slate-300 text-2xl mt-20 font-bold uppercase tracking-widest">Данас нема рођендана</p>}
                    </div>
                  </div>
                )}
                {activeTab === 2 && (
                  <div className="animate-in fade-in duration-700 h-full flex flex-col items-center justify-center text-center p-6">
                    <CloudSun size={120} className="text-blue-400 mb-6" />
                    <h3 className="text-4xl font-black text-slate-800 uppercase mb-4">Време Данас</h3>
                    <span className="text-[9rem] font-[1000] text-blue-600 leading-none">{weather.temp}°Ц</span>
                    <p className="text-2xl font-black text-slate-400 mt-6 tracking-widest uppercase italic italic">Београд</p>
                  </div>
                )}
              </div>
              
              {/* PROGRESS BAR ROTACIJE */}
              <div className="h-4 w-full bg-slate-50">
                  <div className="h-full bg-blue-600 animate-[progress_15s_linear_infinite]" />
              </div>
          </div>
        </div>
      </div>

      <style jsx>{` @keyframes progress { from { width: 0%; } to { width: 100%; } } `}</style>
    </div>
  );
}