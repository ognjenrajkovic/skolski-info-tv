'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Cake, Quote, Calendar, AlertTriangle, Plus, Trash2, RefreshCw } from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('announcements');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [form, setForm] = useState({});
  const [morningShift, setMorningShift] = useState('Parna');

  // Učitavanje podataka
  const fetchData = async () => {
    setLoading(true);
    let { data: res } = await supabase.from(activeTab).select('*');
    
    // Ako smo u tabeli za raspored, sortiraj po broju časa
    if (activeTab === 'timetable' && res) {
      res.sort((a, b) => a.period - b.period);
    }
    
    setData(res || []);

    // Povuci trenutnu smenu iz system_settings
    const { data: sys } = await supabase.from('system_settings').select('*').eq('key', 'current_morning_shift').single();
    if (sys) setMorningShift(sys.value);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (Object.keys(form).length === 0) return;

    const { error } = await supabase.from(activeTab).insert([form]);
    if (error) {
      alert("Greška pri čuvanju: " + error.message);
    } else {
      setForm({});
      e.target.reset();
      fetchData();
    }
  };

  const deleteItem = async (id) => {
    await supabase.from(activeTab).delete().eq('id', id);
    fetchData();
  };

  const updateMorningShift = async (val) => {
    setMorningShift(val);
    await supabase.from('system_settings').upsert({ key: 'current_morning_shift', value: val });
  };

  const toggleEmergency = async (val) => {
    await supabase.from('system_settings').upsert({ key: 'emergency', value: val });
    alert(`Status postavljen na: ${val}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* SIDEBAR */}
      <div className="w-72 bg-slate-900 text-white p-8 flex flex-col gap-2">
        <h1 className="text-2xl font-black mb-10 tracking-tighter italic text-blue-400">TV KONTROLA</h1>
        
        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('announcements')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'announcements' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Bell size={20}/> Obaveštenja
          </button>
          <button onClick={() => setActiveTab('timetable')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'timetable' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Calendar size={20}/> Raspored časova
          </button>
          <button onClick={() => setActiveTab('birthdays')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'birthdays' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Cake size={20}/> Rođendani
          </button>
          <button onClick={() => setActiveTab('quotes')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'quotes' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Quote size={20}/> Citati
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800 space-y-4">
           <button onClick={() => toggleEmergency('UZBUNA')} className="w-full bg-red-600 hover:bg-red-700 p-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95">
             <AlertTriangle size={20}/> AKTIVIRAJ UZBUNU
           </button>
           <button onClick={() => toggleEmergency('НОРМАЛНО')} className="w-full text-slate-500 hover:text-white text-sm font-bold uppercase tracking-widest text-center py-2">
             Prekini uzbunu
           </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          
          {/* SMENA KONTROLA */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase">Trenutna prepodnevna smena</h2>
              <p className="text-slate-400 font-medium">Odaberite koja smena je u školi pre 14:00h</p>
            </div>
            <div className="flex bg-slate-100 p-2 rounded-2xl gap-2">
              <button onClick={() => updateMorningShift('Parna')} className={`px-8 py-3 rounded-xl font-black transition-all ${morningShift === 'Parna' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>PARNA</button>
              <button onClick={() => updateMorningShift('Neparna')} className={`px-8 py-3 rounded-xl font-black transition-all ${morningShift === 'Neparna' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>NEPARNA</button>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-200">
            <header className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Upravljanje: {activeTab}</h2>
              <button onClick={fetchData} className="p-3 text-slate-400 hover:rotate-180 transition-all duration-500"><RefreshCw size={24}/></button>
            </header>
            
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4 mb-12 bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              {activeTab === 'announcements' && (
                <textarea className="col-span-2 p-4 rounded-2xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none h-32 font-medium" placeholder="Unesite važno obaveštenje..." onChange={e => setForm({text: e.target.value})} required />
              )}
              
              {activeTab === 'timetable' && (
                <>
                  <select className="p-4 rounded-2xl border-0 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold" onChange={e => setForm({...form, day: e.target.value})} required>
                    <option value="">Izaberi dan</option>
                    {["Понедељак", "Уторак", "Среда", "Четвртак", "Петак"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select className="p-4 rounded-2xl border-0 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold" onChange={e => setForm({...form, shift: e.target.value})} required>
                    <option value="">Smena</option>
                    <option value="Parna">Parna</option>
                    <option value="Neparna">Neparna</option>
                  </select>
                  <input type="number" className="p-4 rounded-2xl border-0 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="Čas (1-7)" onChange={e => setForm({...form, period: parseInt(e.target.value)})} required />
                  <input className="p-4 rounded-2xl border-0 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="Odeljenje (npr. VIII-1)" onChange={e => setForm({...form, class_name: e.target.value})} required />
                  <input className="col-span-2 p-4 rounded-2xl border-0 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase" placeholder="KABINET / PREDMET" onChange={e => setForm({...form, room: e.target.value})} required />
                </>
              )}

              {activeTab === 'birthdays' && (
                <>
                  <input className="p-4 rounded-2xl border-0 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="Ime učenika" onChange={e => setForm({...form, name: e.target.value})} required />