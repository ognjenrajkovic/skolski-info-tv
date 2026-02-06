'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Lock, Save, Trash2, Plus, RefreshCw, UserCheck, 
  Calendar, Bell, Cake, Quote, LogOut, AlertTriangle, Settings 
} from 'lucide-react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('announcements');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], sys: [], quotes: [] });
  const [morningShift, setMorningShift] = useState('Parna');
  const [emergency, setEmergency] = useState('НОРМАЛНО');
  
  // Forme
  const [itemForm, setItemForm] = useState({});
  const [duty, setDuty] = useState({ teacher_name: '', student_names: '', floor: 'Приземље' });
  const [timetableForm, setTimetableForm] = useState({
    day: 'Понедељак', shift: 'Parna', time_of_day: 'Pre podne', rows: [{ class_name: '', room: '', period: 1 }]
  });

  const checkPassword = async () => {
    const { data: res } = await supabase.from('system_settings').select('value').eq('key', 'admin_password').single();
    if (res && password === res.value) {
      setIsAuthenticated(true);
    } else {
      alert("Погрешна шифра!");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const [ann, bdays, tt, dt, sys, qt] = await Promise.all([
      supabase.from('announcements').select('*'),
      supabase.from('birthdays').select('*'),
      supabase.from('timetable').select('*'),
      supabase.from('duty_staff').select('*').single(),
      supabase.from('system_settings').select('*'),
      supabase.from('quotes').select('*')
    ]);
    
    setData({ ann: ann.data, bdays: bdays.data, tt: tt.data, sys: sys.data, quotes: qt.data });
    if (dt.data) setDuty(dt.data);
    
    const sh = sys.data?.find(s => s.key === 'current_morning_shift');
    const em = sys.data?.find(s => s.key === 'emergency');
    if (sh) setMorningShift(sh.value);
    if (em) setEmergency(em.value);
    setLoading(false);
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

  const saveDuty = async () => {
    await supabase.from('duty_staff').upsert({ id: duty.id, ...duty });
    alert("Дежурство ажурирано!");
  };

  const handleSimpleSave = async (e) => {
    e.preventDefault();
    await supabase.from(activeTab).insert([itemForm]);
    setItemForm({});
    e.target.reset();
    fetchData();
  };

  const deleteItem = async (table, id) => {
    if(confirm("Обрисати ставку?")) {
      await supabase.from(table).delete().eq('id', id);
      fetchData();
    }
  };

  const saveTimetable = async () => {
    const toInsert = timetableForm.rows.filter(r => r.class_name && r.room).map(r => ({
      ...r, day: timetableForm.day, shift: timetableForm.shift, time_of_day: timetableForm.time_of_day
    }));
    await supabase.from('timetable').delete()
      .eq('day', timetableForm.day).eq('shift', timetableForm.shift).eq('time_of_day', timetableForm.time_of_day);
    await supabase.from('timetable').insert(toInsert);
    alert("Распоред сачуван!");
    fetchData();
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md text-center">
          <Lock size={50} className="mx-auto text-blue-600 mb-6" />
          <h1 className="text-2xl font-black uppercase mb-6 tracking-tighter">Админ Панел</h1>
          <input type="password" placeholder="Унесите шифру" className="w-full p-5 bg-slate-100 rounded-2xl mb-4 text-center font-bold text-xl" 
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkPassword()}/>
          <button onClick={checkPassword} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase hover:bg-blue-700 transition-all">Приступи</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* SIDEBAR */}
      <div className="w-72 bg-slate-900 text-white p-8 flex flex-col gap-2">
        <h2 className="text-xl font-black text-blue-400 mb-8 italic uppercase tracking-tighter">TV КОНТРОЛА</h2>
        
        <nav className="space-y-1 flex-1">
          {[
            { id: 'announcements', icon: <Bell size={18}/>, label: 'Обавештења' },
            { id: 'timetable', icon: <Calendar size={18}/>, label: 'Распоред' },
            { id: 'duty', icon: <UserCheck size={18}/>, label: 'Дежурство' },
            { id: 'birthdays', icon: <Cake size={18}/>, label: 'Рођендани' },
            { id: 'quotes', icon: <Quote size={18}/>, label: 'Цитати' },
            { id: 'settings', icon: <Settings size={18}/>, label: 'Подешавања' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} 
              className={`w-full p-4 rounded-xl font-bold flex items-center gap-4 transition-all ${activeTab === item.id ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        {/* EMERGENCY BUTTON IN SIDEBAR */}
        <button onClick={toggleEmergency} 
          className={`w-full p-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all animate-pulse ${emergency === 'УЗБУНА' ? 'bg-white text-red-600' : 'bg-red-600 text-white hover:bg-red-700'}`}>
          <AlertTriangle size={24}/> {emergency === 'УЗБУНА' ? 'ПРЕКИНИ' : 'УЗБУНА'}
        </button>

        <button onClick={() => setIsAuthenticated(false)} className="mt-4 flex items-center justify-center gap-2 p-4 text-slate-500 font-bold hover:text-white transition-all uppercase text-[10px] tracking-widest">
          <LogOut size={14}/> Одјави се
        </button>
      </div>

      <div className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-slate-900 uppercase italic">Управљање: {activeTab}</h2>
              <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                <button onClick={() => updateSetting('current_morning_shift', 'Parna')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${morningShift === 'Parna' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>ПАРНА ПРЕ ПОДНЕ</button>
                <button onClick={() => updateSetting('current_morning_shift', 'Neparna')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${morningShift === 'Neparna' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>НЕПАРНА ПРЕ ПОДНЕ</button>
              </div>
          </div>

          {/* TAB: OBAVESTENJA, RODJENDANI, CITATI */}
          {(activeTab === 'announcements' || activeTab === 'birthdays' || activeTab === 'quotes') && (
            <div className="space-y-8 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200">
              <form onSubmit={handleSimpleSave} className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border-2 border-dashed">
                {activeTab === 'announcements' && <textarea placeholder="Текст..." className="col-span-2 p-4 rounded-xl border-0 ring-1 ring-slate-200 font-bold" onChange={e => setItemForm({text: e.target.value})} required />}
                {activeTab === 'birthdays' && <>
                    <input placeholder="Име" className="p-4 rounded-xl border-0 ring-1 ring-slate-200 font-bold" onChange={e => setItemForm({...itemForm, name: e.target.value})} required />
                    <input placeholder="Одељење" className="p-4 rounded-xl border-0 ring-1 ring-slate-200 font-bold" onChange={e => setItemForm({...itemForm, class_name: e.target.value})} required />
                </>}
                {activeTab === 'quotes' && <>
                    <textarea placeholder="Цитат" className="col-span-2 p-4 rounded-xl border-0 ring-1 ring-slate-200 font-bold italic" onChange={e => setItemForm({...itemForm, text: e.target.value})} required />
                    <input placeholder="Аутор" className="col-span-2 p-4 rounded-xl border-0 ring-1 ring-slate-200 font-bold" onChange={e => setItemForm({...itemForm, author: e.target.value})} required />
                </>}
                <button type="submit" className="col-span-2 bg-blue-600 text-white p-4 rounded-xl font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"><Plus/> Додај</button>
              </form>
              <div className="space-y-2">
                {(activeTab === 'announcements' ? data.ann : activeTab === 'birthdays' ? data.bdays : data.quotes)?.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl group shadow-sm">
                    <span className="font-bold text-slate-700 truncate mr-4">{item.text || item.name}</span>
                    <button onClick={() => deleteItem(activeTab, item.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: TIMETABLE BULK */}
          {activeTab === 'timetable' && (
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 space-y-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <select className="p-4 bg-slate-50 rounded-xl font-bold" value={timetableForm.day} onChange={e => setTimetableForm({...timetableForm, day: e.target.value})}>
                  {["Понедељак", "Уторак", "Среда", "Четвртак", "Петак"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="p-4 bg-slate-50 rounded-xl font-bold" value={timetableForm.shift} onChange={e => setTimetableForm({...timetableForm, shift: e.target.value})}>
                  <option value="Parna">Парна Смена</option><option value="Neparna">Непарна Смена</option>
                </select>
                <select className="p-4 bg-slate-50 rounded-xl font-bold" value={timetableForm.time_of_day} onChange={e => setTimetableForm({...timetableForm, time_of_day: e.target.value})}>
                  <option value="Pre podne">Пре подне</option><option value="Posle podne">После подне</option>
                </select>
              </div>
              {timetableForm.rows.map((row, idx) => (
                <div key={idx} className="flex gap-3">
                  <input placeholder="Час (1-7)" type="number" className="w-24 p-4 bg-slate-50 rounded-xl font-bold" value={row.period} onChange={e => {
                    const nr = [...timetableForm.rows]; nr[idx].period = parseInt(e.target.value); setTimetableForm({...timetableForm, rows: nr});
                  }} />
                  <input placeholder="Одељење" className="flex-1 p-4 bg-slate-50 rounded-xl font-bold" value={row.class_name} onChange={e => {
                    const nr = [...timetableForm.rows]; nr[idx].class_name = e.target.value; setTimetableForm({...timetableForm, rows: nr});
                  }} />
                  <input placeholder="Кабинет" className="flex-1 p-4 bg-slate-50 rounded-xl font-bold" value={row.room} onChange={e => {
                    const nr = [...timetableForm.rows]; nr[idx].room = e.target.value; setTimetableForm({...timetableForm, rows: nr});
                  }} />
                  <button onClick={() => setTimetableForm({...timetableForm, rows: timetableForm.rows.filter((_, i) => i !== idx)})} className="text-red-300 p-2"><Trash2/></button>
                </div>
              ))}
              <button onClick={() => setTimetableForm({...timetableForm, rows: [...timetableForm.rows, { class_name: '', room: '', period: 1 }]})} className="w-full p-4 border-2 border-dashed rounded-xl font-bold text-slate-400">+ Додај ред</button>
              <button onClick={saveTimetable} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black"><Save className="inline mr-2"/> Сачувај цео распоред за овај термин</button>
            </div>
          )}

          {/* TAB: DEZURSTVO */}
          {activeTab === 'duty' && (
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 space-y-6">
              <input placeholder="Дежурни наставник" className="w-full p-5 bg-slate-50 rounded-2xl font-black text-xl" value={duty.teacher_name} onChange={e => setDuty({...duty, teacher_name: e.target.value})} />
              <textarea placeholder="Дежурни ученици" className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-lg" value={duty.student_names} onChange={e => setDuty({...duty, student_names: e.target.value})} />
              <button onClick={saveDuty} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100"><Save className="inline mr-2"/> Сачувај</button>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 space-y-10">
              <div className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl">
                <div><p className="font-black text-xl tracking-tighter uppercase">Брзина ротације</p><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Секунди по слајду</p></div>
                <input type="range" min="5000" max="30000" step="1000" value={data.sys?.find(s => s.key === 'rotation_speed')?.value || 15000} 
                  onChange={(e) => updateSetting('rotation_speed', e.target.value)} className="w-1/2 cursor-pointer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {['show_birthdays', 'show_announcements', 'show_quotes', 'show_weather'].map(key => {
                   const val = data.sys?.find(s => s.key === key)?.value === 'true';
                   return (
                    <button key={key} onClick={() => updateSetting(key, (!val).toString())} className={`flex justify-between items-center p-6 rounded-3xl border-2 transition-all ${val ? 'border-blue-100 bg-blue-50/30' : 'border-slate-100 opacity-50'}`}>
                      <span className="font-black text-xs uppercase tracking-widest text-slate-600">{key.split('_').join(' ')}</span>
                      <div className={`w-12 h-6 rounded-full flex items-center p-1 transition-all ${val ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'}`}><div className="w-4 h-4 bg-white rounded-full shadow-sm" /></div>
                    </button>
                   );
                 })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}