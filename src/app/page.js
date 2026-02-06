'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Thermometer, Quote, Cake, AlertTriangle, BookOpen, UserCheck, Sun, Cloud, CloudRain, Snowflake, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SCHOOL_NAME = "ОШ „КАРАЂОРЂЕ”";

// Definicija zvona
const BELL_SCHEDULE = [
  { num: 1, label: "1. ЧАС", start: "08:00", end: "08:45" },
  { num: 0, label: "ОДМОР", start: "08:45", end: "08:50" },
  { num: 2, label: "2. ЧАС", start: "08:50", end: "09:35" },
  { num: 0, label: "ВЕЛИКИ ОДМОР", start: "09:35", end: "10:00" },
  { num: 3, label: "3. ЧАС", start: "10:00", end: "10:45" },
  { num: 0, label: "ОДМОР", start: "10:45", end: "10:50" },
  { num: 4, label: "4. ЧАС", start: "10:50", end: "11:35" },
  { num: 0, label: "ОДМОР", start: "11:35", end: "11:40" },
  { num: 5, label: "5. ЧАС", start: "11:40", end: "12:25" },
  { num: 0, label: "ОДМОР", start: "12:25", end: "12:30" },
  { num: 6, label: "6. ЧАС", start: "12:30", end: "13:15" },
  { num: 0, label: "ОДМОР", start: "13:15", end: "13:20" },
  { num: 7, label: "7. ЧАС", start: "13:20", end: "14:00" },
  // Popodnevna smena
  { num: 1, label: "1. ЧАС", start: "14:00", end: "14:45" },
  { num: 2, label: "2. ЧАС", start: "14:50", end: "15:35" },
  { num: 3, label: "3. ЧАС", start: "16:00", end: "16:45" },
  { num: 4, label: "4. ЧАС", start: "16:50", end: "17:35" },
  { num: 5, label: "5. ЧАС", start: "17:40", end: "18:25" },
  { num: 6, label: "6. ЧАС", start: "18:30", end: "19:15" },
  { num: 7, label: "7. ЧАС", start: "19:15", end: "20:00" }
];

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], duty: null, quotes: [], sys: [] });
  const [activeTab, setActiveTab] = useState(0);
  const [weather, setWeather] = useState({ temp: 20, code: 0 });

  const fetchData = async () => {
    try {
      const [ann, bdays, tt, duty, quotes, sys] = await Promise.all([
        supabase.from('announcements').select('*'),
        supabase.from('birthdays').select('*'),
        supabase.from('timetable').select('*'),
        supabase.from('duty_staff').select('*').single(),
        supabase.from('quotes').select('*'),
        supabase.from('system_settings').select('*')
      ]);
      setData({ ann: ann.data, bdays: bdays.data, tt: tt.data, duty: duty.data, quotes: quotes.data, sys: sys.data });
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(interval); clearInterval(timer); };
  }, []);

  // Logika za rotaciju slajdova
  useEffect(() => {
    const speed = parseInt(data.sys?.find(s => s.key === 'rotation_speed')?.value || '15000');
    const rotation = setInterval(() => {
      setActiveTab(prev => (prev + 1) % 4);
    }, speed);
    return () => clearInterval(rotation);
  }, [data.sys]);

  const status = useMemo(() => {
    const hour = now.getHours();
    const isMorning = hour < 14;
    const currentMin = hour * 60 + now.getMinutes();
    const morningShift = data.sys?.find(s => s.key === 'current_morning_shift')?.value || 'Parna';
    const activeShift = isMorning ? morningShift : (morningShift === 'Parna' ? 'Neparna' : 'Parna');
    const dobaDana = isMorning ? "ПРЕ ПОДНЕ" : "ПОСЛЕ ПОДНЕ";

    // Pronađi trenutni slot (čas ili odmor)
    const activeSlot = BELL_SCHEDULE.find(s => {
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      return currentMin >= start && currentMin < end;
    }) || { label: "ВАН НАСТАВЕ", num: -1 };

    const days = ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"];
    const currentDay = days[now.getDay()];

    // Filtriraj kabinete samo za TRENUTNI ČAS
    const currentRooms = data.tt?.filter(t => 
      t.day === currentDay && 
      t.shift === activeShift && 
      t.time_of_day === (isMorning ? "Pre podne" : "Posle podne") &&
      t.period === activeSlot.num
    ) || [];

    return { activeSlot, dobaDana, currentDay, currentRooms, emergency: data.sys?.find(s => s.key === 'emergency')?.value };
  }, [now, data]);

  if (status.emergency === "УЗБУНА") {
    return <div className="h-screen w-screen bg-red-700 flex flex-col items-center justify-center text-white p-20 text-center">
      <AlertTriangle size={300} className="animate-pulse mb-10" />
      <h1 className="text-[12vh] font-black uppercase">УЗБУНА - ЕВАКУАЦИЈА</h1>
    </div>;
  }

  return (
    <div className="h-screen w-screen bg-[#F1F5F9] p-[1.5vh] flex flex-col font-sans overflow-hidden text-slate-800">
      
      {/* HEADER */}
      <div className="h-[10vh] bg-white rounded-[2rem] shadow-sm flex justify-between items-center px-10 mb-[1.5vh]">
        <div className="flex items-center gap-6">
          <img src="/logo.png" alt="Logo" className="h-[6vh] object-contain" />
          <div>
            <h1 className="text-[3.2vh] font-black uppercase tracking-tighter leading-none">{SCHOOL_NAME}</h1>
            <span className="text-blue-600 font-bold text-[1.6vh] tracking-widest">{status.dobaDana}</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
           <div className="text-right border-r pr-8 border-slate-100">
              <p className="text-[1.4vh] font-bold text-slate-400 uppercase tracking-widest">{status.currentDay}</p>
              <p className="text-[4.5vh] font-black tabular-nums leading-none">
                {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
              </p>
           </div>
           <div className="flex items-center gap-3">
              <Sun className="text-orange-400" size={35} />
              <span className="text-[3vh] font-black">22°C</span>
           </div>
        </div>
      </div>

      <div className="flex flex-1 gap-[1.5vh] min-h-0">
        
        {/* LEVA STRANA - PAMETNI RASPORED */}
        <div className="w-[60%] bg-white rounded-[3rem] shadow-xl border border-white p-10 flex flex-col">
            <div className="mb-8">
                <span className="bg-blue-50 text-blue-600 px-6 py-2 rounded-full font-black text-[1.8vh] uppercase tracking-widest">
                    {status.activeSlot.label}
                </span>
                <h2 className="text-[5vh] font-black mt-4 tracking-tighter uppercase italic">
                    {status.activeSlot.num === 0 ? "ТРЕНУТНО ЈЕ ОДМОР" : "РАСПОРЕД КАБИНЕТА"}
                </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 overflow-hidden">
                {status.currentRooms.length > 0 ? status.currentRooms.map((r, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                        <span className="text-[2.8vh] font-black text-slate-700">{r.class_name}</span>
                        <span className="bg-white px-6 py-2 rounded-2xl font-black text-blue-600 shadow-sm text-[2.2vh]">{r.room}</span>
                    </div>
                )) : (
                    <div className="col-span-2 py-20 text-center opacity-10 flex flex-col items-center">
                        <BookOpen size={100} />
                        <p className="text-[3vh] font-black uppercase mt-4 italic">Нема часова у овом термину</p>
                    </div>
                )}
            </div>
            
            {/* DEŽURSTVO (FIKSNO DOLE LEVO) */}
            <div className="mt-auto bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center">
                <div>
                    <p className="text-blue-400 font-black text-xs uppercase tracking-[0.2em] mb-1">Дежурни наставник</p>
                    <p className="text-[2.8vh] font-black">{data.duty?.teacher_name || '---'}</p>
                </div>
                <div className="text-right">
                    <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] mb-1">Дежурни ученици</p>
                    <p className="text-[2vh] font-bold text-slate-300 italic">{data.duty?.student_names || '---'}</p>
                </div>
            </div>
        </div>

        {/* DESNA STRANA - ROTACIJA */}
        <div className="w-[40%] bg-white rounded-[3rem] shadow-xl border border-white p-10 flex flex-col relative overflow-hidden">
            
            {/* SLAJD 0: OBAVEŠTENJA */}
            {activeTab === 0 && (
                <div className="animate-in fade-in slide-in-from-right duration-700">
                    <h3 className="text-[2.5vh] font-black text-orange-500 mb-8 uppercase flex items-center gap-3"><Bell /> Обавештења</h3>
                    <div className="space-y-4">
                        {data.ann?.slice(0, 3).map((a, i) => (
                            <div key={i} className="bg-orange-50 p-6 rounded-[2rem] border-l-[8px] border-orange-500 text-[2vh] font-bold text-slate-700 leading-tight">
                                {a.text}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SLAJD 1: VREMENSKA PROGNOZA (NOVO) */}
            {activeTab === 1 && (
                <div className="animate-in zoom-in duration-700 flex flex-col items-center justify-center h-full text-center">
                    <Sun size={120} className="text-orange-400 mb-6" />
                    <h3 className="text-[8vh] font-black leading-none">22°C</h3>
                    <p className="text-[3vh] font-bold text-slate-400 uppercase tracking-widest mt-2">Београд, Србија</p>
                    <div className="mt-10 grid grid-cols-2 gap-4 w-full">
                        <div className="bg-slate-50 p-4 rounded-3xl">
                            <p className="text-xs font-black text-slate-400 uppercase">Влажност</p>
                            <p className="text-xl font-black text-blue-500">45%</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-3xl">
                            <p className="text-xs font-black text-slate-400 uppercase">Ветар</p>
                            <p className="text-xl font-black text-blue-500">12 km/h</p>
                        </div>
                    </div>
                </div>
            )}

            {/* SLAJD 2: ROĐENDANI */}
            {activeTab === 2 && (
                <div className="animate-in slide-in-from-bottom duration-700">
                    <h3 className="text-[2.5vh] font-black text-pink-500 mb-8 uppercase flex items-center gap-3"><Cake /> Срећан рођендан</h3>
                    <div className="space-y-4">
                        {data.bdays?.map((b, i) => (
                            <div key={i} className="flex justify-between items-center bg-pink-50 p-6 rounded-[2rem] text-[2.5vh] font-black text-pink-700">
                                <span>{b.name}</span>
                                <span className="bg-white px-4 py-1 rounded-full text-sm uppercase">{b.class_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SLAJD 3: CITATI */}
            {activeTab === 3 && (
                <div className="animate-in zoom-in duration-700 flex flex-col items-center justify-center h-full text-center p-6">
                    <Quote size={60} className="text-blue-100 mb-6" />
                    <p className="text-[3vh] font-black italic text-slate-800 leading-relaxed">
                        "{data.quotes?.[0]?.text || "Здраво тело, здрав дух."}"
                    </p>
                    <p className="text-blue-500 font-bold mt-6 uppercase tracking-widest">— {data.quotes?.[0]?.author || "Народна пословица"}</p>
                </div>
            )}

            {/* PROGRESS BAR ROTACIJE */}
            <div className="absolute bottom-0 left-0 h-2 bg-blue-600 animate-[progress_15s_linear_infinite]" />
        </div>
      </div>
      <style jsx>{` @keyframes progress { from { width: 0%; } to { width: 100%; } } `}</style>
    </div>
  );
}