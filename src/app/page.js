'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, Quote, Cake, AlertTriangle, Sun, 
  BookOpen, User, Users, Droplets, Wind 
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
    } catch (e) { console.error("Greška pri preuzimanju:", e); }
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
    const currentDay = days[now.getDay()];

    const bellSchedule = [
      // PRE PODNE
      { num: 1, start: "08:00", end: "08:45" },
      { num: 2, start: "08:50", end: "09:35" },
      { num: 3, start: "10:00", end: "10:45" },
      { num: 4, start: "10:50", end: "11:35" },
      { num: 5, start: "11:40", end: "12:25" },
      { num: 6, start: "12:30", end: "13:15" },
      { num: 7, start: "13:15", end: "14:00" },
      // POSLE PODNE (+6 sati)
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
      return currentTotalMin >= (sh * 60 + sm) && currentTotalMin < (eh * 60 + em);
    });

    const dailyTimetable = data.tt?.filter(t => 
      t.day === currentDay && t.shift === activeShift && t.time_of_day === (isMorning ? "Pre podne" : "Posle podne")
    ) || [];

    return { 
      currentSlot, 
      dobaDana: isMorning ? "ПРЕ ПОДНЕ" : "ПОСЛЕ ПОДНЕ", 
      currentDay, 
      dailyTimetable, 
      emergency: data.sys?.find(s => s.key === 'emergency')?.value 
    };
  }, [now, data]);

  useEffect(() => {
    const rotation = setInterval(() => setActiveTab(prev => (prev + 1) % 4), 15000);
    return () => clearInterval(rotation);
  }, []);

  if (status.emergency === "УЗБУНА") {
    return (
      <div className="h-screen w-screen bg-red-700 flex flex-col items-center justify-center text-white">
        <AlertTriangle size={300} className="animate-pulse mb-10" />
        <h1 className="text-[20vh] font-black leading-none">УЗБУНА</h1>
        <p className="text-[5vh] font-bold mt-5 tracking-[1rem]">ХИТНО НАПУСТИТЕ ОБЈЕКАТ</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#020617] text-white p-4 flex flex-col gap-4 overflow-hidden">
      
      {/* HEADER */}
      <div className="h-[15vh] flex items-center justify-between px-12 bg-slate-900/60 rounded-[3rem] border border-slate-800">
        <div className="flex items-center gap-10">
          <div className="w-24 h-24 bg-white rounded-3xl p-3 flex items-center justify-center shadow-2xl">
            <img src="/logo.png" alt="Logo" className="object-contain w-full h-full" />
          </div>
          <div>
            <h1 className="text-[5vh] font-black tracking-tighter uppercase italic leading-none">{SCHOOL_NAME}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="bg-blue-600 px-4 py-1 rounded-xl text-[1.8vh] font-black">{status.dobaDana}</span>
              <span className="text-slate-400 text-[2vh] font-bold uppercase tracking-widest">{status.currentDay}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[8vh] font-black tabular-nums leading-none">
            {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
            <span className="text-blue-500 text-[4vh] opacity-50 ml-2">:{now.getSeconds().toString().padStart(2, '0')}</span>
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* LEVO: RASPORED (VEĆI FONT) */}
        <div className="w-[65%] bg-white rounded-[4rem] p-12 flex flex-col shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center mb-10 border-b-4 border-slate-100 pb-8">
            <h2 className="text-[5vh] font-black text-slate-900 uppercase italic">Распоред часова</h2>
            <div className={`px-8 py-4 rounded-3xl font-black text-[2.5vh] uppercase transition-all ${status.currentSlot ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
               {status.currentSlot ? `${status.currentSlot.num}. ЧАС У ТОКУ` : 'ПАУЗА / ОДМОР'}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
            {status.dailyTimetable.map((item, idx) => (
              <div key={idx} className={`flex items-center p-6 rounded-[2.5rem] border-4 transition-all ${status.currentSlot?.num === item.period ? 'bg-blue-600 border-blue-400 shadow-2xl scale-[1.02]' : 'bg-slate-50 border-transparent'}`}>
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-4xl ${status.currentSlot?.num === item.period ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                  {item.period}
                </div>
                <div className="ml-10 flex-1">
                  <p className={`text-[4.5vh] font-black uppercase leading-none ${status.currentSlot?.num === item.period ? 'text-white' : 'text-slate-800'}`}>
                    {item.class_name}
                  </p>
                </div>
                <div className={`px-12 py-4 rounded-3xl font-black text-[3.5vh] ${status.currentSlot?.num === item.period ? 'bg-blue-800 text-white' : 'bg-white text-blue-600 shadow-md'}`}>
                  {item.room}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-slate-900 rounded-[3rem] p-8 text-white grid grid-cols-2 gap-10">
             <div className="flex items-center gap-6">
                <User size={50} className="text-blue-400" />
                <div>
                  <p className="text-[1.5vh] font-bold text-slate-500 uppercase tracking-widest">Дежурни наставник</p>
                  <p className="text-[3vh] font-black uppercase italic">{data.duty?.teacher_name || '---'}</p>
                </div>
             </div>
             <div className="flex items-center gap-6 border-l-2 border-slate-800 pl-10">
                <Users size={50} className="text-emerald-400" />
                <div>
                  <p className="text-[1.5vh] font-bold text-slate-500 uppercase tracking-widest">Дежурни ученици</p>
                  <p className="text-[2.5vh] font-black text-slate-300 italic uppercase">{data.duty?.student_names || '---'}</p>
                </div>
             </div>
          </div>
        </div>

        {/* DESNO: SLAJDOVI */}
        <div className="w-[35%] flex flex-col gap-4">
          <div className="flex-1 bg-slate-900 rounded-[4rem] border border-slate-800 relative overflow-hidden p-12 flex flex-col justify-center">
            
            {activeTab === 0 && (
              <div className="animate-in slide-in-from-right duration-500">
                <div className="flex items-center gap-6 mb-10 text-orange-500">
                  <Bell size={50} />
                  <h3 className="font-black text-[3.5vh] uppercase italic tracking-widest">Важно</h3>
                </div>
                {data.ann?.[0]?.image_url && (
                  <img src={data.ann[0].image_url} className="w-full h-64 object-cover rounded-[2.5rem] mb-8 border-4 border-white/5 shadow-2xl" />
                )}
                <div className="bg-white/5 p-8 rounded-[3rem] border-l-[12px] border-orange-500">
                  <p className="text-[3.5vh] font-black leading-tight text-white">{data.ann?.[0]?.text || "Нема нових обавештења."}</p>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="animate-in zoom-in duration-500 flex flex-col items-center text-center">
                 <Sun size={150} className="text-amber-500 mb-8" />
                 <h3 className="text-[12vh] font-black leading-none">24°C</h3>
                 <p className="text-amber-500 font-black text-[3vh] uppercase mt-4 tracking-[0.5rem]">Београд</p>
                 <div className="flex gap-12 mt-10 opacity-40">
                    <div className="flex flex-col items-center"><Droplets size={40} className="text-blue-400 mb-2"/><p className="text-2xl font-black">40%</p></div>
                    <div className="flex flex-col items-center"><Wind size={40} className="text-slate-400 mb-2"/><p className="text-2xl font-black">10km/h</p></div>
                 </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className="animate-in slide-in-from-bottom duration-500">
                <div className="flex items-center gap-6 mb-10 text-pink-500">
                  <Cake size={50} />
                  <h3 className="font-black text-[3.5vh] uppercase italic">Рођендани</h3>
                </div>
                <div className="space-y-6">
                  {data.bdays.slice(0, 3).map((b, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                      <span className="text-[3.5vh] font-black">{b.name}</span>
                      <span className="bg-pink-600 px-6 py-2 rounded-2xl text-[2vh] font-black">{b.class_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 3 && (
              <div className="animate-in fade-in duration-700 text-center">
                 <Quote size={100} className="text-blue-500/20 mx-auto mb-10" />
                 <p className="text-[4vh] font-black italic text-slate-200 leading-snug">
                   "{data.quotes[0]?.text || "Буди промена коју желиш да видиш у свету."}"
                 </p>
                 <div className="w-24 h-2 bg-blue-600 mx-auto my-12 rounded-full" />
                 <p className="text-blue-500 font-black uppercase text-[2.5vh] tracking-widest">
                   {data.quotes[0]?.author || "Махатма Ганди"}
                 </p>
              </div>
            )}

            <div className="absolute bottom-0 left-0 h-3 bg-blue-600 animate-[progress_15s_linear_infinite]" />
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