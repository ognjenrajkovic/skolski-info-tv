'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Bell, Thermometer, Quote, Cake, AlertTriangle, BookOpen, UserCheck, Sun, Cloud, CloudRain, Snowflake } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SCHOOL_NAME = "ОШ „КАРАЂОРЂЕ”";

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [announcements, setAnnouncements] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [duty, setDuty] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [weather, setWeather] = useState({ temp: '--', code: 0 });
  const [emergency, setEmergency] = useState('НОРМАЛНО');
  const [morningShift, setMorningShift] = useState('Parna');
  const [activeTab, setActiveTab] = useState(0);

  const fetchData = async () => {
    try {
      const { data: ann } = await supabase.from('announcements').select('*');
      const { data: bdays } = await supabase.from('birthdays').select('*');
      const { data: tt } = await supabase.from('timetable').select('*');
      const { data: dt } = await supabase.from('duty_staff').select('*').single();
      const { data: qt } = await supabase.from('quotes').select('*');
      const { data: sys } = await supabase.from('system_settings').select('*');
      
      setAnnouncements(ann || []);
      setBirthdays(bdays || []);
      setTimetable(tt || []);
      setDuty(dt);
      setQuotes(qt || []);
      
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
    const rotation = setInterval(() => setActiveTab((prev) => (prev + 1) % 4), 15000);
    return () => { clearInterval(timer); clearInterval(rotation); };
  }, []);

  const status = useMemo(() => {
    const hour = now.getHours();
    const isMorning = hour < 14;
    const currentMin = hour * 60 + now.getMinutes();
    
    // Logika za raspored: Koja je smena (Parna/Neparna) trenutno u zgradi
    const activeShiftInBuilding = isMorning ? morningShift : (morningShift === 'Parna' ? 'Neparna' : 'Parna');
    const dobaDanaText = isMorning ? "ПРЕ ПОДНЕ" : "ПОСЛЕ ПОДНЕ";

    const days = ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"];
    const currentDay = days[now.getDay()];

    // FILTRIRANJE: Dan + Smena + Doba dana (Pre/Posle podne)
    const currentRooms = (timetable || []).filter(t => 
      t.day === currentDay && 
      t.shift === activeShiftInBuilding && 
      t.time_of_day === (isMorning ? "Pre podne" : "Posle podne")
    );

    return { isMorning, currentDay, dobaDanaText, currentRooms };
  }, [now, timetable, morningShift]);

  if (emergency === "УЗБУНА") {
    return (
      <div className="h-screen w-screen bg-red-700 flex flex-col items-center justify-center text-white">
        <AlertTriangle size={300} className="animate-bounce" />
        <h1 className="text-[15vh] font-black uppercase">УЗБУНА</h1>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] p-[1.5vh] flex flex-col font-sans overflow-hidden text-slate-900">
      
      {/* HEADER */}
      <div className="h-[12vh] bg-white rounded-[2.5rem] shadow-sm flex justify-between items-center px-[5vh] mb-[1.5vh] border border-slate-100">
        <div className="flex items-center gap-[4vh]">
          <img src="/logo.png" alt="Logo" className="h-[8vh] w-auto" />
          <div>
            <h1 className="text-[4vh] font-[1000] uppercase tracking-tighter leading-none">{SCHOOL_NAME}</h1>
            <div className="flex gap-3 mt-1">
                <span className="text-blue-600 font-black text-[2vh]">{status.dobaDanaText}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-10 text-right">
           <div className="border-r border-slate-100 pr-10">
              <p className="text-[2vh] font-bold text-slate-400 uppercase">{status.currentDay}</p>
              <p className="text-[5vh] font-black tabular-nums leading-none">
                {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
              </p>
           </div>
           <div className="flex flex-col items-center bg-slate-50 p-4 rounded-3xl min-w-[120px]">
              <Sun className="text-orange-400 mb-1" size={30} />
              <span className="text-[3vh] font-black">22°C</span>
           </div>
        </div>
      </div>

      <div className="flex flex-1 gap-[1.5vh] min-h-0">
        
        {/* LEVA STRANA - RASPORED (Fiksno da đaci vide gde idu) */}
        <div className="w-[65%] bg-white rounded-[4rem] shadow-xl flex flex-col border border-white overflow-hidden p-[4vh]">
            <div className="flex justify-between items-end mb-8 border-b-4 border-slate-50 pb-6">
                <h2 className="text-[5vh] font-[1000] tracking-tighter uppercase italic flex items-center gap-4">
                   <BookOpen size={50} className="text-blue-600"/> Распоред Кабинета
                </h2>
                <span className="text-slate-400 font-bold text-[2vh] mb-2 uppercase tracking-widest">{status.currentDay} - {status.dobaDanaText}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-[2vh] overflow-y-auto pr-2 custom-scrollbar">
                {status.currentRooms.length > 0 ? status.currentRooms.map((r, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-6 rounded-[3rem] border border-slate-100 hover:scale-[1.02] transition-transform">
                        <span className="text-[3.5vh] font-black text-slate-800">{r.class_name}</span>
                        <span className="bg-white px-8 py-2 rounded-full font-black text-blue-600 shadow-sm border border-blue-50 text-[2.5vh]">{r.room}</span>
                    </div>
                )) : (
                    <div className="col-span-2 flex flex-col items-center justify-center h-full opacity-20">
                        <BookOpen size={100} />
                        <p className="text-[3vh] font-black uppercase mt-4">Распоред није унет</p>
                    </div>
                )}
            </div>
        </div>

        {/* DESNA STRANA - ROTACIJA I DEŽURSTVO */}
        <div className="w-[35%] flex flex-col gap-[1.5vh]">
            
            {/* ROTIRAJUĆI DEO */}
            <div className="flex-1 bg-white rounded-[4rem] shadow-xl p-[5vh] relative overflow-hidden border border-white">
                {activeTab === 0 && (
                  <div className="animate-in fade-in duration-500">
                    <h3 className="text-[3vh] font-black text-orange-500 mb-6 uppercase flex items-center gap-3"><Bell /> Обавештења</h3>
                    <div className="space-y-4">
                        {announcements.slice(0, 3).map((a, i) => (
                          <div key={i} className="bg-orange-50/50 p-6 rounded-[2.5rem] border-l-[10px] border-orange-500 text-[2.4vh] font-bold text-slate-700">{a.text}</div>
                        ))}
                    </div>
                  </div>
                )}

                {activeTab === 1 && (
                  <div className="animate-in slide-in-from-right duration-500">
                    <h3 className="text-[3vh] font-black text-pink-500 mb-8 uppercase flex items-center gap-3"><Cake /> Рођендани 🎂</h3>
                    <div className="space-y-4">
                        {birthdays.map((b, i) => (
                          <div key={i} className="flex justify-between items-center bg-pink-50/50 p-6 rounded-[2.5rem] text-[3vh] font-black text-pink-700 border border-pink-100">
                            <span>{b.name}</span>
                            <span className="text-[1.8vh] bg-white px-4 py-1 rounded-full uppercase">{b.class_name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {activeTab === 2 && (
                    <div className="animate-in zoom-in duration-500 h-full flex flex-col items-center justify-center text-center">
                        <Quote size={60} className="text-slate-100 mb-6" />
                        <p className="text-[3.2vh] font-black italic text-slate-800 leading-tight">"{quotes[0]?.text || "Знање је моћ."}"</p>
                        <p className="text-blue-500 font-bold mt-4 uppercase tracking-widest">— {quotes[0]?.author || "Народна изрека"}</p>
                    </div>
                )}
                
                <div className="absolute bottom-0 left-0 h-2 bg-blue-600 animate-[progress_15s_linear_infinite]" />
            </div>

            {/* DEŽURSTVO BOKS (UVEK VIDLJIV) */}
            <div className="h-[28vh] bg-slate-900 rounded-[3.5rem] shadow-2xl p-8 text-white relative overflow-hidden border-4 border-blue-600/20">
                <div className="flex items-center gap-4 mb-4 text-blue-400">
                    <UserCheck size={32} />
                    <h4 className="font-black text-[2.2vh] uppercase tracking-widest italic">Дежурство</h4>
                </div>
                <div className="space-y-3">
                    <div>
                        <p className="text-[1.5vh] text-slate-500 font-bold uppercase tracking-widest">Наставник</p>
                        <p className="text-[3.2vh] font-black leading-tight text-white">{duty?.teacher_name || '---'}</p>
                    </div>
                    <div>
                        <p className="text-[1.5vh] text-slate-500 font-bold uppercase tracking-widest">Ученици</p>
                        <p className="text-[2.2vh] font-bold text-slate-300 italic leading-tight">{duty?.student_names || '---'}</p>
                    </div>
                </div>
                <div className="absolute top-8 right-8 bg-blue-600 px-4 py-1 rounded-full text-[1.4vh] font-black uppercase tracking-widest">
                    {duty?.floor || 'Приземље'}
                </div>
            </div>

        </div>
      </div>
      <style jsx>{` 
        @keyframes progress { from { width: 0%; } to { width: 100%; } } 
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
}