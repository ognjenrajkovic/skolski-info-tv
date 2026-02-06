'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, Quote, Cake, AlertTriangle, Sun, 
  BookOpen, User, Users, Droplets, Wind, Calendar 
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
      setData({ ann: ann.data || [], bdays: bdays.data || [], tt: tt.data || [], duty: duty.data, quotes: quotes.data || [], sys: sys.data || [] });
    } catch (e) { console.error(e); }
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
    const currentTotalMin = hour * 60 + min;
    const isMorning = currentTotalMin < (14 * 60); 
    const morningShiftSetting = data.sys?.find(s => s.key === 'current_morning_shift')?.value || 'Parna';
    const activeShift = isMorning ? morningShiftSetting : (morningShiftSetting === 'Parna' ? 'Neparna' : 'Parna');
    const days = ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"];
    
    const bellSchedule = [
      { num: 1, start: "08:00", end: "08:45" }, { num: 2, start: "08:50", end: "09:35" },
      { num: 3, start: "10:00", end: "10:45" }, { num: 4, start: "10:50", end: "11:35" },
      { num: 5, start: "11:40", end: "12:25" }, { num: 6, start: "12:30", end: "13:15" },
      { num: 7, start: "13:15", end: "14:00" },
      { num: 1, start: "14:00", end: "14:45" }, { num: 2, start: "14:50", end: "15:35" },
      { num: 3, start: "16:00", end: "16:45" }, { num: 4, start: "16:50", end: "17:35" },
      { num: 5, start: "17:40", end: "18:25" }, { num: 6, start: "18:30", end: "19:15" },
      { num: 7, start: "19:15", end: "20:00" }
    ];

    const currentSlot = bellSchedule.find(s => {
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      return currentTotalMin >= (sh * 60 + sm) && currentTotalMin < (eh * 60 + em);
    });

    return { 
      currentSlot, dobaDana: isMorning ? "ПРЕ ПОДНЕ" : "ПОСЛЕ ПОДНЕ", 
      currentDay: days[now.getDay()],
      dailyTimetable: data.tt?.filter(t => t.day === days[now.getDay()] && t.shift === activeShift && t.time_of_day === (isMorning ? "Pre podne" : "Posle podne")) || [],
      emergency: data.sys?.find(s => s.key === 'emergency')?.value 
    };
  }, [now, data]);

  useEffect(() => {
    const rotation = setInterval(() => setActiveTab(prev => (prev + 1) % 4), 15000);
    return () => clearInterval(rotation);
  }, []);

  if (status.emergency === "УЗБУНА") {
    return (
      <div className="h-screen w-screen bg-red-600 flex flex-col items-center justify-center text-white p-10">
        <AlertTriangle size={300} className="animate-bounce mb-8" />
        <h1 className="text-[18vh] font-black uppercase text-center leading-none">УЗБУНА</h1>
        <p className="text-[6vh] font-bold mt-10 tracking-[2rem] text-center">ЕВАКУАЦИЈА У ТОКУ</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#F0F2F5] text-slate-800 p-6 flex flex-col gap-6 overflow-hidden font-sans">
      
      {/* HEADER - GLASSMORPHISM */}
      <div className="h-[14vh] flex items-center justify-between px-12 bg-white/80 backdrop-blur-xl rounded-[3.5rem] shadow-xl border border-white/50">
        <div className="flex items-center gap-10">
          <div className="w-24 h-24 bg-white rounded-[2rem] p-3 flex items-center justify-center shadow-lg border border-slate-100">
            <img src="/logo.png" alt="Logo" className="object-contain w-full h-full" />
          </div>
          <div>
            <h1 className="text-[5.5vh] font-black tracking-tighter uppercase italic leading-none text-slate-900">{SCHOOL_NAME}</h1>
            <div className="flex items-center gap-6 mt-2">
              <span className="bg-blue-600 text-white px-5 py-1 rounded-2xl text-[2vh] font-black shadow-lg shadow-blue-200 uppercase">{status.dobaDana}</span>
              <div className="flex items-center gap-2 text-slate-400 font-bold text-[2.2vh]">
                <Calendar size={24} /> {status.currentDay}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-10 py-4 rounded-[2.5rem] shadow-2xl">
          <p className="text-[7.5vh] font-black tabular-nums leading-none tracking-tight">
            {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
            <span className="text-blue-400 text-[4vh] opacity-80 ml-2">:{now.getSeconds().toString().padStart(2, '0')}</span>
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* LEVO: RASPORED */}
        <div className="w-[64%] bg-white rounded-[4rem] p-12 flex flex-col shadow-2xl border border-white/50 relative">
          <div className="flex justify-between items-center mb-10 border-b-2 border-slate-100 pb-8">
            <h2 className="text-[5.5vh] font-black text-slate-900 uppercase italic tracking-tighter">Дневни распоред</h2>
            <div className={`px-10 py-5 rounded-3xl font-black text-[2.8vh] uppercase transition-all shadow-md ${status.currentSlot ? 'bg-blue-600 text-white animate-pulse shadow-blue-200' : 'bg-slate-100 text-slate-400'}`}>
               {status.currentSlot ? `${status.currentSlot.num}. ЧАС У ТОКУ` : 'ПАУЗА / ОДМОР'}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
            {status.dailyTimetable.map((item, idx) => (
              <div key={idx} className={`flex items-center p-6 rounded-[3rem] border-2 transition-all ${status.currentSlot?.num === item.period ? 'bg-blue-50 border-blue-200 shadow-inner' : 'bg-slate-50 border-transparent opacity-80'}`}>
                <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center font-black text-4xl shadow-sm ${status.currentSlot?.num === item.period ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-slate-400'}`}>
                  {item.period}
                </div>
                <div className="ml-10 flex-1">
                  <p className={`text-[4.8vh] font-black uppercase tracking-tight ${status.currentSlot?.num === item.period ? 'text-blue-700' : 'text-slate-800'}`}>
                    {item.class_name}
                  </p>
                </div>
                <div className={`px-12 py-5 rounded-[2rem] font-black text-[3.8vh] shadow-sm ${status.currentSlot?.num === item.period ? 'bg-white text-blue-600 border border-blue-100' : 'bg-white text-slate-500 border border-slate-100'}`}>
                  {item.room}
                </div>
              </div>
            ))}
          </div>

          {/* DEŽURSTVO BOX */}
          <div className="mt-10 bg-slate-50 rounded-[3rem] p-8 grid grid-cols-2 gap-10 border border-slate-100 shadow-inner">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><User size={40} /></div>
                <div>
                  <p className="text-[1.6vh] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Дежурни наставник</p>
                  <p className="text-[3.2vh] font-black text-slate-800 uppercase italic tracking-tighter">{data.duty?.teacher_name || '---'}</p>
                </div>
             </div>
             <div className="flex items-center gap-6 border-l-2 border-slate-200 pl-10">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><Users size={40} /></div>
                <div>
                  <p className="text-[1.6vh] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Дежурни ученици</p>
                  <p className="text-[2.8vh] font-black text-slate-600 italic uppercase tracking-tighter">{data.duty?.student_names || '---'}</p>
                </div>
             </div>
          </div>
        </div>

        {/* DESNO: DINAMIČKI PANELI */}
        <div className="w-[36%] flex flex-col gap-6">
          <div className="flex-1 bg-white rounded-[4rem] border border-white/50 relative overflow-hidden p-12 flex flex-col justify-center shadow-2xl">
            
            {activeTab === 0 && (
              <div className="animate-in fade-in slide-in-from-right duration-700">
                <div className="flex items-center gap-6 mb-10 text-orange-500 bg-orange-50 w-fit px-6 py-2 rounded-2xl">
                  <Bell size={45} />
                  <h3 className="font-black text-[3.5vh] uppercase italic">Важно</h3>
                </div>
                {data.ann?.[0]?.image_url && (
                  <div className="relative mb-8 shadow-2xl rounded-[3rem] overflow-hidden border-4 border-slate-50">
                    <img src={data.ann[0].image_url} className="w-full h-72 object-cover" />
                  </div>
                )}
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                  <p className="text-[3.8vh] font-black leading-tight text-slate-800 italic">{data.ann?.[0]?.text || "Уживајте у дану!"}</p>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="animate-in zoom-in duration-700 flex flex-col items-center text-center">
                 <div className="p-10 bg-amber-50 rounded-[4rem] mb-8 shadow-inner border border-amber-100">
                    <Sun size={140} className="text-amber-500 drop-shadow-lg" />
                 </div>
                 <h3 className="text-[12vh] font-black leading-none text-slate-900 tracking-tighter">24°C</h3>
                 <p className="text-amber-600 font-black text-[3.2vh] uppercase mt-4 tracking-[0.5rem]">Београд</p>
              </div>
            )}

            {activeTab === 2 && (
              <div className="animate-in slide-in-from-bottom duration-700">
                <div className="flex items-center gap-6 mb-10 text-pink-500 bg-pink-50 w-fit px-6 py-2 rounded-2xl">
                  <Cake size={45} />
                  <h3 className="font-black text-[3.5vh] uppercase italic">Рођендани</h3>
                </div>
                <div className="space-y-6">
                  {data.bdays.slice(0, 3).map((b, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                      <span className="text-[3.8vh] font-black text-slate-800 tracking-tighter">{b.name}</span>
                      <span className="bg-pink-500 text-white px-8 py-2 rounded-2xl text-[2.2vh] font-black shadow-lg shadow-pink-100">{b.class_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 3 && (
              <div className="animate-in fade-in duration-1000 text-center px-4">
                 <Quote size={100} className="text-blue-100 mx-auto mb-10" />
                 <p className="text-[4.2vh] font-black italic text-slate-800 leading-tight">
                   "{data.quotes[0]?.text || "Знање је моћ."}"
                 </p>
                 <div className="w-24 h-2 bg-blue-500 mx-auto my-12 rounded-full shadow-lg shadow-blue-100" />
                 <p className="text-blue-600 font-black uppercase text-[2.8vh] tracking-widest">
                   — {data.quotes[0]?.author || "Мудрост"}
                 </p>
              </div>
            )}

            <div className="absolute bottom-0 left-0 h-4 bg-blue-600/10 w-full">
              <div className="h-full bg-blue-600 animate-[progress_15s_linear_infinite]" />
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