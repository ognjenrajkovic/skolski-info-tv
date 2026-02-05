'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Bell, Info, Calendar, LayoutDashboard, Send, Trash2 } from 'lucide-react';


// --- PODACI (Ovo bi idealno išlo u bazu, ali za početak držimo ovde) ---
const SCHOOL_NAME = "OŠ \"Karađorđe\""; // Naziv škole
const ADMIN_PIN = "2024"; // Šifra za dodavanje obaveštenja

const bellSchedule = [
  { label: "1. Čas", start: "08:00", end: "08:45" },
  { label: "Mali odmor", start: "08:45", end: "08:50" },
  { label: "2. Čas", start: "08:50", end: "09:35" },
  { label: "Veliki odmor", start: "09:35", end: "09:55" },
  { label: "3. Čas", start: "09:55", end: "10:40" },
  { label: "Mali odmor", start: "10:40", end: "10:45" },
  { label: "4. Čas", start: "10:45", end: "11:30" },
];

export default function SchoolTV() {
  const [now, setNow] = useState(new Date());
  const [announcements, setAnnouncements] = useState([
    "Dobrodošli u novu školsku nedelju!",
    "Sastanak učeničkog parlamenta u sredu u 12h.",
    "Podsećamo na obavezno nošenje školskih uniformi."
  ]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [pinInput, setPinInput] = useState("");

  // Osvežavanje vremena svake sekunde
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Logika za detekciju trenutnog stanja (čas/odmor)
  const currentStatus = useMemo(() => {
    const currentMin = now.getHours() * 60 + now.getMinutes();
    
    for (let slot of bellSchedule) {
      const [sh, sm] = slot.start.split(':').map(Number);
      const [eh, em] = slot.end.split(':').map(Number);
      const startTotal = sh * 60 + sm;
      const endTotal = eh * 60 + em;

      if (currentMin >= startTotal && currentMin < endTotal) {
        return { ...slot, remaining: endTotal - currentMin };
      }
    }
    return { label: "Van nastave", remaining: null };
  }, [now]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-6 lg:p-10 flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b-8 border-blue-600 pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-black text-blue-800 tracking-tight uppercase">{SCHOOL_NAME}</h1>
          <div className="flex items-center gap-3 text-slate-500 text-xl font-medium mt-1">
            <Calendar size={24} className="text-blue-500" />
            {now.toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        <div className="text-right">
          <div className="text-8xl font-black tabular-nums tracking-tighter text-slate-800 leading-none">
            {now.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-12 gap-8 flex-grow">
        
        {/* LEVA STRANA: STATUS ČASA */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          <div className={`p-10 rounded-[3rem] shadow-2xl flex flex-col justify-center min-h-[400px] border-4 ${
            currentStatus.label.includes("Čas") ? "bg-blue-700 border-blue-800 text-white" : "bg-emerald-600 border-emerald-700 text-white"
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-2xl font-bold opacity-80 uppercase tracking-widest mb-4">Trenutno stanje:</p>
                <h2 className="text-[7rem] font-black leading-none mb-6">{currentStatus.label}</h2>
              </div>
              <Clock size={120} className="opacity-20" />
            </div>

            {currentStatus.remaining !== null && (
              <div className="mt-8">
                <div className="flex justify-between items-end mb-2 text-3xl font-bold">
                  <span>Još {currentStatus.remaining} min</span>
                  <span className="opacity-60 text-xl italic">do kraja</span>
                </div>
                <div className="w-full bg-black/20 h-6 rounded-full overflow-hidden border border-white/30">
                  <div 
                    className="bg-white h-full transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                    style={{ width: `${(currentStatus.remaining / 45) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* MALI RASPORED */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-[2.5rem] p-8">
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-700 uppercase tracking-wider">
              <LayoutDashboard size={28} className="text-blue-600" /> Raspored zvonjenja
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {bellSchedule.map((b, i) => (
                <div key={i} className={`flex justify-between p-4 rounded-2xl font-bold ${currentStatus.label === b.label ? 'bg-blue-100 border-2 border-blue-500 text-blue-800' : 'bg-white border border-slate-200 text-slate-500'}`}>
                  <span>{b.label}</span>
                  <span>{b.start} - {b.end}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DESNA STRANA: OBAVEŠTENJA */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="bg-orange-500 p-8 rounded-[3rem] shadow-xl flex-grow border-b-[12px] border-orange-700 text-white overflow-hidden relative">
            <h3 className="text-3xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter">
              <Bell size={36} fill="white" /> Važne vesti
            </h3>
            <div className="space-y-6">
              {announcements.map((msg, idx) => (
                <div key={idx} className="bg-white/10 p-6 rounded-2xl border-l-8 border-white text-2xl font-bold animate-in fade-in slide-in-from-right duration-500">
                  {msg}
                </div>
              ))}
            </div>
            {/* Dekorativna ikona u uglu */}
            <Info size={200} className="absolute -bottom-10 -right-10 opacity-10 rotate-12" />
          </div>
        </div>
      </div>

      {/* ADMIN PANEL - AKTIVIRA SE KLIKOM NA LOGO (skriveno) ILI PIN UNOSOM */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        {!isAdmin ? (
          <div className="flex items-center gap-2 opacity-20 hover:opacity-100 transition-opacity">
            <input 
              type="password" 
              placeholder="Admin PIN" 
              className="bg-slate-100 p-2 rounded-lg text-sm outline-none border border-slate-300"
              onChange={(e) => e.target.value === ADMIN_PIN && setIsAdmin(true)}
            />
            <span className="text-xs text-slate-400 italic">Administracija</span>
          </div>
        ) : (
          <div className="bg-slate-900 p-6 rounded-3xl text-white flex gap-4 items-center">
            <input 
              className="flex-1 bg-slate-800 border border-slate-700 p-4 rounded-xl text-xl outline-none focus:border-blue-500"
              placeholder="Napiši novo obaveštenje..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button 
              onClick={() => {if(newNote){setAnnouncements([newNote, ...announcements]); setNewNote("")}}}
              className="bg-blue-600 hover:bg-blue-500 p-4 rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95"
            >
              <Send size={24} /> OBJAVI
            </button>
            <button 
              onClick={() => setAnnouncements([])}
              className="bg-red-600 hover:bg-red-500 p-4 rounded-xl font-bold transition-transform active:scale-95"
            >
              <Trash2 size={24} />
            </button>
            <button onClick={() => setIsAdmin(false)} className="text-slate-400 px-4 underline">Zatvori</button>
          </div>
        )}
      </div>
    </div>
  );
}