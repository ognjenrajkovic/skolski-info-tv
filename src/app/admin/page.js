'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Lock, Save, Trash2, Plus, RefreshCw, UserCheck, 
  Calendar, Bell, Cake, Quote, LogOut, AlertTriangle, Settings, Image as ImageIcon
} from 'lucide-react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('announcements');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], sys: [], quotes: [] });
  const [morningShift, setMorningShift] = useState('Parna');
  const [emergency, setEmergency] = useState('НОРМАЛНО');
  
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
    // Ne brišemo sve, samo dodajemo ili menjamo. 
    // Ako želiš "čist" unos za taj termin, možeš ostaviti delete pre inserta.
    await supabase.from('timetable').insert(toInsert);
    alert("Успешно додато у распоред!");
    fetchData();
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-6 text-slate-900">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md text-center">
          <Lock size={50} className="mx-auto text-blue-600 mb-6" />
          <h1 className="text-2xl font-black uppercase mb-6 tracking-tighter">Школски TV Админ</h1>
          <input type="password" placeholder="Шифра" className="w-full p-5 bg-slate-100 rounded-2xl mb-4 text-center font-bold text-xl outline-none ring-blue-500 focus:ring-2" 
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkPassword()}/>
          <button onClick={checkPassword} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase hover:bg-blue-700 transition-all">Уђи у систем</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* SIDEBAR */}
      <div className="w-72 bg-slate-900 text-white p-6 flex flex-col gap-2 shrink-0">
        <div className="mb-8 px-2">
            <h2 className="text-xl font-black text-blue-400 italic uppercase">Админ Панел</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Контролна Табла</p>
        </div>
        
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
              className={`w-full p-4 rounded-xl font-bold flex items-center gap-4 transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <button onClick={toggleEmergency} 
          className={`w-full p-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all ${emergency === 'УЗБУНА' ? 'bg-white text-red-600 animate-bounce' : 'bg-red-600 text-white hover:bg-red-700'}`}>
          <AlertTriangle size={24}/> {emergency === 'УЗБУНА' ? 'ПРЕКИНИ УЗБУНУ' : 'АКТИВИРАЈ УЗБУНУ'}
        </button>

        <button onClick={() => setIsAuthenticated(false)} className="mt-4 flex items-center justify-center gap-2 p-4 text-slate-500 font-bold hover:text-white transition-all uppercase text-[10px] tracking-widest">
          <LogOut size={14}/> Одјави се
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-[1000] text-slate-900 uppercase italic tracking-tighter">{activeTab}</h2>
              <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                <button onClick={() => updateSetting('current_morning_shift', 'Parna')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${morningShift === 'Parna' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>ПАРНА ПРЕ ПОДНЕ</button>
                <button onClick={() => updateSetting('current_morning_shift', 'Neparna')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${morningShift === 'Neparna' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>НЕПАРНА ПРЕ ПОДНЕ</button>
              </div>
          </div>

          {/* OBAVEŠTENJA / RODJENDANI / CITATI */}
          {(activeTab === 'announcements' || activeTab === 'birthdays' || activeTab === 'quotes') && (
            <div className="space-y-6">
              <form onSubmit={handleSimpleSave} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 grid grid-cols-2 gap-4">
                {activeTab === 'announcements' && (
                  <>
                    <textarea placeholder="Текст обавештења..." className="col-span-2 p-4 rounded-xl bg-slate-50 border-0 ring-1 ring-slate-200 font-bold" onChange={e => setItemForm({...itemForm, text: e.target.value})} required />
                    <input placeholder="Link slike (URL) - Opciono za veći prikaz" className="col-span-2 p-4 rounded-xl bg-slate-50 border-0 ring-1 ring-slate-200 font-bold" onChange={e => setItemForm({...itemForm, image_url: e.target.value})} />
                  </>
                )}
                {activeTab === 'birthdays' && (
                  <>
                    <input placeholder="Име и презиме" className="p-4 rounded-xl bg-slate-50 border-0 ring-1 ring-slate-200 font-bold" onChange={e => setItemForm({...itemForm, name: e.target.value})} required />
                    <input placeholder="Одељење" className="p-4 rounded-xl bg-slate-50 border-0 ring-1 ring-slate-200 font-bold" onChange={e => setItemForm({...itemForm, class_name: e.target.value})} required />
                  </>
                )}
                {activeTab === 'quotes' && (
                  <>
                    <textarea placeholder="Текст цитата..." className="col-span-2 p-4 rounded-xl bg-slate-50 border-0 ring-1 ring-slate-200 font-bold italic" onChange={e => setItemForm({...itemForm, text: e.target.value})} required />
                    <input placeholder="Аутор" className="col-span-2 p-4 rounded-xl bg-slate-50 border-0 ring-1 ring-slate-200 font-bold" onChange={e => setItemForm({...itemForm, author: e.target.value})} required />
                  </>
                )}
                <button type="submit" className="col-span-2 bg-blue-600 text-white p-4 rounded-xl font-black uppercase hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                  <Plus size={20}/> Додај у систем
                </button>
              </form>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                   <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 text-center">Листа постојећих ставки</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {(activeTab === 'announcements' ? data.ann : activeTab === 'birthdays' ? data.bdays : data.quotes).map(item => (
                    <div key={item.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-all">
                      <div className="flex items-center gap-4 truncate">
                        {item.image_url && <ImageIcon size={20} className="text-blue-500 shrink-0" />}
                        <span className="font-bold text-slate-700 truncate">{item.text || item.name}</span>
                      </div>
                      <button onClick={() => deleteItem(activeTab, item.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RASPORED (TIMETABLE) */}
          {activeTab === 'timetable' && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <select className="p-4 bg-slate-50 rounded-xl font-black text-sm" value={timetableForm.day} onChange={e => setTimetableForm({...timetableForm, day: e.target.value})}>
                    {["Понедељак", "Уторак", "Среда", "Четвртак", "Петак"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select className="p-4 bg-slate-50 rounded-xl font-black text-sm" value={timetableForm.shift} onChange={e => setTimetableForm({...timetableForm, shift: e.target.value})}>
                    <option value="Parna">Парна Смена</option><option value="Neparna">Непарна Смена</option>
                  </select>
                  <select className="p-4 bg-slate-50 rounded-xl font-black text-sm" value={timetableForm.time_of_day} onChange={e => setTimetableForm({...timetableForm, time_of_day: e.target.value})}>
                    <option value="Pre podne">Пре подне</option><option value="Posle podne">После подне</option>
                  </select>
                </div>

                <div className="space-y-3">
                  {timetableForm.rows.map((row, idx) => (
                    <div key={idx} className="flex gap-3 animate-in fade-in">
                      <input type="number" placeholder="Час" className="w-20 p-4 bg-slate-50 rounded-xl font-black text-center" value={row.period} onChange={e => {
                        const nr = [...timetableForm.rows]; nr[idx].period = parseInt(e.target.value); setTimetableForm({...timetableForm, rows: nr});
                      }} />
                      <input placeholder="Одељење (нпр. VII-2)" className="flex-1 p-4 bg-slate-50 rounded-xl font-bold" value={row.class_name} onChange={e => {
                        const nr = [...timetableForm.rows]; nr[idx].class_name = e.target.value; setTimetableForm({...timetableForm, rows: nr});
                      }} />
                      <input placeholder="Кабинет" className="flex-1 p-4 bg-slate-50 rounded-xl font-bold" value={row.room} onChange={e => {
                        const nr = [...timetableForm.rows]; nr[idx].room = e.target.value; setTimetableForm({...timetableForm, rows: nr});
                      }} />
                      <button onClick={() => setTimetableForm({...timetableForm, rows: timetableForm.rows.filter((_, i) => i !== idx)})} className="p-4 text-red-300 hover:text-red-500"><Trash2/></button>
                    </div>
                  ))}
                  <button onClick={() => setTimetableForm({...timetableForm, rows: [...timetableForm.rows, { class_name: '', room: '', period: 1 }]})} className="w-full p-4 border-2 border-dashed border-slate-200 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-all">+ Додај још један час</button>
                  <button onClick={saveTimetable} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-[1000] uppercase tracking-widest mt-4 hover:bg-black transition-all">Сачувај у распоред</button>
                </div>
              </div>

              {/* PREGLED POSTOJEĆEG RASPOREDA */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                   <h3 className="font-black uppercase italic tracking-tighter text-xl">Тренутни распоред у бази</h3>
                   <span className="text-[10px] font-bold bg-blue-600 px-3 py-1 rounded-full">{timetableForm.day} / {timetableForm.time_of_day}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-4 font-black text-[10px] uppercase text-slate-400">Час</th>
                        <th className="p-4 font-black text-[10px] uppercase text-slate-400">Одељење</th>
                        <th className="p-4 font-black text-[10px] uppercase text-slate-400">Кабинет</th>
                        <th className="p-4 font-black text-[10px] uppercase text-slate-400 text-right">Акција</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.tt.filter(t => t.day === timetableForm.day && t.shift === timetableForm.shift && t.time_of_day === timetableForm.time_of_day).map(t => (
                        <tr key={t.id} className="hover:bg-blue-50/30 transition-all group">
                          <td className="p-4 font-black text-blue-600 italic text-lg">{t.period}.</td>
                          <td className="p-4 font-black text-slate-800 uppercase">{t.class_name}</td>
                          <td className="p-4 font-bold text-slate-500">{t.room}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => deleteItem('timetable', t.id)} className="text-red-300 hover:text-red-600 p-2"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* DEŽURSTVO */}
          {activeTab === 'duty' && (
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Наставник на дужности</label>
                  <input className="w-full p-6 bg-slate-50 rounded-[2rem] border-0 ring-1 ring-slate-200 font-black text-2xl" value={duty.teacher_name} onChange={e => setDuty({...duty, teacher_name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Дежурни ученици</label>
                  <textarea className="w-full p-6 bg-slate-50 rounded-[2rem] border-0 ring-1 ring-slate-200 font-bold text-xl" rows={3} value={duty.student_names} onChange={e => setDuty({...duty, student_names: e.target.value})} />
                </div>
                <button onClick={saveDuty} className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                  <Save/> Сачувај промене
                </button>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 space-y-8">
               <div className="p-8 bg-slate-50 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-center md:text-left">
                    <p className="font-[1000] text-2xl uppercase italic tracking-tighter">Брзина ротације</p>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Тренутно: {data.sys?.find(s => s.key === 'rotation_speed')?.value / 1000} секунди</p>
                  </div>
                  <input type="range" min="5000" max="40000" step="1000" value={data.sys?.find(s => s.key === 'rotation_speed')?.value || 15000} 
                    onChange={(e) => updateSetting('rotation_speed', e.target.value)} className="w-full md:w-1/2 h-4 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['show_birthdays', 'show_announcements', 'show_quotes', 'show_weather'].map(key => {
                    const val = data.sys?.find(s => s.key === key)?.value === 'true';
                    return (
                      <button key={key} onClick={() => updateSetting(key, (!val).toString())} className={`flex justify-between items-center p-8 rounded-[2rem] border-2 transition-all ${val ? 'border-blue-600 bg-blue-50' : 'border-slate-100 opacity-60'}`}>
                        <span className="font-black uppercase tracking-widest text-slate-700">{key.replace('show_', 'ПРИКАЖИ ').replace('weather', 'ВРЕМЕ')}</span>
                        <div className={`w-14 h-7 rounded-full flex items-center p-1 transition-all ${val ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'}`}>
                          <div className="w-5 h-5 bg-white rounded-full shadow-lg" />
                        </div>
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