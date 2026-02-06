'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Save, AlertTriangle, Video, Music, Bell, Calendar, User, Cake, Quote } from 'lucide-react';

export default function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], duty: {}, sys: [], quotes: [] });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [ann, bdays, tt, dt, sys, qt] = await Promise.all([
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('birthdays').select('*'),
      supabase.from('timetable').select('*').order('period', { ascending: true }),
      supabase.from('duty_staff').select('*').single(),
      supabase.from('system_settings').select('*'),
      supabase.from('quotes').select('*')
    ]);
    setData({ ann: ann.data || [], bdays: bdays.data || [], tt: tt.data || [], duty: dt.data || {}, sys: sys.data || [], quotes: qt.data || [] });
  };

  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated]);

  const updateSys = async (key, value) => {
    await supabase.from('system_settings').upsert({ key, value: value.toString() }, { onConflict: 'key' });
    fetchData();
  };

  const deleteItem = async (table, id) => {
    if(confirm("Obriši stavku?")) { await supabase.from(table).delete().eq('id', id); fetchData(); }
  };

  if (!isAuthenticated) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="bg-white p-10 rounded-3xl shadow-2xl text-center">
        <h1 className="text-2xl font-black mb-6 uppercase">ADMIN LOGIN</h1>
        <input type="password" placeholder="Šifra" className="border-2 p-4 w-full rounded-xl mb-4 text-center" onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && password === 'admin123' && setIsAuthenticated(true)} />
        <button onClick={() => password === 'admin123' ? setIsAuthenticated(true) : alert("Pogrešna šifra")} className="bg-blue-600 text-white w-full p-4 rounded-xl font-bold">PRISTUPI</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER ADMINA */}
        <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border-b-8 border-blue-600">
          <h1 className="text-4xl font-black italic uppercase">Kontrolna Tabla</h1>
          <button onClick={() => updateSys('emergency', data.sys.find(s => s.key === 'emergency')?.value === 'true' ? 'false' : 'true')} 
            className={`p-6 rounded-2xl font-black uppercase text-white shadow-xl ${data.sys.find(s => s.key === 'emergency')?.value === 'true' ? 'bg-red-500 animate-pulse' : 'bg-red-700'}`}>
            {data.sys.find(s => s.key === 'emergency')?.value === 'true' ? 'STOP UZBUNA' : 'AKTIVIRAJ UZBUNU'}
          </button>
        </div>

        {/* 1. SISTEMSKA PODEŠAVANJA & VIDEO */}
        <section className="bg-white p-10 rounded-3xl shadow-sm">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><Settings size={30}/> SISTEM & VIDEO</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="font-bold text-slate-500 uppercase">Video Pozadina (YouTube Link)</label>
              <input className="w-full p-4 bg-slate-50 border rounded-xl" value={data.sys.find(s => s.key === 'bg_video_url')?.value || ''} onChange={e => updateSys('bg_video_url', e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => updateSys('video_active', 'true')} className="flex-1 p-3 bg-emerald-500 text-white rounded-lg font-bold">UKLJUČI VIDEO</button>
                <button onClick={() => updateSys('video_active', 'false')} className="flex-1 p-3 bg-slate-200 rounded-lg font-bold">ISKLJUČI VIDEO</button>
              </div>
            </div>
            <div className="space-y-4">
              <label className="font-bold text-slate-500 uppercase">Hitna Traka (Tekst na dnu)</label>
              <input className="w-full p-4 bg-orange-50 border-orange-200 border rounded-xl font-bold" value={data.sys.find(s => s.key === 'breaking_news')?.value || ''} onChange={e => updateSys('breaking_news', e.target.value)} />
            </div>
          </div>
        </section>

        {/* 2. RASPORED ČASOVA (DETALJNO) */}
        <section className="bg-white p-10 rounded-3xl shadow-sm">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-blue-600"><Calendar size={30}/> RASPORED ČASOVA</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 uppercase text-sm">
                  <th className="p-4 border">Dan</th><th className="p-4 border">Smena</th><th className="p-4 border">Čas</th><th className="p-4 border">Odeljenje</th><th className="p-4 border">Kabinet</th><th className="p-4 border">Akcija</th>
                </tr>
              </thead>
              <tbody>
                {data.tt.map(t => (
                  <tr key={t.id} className="text-center hover:bg-slate-50">
                    <td className="p-3 border font-bold">{t.day}</td>
                    <td className="p-3 border uppercase text-xs">{t.shift}</td>
                    <td className="p-3 border font-black">{t.period}.</td>
                    <td className="p-3 border font-bold text-blue-600">{t.class_name}</td>
                    <td className="p-3 border font-bold uppercase">{t.room}</td>
                    <td className="p-3 border"><button onClick={() => deleteItem('timetable', t.id)} className="text-red-500"><Trash2 size={20}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. DEŽURSTVO */}
        <section className="bg-white p-10 rounded-3xl shadow-sm">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-emerald-600"><User size={30}/> DEŽURSTVO</h2>
          <div className="grid grid-cols-2 gap-6">
            <input className="p-5 border rounded-2xl font-black text-xl uppercase" placeholder="Ime Nastavnika" value={data.duty.teacher_name || ''} onChange={e => setData({...data, duty: {...data.duty, teacher_name: e.target.value}})} />
            <button onClick={() => supabase.from('duty_staff').upsert(data.duty).then(() => alert("Sačuvano!"))} className="bg-slate-900 text-white rounded-2xl font-bold">SAČUVAJ DEŽURSTVO</button>
          </div>
        </section>

        {/* 4. OBAVEŠTENJA & ROĐENDANI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white p-10 rounded-3xl shadow-sm">
             <h2 className="text-xl font-black mb-4 uppercase text-orange-600 italic">Obaveštenja</h2>
             {data.ann.map(a => (
               <div key={a.id} className="flex justify-between p-3 border-b">
                 <span className="truncate max-w-[80%] uppercase font-bold text-sm">{a.text}</span>
                 <button onClick={() => deleteItem('announcements', a.id)} className="text-red-500"><Trash2 size={18}/></button>
               </div>
             ))}
           </div>
           <div className="bg-white p-10 rounded-3xl shadow-sm">
             <h2 className="text-xl font-black mb-4 uppercase text-pink-600 italic">Rođendani</h2>
             {data.bdays.map(b => (
               <div key={b.id} className="flex justify-between p-3 border-b">
                 <span className="font-bold uppercase text-sm">{b.name} ({b.class_name})</span>
                 <button onClick={() => deleteItem('birthdays', b.id)} className="text-red-500"><Trash2 size={18}/></button>
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}