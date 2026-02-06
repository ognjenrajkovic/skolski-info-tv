'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, Quote, Cake, AlertTriangle, Sun, Clock, 
  BookOpen, User, Users, Thermometer, Wind, Droplets 
} from 'lucide-react';
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
    } catch (e) { console.error("Greška:", e); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(interval); clearInterval(timer); };
  }, []);

  const status = useMemo(() => {
    const hour = now.getHours();
    const min = now.getMinutes();
    const currentMin = hour * 60 + min;
    
    // Određivanje smene na osnovu vremena (Pre podne je do 13:59)
    const isMorning = currentMin < (14 * 60); 
    
    const morningShiftSetting = data.sys?.find(s => s.key === 'current_morning_shift')?.value || 'Parna';
    const activeShift = isMorning ? morningShiftSetting : (morningShiftSetting === 'Parna' ? 'Neparna' : 'Parna');
    const dobaDana = isMorning ? "Пре подне" : "После подне";
    const days = ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"];
    const currentDay = days[now.getDay()];

    // TVOJA PRECIZNA SATNICA
    const bellSchedule = [
      // Pre podne
      { num: 1, start: "08:00", end: "08:45" },
      { num: 2, start: "08:50", end: "09:35" },
      { num: 3, start: "10:00", end: "10:45" },
      { num: 4, start: "10:50", end: "11:35" },
      { num: 5, start: "11:40", end: "12:25" },
      { num: 6, start: "12:30", end: "13:15" },
      { num: 7, start: "13:15", end: "14:00" },
      // Posle podne (+6 sati)
      { num: 1, start: "14:00", end: "14:45" },
      { num: 2, start: "14:50", end: "15:35" },
      { num: 3, start: "16:00", end: "16:45" },
      { num: 4, start: "16:50", end: "17:35" },
      { num: 5, start: "17:40", end: "18:25" },
      { num: 6, start: "18:30", end: "19:15" },
      { num: 7, start: "19:15", end: "20:00" }
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

  useEffect(() => {
    const rotation = setInterval(() => setActiveTab(prev => (prev + 1) % 4), 15000);
    return () => clearInterval(rotation);
  }, []);

  if (status.emergency === "УЗБУНА") {
    return (
      <div className="h-screen w-screen bg-red-600 flex flex-col items-center justify-center text-white p-10">
        <AlertTriangle size={200} className="animate-bounce mb-8" />
        <h1 className="text-[15vh] font-black uppercase text-center leading-none tracking-tighter">УЗБУНА</h1>
        <p className="text-[4vh] font-bold mt-10 opacity-90 tracking-widest uppercase text-center">Хитно напустите објекат!</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#020617] text-slate-100 p-[1.5vh] flex flex-col gap-[1.5vh] overflow-hidden font-sans">
      
      {/* HEADER */}
      <div className="h-[12vh] flex items-center justify-between px-10 bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-white rounded-2xl p-2 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="object-contain h-full" />
          </div>
          <div>
            <h1 className="text-[3.5vh] font-black tracking-tighter uppercase italic leading-none">{SCHOOL_NAME}</h1>
            <div className="flex items-center gap-3 mt-1">
               <span className="bg-blue-600/20 text-blue-400 px-3 py-0.5 rounded-full text-[1.4vh] font-black uppercase tracking-widest border border-blue-500/20">
                 {status.dobaDana}
               </span>
               <div className="w-1 h-1 bg-slate-700 rounded-full" />
               <span className="text-slate-400 text-[1.4vh] font-bold uppercase tracking-widest">{status.currentDay}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[5.5vh] font-black tabular-nums leading-none text-white tracking-tighter">
            {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
            <span className="text-blue-500 text-[2.5vh] ml-1 opacity-50">:{now.getSeconds().toString().padStart(2, '0')}</span>
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-[1.5vh] min-h-0">
        {/* LEVO: RASPORED */}
        <div className="w-[62%] bg-white rounded-[3.5rem] p-10 flex flex-col shadow-2xl overflow-hidden relative">
          <div className="flex justify-between items-end mb-8 border-b border-slate-100 pb-6">
            <div>
              <p className="text-blue-600 font-black text-[1.4vh] uppercase tracking-[0.3em] mb-1 italic">Распоред часова</p>
              <h2 className="text-[4.2vh] font-black text-slate-900 tracking-tighter uppercase italic leading-none">Кабинети и одељења</h2>
            </div>
            <div className={`px-6 py-3 rounded-2xl font-black text-[1.8vh] uppercase tracking-widest transition-all ${status.currentSlot ? 'bg-blue-600 text-white animate-pulse shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
               {status.currentSlot ? `${status.currentSlot.num}. Час у току` : 'ОДМОР'}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar text-slate-900">
            {status.dailyTimetable.length > 0 ? status.dailyTimetable.map((item, idx) => (
              <div key={idx} className={`flex items-center p-5 rounded-[2rem] transition-all border-2 ${status.currentSlot?.num === item.period ? 'bg-blue-600 border-blue-400 shadow-xl' : 'bg-slate-50 border-transparent opacity-90'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl ${status.currentSlot?.num === item.period ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                  {item.period}
                </div>
                <div className="ml-8 flex-1">
                  <p className={`text-[3.2vh] font-black leading-none uppercase tracking-tight ${status.currentSlot?.num === item.period ? 'text-white' : 'text-slate-800'}`}>
                    {item.class_name}
                  </p>
                </div>
                <div className={`px-10 py-3 rounded-2xl font-black text-[2.5vh] ${status.currentSlot?.num === item.period ? 'bg-blue-700 text-white' : 'bg-white text-blue-600 shadow-sm border border-slate-100'}`}>
                  {item.room}
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center opacity-10 italic">
                <BookOpen size={100} />
                <p className="text-2xl font-black uppercase mt-4">Нема података за данас</p>
              </div>
            )}
          </div>

          <div className="mt-8 bg-slate-900 rounded-[2.5rem] p-6 text-white grid grid-cols-2 gap-4 border border-slate-700">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400"><User size={28} /></div>
                <div>
                  <p className="text-[1vh] font-bold text-slate-500 uppercase tracking-widest">Наставник на дежурству</p>
                  <p className="text-[2.2vh] font-black tracking-tight uppercase italic">{data.duty?.teacher_name || '---'}</p>
                </div>
             </div>
             <div className="flex items-center gap-4 border-l border-slate-800 pl-6">
                <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center text-emerald-400"><Users size={28} /></div>
                <div>
                  <p className="text-[1vh] font-bold text-slate-500 uppercase tracking-widest">Дежурни ученици</p>
                  <p className="text-[1.8vh] font-bold text-slate-300 italic truncate uppercase">{data.duty?.student_names || '---'}</p>
                </div>
             </div>
          </div>
        </div>

        {/* DESNO: SLAJDOVI */}
        <div className="w-[38%] flex flex-col gap-[1.5vh]">
          <div className="flex-1 bg-slate-900 rounded-[3.5rem] border border-slate-800 relative overflow-hidden p-10 flex flex-col justify-center shadow-2xl">
            
            {activeTab === 0 && (
              <div className="animate-in slide-in-from-right duration-700">
                <div className="flex items-center gap-4 mb-8 text-orange-500">
                  <Bell size={35} />
                  <h3 className="font-black text-[2.8vh] uppercase tracking-widest italic">Важно</h3>
                </div>
                {data.ann?.[0]?.image_url && (
                  <img src={data.ann[0].image_url} className="w-full h-48 object-cover rounded-3xl mb-6 border border-white/10" alt="News" />
                )}
                <div className="space-y-4">
                  {data.ann.slice(0, 2).map((a, i) => (
                    <div key={i} className="bg-white/5 p-6 rounded-[2rem] border-l-8 border-orange-500 backdrop-blur-sm">
                      <p className="text-[2.6vh] font-black leading-tight text-white">{a.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="animate-in zoom-in duration-700 flex flex-col items-center text-center">
                 <div className="w-32 h-32 bg-amber-500/10 rounded-[3rem] flex items-center justify-center text-amber-500 mb-8 border border-amber-500/20">
                    <Sun size={80} className="animate-pulse" />
                 </div>
                 <h3 className="text-[10vh] font-black leading-none tracking-tighter">24°C</h3>
                 <p className="text-amber-500 font-black text-[2.2vh] uppercase mt-4 tracking-[0.4em]">Сунчано • Београд</p>
                 <div className="grid grid-cols-2 gap-8 mt-12 opacity-50">
                    <div className="flex flex-col items-center bg-white/5 px-6 py-4 rounded-3xl"><Droplets size={24} className="mb-2 text-blue-400" /><p className="font-black text-xl">44%</p></div>
                    <div className="flex flex-col items-center bg-white/5 px-6 py-4 rounded-3xl"><Wind size={24} className="mb-2 text-slate-400" /><p className="font-black text-xl">12km/h</p></div>
                 </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className="animate-in slide-in-from-bottom duration-700">
                <div className="flex items-center gap-4 mb-8 text-pink-500">
                  <Cake size={35} />
                  <h3 className="font-black text-[2.8vh] uppercase tracking-widest italic">Рођендани</h3>
                </div>
                <div className="space-y-4">
                  {data.bdays.slice(0, 4).map((b, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
                      <span className="text-[3.2vh] font-black tracking-tight">{b.name}</span>
                      <span className="bg-pink-600 px-6 py-2 rounded-full text-[1.6vh] font-black uppercase shadow-lg shadow-pink-900/20">{b.class_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 3 && (
              <div className="animate-in fade-in duration-1000 flex flex-col items-center text-center p-6">
                 <Quote size={80} className="text-blue-500/20 mb-10" />
                 <p className="text-[3.8vh] font-black italic leading-tight text-slate-200">
                   "{data.quotes[0]?.text || "Знање је моћ."}"
                 </p>
                 <div className="w-16 h-1 bg-blue-600 my-10 rounded-full" />
                 <p className="text-blue-500 font-black uppercase tracking-[0.3em] text-[1.8vh]">
                   — {data.quotes[0]?.author || "Мудрост"}
                 </p>
              </div>
            )}

            <div className="absolute bottom-0 left-0 h-2 bg-blue-600 animate-[progress_15s_linear_infinite]" />
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