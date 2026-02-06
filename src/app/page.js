'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Quote, Cake, AlertTriangle, BookOpen, Sun, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
    const interval = setInterval(fetchData, 10000);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(interval); clearInterval(timer); };
  }, []);

  const status = useMemo(() => {
    const hour = now.getHours();
    const isMorning = hour < 14;
    const currentMin = hour * 60 + now.getMinutes();
    const morningShift = data.sys?.find(s => s.key === 'current_morning_shift')?.value || 'Parna';
    const activeShift = isMorning ? morningShift : (morningShift === 'Parna' ? 'Neparna' : 'Parna');
    const dobaDana = isMorning ? "ПРЕ ПОДНЕ" : "ПОСЛЕ ПОДНЕ";
    const days = ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"];
    const currentDay = days[now.getDay()];

    // BELL_SCHEDULE definicija unutar memo da prati promene
    const currentSlot = [
      { num: 1, start: "08:00", end: "08:45" }, { num: 2, start: "08:50", end: "09:35" },
      { num: 3, start: "10:00", end: "10:45" }, { num: 4, start: "10:50", end: "11:35" },
      { num: 5, start: "11:40", end: "12:25" }, { num: 6, start: "12:30", end: "13:15" }
    ].find(s => {
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      return currentMin >= (sh * 60 + sm) && currentMin < (eh * 60 + em);
    });

    const dailyTimetable = data.tt?.filter(t => 
      t.day === currentDay && t.shift === activeShift && t.time_of_day === (isMorning ? "Pre podne" : "Posle podne")
    ) || [];

    return { currentSlot, dobaDana, currentDay, dailyTimetable, emergency: data.sys?.find(s => s.key === 'emergency')?.value };
  }, [now, data]);

  // Rotacija slajdova
  useEffect(() => {
    const rotation = setInterval(() => setActiveTab(prev => (prev + 1) % 4), 15000);
    return () => clearInterval(rotation);
  }, []);

  if (status.emergency === "УЗБУНА") {
    return (
      <div className="h-screen w-screen bg-red-700 flex flex-col items-center justify-center text-white animate-pulse">
        <AlertTriangle size={200} />
        <h1 className="text-[15vh] font-black">УЗБУНА</h1>
      </div>
    );
  }

  // Provera za "Specijalno obaveštenje sa slikom" (ako prvo obaveštenje ima sliku, prikazuje se preko celog desnog dela)
  const specialAnn = data.ann?.[0]?.image_url ? data.ann[0] : null;

  return (
    <div className="h-screen w-screen bg-[#0F172A] p-[1.5vh] flex flex-col font-sans overflow-hidden text-slate-100">
      
      {/* HEADER */}
      <div className="h-[10vh] bg-slate-900/50 rounded-[2rem] flex justify-between items-center px-10 mb-[1.5vh] border border-slate-800">
        <div className="flex items-center gap-6">
          <img src="/logo.png" alt="Logo" className="h-[7vh]" />
          <div>
            <h1 className="text-[3vh] font-black tracking-tighter uppercase">{SCHOOL_NAME}</h1>
            <span className="text-blue-400 font-bold text-[1.4vh] tracking-[0.3em] uppercase">{status.dobaDana}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[4vh] font-black tabular-nums leading-none">
            {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
            <span className="text-blue-500 text-[2vh]">:{now.getSeconds().toString().padStart(2, '0')}</span>
          </p>
          <p className="text-[1.2vh] font-bold text-slate-500 uppercase tracking-widest">{status.currentDay}</p>
        </div>
      </div>

      <div className="flex flex-1 gap-[1.5vh] min-h-0">
        
        {/* LEVA STRANA - KOMPLETAN RASPORED DANA */}
        <div className="w-[60%] bg-white rounded-[3rem] p-8 flex flex-col text-slate-900 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[4vh] font-black tracking-tighter uppercase italic">Данашњи распоред</h2>
            <div className="bg-blue-600 text-white px-6 py-2 rounded-full font-black text-[2vh]">
               {status.currentSlot ? `${status.currentSlot.num}. ЧАС У ТОКУ` : "ОДМОР"}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {status.dailyTimetable.map((item, idx) => (
              <div key={idx} className={`flex justify-between items-center p-5 rounded-[2rem] transition-all border-2 ${status.currentSlot?.num === item.period ? 'border-blue-600 bg-blue-50 scale-[1.02] shadow-lg' : 'border-transparent bg-slate-50 opacity-80'}`}>
                <div className="flex items-center gap-6">
                  <span className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl ${status.currentSlot?.num === item.period ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {item.period}
                  </span>
                  <span className="text-[3vh] font-black uppercase tracking-tight">{item.class_name}</span>
                </div>
                <span className={`px-8 py-2 rounded-2xl font-black text-[2.5vh] ${status.currentSlot?.num === item.period ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-400'}`}>
                  {item.room}
                </span>
              </div>
            ))}
          </div>

          {/* DEŽURSTVO */}
          <div className="mt-6 bg-slate-900 rounded-[2.5rem] p-6 text-white flex justify-between items-center border-4 border-blue-600/30">
             <div>
               <p className="text-blue-400 text-[1.2vh] font-black uppercase tracking-widest mb-1">Дежурни наставник</p>
               <p className="text-[2.5vh] font-black tracking-tight">{data.duty?.teacher_name || '---'}</p>
             </div>
             <div className="text-right">
               <p className="text-slate-500 text-[1.2vh] font-black uppercase tracking-widest mb-1">Ученици</p>
               <p className="text-[1.8vh] font-bold text-slate-300 italic">{data.duty?.student_names || '---'}</p>
             </div>
          </div>
        </div>

        {/* DESNA STRANA - ROTACIJA ILI SPECIJALNO OBAVEŠTENJE */}
        <div className="w-[40%] bg-slate-900 rounded-[3rem] p-1 border border-slate-800 relative overflow-hidden">
          {specialAnn && activeTab === 0 ? (
            <div className="h-full w-full relative animate-in zoom-in duration-1000">
               <img src={specialAnn.image_url} className="h-full w-full object-cover rounded-[2.8rem] opacity-60" />
               <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                  <Bell size={60} className="text-blue-400 mb-6" />
                  <h3 className="text-[4vh] font-black leading-tight uppercase shadow-xl">{specialAnn.text}</h3>
               </div>
            </div>
          ) : (
            <div className="h-full w-full p-10">
              {activeTab === 0 && (
                <div className="animate-in slide-in-from-right space-y-6">
                  <h3 className="text-orange-500 font-black text-[2.5vh] uppercase flex items-center gap-3"><Bell/> Обавештења</h3>
                  {data.ann.filter(a => !a.image_url).slice(0, 3).map((a, i) => (
                    <div key={i} className="bg-white/5 p-6 rounded-[2rem] border-l-[10px] border-orange-500 text-[2.2vh] font-bold">
                      {a.text}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 1 && (
                <div className="h-full flex flex-col items-center justify-center animate-in zoom-in">
                   <Sun size={120} className="text-orange-400 mb-6" />
                   <h3 className="text-[10vh] font-black leading-none tracking-tighter">24°C</h3>
                   <p className="text-slate-400 font-black text-[2vh] uppercase mt-4">Ведро и сунчано</p>
                </div>
              )}

              {activeTab === 2 && (
                <div className="animate-in slide-in-from-bottom space-y-6">
                  <h3 className="text-pink-500 font-black text-[2.5vh] uppercase flex items-center gap-3"><Cake/> Рођендани</h3>
                  {data.bdays.map((b, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 p-6 rounded-[2rem] border border-white/10">
                      <span className="text-[2.8vh] font-black">{b.name}</span>
                      <span className="bg-pink-600 px-4 py-1 rounded-full text-xs font-black">{b.class_name}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 3 && (
                <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in p-6">
                   <Quote size={80} className="text-blue-900 mb-8" />
                   <p className="text-[3.5vh] font-black italic leading-tight text-slate-200">"{data.quotes[0]?.text}"</p>
                   <p className="text-blue-500 font-black mt-8 uppercase tracking-widest text-[2vh]">— {data.quotes[0]?.author}</p>
                </div>
              )}
            </div>
          )}
          <div className="absolute bottom-0 left-0 h-2 bg-blue-600 animate-[progress_15s_linear_infinite]" />
        </div>
      </div>
      <style jsx>{`
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
}