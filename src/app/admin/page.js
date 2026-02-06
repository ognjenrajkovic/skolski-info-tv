'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Save, Bell, Calendar, User, Cake, Quote, AlertTriangle, Settings } from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // Stanje za podatke - Inicijalizovano kao prazno da ne puca
  const [data, setData] = useState({ 
    ann: [], bdays: [], tt: [], duty: { teacher_name: '' }, sys: [], quotes: [] 
  });
  
  // Stanje za forme
  const [tab, setTab] = useState('obavestenja');
  const [input1, setInput1] = useState(''); // Univerzalni input 1
  const [input2, setInput2] = useState(''); // Univerzalni input 2
  const [ttForm, setTtForm] = useState({ day: 'Понедељак', period: 1, class_name: '', room: '' });

  // Učitavanje
  const loadData = async () => {
    try {
      const ann = await supabase.from('announcements').select('*').order('id', {ascending: false});
      const bdays = await supabase.from('birthdays').select('*');
      const tt = await supabase.from('timetable').select('*').order('period');
      const duty = await supabase.from('duty_staff').select('*').single();
      const sys = await supabase.from('system_settings').select('*');
      const qt = await supabase.from('quotes').select('*');

      setData({
        ann: ann.data || [],
        bdays: bdays.data || [],
        tt: tt.data || [],
        duty: duty.data || { teacher_name: '' },
        sys: sys.data || [],
        quotes: qt.data || []
      });
    } catch (error) {
      console.error("Greška pri učitavanju:", error);
      alert("Greška u komunikaciji sa bazom. Proveri konzolu.");
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  // Akcije
  const handleDelete = async (table, id) => {
    if(!confirm("Obriši?")) return;
    await supabase.from(table).delete().eq('id', id);
    loadData();
  };

  const handleSave = async () => {
    try {
      if (tab === 'obavestenja') await supabase.from('announcements').insert({ text: input1 });
      if (tab === 'rodjendani') await supabase.from('birthdays').insert({ name: input1, class_name: input2 });
      if (tab === 'citati') await supabase.from('quotes').insert({ text: input1, author: input2 });
      
      setInput1(''); setInput2('');
      loadData();
    } catch (e) { alert("Greška pri čuvanju."); }
  };

  const saveTimetable = async () => {
    if (!ttForm.class_name || !ttForm.room) return alert("Popuni sva polja");
    await supabase.from('timetable').insert(ttForm);
    loadData();
  };

  const updateDuty = async () => {
    await supabase.from('duty_staff').upsert({ id: 1, teacher_name: input1 });
    loadData(); alert("Sačuvano!");
  };

  const toggleEmergency = async () => {
    const current = data.sys.find(s => s.key === 'emergency')?.value === 'true';
    await supabase.from('system_settings').upsert({ key: 'emergency', value: (!current).toString() });
    loadData();
  };

  // LOGIN
  if (!isAuthenticated) return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-xl font-bold mb-4 text-center">ADMIN PANEL</h1>
        <input type="password" placeholder="Šifra (admin123)" className="border p-2 w-full rounded mb-4" 
          value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={() => password === 'admin123' ? setIsAuthenticated(true) : alert("Greška")} 
          className="bg-blue-600 text-white w-full py-2 rounded font-bold">ULOGUJ SE</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* MENI */}
      <div className="w-64 bg-white border-r p-4 flex flex-col gap-2">
        <h2 className="font-black text-2xl italic text-blue-600 mb-6 px-4">ŠKOLA</h2>
        <button onClick={() => setTab('obavestenja')} className={`p-3 text-left rounded-lg font-bold flex gap-3 ${tab==='obavestenja' ? 'bg-blue-100 text-blue-700' : ''}`}><Bell size={20}/> Obaveštenja</button>
        <button onClick={() => setTab('raspored')} className={`p-3 text-left rounded-lg font-bold flex gap-3 ${tab==='raspored' ? 'bg-blue-100 text-blue-700' : ''}`}><Calendar size={20}/> Raspored</button>
        <button onClick={() => setTab('dezurstvo')} className={`p-3 text-left rounded-lg font-bold flex gap-3 ${tab==='dezurstvo' ? 'bg-blue-100 text-blue-700' : ''}`}><User size={20}/> Dežurstvo</button>
        <button onClick={() => setTab('rodjendani')} className={`p-3 text-left rounded-lg font-bold flex gap-3 ${tab==='rodjendani' ? 'bg-blue-100 text-blue-700' : ''}`}><Cake size={20}/> Rođendani</button>
        <button onClick={() => setTab('citati')} className={`p-3 text-left rounded-lg font-bold flex gap-3 ${tab==='citati' ? 'bg-blue-100 text-blue-700' : ''}`}><Quote size={20}/> Citati</button>
        
        <div className="mt-auto pt-4 border-t">
          <button onClick={toggleEmergency} className={`w-full p-3 font-bold rounded-lg flex items-center justify-center gap-2 ${data.sys.find(s=>s.key==='emergency')?.value === 'true' ? 'bg-red-600 text-white animate-pulse' : 'bg-red-100 text-red-600'}`}>
            <AlertTriangle/> UZBUNA
          </button>
        </div>
      </div>

      {/* GLAVNI DEO */}
      <div className="flex-1 p-10 overflow-auto">
        <h1 className="text-3xl font-black uppercase mb-8">{tab}</h1>

        {tab === 'obavestenja' && (
          <div>
            <div className="flex gap-4 mb-6">
              <input className="border p-3 rounded-lg flex-1 font-bold" placeholder="Tekst obaveštenja..." value={input1} onChange={e=>setInput1(e.target.value)}/>
              <button onClick={handleSave} className="bg-blue-600 text-white px-6 rounded-lg font-bold">DODAJ</button>
            </div>
            {data.ann.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow mb-2 flex justify-between">
                <span>{item.text}</span>
                <button onClick={() => handleDelete('announcements', item.id)} className="text-red-500"><Trash2/></button>
              </div>
            ))}
          </div>
        )}

        {tab === 'raspored' && (
          <div>
            <div className="grid grid-cols-5 gap-4 mb-6 bg-white p-6 rounded-xl shadow-sm">
               <select className="border p-2 rounded" onChange={e => setTtForm({...ttForm, day: e.target.value})}>
                 {['Понедељак','Уторак','Среда','Четвртак','Петак'].map(d=><option key={d}>{d}</option>)}
               </select>
               <input type="number" className="border p-2 rounded" placeholder="Čas (1-7)" onChange={e => setTtForm({...ttForm, period: e.target.value})}/>
               <input className="border p-2 rounded" placeholder="Predmet i odeljenje" onChange={e => setTtForm({...ttForm, class_name: e.target.value})}/>
               <input className="border p-2 rounded" placeholder="Kabinet" onChange={e => setTtForm({...ttForm, room: e.target.value})}/>
               <button onClick={saveTimetable} className="bg-blue-600 text-white rounded font-bold">SAČUVAJ</button>
            </div>
            <table className="w-full bg-white rounded-lg shadow overflow-hidden">
              <thead className="bg-slate-100 text-left"><tr><th className="p-3">Dan</th><th>Čas</th><th>Predmet</th><th>Kabinet</th><th>Brisanje</th></tr></thead>
              <tbody>
                {data.tt.map(t => (
                  <tr key={t.id} className="border-t">
                    <td className="p-3">{t.day}</td><td>{t.period}</td><td className="font-bold text-blue-600">{t.class_name}</td><td>{t.room}</td>
                    <td><button onClick={() => handleDelete('timetable', t.id)} className="text-red-500"><Trash2 size={16}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'dezurstvo' && (
          <div className="bg-white p-8 rounded-xl shadow max-w-md">
            <label className="font-bold block mb-2">Ime dežurnog nastavnika:</label>
            <input className="border p-3 w-full rounded-lg mb-4 text-lg font-bold" placeholder={data.duty.teacher_name} onChange={e=>setInput1(e.target.value)} />
            <button onClick={updateDuty} className="bg-black text-white w-full py-3 rounded-lg font-bold">AŽURIRAJ</button>
          </div>
        )}

        {tab === 'rodjendani' && (
          <div>
             <div className="flex gap-4 mb-6">
              <input className="border p-3 rounded-lg flex-1" placeholder="Ime i Prezime" value={input1} onChange={e=>setInput1(e.target.value)}/>
              <input className="border p-3 rounded-lg w-32" placeholder="Odeljenje" value={input2} onChange={e=>setInput2(e.target.value)}/>
              <button onClick={handleSave} className="bg-pink-600 text-white px-6 rounded-lg font-bold">DODAJ</button>
            </div>
            {data.bdays.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow mb-2 flex justify-between border-l-4 border-pink-500">
                <span className="font-bold">{item.name} ({item.class_name})</span>
                <button onClick={() => handleDelete('birthdays', item.id)} className="text-red-500"><Trash2/></button>
              </div>
            ))}
          </div>
        )}
        
        {tab === 'citati' && (
          <div>
             <div className="flex gap-4 mb-6">
              <input className="border p-3 rounded-lg flex-1" placeholder="Tekst citata" value={input1} onChange={e=>setInput1(e.target.value)}/>
              <input className="border p-3 rounded-lg w-48" placeholder="Autor" value={input2} onChange={e=>setInput2(e.target.value)}/>
              <button onClick={handleSave} className="bg-slate-800 text-white px-6 rounded-lg font-bold">DODAJ</button>
            </div>
            {data.quotes.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow mb-2 flex justify-between italic">
                <span>"{item.text}" - {item.author}</span>
                <button onClick={() => handleDelete('quotes', item.id)} className="text-red-500"><Trash2/></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}