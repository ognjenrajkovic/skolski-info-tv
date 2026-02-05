'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Cake, Quote, AlertOctagon, Trash2, Send, ShieldAlert, RefreshCw } from 'lucide-react';

export default function AdminPanel() {
  const [announcements, setAnnouncements] = useState([]);
  const [text, setText] = useState('');
  const [emergency, setEmergency] = useState('NORMAL');

  // Učitavanje trenutnih podataka
  useEffect(() => {
    fetchData();
    const sub = supabase.channel('admin_realtime').on('postgres_changes', { event: '*', schema: 'public', table: '*' }, fetchData).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchData = async () => {
    const { data: ann } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    const { data: sys } = await supabase.from('system_settings').select('*').eq('key', 'emergency').single();
    if (ann) setAnnouncements(ann);
    if (sys) setEmergency(sys.value);
  };

  const toggleEmergency = async (mode) => {
    await supabase.from('system_settings').update({ value: mode }).eq('key', 'emergency');
  };

  const addNote = async () => {
    if (!text) return;
    await supabase.from('announcements').insert([{ text }]);
    setText('');
  };

  const deleteNote = async (id) => {
    await supabase.from('announcements').delete().eq('id', id);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-[1000] text-slate-900 tracking-tighter uppercase">Admin <span className="text-blue-600">Panel</span></h1>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">OŠ Karađorđe • Upravljanje sistemom</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => toggleEmergency('UZBUNA')} className={`px-6 py-3 rounded-2xl font-black transition-all ${emergency === 'UZBUNA' ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-200' : 'bg-white text-red-600 border-2 border-red-100'}`}>
              UZBUNA
            </button>
            <button onClick={() => toggleEmergency('NORMAL')} className={`px-6 py-3 rounded-2xl font-black transition-all ${emergency === 'NORMAL' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-white text-emerald-500 border-2 border-emerald-100'}`}>
              NORMAL
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEVO: FORMA ZA DODAVANJE */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-blue-600 uppercase italic"><Send size={20}/> Nova Objava</h2>
              <textarea 
                value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Unesite tekst obaveštenja..."
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold focus:border-blue-500 outline-none transition-all h-40 mb-4"
              />
              <button onClick={addNote} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95">
                OBJAVI NA TV
              </button>
            </div>
          </div>

          {/* DESNO: LISTA AKTIVNIH OBAVEŠTENJA */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[500px]">
              <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-400 uppercase italic"><Bell size={20}/> Aktivne objave na ekranu</h2>
              <div className="space-y-4">
                {announcements.map((note) => (
                  <div key={note.id} className="group flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-all">
                    <p className="text-lg font-bold text-slate-700 leading-tight pr-4">{note.text}</p>
                    <button onClick={() => deleteNote(note.id)} className="p-4 bg-white text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all shadow-sm">
                      <Trash2 size={24} />
                    </button>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="text-center py-20 opacity-20 font-black uppercase tracking-[0.3em]">Nema aktivnih objava</div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}