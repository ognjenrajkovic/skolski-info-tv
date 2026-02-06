'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Lock, Save, Trash2, Plus, UserCheck, 
  Calendar, Bell, Cake, Quote, LogOut, AlertTriangle, Settings, Image as ImageIcon 
} from 'lucide-react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('announcements');
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], sys: [], quotes: [] });
  const [morningShift, setMorningShift] = useState('Parna');
  const [emergency, setEmergency] = useState('НОРМАЛНО');
  
  // Forme
  const [itemForm, setItemForm] = useState({});
  const [duty, setDuty] = useState({ teacher_name: '', student_names: '' });
  const [timetableForm, setTimetableForm] = useState({
    day: 'Понедељак', shift: 'Parna', time_of_day: 'Pre podne', 
    rows: [{ class_name: '', room: '', period: 1 }]
  });

  const checkPassword = async () => {
    const { data: res } = await supabase.from('system_settings').select('value').eq('key', 'admin_password').single();
    if (res && password === res.value) setIsAuthenticated(true);
    else alert("Pogrešna šifra!");
  };

  const fetchData = async () => {
    const [ann, bdays, tt, dt, sys, qt] = await Promise.all([
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('birthdays').select('*'),
      supabase.from('timetable').select('*').order('period', { ascending: true }),
      supabase.from('duty_staff').select('*').single(),
      supabase.from('system_settings').select('*'),
      supabase.from('quotes').select('*')
    ]);
    
    setData({ 
      ann: ann.data || [], 
      bdays: bdays.data || [], 
      tt: tt.data || [], 
      sys: sys.data || [], 
      quotes: qt.data || [] 
    });
    if (dt.data) setDuty(dt.data);
    const sh = sys.data?.find(s => s.key === 'current_morning_shift');
    const em = sys.data?.find(s => s.key === 'emergency');
    if (sh) setMorningShift(sh.value);
    if (em) setEmergency(em.value);
  };

  useEffect(() => { if (isAuthenticated) fetchData(); }, [activeTab, isAuthenticated]);

  // AKCIJE
  const handleSimpleSave = async (e) => {
    e.preventDefault();
    await supabase.from(activeTab).insert([itemForm]);
    setItemForm({}); e.target.reset(); fetchData();
  };

  const deleteItem = async (table, id) => {
    if(confirm("Obriši stavku?")) {
      await supabase.from(table).delete().eq('id', id);
      fetchData();
    }
  };

  const saveTimetable = async () => {
    const toInsert = timetableForm.rows
      .filter(r => r.class_name && r.room)
      .map(r => ({
        ...r, 
        day: timetableForm.day, 
        shift: timetableForm.shift, 
        time_of_day: timetableForm.time_of_day
      }));
    
    if (toInsert.length === 0) return alert("Unesite bar jedan čas!");
    const { error } = await supabase.from('timetable').insert(toInsert);
    if (!error) {
      alert("Uspešno dodato!");
      setTimetableForm({ ...timetableForm, rows: [{ class_name: '', room: '', period: 1 }] });
      fetchData();
    }
  };

  const toggleEmergency = async () => {
    const newVal = emergency === 'НОРМАЛНО' ? 'УЗБУНА' : 'НОРМАЛНО';
    await supabase.from('system_settings').upsert({ key: 'emergency', value: newVal });
    setEmergency(newVal);
  };

  const updateMorningShift = async (val) => {
    await supabase.from('system_settings').upsert({ key: 'current_morning_shift', value: val });
    setMorningShift(val);
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center font-sans">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md">
          <Lock className="mx-auto text-blue-600 mb-6" size={50} />
          <h1 className="text-3xl font-black text-center mb-8 italic uppercase">TV Admin</h1>
          <input type="password" placeholder="Lozinka" className="w-full p-5 bg-slate-100 rounded-2xl mb-4 font-bold text-center border-2 border-transparent focus:border-blue-500 outline-none text-slate-900" 
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkPassword()} />
          <button onClick={checkPassword} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase hover:bg-blue-700">Prijavi se</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-900">
      {/* SIDEBAR */}
      <div className="w-80 bg-slate-900 text-white p-8 flex flex-col gap-2 shrink-0">
        <div className="mb-10">
          <h2 className="text-2xl font-black text-blue-400 italic uppercase">Konfiguracija</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Sistem za digitalni prikaz</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          {[
            { id: 'announcements', icon: <Bell/>, label: 'Obaveštenja' },
            { id: 'timetable', icon: <Calendar/>, label: 'Raspored Časova' },
            { id: 'duty', icon: <UserCheck/>, label: 'Dežurstvo' },
            { id: 'birthdays', icon: <Cake/>, label: 'Rođendani' },
            { id: 'quotes', icon: <Quote/>, label: 'Citati' },
            { id: 'settings', icon: <Settings/>, label: 'Podešavanja' }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} 
              className={`w-full p-4 rounded-2xl font-black flex items-center gap-4 transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <button onClick={toggleEmergency} className={`w-full p-6 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all ${emergency === 'УЗБУНА' ? 'bg-white text-red-600 animate-pulse' : 'bg-red-600 text-white hover:bg-red-700'}`}>
          <AlertTriangle size={24}/> {emergency === 'УЗБУНА' ? 'PREKINI UZBUNU' : 'AKTIVIRAJ UZBUNU'}
        </button>

        <button onClick={() => setIsAuthenticated(false)} className="mt-6 text-slate-500 font-bold hover:text-white flex items-center justify-center gap-2 text-xs uppercase">
          <LogOut size={16}/> Odjavi se
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-16 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          {/* TIMETABLE TAB */}
          {activeTab === 'timetable' && (
            <div className="space-y-10">
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200">
                <h3 className="text-2xl font-black mb-8 uppercase italic border-b pb-4">Dodaj novi raspored</h3>
                <div className="grid grid-cols-3 gap-6 mb-10">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-2">Dan</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" value={timetableForm.day} onChange={e => setTimetableForm({...timetableForm, day: e.target.value})}>
                      {["Понедељак", "Уторак", "Среда", "Четвртак", "Петак"].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-2">Smena</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" value={timetableForm.shift} onChange={e => setTimetableForm({...timetableForm, shift: e.target.value})}>
                      <option value="Parna">Parna Smena</option><option value="Neparna">Neparna Smena</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-2">Doba dana</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" value={timetableForm.time_of_day} onChange={e => setTimetableForm({...timetableForm, time_of_day: e.target.value})}>
                      <option value="Pre podne">Pre podne</option><option value="Posle podne">Posle podne</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {timetableForm.rows.map((row, idx) => (
                    <div key={idx} className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl">
                      <div className="w-16">
                        <label className="text-[10px] font-black block mb-1">Čas</label>
                        <input type="number" className="w-full p-3 rounded-xl font-black text-center border" value={row.period} onChange={e => {
                          let nr = [...timetableForm.rows]; nr[idx].period = e.target.value; setTimetableForm({...timetableForm, rows: nr});
                        }} />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-black block mb-1">Odeljenje (npr. 8-1)</label>
                        <input className="w-full p-3 rounded-xl font-bold border uppercase" value={row.class_name} onChange={e => {
                          let nr = [...timetableForm.rows]; nr[idx].class_name = e.target.value; setTimetableForm({...timetableForm, rows: nr});
                        }} />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-black block mb-1">Kabinet</label>
                        <input className="w-full p-3 rounded-xl font-bold border uppercase" value={row.room} onChange={e => {
                          let nr = [...timetableForm.rows]; nr[idx].room = e.target.value; setTimetableForm({...timetableForm, rows: nr});
                        }} />
                      </div>
                      <button onClick={() => setTimetableForm({...timetableForm, rows: timetableForm.rows.filter((_, i) => i !== idx)})} className="mt-4 text-red-400 hover:text-red-600"><Trash2/></button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-4">
                  <button onClick={() => setTimetableForm({...timetableForm, rows: [...timetableForm.rows, {class_name: '', room: '', period: timetableForm.rows.length + 1}]})} className="flex-1 p-4 border-2 border-dashed border-slate-300 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all">+ Dodaj još jedan red</button>
                  <button onClick={saveTimetable} className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-black uppercase shadow-xl hover:bg-black flex items-center justify-center gap-2"><Save size={20}/> Sačuvaj sve u bazu</button>
                </div>
              </div>

              {/* LISTA UNETIH ČASOVA SA BRISANJEM */}
              <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-200">
                <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
                  <h3 className="font-black uppercase italic">Pregled baze podataka</h3>
                  <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-black uppercase">{timetableForm.day} | {timetableForm.time_of_day}</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="p-6">Čas</th><th className="p-6">Odeljenje</th><th className="p-6">Kabinet</th><th className="p-6">Smena</th><th className="p-6 text-right">Akcija</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.tt.filter(t => t.day === timetableForm.day && t.time_of_day === timetableForm.time_of_day).map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 font-bold">
                        <td className="p-6 text-blue-600 font-black text-xl">{t.period}.</td>
                        <td className="p-6 uppercase">{t.class_name}</td>
                        <td className="p-6 uppercase text-slate-500">{t.room}</td>
                        <td className="p-6 text-xs">{t.shift}</td>
                        <td className="p-6 text-right"><button onClick={() => deleteItem('timetable', t.id)} className="text-red-300 hover:text-red-600 p-2"><Trash2 size={20}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OSTALI TABOVI (OBAVEŠTENJA, ROĐENDANI, CITATI) */}
          {(activeTab === 'announcements' || activeTab === 'birthdays' || activeTab === 'quotes') && (
            <div className="space-y-10">
              <form onSubmit={handleSimpleSave} className="bg-white p-10 rounded-[3rem] shadow-xl grid gap-6 border border-slate-200">
                <h3 className="text-2xl font-black uppercase italic border-b pb-4">Nova stavka</h3>
                {activeTab === 'announcements' && (
                  <>
                    <textarea placeholder="Tekst obaveštenja..." className="p-5 bg-slate-50 rounded-2xl font-bold text-lg border" onChange={e => setItemForm({...itemForm, text: e.target.value})} required />
                    <input placeholder="URL slike (opciono)" className="p-5 bg-slate-50 rounded-2xl font-bold border" onChange={e => setItemForm({...itemForm, image_url: e.target.value})} />
                  </>
                )}
                {activeTab === 'birthdays' && (
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Ime i prezime" className="p-5 bg-slate-50 rounded-2xl font-bold border" onChange={e => setItemForm({...itemForm, name: e.target.value})} required />
                    <input placeholder="Odeljenje" className="p-5 bg-slate-50 rounded-2xl font-bold border" onChange={e => setItemForm({...itemForm, class_name: e.target.value})} required />
                  </div>
                )}
                {activeTab === 'quotes' && (
                  <>
                    <textarea placeholder="Citat..." className="p-5 bg-slate-50 rounded-2xl font-bold italic border text-lg" onChange={e => setItemForm({...itemForm, text: e.target.value})} required />
                    <input placeholder="Autor" className="p-5 bg-slate-50 rounded-2xl font-bold border" onChange={e => setItemForm({...itemForm, author: e.target.value})} required />
                  </>
                )}
                <button type="submit" className="bg-blue-600 text-white p-6 rounded-2xl font-black uppercase shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2"><Plus/> Dodaj u listu</button>
              </form>
              
              <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-200 divide-y">
                {(activeTab === 'announcements' ? data.ann : activeTab === 'birthdays' ? data.bdays : data.quotes).map(item => (
                  <div key={item.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-4 truncate">
                      {item.image_url && <ImageIcon className="text-blue-500" size={20}/>}
                      <span className="font-bold text-slate-700 text-lg truncate">{item.text || item.name}</span>
                    </div>
                    <button onClick={() => deleteItem(activeTab, item.id)} className="text-red-400 hover:text-red-600 p-3 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={24}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DEŽURSTVO TAB */}
          {activeTab === 'duty' && (
            <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-200 space-y-10">
              <h3 className="text-3xl font-black uppercase italic border-b pb-6">Dnevno dežurstvo</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 ml-4 mb-2 block">Nastavnik</label>
                  <input className="w-full p-6 bg-slate-50 rounded-[2rem] font-black text-3xl border uppercase" value={duty.teacher_name} onChange={e => setDuty({...duty, teacher_name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 ml-4 mb-2 block">Učenici</label>
                  <textarea className="w-full p-6 bg-slate-50 rounded-[2rem] font-bold text-2xl border uppercase" rows={3} value={duty.student_names} onChange={e => setDuty({...duty, student_names: e.target.value})} />
                </div>
                <button onClick={async () => { await supabase.from('duty_staff').upsert(duty); alert("Sačuvano!"); }} className="w-full bg-blue-600 text-white p-8 rounded-[2.5rem] font-black uppercase text-xl shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4"><Save size={30}/> Ažuriraj TV ekran</button>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-200">
              <h3 className="text-3xl font-black uppercase italic border-b pb-6 mb-8">Globalna podešavanja</h3>
              <div className="p-8 bg-slate-50 rounded-[3rem] border flex justify-between items-center">
                <div>
                  <p className="font-black text-xl uppercase italic">Smena koja je trenutno PRE PODNE</p>
                  <p className="text-slate-500 font-bold">Ovo automatski rotira raspored na ekranu svakog ponedeljka (ili ručno ovde).</p>
                </div>
                <div className="flex bg-white p-2 rounded-3xl shadow-inner border gap-2">
                  <button onClick={() => updateMorningShift('Parna')} className={`px-10 py-5 rounded-2xl font-black transition-all ${morningShift === 'Parna' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>PARNA</button>
                  <button onClick={() => updateMorningShift('Neparna')} className={`px-10 py-5 rounded-2xl font-black transition-all ${morningShift === 'Neparna' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>NEPARNA</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}