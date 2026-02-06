'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Save, Trash2, Plus, RefreshCw, UserCheck, Calendar, Bell, Cake, Quote, LogOut } from 'lucide-react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('announcements');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [morningShift, setMorningShift] = useState('Parna');
  
  // Obične forme
  const [itemForm, setItemForm] = useState({});
  
  // Dežurstvo
  const [duty, setDuty] = useState({ teacher_name: '', student_names: '', floor: 'Приземље' });

  // Raspored (Bulk)
  const [timetableForm, setTimetableForm] = useState({
    day: 'Понедељак',
    shift: 'Parna',
    time_of_day: 'Pre podne',
    rows: [{ class_name: '', room: '' }]
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
    if (activeTab === 'duty') {
      const { data: res } = await supabase.from('duty_staff').select('*').single();
      if (res) setDuty(res);
    } else {
      const { data: res } = await supabase.from(activeTab).select('*');
      setData(res || []);
    }
    const { data: sh } = await supabase.from('system_settings').select('*').eq('key', 'current_morning_shift').single();
    if (sh) setMorningShift(sh.value);
    setLoading(false);
  };

  useEffect(() => { if (isAuthenticated) fetchData(); }, [activeTab, isAuthenticated]);

  const updateMorningShift = async (val) => {
    setMorningShift(val);
    await supabase.from('system_settings').upsert({ key: 'current_morning_shift', value: val });
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

  const deleteItem = async (id) => {
    if(confirm("Да ли сте сигурни?")) {
      await supabase.from(activeTab).delete().eq('id', id);
      fetchData();
    }
  };

  const saveTimetable = async () => {
    const toInsert = timetableForm.rows
      .filter(r => r.class_name && r.room)
      .map(r => ({
        day: timetableForm.day,
        shift: timetableForm.shift,
        time_of_day: timetableForm.time_of_day,
        class_name: r.class_name,
        room: r.room
      }));

    if (toInsert.length === 0) return;

    await supabase.from('timetable').delete()
      .eq('day', timetableForm.day)
      .eq('shift', timetableForm.shift)
      .eq('time_of_day', timetableForm.time_of_day);

    await supabase.from('timetable').insert(toInsert);
    alert("Распоред сачуван!");
    fetchData();
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-[#0F172A] flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-600">
            <Lock size={40} />
          </div>
          <h1 className="text-3xl font-black uppercase mb-2 tracking-tighter text-slate-900">Приступ Панелу</h1>
          <p className="text-slate-400 font-bold mb-8 uppercase text-xs tracking-[0.2em]">Унесите администраторску лозинку</p>
          <input type="password" placeholder="••••••••" className="w-full p-5 bg-slate-100 rounded-[2rem] mb-4 text-center font-black text-2xl focus:ring-4 ring-blue-100 outline-none transition-all" 
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkPassword()}/>
          <button onClick={checkPassword} className="w-full bg-blue-600 text-white p-5 rounded-[2rem] font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">Пријави се</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* SIDEBAR */}
      <div className="w-80 bg-slate-900 text-white p-8 flex flex-col gap-3">
        <div className="mb-10 px-4">
            <h2 className="text-2xl font-black text-blue-400 italic uppercase tracking-tighter">TV ПАНЕЛ</h2>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.3em] uppercase">Администрација</p>
        </div>
        
        <nav className="space-y-1 flex-1">
            <button onClick={() => setActiveTab('announcements')} className={`w-full p-4 rounded-2xl font-bold flex items-center gap-4 transition-all ${activeTab === 'announcements' ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                <Bell size={20}/> Обавештења
            </button>
            <button onClick={() => setActiveTab('timetable')} className={`w-full p-4 rounded-2xl font-bold flex items-center gap-4 transition-all ${activeTab === 'timetable' ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                <Calendar size={20}/> Распоред
            </button>
            <button onClick={() => setActiveTab('duty')} className={`w-full p-4 rounded-2xl font-bold flex items-center gap-4 transition-all ${activeTab === 'duty' ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                <UserCheck size={20}/> Дежурство
            </button>
            <button onClick={() => setActiveTab('birthdays')} className={`w-full p-4 rounded-2xl font-bold flex items-center gap-4 transition-all ${activeTab === 'birthdays' ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                <Cake size={20}/> Рођендани
            </button>
            <button onClick={() => setActiveTab('quotes')} className={`w-full p-4 rounded-2xl font-bold flex items-center gap-4 transition-all ${activeTab === 'quotes' ? 'bg-blue-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                <Quote size={20}/> Цитати
            </button>
        </nav>
        
        <button onClick={() => setIsAuthenticated(false)} className="mt-auto flex items-center justify-center gap-2 p-4 text-slate-500 font-bold hover:text-white transition-all uppercase text-xs tracking-widest">
            <LogOut size={16}/> Одјави се
        </button>
      </div>

      <div className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          {/* HEADER AKCIJE */}
          <div className="flex justify-between items-center mb-10">
              <div>
                  <h2 className="text-4xl font-[1000] text-slate-900 uppercase italic tracking-tighter">Управљање: {activeTab}</h2>
                  <p className="text-slate-400 font-bold mt-1 uppercase text-xs tracking-widest">Школски инфо систем v2.0</p>
              </div>
              
              {/* SMENA TOGGLE */}
              <div className="bg-white p-2 rounded-[2rem] shadow-sm flex gap-2 border border-slate-200">
                  <button onClick={() => updateMorningShift('Parna')} className={`px-6 py-2 rounded-[1.5rem] font-black text-xs transition-all ${morningShift === 'Parna' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>ПАРНА ПРЕ ПОДНЕ</button>
                  <button onClick={() => updateMorningShift('Neparna')} className={`px-6 py-2 rounded-[1.5rem] font-black text-xs transition-all ${morningShift === 'Neparna' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>НЕПАРНА ПРЕ ПОДНЕ</button>
              </div>
          </div>

          {/* SADRŽAJ TABOVA */}
          <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-200">
            
            {/* OBAVEŠTENJA / ROĐENDANI / CITATI */}
            {(activeTab === 'announcements' || activeTab === 'birthdays' || activeTab === 'quotes') && (
              <div className="space-y-10">
                <form onSubmit={handleSimpleSave} className="grid grid-cols-2 gap-4 bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  {activeTab === 'announcements' && <textarea placeholder="Текст обавештења..." className="col-span-2 p-5 rounded-2xl border-0 ring-1 ring-slate-200 font-bold" onChange={e => setItemForm({text: e.target.value})} required />}
                  {activeTab === 'birthdays' && (
                    <>
                      <input placeholder="Име и презиме" className="p-5 rounded-2xl border-0 ring-1 ring-slate-200 font-bold" onChange={e => setItemForm({...itemForm, name: e.target.value})} required />
                      <input placeholder="Одељење" className="p-5 rounded-2xl border-0 ring-1 ring-slate-200 font-bold" onChange={e => setItemForm({...itemForm, class_name: e.target.value})} required />
                    </>
                  )}
                  {activeTab === 'quotes' && (
                    <>
                      <textarea placeholder="Цитат..." className="col-span-2 p-5 rounded-2xl border-0 ring-1 ring-slate-200 font-bold italic" onChange={e => setItemForm({...itemForm, text: e.target.value})} required />
                      <input placeholder="Аутор" className="col-span-2 p-5 rounded-2xl border-0 ring-1 ring-slate-200 font-bold" onChange={e => setItemForm({...itemForm, author: e.target.value})} required />
                    </>
                  )}
                  <button type="submit" className="col-span-2 bg-blue-600 text-white p-5 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"><Plus/> Додај ставку</button>
                </form>

                <div className="space-y-3">
                  {data.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-6 bg-white border border-slate-100 rounded-[2rem] hover:shadow-md transition-all group">
                      <span className="font-bold text-slate-700">{item.text || item.name} {item.author && <span className="text-blue-400">— {item.author}</span>}</span>
                      <button onClick={() => deleteItem(item.id)} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DEŽURSTVO */}
            {activeTab === 'duty' && (
              <div className="max-w-2xl mx-auto space-y-8 py-10">
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 mb-2 block">Дежурни Наставник</label>
                        <input className="w-full p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 font-black text-xl" value={duty.teacher_name} onChange={e => setDuty({...duty, teacher_name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 mb-2 block">Дежурни Ученици</label>
                        <textarea className="w-full p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 font-bold text-lg" value={duty.student_names} onChange={e => setDuty({...duty, student_names: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 mb-2 block">Сектор / Локација</label>
                        <select className="w-full p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 font-black text-lg" value={duty.floor} onChange={e => setDuty({...duty, floor: e.target.value})}>
                            <option value="Приземље">Приземље</option>
                            <option value="Спрат I">Спрат I</option>
                            <option value="Спрат II">Спрат II</option>
                            <option value="Сала">Фискултурна Сала</option>
                        </select>
                    </div>
                    <button onClick={saveDuty} className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 flex items-center justify-center gap-3 transition-all active:scale-95"><Save/> Сачувај Дежурство</button>
                </div>
              </div>
            )}

            {/* RASPORED (BULK) */}
            {activeTab === 'timetable' && (
              <div className="space-y-8">
                <div className="grid grid-cols-3 gap-4 bg-slate-900 p-6 rounded-[2.5rem]">
                   <select className="p-4 bg-slate-800 text-white rounded-xl font-bold border-0 ring-1 ring-slate-700 outline-none" value={timetableForm.day} onChange={e => setTimetableForm({...timetableForm, day: e.target.value})}>
                     {["Понедељак", "Уторак", "Среда", "Четвртак", "Петак"].map(d => <option key={d} value={d}>{d}</option>)}
                   </select>
                   <select className="p-4 bg-slate-800 text-white rounded-xl font-bold border-0 ring-1 ring-slate-700 outline-none" value={timetableForm.shift} onChange={e => setTimetableForm({...timetableForm, shift: e.target.value})}>
                     <option value="Parna">Парна Смена</option>
                     <option value="Neparna">Непарна Смена</option>
                   </select>
                   <select className="p-4 bg-slate-800 text-white rounded-xl font-bold border-0 ring-1 ring-slate-700 outline-none" value={timetableForm.time_of_day} onChange={e => setTimetableForm({...timetableForm, time_of_day: e.target.value})}>
                     <option value="Pre podne">Пре Подне</option>
                     <option value="Posle podne">После Подне</option>
                   </select>
                </div>

                <div className="space-y-3">
                    <div className="flex gap-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className="flex-1">Одељење</span>
                        <span className="flex-1">Кабинет</span>
                        <span className="w-12"></span>
                    </div>
                    {timetableForm.rows.map((row, index) => (
                        <div key={index} className="flex gap-4 animate-in fade-in duration-300">
                            <input className="flex-1 p-5 bg-slate-50 rounded-[1.5rem] border-2 border-slate-100 font-black text-lg focus:border-blue-500 outline-none transition-all" placeholder="нпр. VIII-1" value={row.class_name} onChange={e => {
                                const newRows = [...timetableForm.rows];
                                newRows[index].class_name = e.target.value;
                                setTimetableForm({...timetableForm, rows: newRows});
                            }} />
                            <input className="flex-1 p-5 bg-slate-50 rounded-[1.5rem] border-2 border-slate-100 font-black text-lg focus:border-blue-500 outline-none transition-all" placeholder="нпр. Физика" value={row.room} onChange={e => {
                                const newRows = [...timetableForm.rows];
                                newRows[index].room = e.target.value;
                                setTimetableForm({...timetableForm, rows: newRows});
                            }} />
                            <button onClick={() => setTimetableForm({...timetableForm, rows: timetableForm.rows.filter((_, i) => i !== index)})} className="w-14 h-14 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={24}/></button>
                        </div>
                    ))}
                    <button onClick={() => setTimetableForm({...timetableForm, rows: [...timetableForm.rows, { class_name: '', room: '' }]})} className="w-full p-5 border-2 border-dashed border-slate-200 rounded-[1.5rem] font-black text-slate-400 hover:bg-slate-50 flex items-center justify-center gap-2 tracking-widest uppercase text-xs transition-all"><Plus size={18}/> Додај одељење у овај термин</button>
                </div>

                <button onClick={saveTimetable} className="w-full bg-slate-900 text-white p-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-black shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"><Save/> Сачувај цео распоред за изабрани термин</button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}