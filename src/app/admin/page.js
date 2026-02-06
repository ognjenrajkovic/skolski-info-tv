'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Lock, Save, Trash2, Plus, User, Calendar, Bell, Cake, 
  Quote, Settings, Video, Image as ImageIcon, Volume2, 
  Megaphone, AlertTriangle, MonitorPlay
} from 'lucide-react';

export default function AdminPanel() {
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState('');
  const [tab, setTab] = useState('announcements');
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], sys: [], quotes: [] });
  const [form, setForm] = useState({});
  const [teacher, setTeacher] = useState('');

  // Učitavanje podataka
  const fetchData = async () => {
    const [ann, bdays, tt, dt, sys, qt] = await Promise.all([
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('birthdays').select('*').order('name'),
      supabase.from('timetable').select('*').order('period'),
      supabase.from('duty_staff').select('*').single(),
      supabase.from('system_settings').select('*'),
      supabase.from('quotes').select('*')
    ]);
    setData({ ann: ann.data || [], bdays: bdays.data || [], tt: tt.data || [], sys: sys.data || [], quotes: qt.data || [] });
    if (dt.data) setTeacher(dt.data.teacher_name || '');
  };

  useEffect(() => { if (auth) fetchData(); }, [auth, tab]);

  // LOGIN LOGIKA (Prostija da sigurno uđeš)
  const handleLogin = async () => {
    // Provera iz baze ILI univerzalna šifra ako baza ne radi
    const { data: s } = await supabase.from('system_settings').select('value').eq('key', 'admin_password').single();
    if ((s && pass === s.value) || pass === 'admin123') setAuth(true); // Default pass: admin123
    else alert("Pogrešna šifra!");
  };

  const saveItem = async (table) => {
    await supabase.from(table).insert([form]);
    setForm({}); fetchData(); alert("Sačuvano!");
  };

  const deleteItem = async (table, id) => {
    if(confirm('Brisanje?')) { await supabase.from(table).delete().eq('id', id); fetchData(); }
  };

  const updateSys = async (key, val) => {
    await supabase.from('system_settings').upsert({ key, value: val.toString() }, { onConflict: 'key' });
    fetchData();
  };

  const getSys = (key) => data.sys.find(s => s.key === key)?.value || '';

  if (!auth) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl border border-white/20 shadow-2xl w-full max-w-md text-center text-white">
        <div className="bg-white text-blue-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Lock size={30} />
        </div>
        <h1 className="text-3xl font-black mb-2 tracking-tight">ADMIN PANEL</h1>
        <p className="text-blue-200 mb-8 text-sm uppercase tracking-widest">Informacioni sistem</p>
        <input type="password" placeholder="Unesite šifru..." className="w-full p-4 rounded-xl bg-white/20 border border-white/30 placeholder-blue-200 mb-4 text-center text-xl font-bold outline-none focus:bg-white/30 transition-all" 
          onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        <button onClick={handleLogin} className="w-full bg-blue-500 hover:bg-blue-400 p-4 rounded-xl font-black uppercase transition-all shadow-lg">Prijavi se</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* SIDEBAR */}
      <div className="w-24 lg:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300">
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg shrink-0" />
          <h1 className="text-2xl font-black italic hidden lg:block">ADMIN</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'announcements', label: 'Obaveštenja', icon: <Bell/> },
            { id: 'timetable', label: 'Raspored', icon: <Calendar/> },
            { id: 'duty', label: 'Dežurstvo', icon: <User/> },
            { id: 'birthdays', label: 'Rođendani', icon: <Cake/> },
            { id: 'quotes', label: 'Citati', icon: <Quote/> },
            { id: 'settings', label: 'Podešavanja', icon: <Settings/> },
          ].map(i => (
            <button key={i.id} onClick={() => setTab(i.id)} 
              className={`w-full p-4 rounded-xl flex items-center gap-4 font-bold transition-all ${tab === i.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-100'}`}>
              {i.icon} <span className="hidden lg:block">{i.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4">
          <button onClick={() => updateSys('emergency', getSys('emergency') === 'true' ? 'false' : 'true')} 
            className={`w-full p-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase transition-all ${getSys('emergency') === 'true' ? 'bg-red-500 text-white animate-pulse' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
            <AlertTriangle/> <span className="hidden lg:block">UZBUNA</span>
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-black uppercase tracking-tight text-slate-900">{tab === 'announcements' ? 'Obaveštenja' : tab === 'duty' ? 'Dežurni nastavnik' : tab}</h2>
        </header>

        {tab === 'duty' && (
          <div className="bg-white p-10 rounded-[2rem] shadow-xl max-w-2xl">
            <label className="block text-slate-400 font-bold uppercase text-xs mb-2 tracking-widest">Ime i prezime dežurnog nastavnika</label>
            <input className="w-full text-3xl font-black border-b-4 border-slate-100 p-4 outline-none focus:border-blue-500 transition-all uppercase placeholder-slate-200" 
              value={teacher} onChange={e => setTeacher(e.target.value)} placeholder="UNESI IME..." />
            <button onClick={async () => { await supabase.from('duty_staff').upsert({ id: 1, teacher_name: teacher }); alert("Ažurirano!"); }} 
              className="mt-8 bg-black text-white px-8 py-4 rounded-2xl font-bold uppercase hover:scale-105 transition-transform w-full">Sačuvaj izmene</button>
          </div>
        )}

        {tab === 'settings' && (
          <div className="grid gap-6 max-w-4xl">
             <div className="bg-white p-8 rounded-[2rem] shadow-lg flex flex-col gap-4">
                <h3 className="font-black flex items-center gap-3 text-lg"><Video className="text-blue-500"/> VIDEO POZADINA</h3>
                <input value={getSys('bg_video_url')} onChange={e => updateSys('bg_video_url', e.target.value)} placeholder="YouTube Link..." className="p-4 bg-slate-50 rounded-xl font-bold" />
                <div className="flex gap-4">
                   <button onClick={() => updateSys('video_mode', 'fullscreen')} className={`flex-1 p-4 rounded-xl font-bold uppercase ${getSys('video_mode') === 'fullscreen' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Full Screen</button>
                   <button onClick={() => updateSys('video_mode', 'overlay')} className={`flex-1 p-4 rounded-xl font-bold uppercase ${getSys('video_mode') === 'overlay' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Overlay</button>
                   <button onClick={() => updateSys('video_active', getSys('video_active') === 'true' ? 'false' : 'true')} className={`flex-1 p-4 rounded-xl font-bold uppercase ${getSys('video_active') === 'true' ? 'bg-green-500 text-white' : 'bg-slate-200'}`}>
                     {getSys('video_active') === 'true' ? 'Video: ON' : 'Video: OFF'}
                   </button>
                </div>
             </div>
             
             <div className="bg-white p-8 rounded-[2rem] shadow-lg">
                <h3 className="font-black flex items-center gap-3 text-lg mb-4 text-orange-500"><Megaphone/> VESTI (SCROLL TRAKA)</h3>
                <input value={getSys('breaking_news')} onChange={e => updateSys('breaking_news', e.target.value)} className="w-full p-4 border-2 border-orange-100 bg-orange-50 rounded-xl font-bold uppercase text-orange-800" placeholder="Tekst vesti..." />
             </div>
          </div>
        )}

        {/* Ostali tabovi (Standardni unos) */}
        {tab === 'announcements' && (
           <div className="space-y-6 max-w-3xl">
              <div className="bg-white p-8 rounded-[2rem] shadow-lg flex gap-4">
                 <input className="flex-1 bg-slate-50 p-4 rounded-xl font-bold" placeholder="Tekst..." onChange={e => setForm({...form, text: e.target.value})} />
                 <input className="w-1/3 bg-slate-50 p-4 rounded-xl font-bold" placeholder="Slika URL..." onChange={e => setForm({...form, image_url: e.target.value})} />
                 <button onClick={() => saveItem('announcements')} className="bg-blue-600 text-white p-4 rounded-xl"><Plus/></button>
              </div>
              {data.ann.map(a => <div key={a.id} className="bg-white p-4 rounded-xl shadow flex justify-between font-bold text-slate-600">{a.text} <button onClick={() => deleteItem('announcements', a.id)} className="text-red-400"><Trash2/></button></div>)}
           </div>
        )}

        {/* Slično i za ostale tabove (Rođendani, Citati)... */}
        {tab === 'quotes' && (
           <div className="space-y-6 max-w-3xl">
              <div className="bg-white p-8 rounded-[2rem] shadow-lg flex gap-4">
                 <input className="flex-1 bg-slate-50 p-4 rounded-xl font-bold" placeholder="Citat..." onChange={e => setForm({...form, text: e.target.value})} />
                 <input className="w-1/3 bg-slate-50 p-4 rounded-xl font-bold" placeholder="Autor..." onChange={e => setForm({...form, author: e.target.value})} />
                 <button onClick={() => saveItem('quotes')} className="bg-black text-white p-4 rounded-xl"><Plus/></button>
              </div>
              {data.quotes.map(q => <div key={q.id} className="bg-white p-4 rounded-xl shadow flex justify-between font-bold text-slate-600 italic">"{q.text}" <button onClick={() => deleteItem('quotes', q.id)} className="text-red-400"><Trash2/></button></div>)}
           </div>
        )}
      </div>
    </div>
  );
}