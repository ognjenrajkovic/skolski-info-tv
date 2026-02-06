'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Save, Trash2, Plus, UserCheck, Calendar, Bell, Cake, Quote, LogOut, AlertTriangle, Settings, Volume2, Megaphone } from 'lucide-react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('announcements');
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], sys: [], quotes: [] });
  const [itemForm, setItemForm] = useState({});
  const [duty, setDuty] = useState({ teacher_name: '', student_names: '' });
  const [timetableForm, setTimetableForm] = useState({ day: 'Понедељак', shift: 'Parna', time_of_day: 'Pre podne', rows: [{ class_name: '', room: '', period: 1 }] });

  const checkPassword = async () => {
    const { data: res } = await supabase.from('system_settings').select('value').eq('key', 'admin_password').single();
    if (res && password === res.value) setIsAuthenticated(true);
    else alert("Погрешна шифра!");
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
  };

  const saveTimetable = async () => {
    const toInsert = timetableForm.rows.filter(r => r.class_name && r.room).map(r => ({
      ...r, day: timetableForm.day, shift: timetableForm.shift, time_of_day: timetableForm.time_of_day
    }));
    await supabase.from('timetable').insert(toInsert);
    setTimetableForm({ ...timetableForm, rows: [{ class_name: '', room: '', period: 1 }] });
    fetchData();
  };

  const deleteItem = async (table, id) => {
    if(confirm("Обриши?")) { await supabase.from(table).delete().eq('id', id); fetchData(); }
  };

  const getSysVal = (key) => data.sys?.find(s => s.key === key)?.value || '';

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md text-center">
          <Lock className="mx-auto text-blue-600 mb-6" size={60} />
          <h1 className="text-3xl font-black mb-8 uppercase italic text-slate-900">АДМИН ПАНЕЛ</h1>
          <input type="password" placeholder="Унесите шифру" className="w-full p-5 bg-slate-100 rounded-2xl mb-4 font-bold text-center text-xl" 
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkPassword()} />
          <button onClick={checkPassword} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg">ПРИЈАВИ СЕ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* SIDEBAR */}
      <div className="w-80 bg-slate-900 text-white p-8 flex flex-col gap-3 shrink-0">
        <h2 className="text-2xl font-black text-blue-400 mb-10 uppercase italic">Управљање</h2>
        <nav className="flex-1 space-y-2">
          {[{id:'announcements', label:'Обавештења'}, {id:'timetable', label:'Распоред'}, {id:'duty', label:'Дежурство'}, {id:'birthdays', label:'Рођендани'}, {id:'quotes', label:'Цитати'}, {id:'settings', label:'Систем'}].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
              className={`w-full p-4 rounded-2xl font-black text-left uppercase transition-all ${activeTab === tab.id ? 'bg-blue-600 shadow-xl' : 'text-slate-400 hover:bg-slate-800'}`}>
              {tab.label}
            </button>
          ))}
        </nav>
        <button onClick={() => updateSetting('emergency', getSysVal('emergency') === 'УЗБУНА' ? 'NORMAL' : 'УЗБУНА')} 
          className={`p-6 rounded-2xl font-black uppercase text-center ${getSysVal('emergency') === 'УЗБУНА' ? 'bg-white text-red-600 animate-pulse' : 'bg-red-600 text-white'}`}>
          <AlertTriangle className="inline mr-2" /> {getSysVal('emergency') === 'УЗБУНА' ? 'СТОП УЗБУНА' : 'УЗБУНА'}
        </button>
      </div>

      <div className="flex-1 p-16 overflow-y-auto">
        <h2 className="text-5xl font-black uppercase italic mb-10 border-b-8 border-slate-200 pb-6">{activeTab}</h2>

        {activeTab === 'timetable' && (
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border">
              <div className="grid grid-cols-3 gap-6 mb-8">
                <select className="p-5 bg-slate-100 rounded-2xl font-bold" value={timetableForm.day} onChange={e => setTimetableForm({...timetableForm, day: e.target.value})}>
                  {["Понедељак", "Уторак", "Среда", "Четвртак", "Петак"].map(d => <option key={d}>{d}</option>)}
                </select>
                <select className="p-5 bg-slate-100 rounded-2xl font-bold" value={timetableForm.shift} onChange={e => setTimetableForm({...timetableForm, shift: e.target.value})}>
                  <option value="Parna">Парна смена</option><option value="Neparna">Непарна смена</option>
                </select>
                <select className="p-5 bg-slate-100 rounded-2xl font-bold" value={timetableForm.time_of_day} onChange={e => setTimetableForm({...timetableForm, time_of_day: e.target.value})}>
                  <option value="Pre podne">Пре подне</option><option value="Posle podne">После подне</option>
                </select>
              </div>
              {timetableForm.rows.map((row, idx) => (
                <div key={idx} className="flex gap-4 mb-4">
                  <input type="number" placeholder="Ч" className="w-20 p-4 border rounded-xl font-bold" value={row.period} onChange={e => { let nr = [...timetableForm.rows]; nr[idx].period = e.target.value; setTimetableForm({...timetableForm, rows: nr}); }} />
                  <input placeholder="Одељење" className="flex-1 p-4 border rounded-xl font-bold uppercase" value={row.class_name} onChange={e => { let nr = [...timetableForm.rows]; nr[idx].class_name = e.target.value; setTimetableForm({...timetableForm, rows: nr}); }} />
                  <input placeholder="Кабинет" className="flex-1 p-4 border rounded-xl font-bold uppercase" value={row.room} onChange={e => { let nr = [...timetableForm.rows]; nr[idx].room = e.target.value; setTimetableForm({...timetableForm, rows: nr}); }} />
                </div>
              ))}
              <div className="flex gap-4">
                <button onClick={() => setTimetableForm({...timetableForm, rows: [...timetableForm.rows, {class_name:'', room:'', period:timetableForm.rows.length+1}]})} className="flex-1 p-5 border-2 border-dashed rounded-2xl font-bold text-slate-400">+ Додај ред</button>
                <button onClick={saveTimetable} className="flex-1 bg-slate-900 text-white p-5 rounded-2xl font-black uppercase shadow-xl">САЧУВАЈ У БАЗУ</button>
              </div>
            </div>
            <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-[1.2vh] font-black uppercase"><tr><th className="p-6">Час</th><th className="p-6">Одељење</th><th className="p-6">Кабинет</th><th className="p-6">Акција</th></tr></thead>
                <tbody>
                  {data.tt.filter(t => t.day === timetableForm.day && t.time_of_day === timetableForm.time_of_day).map(t => (
                    <tr key={t.id} className="border-t font-black">
                      <td className="p-6 text-blue-600">{t.period}.</td><td className="p-6 uppercase">{t.class_name}</td><td className="p-6 uppercase text-slate-400">{t.room}</td>
                      <td className="p-6"><button onClick={() => deleteItem('timetable', t.id)} className="text-red-500 hover:scale-125 transition-all"><Trash2/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'duty' && (
          <div className="bg-white p-12 rounded-[4rem] shadow-2xl border space-y-8">
            <h3 className="text-2xl font-black uppercase mb-4 opacity-30 italic">Дежурни наставник данас</h3>
            <input className="w-full p-8 bg-slate-50 rounded-[2.5rem] font-black text-5xl border-4 border-slate-100 uppercase" value={duty.teacher_name} onChange={e => setDuty({...duty, teacher_name: e.target.value})} placeholder="ИМЕ НАСТАВНИКА" />
            <button onClick={async () => { await supabase.from('duty_staff').upsert(duty); alert("Ажурирано!"); }} className="w-full bg-blue-600 text-white p-8 rounded-[3rem] font-black text-2xl uppercase shadow-xl hover:bg-blue-700">АЖУРИРАЈ ПОДАТКЕ</button>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid gap-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border">
              <h3 className="text-xl font-black mb-6 uppercase italic text-blue-600 flex items-center gap-3"><Volume2/> Школски радио</h3>
              <input className="w-full p-5 bg-slate-50 rounded-2xl border mb-4 font-bold" value={getSysVal('bg_music_url')} onChange={e => updateSetting('bg_music_url', e.target.value)} placeholder="MP3 Линк..." />
              <button onClick={() => updateSetting('music_active', getSysVal('music_active') === 'true' ? 'false' : 'true')} 
                className={`w-full p-5 rounded-2xl font-black uppercase text-white ${getSysVal('music_active') === 'true' ? 'bg-red-500' : 'bg-emerald-600'}`}>
                {getSysVal('music_active') === 'true' ? 'ИСКЉУЧИ МУЗИКУ' : 'ПУСТИ МУЗИКУ'}
              </button>
            </div>
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border">
              <h3 className="text-xl font-black mb-6 uppercase italic text-orange-500"><Megaphone/> Трака са вестима</h3>
              <input className="w-full p-5 bg-slate-50 rounded-2xl border font-black uppercase" value={getSysVal('breaking_news')} onChange={e => updateSetting('breaking_news', e.target.value)} placeholder="Текст на дну..." />
            </div>
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border">
              <h3 className="text-xl font-black mb-4 uppercase">Смена пре подне:</h3>
              <div className="flex gap-4">
                <button onClick={() => updateSetting('current_morning_shift', 'Parna')} className={`flex-1 p-5 rounded-2xl font-black ${getSysVal('current_morning_shift') === 'Parna' ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-100 text-slate-400'}`}>ПАРНА</button>
                <button onClick={() => updateSetting('current_morning_shift', 'Neparna')} className={`flex-1 p-5 rounded-2xl font-black ${getSysVal('current_morning_shift') === 'Neparna' ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-100 text-slate-400'}`}>НЕПАРНА</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}