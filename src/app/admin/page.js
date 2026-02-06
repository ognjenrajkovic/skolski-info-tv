'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Lock, Save, Trash2, Plus, UserCheck, Calendar, Bell, Cake, 
  Quote, LogOut, AlertTriangle, Settings, Image as ImageIcon,
  Volume2, Music, Megaphone, Radio, List
} from 'lucide-react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('announcements');
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], sys: [], quotes: [] });
  
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
    try {
      const [ann, bdays, tt, dt, sys, qt] = await Promise.all([
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('birthdays').select('*'),
        supabase.from('timetable').select('*').order('period', { ascending: true }),
        supabase.from('duty_staff').select('*').single(),
        supabase.from('system_settings').select('*'),
        supabase.from('quotes').select('*')
      ]);
      setData({ ann: ann.data || [], bdays: bdays.data || [], tt: tt.data || [], sys: sys.data || [], quotes: qt.data || [] });
      if (dt.data) setDuty(dt.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (isAuthenticated) fetchData(); }, [activeTab, isAuthenticated]);

  const updateSetting = async (key, value) => {
    await supabase.from('system_settings').upsert({ key, value: value.toString() }, { onConflict: 'key' });
    fetchData();
  };

  const handleSimpleSave = async (e) => {
    e.preventDefault();
    await supabase.from(activeTab).insert([itemForm]);
    setItemForm({}); e.target.reset(); fetchData();
    alert("Uspešno dodato!");
  };

  const deleteItem = async (table, id) => {
    if(confirm("Obriši stavku?")) {
      await supabase.from(table).delete().eq('id', id);
      fetchData();
    }
  };

  const saveTimetable = async () => {
    const toInsert = timetableForm.rows.filter(r => r.class_name && r.room).map(r => ({
      ...r, day: timetableForm.day, shift: timetableForm.shift, time_of_day: timetableForm.time_of_day
    }));
    await supabase.from('timetable').insert(toInsert);
    setTimetableForm({ ...timetableForm, rows: [{ class_name: '', room: '', period: 1 }] });
    fetchData();
    alert("Raspored sačuvan!");
  };

  const getSysVal = (key) => data.sys?.find(s => s.key === key)?.value || '';

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md">
          <Lock className="mx-auto text-blue-600 mb-6" size={60} />
          <h1 className="text-3xl font-black text-center mb-8 italic uppercase tracking-tighter text-slate-900">ADMIN PANEL</h1>
          <input type="password" placeholder="Šifra" className="w-full p-5 bg-slate-100 rounded-2xl mb-4 font-bold text-center text-xl" 
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkPassword()} />
          <button onClick={checkPassword} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg">Prijavi se</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* SIDEBAR */}
      <div className="w-80 bg-slate-900 text-white p-8 flex flex-col gap-3 shrink-0">
        <div className="mb-10 px-2"><h2 className="text-2xl font-black text-blue-400 italic uppercase">TV Control</h2></div>
        <nav className="flex-1 space-y-2">
          {[
            { id: 'announcements', icon: <Bell/>, label: 'Obaveštenja' },
            { id: 'timetable', icon: <Calendar/>, label: 'Raspored' },
            { id: 'duty', icon: <UserCheck/>, label: 'Dežurstvo' },
            { id: 'birthdays', icon: <Cake/>, label: 'Rođendani' },
            { id: 'quotes', icon: <Quote/>, label: 'Citati' },
            { id: 'settings', icon: <Settings/>, label: 'Sistem & Muzika' }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} 
              className={`w-full p-4 rounded-2xl font-black flex items-center gap-4 transition-all ${activeTab === item.id ? 'bg-blue-600 shadow-xl translate-x-2' : 'text-slate-400 hover:bg-slate-800'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => updateSetting('emergency', getSysVal('emergency') === 'УЗБУНА' ? 'NORMALNO' : 'УЗБУНА')} 
          className={`w-full p-5 rounded-2xl font-black flex items-center justify-center gap-3 ${getSysVal('emergency') === 'УЗБУНА' ? 'bg-white text-red-600 animate-pulse' : 'bg-red-600 hover:bg-red-700'}`}>
          <AlertTriangle/> {getSysVal('emergency') === 'УЗБУНА' ? 'STOP UZBUNA' : 'AKTIVIRAJ UZBUNU'}
        </button>
      </div>

      <div className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-black uppercase italic mb-10 border-b-4 border-slate-200 pb-6">{activeTab}</h2>

          {activeTab === 'timetable' && (
            <div className="space-y-10">
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200">
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <select className="p-5 bg-slate-100 rounded-2xl font-bold" value={timetableForm.day} onChange={e => setTimetableForm({...timetableForm, day: e.target.value})}>
                    {["Понедељак", "Уторак", "Среда", "Четвртак", "Петак"].map(d => <option key={d}>{d}</option>)}
                  </select>
                  <select className="p-5 bg-slate-100 rounded-2xl font-bold" value={timetableForm.shift} onChange={e => setTimetableForm({...timetableForm, shift: e.target.value})}>
                    <option value="Parna">Parna</option><option value="Neparna">Neparna</option>
                  </select>
                  <select className="p-5 bg-slate-100 rounded-2xl font-bold" value={timetableForm.time_of_day} onChange={e => setTimetableForm({...timetableForm, time_of_day: e.target.value})}>
                    <option value="Pre podne">Pre podne</option><option value="Posle podne">Posle podne</option>
                  </select>
                </div>
                {timetableForm.rows.map((row, idx) => (
                  <div key={idx} className="flex gap-4 mb-3">
                    <input type="number" placeholder="Čas" className="w-20 p-4 bg-slate-50 rounded-xl border" value={row.period} onChange={e => { let nr = [...timetableForm.rows]; nr[idx].period = e.target.value; setTimetableForm({...timetableForm, rows: nr}); }} />
                    <input placeholder="Odeljenje" className="flex-1 p-4 bg-slate-50 rounded-xl border uppercase font-bold" value={row.class_name} onChange={e => { let nr = [...timetableForm.rows]; nr[idx].class_name = e.target.value; setTimetableForm({...timetableForm, rows: nr}); }} />
                    <input placeholder="Kabinet" className="flex-1 p-4 bg-slate-50 rounded-xl border uppercase font-bold" value={row.room} onChange={e => { let nr = [...timetableForm.rows]; nr[idx].room = e.target.value; setTimetableForm({...timetableForm, rows: nr}); }} />
                  </div>
                ))}
                <div className="flex gap-4 mt-6">
                  <button onClick={() => setTimetableForm({...timetableForm, rows: [...timetableForm.rows, {class_name: '', room: '', period: timetableForm.rows.length + 1}]})} className="flex-1 p-4 border-2 border-dashed rounded-2xl font-bold text-slate-400">+ Dodaj red</button>
                  <button onClick={saveTimetable} className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-black"><Save className="inline mr-2"/> SAČUVAJ</button>
                </div>
              </div>
              <div className="bg-white rounded-[2rem] shadow-lg overflow-hidden border">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-black uppercase text-xs"><tr><th className="p-5">Čas</th><th className="p-5">Odeljenje</th><th className="p-5">Soba</th><th className="p-5">Akcija</th></tr></thead>
                  <tbody>
                    {data.tt.filter(t => t.day === timetableForm.day && t.time_of_day === timetableForm.time_of_day).map(t => (
                      <tr key={t.id} className="border-t font-bold">
                        <td className="p-5 text-blue-600">{t.period}.</td><td className="p-5 uppercase">{t.class_name}</td><td className="p-5 uppercase">{t.room}</td>
                        <td className="p-5"><button onClick={() => deleteItem('timetable', t.id)} className="text-red-500"><Trash2 size={18}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'duty' && (
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border space-y-8">
              <input className="w-full p-6 bg-slate-50 rounded-2xl font-black text-3xl border-2 uppercase shadow-inner" value={duty.teacher_name} onChange={e => setDuty({...duty, teacher_name: e.target.value})} placeholder="Nastavnik" />
              <textarea className="w-full p-6 bg-slate-50 rounded-2xl font-bold text-xl border-2 uppercase shadow-inner" rows={3} value={duty.student_names} onChange={e => setDuty({...duty, student_names: e.target.value})} placeholder="Učenici" />
              <button onClick={async () => { await supabase.from('duty_staff').upsert(duty); alert("Ažurirano!"); }} className="w-full bg-blue-600 text-white p-6 rounded-2xl font-black text-xl uppercase shadow-lg hover:bg-blue-700">AŽURIRAJ DEŽURSTVO</button>
            </div>
          )}

          {(activeTab === 'announcements' || activeTab === 'birthdays' || activeTab === 'quotes') && (
            <div className="space-y-10">
              <form onSubmit={handleSimpleSave} className="bg-white p-10 rounded-[3rem] shadow-xl border grid gap-6">
                {activeTab === 'announcements' && (
                  <><textarea placeholder="Tekst..." className="w-full p-6 bg-slate-50 rounded-2xl font-bold text-xl" rows={3} onChange={e => setItemForm({...itemForm, text: e.target.value})} required />
                  <input placeholder="Image URL" className="w-full p-4 bg-slate-50 rounded-xl" onChange={e => setItemForm({...itemForm, image_url: e.target.value})} /></>
                )}
                {activeTab === 'birthdays' && (
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Ime" className="p-5 bg-slate-50 rounded-xl font-bold" onChange={e => setItemForm({...itemForm, name: e.target.value})} required />
                    <input placeholder="Razred" className="p-5 bg-slate-50 rounded-xl font-bold uppercase" onChange={e => setItemForm({...itemForm, class_name: e.target.value})} required />
                  </div>
                )}
                {activeTab === 'quotes' && (
                  <><textarea placeholder="Citat..." className="w-full p-6 bg-slate-50 rounded-2xl font-bold italic" onChange={e => setItemForm({...itemForm, text: e.target.value})} required />
                  <input placeholder="Autor" className="p-5 bg-slate-50 rounded-xl font-black" onChange={e => setItemForm({...itemForm, author: e.target.value})} required /></>
                )}
                <button type="submit" className="bg-blue-600 text-white p-5 rounded-2xl font-black uppercase shadow-xl hover:bg-blue-700">OBJAVI</button>
              </form>
              <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border">
                {(activeTab === 'announcements' ? data.ann : activeTab === 'birthdays' ? data.bdays : data.quotes).map(item => (
                  <div key={item.id} className="p-6 flex justify-between items-center border-b hover:bg-slate-50">
                    <span className="font-bold text-lg">{item.text || item.name}</span>
                    <button onClick={() => deleteItem(activeTab, item.id)} className="text-red-400 p-2"><Trash2/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-lg border">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-blue-600"><Radio/> ŠKOLSKI RADIO (MP3)</h3>
                <input className="w-full p-5 bg-slate-50 rounded-2xl border mb-4 font-bold" value={getSysVal('bg_music_url')} onChange={e => updateSetting('bg_music_url', e.target.value)} placeholder="MP3 Link..." />
                <button onClick={() => updateSetting('music_active', getSysVal('music_active') === 'true' ? 'false' : 'true')} 
                  className={`w-full p-5 rounded-2xl font-black uppercase shadow-md ${getSysVal('music_active') === 'true' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                  {getSysVal('music_active') === 'true' ? 'STOPIRAJ MUZIKU' : 'PUSTI MUZIKU NA TV'}
                </button>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-lg border">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-orange-500"><Megaphone/> HITNA TRAKA (BREAKING NEWS)</h3>
                <input className="w-full p-5 bg-slate-50 rounded-2xl border font-black uppercase" value={getSysVal('breaking_news')} onChange={e => updateSetting('breaking_news', e.target.value)} placeholder="Tekst na dnu ekrana..." />
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-lg border">
                <h3 className="text-xl font-black mb-4 uppercase italic">Pre podne je smena:</h3>
                <div className="flex gap-4">
                  <button onClick={() => updateSetting('current_morning_shift', 'Parna')} className={`flex-1 p-5 rounded-2xl font-black ${getSysVal('current_morning_shift') === 'Parna' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>PARNA</button>
                  <button onClick={() => updateSetting('current_morning_shift', 'Neparna')} className={`flex-1 p-5 rounded-2xl font-black ${getSysVal('current_morning_shift') === 'Neparna' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>NEPARNA</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}