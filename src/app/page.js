'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Quote, Cake, AlertTriangle, Sun, Clock, MapPin, User, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SCHOOL_NAME = "ОШ „КАРАЂОРЂЕ”";

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], duty: null, quotes: [], sys: [] });
  const [activeTab, setActiveTab] = useState(0);

  const fetchData = async () => {
    try {
      const [ann, bdays, tt, duty, quotes, sys] = await Promise.all([
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('birthdays').select('*'),
        supabase.from('timetable').select('*').order('period', { ascending: true }),
        supabase.from('duty_staff').select('*').single(),
        supabase.from('quotes').select('*'),
        supabase.from('system_settings').select('*')
      ]);
      setData({ 
        ann: ann.data || [], 
        bdays: bdays.data || [], 
        tt: tt.data || [], 
        duty: duty.data, 
        quotes: quotes.data || [], 
        sys: sys.data || [] 
      });
    } catch (e) { console.error("Greška pri osvežavanju:", e); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Osveži podatke na 15s
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(interval); clearInterval(timer); };
  }, []);

  const status = useMemo(() => {
    const hour = now.getHours();
    const isMorning = hour < 14;
    const currentMin = hour * 60 + now.getMinutes();
    const morningShift = data.sys?.find(s => s.key === 'current_morning_shift')?.value || 'Parna';
    const activeShift = isMorning ? morningShift : (morningShift === 'Parna' ? 'Neparna' : 'Parna');
    const dobaDana = isMorning ? "Пре подне" : "После подне";
    const days = ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"];
    const currentDay = days[now.getDay()];

    const bellSchedule = [
      { num: 1, start: "08:00", end: "08:45" }, { num: 2, start: "08:50", end: "09:35" },
      { num: 3, start: "10:00", end: "10:45" }, { num: 4, start: "10:50", end: "11:35" },
      { num: 5, start: "11:40", end: "12:25" }, { num: 6, start: "12:30", end: "13:15" },
      { num: 1, start: "14:00", end: "14:45" }, { num: 2, start: "14:50", end: "15:35" },
      { num: 3, start: "16:00", end: "16:45" }, { num: 4, start: "16:50", end: "17:35" },
      { num: 5, start: "17:40", end: "18:25" }, { num: 6, start: "18:30", end: "19:15" }
    ];

    const currentSlot = bellSchedule.find(s => {
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      return currentMin >= (sh * 60 + sm) && currentMin < (eh * 60 + em);
    });

    const dailyTimetable = data.tt?.filter(t => 
      t.day === currentDay && t.shift === activeShift && t.time_of_day === (isMorning ? "Pre podne" : "Posle podne")
    ) || [];

    return { currentSlot, dobaDana, currentDay, dailyTimetable, emergency: data.sys?.find(s => s.key === 'emergency')?.value };
  }, [now, data]);

  // Rotacija desnih slajdova
  useEffect(() => {
    const speed = parseInt(data.sys?.find(s => s.key === 'rotation_speed')?.value || '15000');
    const rotation = setInterval(() => {
      setActiveTab(prev => (prev + 1) % 4);
    }, speed);
    return () => clearInterval(rotation);
  }, [data.sys]);

  if (status.emergency === "УЗБУНА") {
    return (
      <div className="h-screen w-screen bg-red-600 flex flex-col items-center justify-center text-white p-10 overflow-hidden">
        <div className="animate-ping mb-12">
          <AlertTriangle size={250} />
        </div>
        <h1 className="text-[18vh] font-[1000] tracking-tighter uppercase text-center leading-none">УЗБУНА</h1>
        <p className="text-[5vh] font-bold mt-10 opacity-80 uppercase tracking-widest text-center">Пратите упутства за евакуацију!</p>
      </div>
    );
  }

  const currentAnn = data.ann?.[activeTab % (data.ann.length || 1)];

  return (
    <div className="h-screen w-screen bg-[#020617] text-slate-100 p-[1.5vh] flex flex-col gap-[1.5vh] overflow-hidden font-sans">
      
      {/* --- TOP BAR --- */}
      <div className="h-[12vh] flex items-center justify-between px-10 bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-white rounded-2xl p-2 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <img src="/logo.png" alt="School" className="object-contain" />
          </div>
          <div>
            <h1 className="text-[3.5vh] font-[1000] tracking-tighter uppercase italic leading-none">{SCHOOL_NAME}</h1>
            <div className="flex items-center gap-3 mt-1">
               <span className="bg-blue-600/20 text-blue-400 px-3 py-0.5 rounded-full text-[1.4vh] font-black uppercase tracking-widest border border-blue-500/20">
                 {status.dobaDana}
               </span>
               <div className="w-1 h-1 bg-slate-700 rounded-full" />
               <span className="text-slate-400 text-[1.4vh] font-bold uppercase tracking-widest">{status.currentDay}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-12">
           <div className="flex items-center gap-4 bg-slate-800/30 px-6 py-3 rounded-3xl border border-slate-700/30">
              <Sun className="text-amber-400" size={32} />
              <div className="text-right">
                <p className="text-[2.8vh] font-black leading-none tabular-nums">22°C</p>
                <p className="text-[1vh] font-bold text-slate-500 uppercase tracking-widest">Београд</p>
              </div>
           </div>
           <div className="text-right min-w-[150px]">
              <p className="text-[5.5vh] font-black tabular-nums leading-none tracking-tighter text-white">
                {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
                <span className="text-blue-500 text-[2.5vh] ml-1 opacity-50">:{now.getSeconds().toString().padStart(2, '0')}</span>
              </p>
           </div>
        </div>
      </div>

      <div className="flex-1 flex gap-[1.5vh] min-h-0">
        
        {/* --- LEFT: TIMETABLE --- */}
        <div className="w-[62%] bg-white rounded-[3.5rem] p-10 flex flex-col shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50" />
          
          <div className="relative z-10 flex justify-between items-end mb-8 border-b border-slate-100 pb-6">
            <div>
              <p className="text-blue-600 font-black text-[1.4vh] uppercase tracking-[0.3em] mb-1">Дневни распоред часова</p>
              <h2 className="text-[4.5vh] font-[1000] text-slate-900 tracking-tighter uppercase italic leading-none">Кабинети и одељења</h2>
            </div>
            <div className={`px-8 py-3 rounded-[1.5rem] font-black text-[2vh] uppercase tracking-widest shadow-sm ${status.currentSlot ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
               {status.currentSlot ? `${status.currentSlot.num}. Час у току` : 'Велики одмор'}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-4 custom-scrollbar relative z-10">
            {status.dailyTimetable.length > 0 ? status.dailyTimetable.map((item, idx) => (
              <div key={idx} className={`flex items-center p-5 rounded-[2rem] transition-all border-2 ${status.currentSlot?.num === item.period ? 'bg-blue-600 border-blue-400 shadow-xl shadow-blue-200 translate-x-4' : 'bg-slate-50 border-transparent opacity-80 hover:opacity-100'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner ${status.currentSlot?.num === item.period ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                  {item.period}
                </div>
                <div className="ml-8 flex-1">
                  <p className={`text-[3.2vh] font-[1000] leading-none uppercase tracking-tight ${status.currentSlot?.num === item.period ? 'text-white' : 'text-slate-800'}`}>
                    {item.class_name}
                  </p>
                </div>
                <div className={`px-10 py-3 rounded-2xl font-black text-[2.8vh] tracking-tighter shadow-sm ${status.currentSlot?.num === item.period ? 'bg-blue-700/40 text-white' : 'bg-white text-blue-600'}`}>
                  {item.room}
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                <BookOpen size={80} className="text-slate-400" />
                <p className="text-3xl font-black mt-4">Распоред није унет</p>
              </div>
            )}
          </div>

          {/* DEŽURSTVO (Zakačeno za raspored) */}
          <div className="mt-8 bg-slate-900 rounded-[2.5rem] p-6 text-white grid grid-cols-2 gap-8 items-center border border-slate-700 shadow-xl">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-[1vh] font-bold text-slate-500 uppercase tracking-widest">Наставник на дужности</p>
                  <p className="text-[2.2vh] font-black tracking-tight">{data.duty?.teacher_name || '---'}</p>
                </div>
             </div>
             <div className="flex items-center gap-4 border-l border-slate-800 pl-8">
                <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center text-emerald-400">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-[1vh] font-bold text-slate-500 uppercase tracking-widest">Дежурни ученици</p>
                  <p className="text-[1.8vh] font-bold text-slate-300 italic truncate max-w-[200px]">{data.duty?.student_names || '---'}</p>
                </div>
             </div>
          </div>
        </div>

        {/* --- RIGHT: ROTATING SLIDES --- */}
        <div className="w-[38%] flex flex-col gap-[1.5vh]">
          
          {/* SLIDE CONTENT AREA */}
          <div className="flex-1 bg-slate-900 rounded-[3.5rem] border border-slate-800 shadow-2xl relative overflow-hidden p-10 flex flex-col justify-center">
            
            {/* OBAVEŠTENJE SA SLIKOM (POSTER MOD) */}
            {currentAnn?.image_url && activeTab === 0 ? (
              <div className="absolute inset-0 z-0 animate-in zoom-in duration-1000 scale-105">
                <img src={currentAnn.image_url} className="w-full h-full object-cover opacity-40 blur-[2px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent" />
              </div>
            ) : null}

            <div className="relative z-10">
              {activeTab === 0 && (
                <div className="animate-in slide-in-from-right duration-700">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500">
                      <Bell size={28} />
                    </div>
                    <h3 className="text-orange-500 font-black text-[2.5vh] uppercase tracking-widest italic">Важно</h3>
                  </div>
                  <div className="space-y-6">
                    {data.ann.filter(a => !a.image_url || activeTab === 0).slice(0, 2).map((a, i) => (
                      <div key={i} className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-xl">
                        <p className="text-[2.6vh] font-black leading-tight text-white">{a.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 1 && (
                <div className="animate-in zoom-in duration-700 flex flex-col items-center text-center">
                   <div className="w-32 h-32 bg-amber-500/10 rounded-[3rem] flex items-center justify-center text-amber-500 mb-8 border border-amber-500/20">
                    <Sun size={80} />
                   </div>
                   <h3 className="text-[10vh] font-[1000] leading-none text-white tracking-tighter">22°C</h3>
                   <p className="text-amber-500 font-black text-[2.2vh] uppercase tracking-[0.4em] mt-4 italic">Београд, Србија</p>
                   <div className="grid grid-cols-2 gap-4 mt-12 w-full max-w-[300px]">
                      <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                        <p className="text-[1vh] font-bold text-slate-500 uppercase mb-1">Ветар</p>
                        <p className="text-xl font-black">12 km/h</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                        <p className="text-[1vh] font-bold text-slate-500 uppercase mb-1">Влага</p>
                        <p className="text-xl font-black">44%</p>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 2 && (
                <div className="animate-in slide-in-from-bottom duration-700">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-pink-500/20 rounded-2xl flex items-center justify-center text-pink-500">
                      <Cake size={28} />
                    </div>
                    <h3 className="text-pink-500 font-black text-[2.5vh] uppercase tracking-widest italic">Срећан рођендан</h3>
                  </div>
                  <div className="space-y-4">
                    {data.bdays.map((b, i) => (
                      <div key={i} className="flex justify-between items-center bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                        <span className="text-[3.5vh] font-[1000] tracking-tight">{b.name}</span>
                        <span className="bg-pink-600 px-6 py-2 rounded-full text-[1.6vh] font-black uppercase">{b.class_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 3 && (
                <div className="animate-in fade-in duration-1000 flex flex-col items-center text-center p-6">
                   <Quote size={80} className="text-blue-500/20 mb-10" />
                   <p className="text-[3.8vh] font-black italic leading-tight text-slate-200">
                     "{data.quotes[0]?.text || "Учење је једина ствар коју ум никада не исцрпи."}"
                   </p>
                   <div className="w-12 h-1 bg-blue-600 my-8 rounded-full" />
                   <p className="text-blue-500 font-[1000] uppercase tracking-[0.3em] text-[1.8vh]">
                     — {data.quotes[0]?.author || "Леонардо да Винчи"}
                   </p>
                </div>
              )}
            </div>

            {/* PROGRESS BAR */}
            <div className="absolute bottom-0 left-0 h-1.5 bg-blue-600 animate-[progress_15s_linear_infinite]" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.01); }
        }
      `}</style>
    </div>
  );
}