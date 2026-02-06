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
  
  const [itemForm, setItemForm] = useState({});
  const [duty, setDuty] = useState({ teacher_name: '', student_names: '' });
  const [timetableForm, setTimetableForm] = useState({
    day: 'Понедељак', shift: 'Parna', time_of_day: 'Pre podne', rows: [{ class_name: '', room: '', period: 1 }]
  });

  const checkPassword = async () => {
    const { data: res } = await supabase.from('system_settings').select('value').eq('key', 'admin_password').single();
    if (res && password === res.value) setIsAuthenticated(true);
    else alert("Погрешна шифра!");
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
    
    setData({ ann: ann.data || [], bdays: bdays.data || [], tt: tt.data || [], sys: sys.data || [], quotes: qt.data || [] });
    if (dt.data) setDuty(dt.data);
    const sh = sys.data?.find(s => s.key === 'current_morning_shift');
    const em = sys.data?.find(s => s.key === 'emergency');
    if (sh) setMorningShift(sh.value);
    if (em) setEmergency(em.value);
  };

  useEffect(() => { if (isAuthenticated) fetchData(); }, [activeTab, isAuthenticated]);

  const toggleEmergency = async () => {
    const newVal = emergency === 'НОРМАЛНО' ? 'УЗБУНА' : 'НОРМАЛНО';
    setEmergency(newVal);
    await supabase.from('system_settings').upsert({ key: 'emergency', value: newVal });
  };

  const updateSetting = async (key, val) => {
    await supabase.from('system_settings').upsert({ key, value: val.toString() });
    fetchData();
  };

  const handleSimpleSave = async (e) => {
    e.preventDefault();
    await supabase.from(activeTab).insert([itemForm]);
    setItemForm({}); e.target.reset(); fetchData();
  };

  const deleteItem = async (table, id) => {
    if(confirm("Обрисати?")) { await supabase.from(table).delete().eq('id', id); fetchData(); }
  };

  const saveTimetable = async () => {
    const toInsert = timetableForm.rows.filter(r => r.class_name).map(r => ({
      ...r, day: timetableForm.day, shift: timetableForm.shift, time_of_day: timetableForm.time_of_day
    }));
    await supabase.from('timetable').insert(toInsert);
    alert("Сачувано!"); 
    setTimetableForm({...timetableForm, rows: [{ class_name: '', room: '', period: 1 }]});
    fetchData();
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-6 text-slate-900 font-sans">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md text-center">
          <Lock size={60} className="mx-auto text-blue-600 mb-8" />
          <h1 className="text-2xl font-black uppercase italic mb-8 tracking-tighter">TV КОНТРОЛА</h1>
          <input type="password" placeholder="Шифра" className="w-full p-5 bg-slate-100 rounded-2xl mb-4 text-center font-black text-xl border-2 border-transparent focus:border-blue-500 outline-none" 
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkPassword()}/>
          <button onClick={checkPassword} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase">Приступи</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <div className="w-72 bg-slate-900 text-white p-6 flex flex-col shrink-0">
        <h2 className="text-xl font-black text-blue-400 italic mb-10 uppercase">Школски TV</h2>
        <nav className="flex-1 space-y-1">
          {[
            { id: 'announcements', icon: <Bell/>, label: 'Обавештења' },
            { id: 'timetable', icon: <Calendar/>, label: 'Распоред' },
            { id: 'duty', icon: <UserCheck/>, label: 'Дежурство' },
            { id: 'birthdays', icon: <Cake/>, label: 'Рођендани' },
            { id: 'quotes', icon: <Quote/>, label: 'Цитати' },
            { id: 'settings', icon: <Settings/>, label: 'Подешавања' }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full p-4 rounded-xl font-bold flex items-center gap-4 transition-all ${activeTab === item.id ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <button onClick={toggleEmergency} className={`w-full p-5 rounded-2xl font-black ${emergency === 'УЗБУНА' ? 'bg-white text-red-600 animate-pulse' : 'bg-red-600 text-white'}`}>УЗБУНА</button>
      </div>

      <div className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black uppercase italic mb-10 tracking-tighter border-b pb-4">{activeTab}</h2>

          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <form onSubmit={handleSimpleSave} className="bg-white p-10 rounded-[2.5rem] shadow-sm grid gap-4 border border-slate-200">
                <textarea placeholder="Текст..." className="p-4 bg-slate-50 rounded-2xl font-bold text-lg" onChange={e => setItemForm({...itemForm, text: e.target.value})} required />
                <input placeholder="URL slike" className="p-4 bg-slate-50 rounded-2xl font-bold" onChange={e => setItemForm({...itemForm, image_url: e.target.value})} />
                <button className="bg-blue-600 text-white p-4 rounded-2xl font-black uppercase">Додај</button>
              </form>
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
                {data.ann.map(a => <div key={a.id} className="p-5 flex justify-between border-b"><span>{a.text}</span><button onClick={() => deleteItem('announcements', a.id)} className="text-red-400"><Trash2/></button></div>)}
              </div>
            </div>
          )}

          {activeTab === 'timetable' && (
            <div className="space-y-6">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <select className="p-4 bg-slate-50 rounded-xl font-black" value={timetableForm.day} onChange={e => setTimetableForm({...timetableForm, day: e.target.value})}>
                    {["Понедељак", "Уторак", "Среда", "Четвртак", "Петак"].map(d => <option key={d}>{d}</option>)}
                  </select>
                  <select className="p-4 bg-slate-50 rounded-xl font-black" value={timetableForm.shift} onChange={e => setTimetableForm({...timetableForm, shift: e.target.value})}>
                    <option value="Parna">Парна Смена</option><option value="Neparna">Непарна Смена</option>
                  </select>
                  <select className="p-4 bg-slate-50 rounded-xl font-black" value={timetableForm.time_of_day} onChange={e => setTimetableForm({...timetableForm, time_of_day: e.target.value})}>
                    <option value="Pre podne">Пре подне</option><option value="Posle podne">После подне</option>
                  </select>
                </div>
                {timetableForm.rows.map((row, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input type="number" placeholder="Ч" className="w-16 p-4 bg-slate-50 rounded-xl font-black" value={row.period} onChange={e => { let nr=[...timetableForm.rows]; nr[idx].period=e.target.value; setTimetableForm({...timetableForm, rows:nr})}} />
                    <input placeholder="Одељење" className="flex-1 p-4 bg-slate-50 rounded-xl font-bold" value={row.class_name} onChange={e => { let nr=[...timetableForm.rows]; nr[idx].class_name=e.target.value; setTimetableForm({...timetableForm, rows:nr})}} />
                    <input placeholder="Кабинет" className="flex-1 p-4 bg-slate-50 rounded-xl font-bold" value={row.room} onChange={e => { let nr=[...timetableForm.rows]; nr[idx].room=e.target.value; setTimetableForm({...timetableForm, rows:nr})}} />
                  </div>
                ))}
                <button onClick={() => setTimetableForm({...timetableForm, rows: [...timetableForm.rows, {period: 1}]})} className="w-full p-4 border-2 border-dashed rounded-xl font-bold text-slate-400 mb-4">+ Додај још један час</button>
                <button onClick={saveTimetable} className="w-full bg-slate-900 text-white p-4 rounded-xl font-black uppercase shadow-lg">Сачувај у распоред</button>
              </div>
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border">
                <table className="w-full text-left">
                  <thead className="bg-slate-50"><tr><th className="p-4 font-black">ЧАС</th><th className="p-4 font-black">ОДЕЉЕЊЕ</th><th className="p-4 font-black">КАБИНЕТ</th><th className="p-4"></th></tr></thead>
                  <tbody>
                    {data.tt.filter(t => t.day === timetableForm.day && t.shift === timetableForm.shift && t.time_of_day === timetableForm.time_of_day).map(t => (
                      <tr key={t.id} className="border-t hover:bg-slate-50"><td className="p-4 font-black text-blue-600">{t.period}.</td><td className="p-4 font-bold">{t.class_name}</td><td className="p-4">{t.room}</td><td className="p-4 text-right"><button onClick={() => deleteItem('timetable', t.id)} className="text-red-400 p-2"><Trash2 size={18}/></button></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'duty' && (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6">
              <div>
                <label className="text-xs font-black uppercase text-slate-400 ml-2 mb-2 block">Наставник на дужности</label>
                <input className="w-full p-5 bg-slate-50 rounded-2xl font-black text-2xl" value={duty.teacher_name} onChange={e => setDuty({...duty, teacher_name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-slate-400 ml-2 mb-2 block">Дежурни ученици</label>
                <textarea className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-xl" rows={3} value={duty.student_names} onChange={e => setDuty({...duty, student_names: e.target.value})} />
              </div>
              <button onClick={async () => { await supabase.from('duty_staff').upsert(duty); alert("Сачувано!"); }} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg">Ажурирај дежурство</button>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
               <div className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl">
                  <span className="font-black uppercase">Смена која је пре подne:</span>
                  <div className="flex gap-2">
                    <button onClick={() => updateSetting('current_morning_shift', 'Parna')} className={`px-6 py-3 rounded-xl font-black ${morningShift === 'Parna' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border'}`}>ПАРНА</button>
                    <button onClick={() => updateSetting('current_morning_shift', 'Neparna')} className={`px-6 py-3 rounded-xl font-black ${morningShift === 'Neparna' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border'}`}>НЕПАРНА</button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}