'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Lock, Save, Trash2, Plus, UserCheck, 
  Calendar, Bell, Cake, Quote, LogOut, 
  AlertTriangle, Settings, Image as ImageIcon,
  Volume2, Radio, Megaphone
} from 'lucide-react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('announcements');
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], sys: [], quotes: [] });
  
  // Forme za unos
  const [itemForm, setItemForm] = useState({});
  const [duty, setDuty] = useState({ teacher_name: '', student_names: '' });
  const [timetableForm, setTimetableForm] = useState({
    day: 'Понедељак', shift: 'Parna', time_of_day: 'Pre podne', 
    rows: [{ class_name: '', room: '', period: 1 }]
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
    
    setData({ 
      ann: ann.data || [], 
      bdays: bdays.data || [], 
      tt: tt.data || [], 
      sys: sys.data || [], 
      quotes: qt.data || [] 
    });
    if (dt.data) setDuty(dt.data);
  };

  useEffect(() => { if (isAuthenticated) fetchData(); }, [activeTab, isAuthenticated]);

  // POMOĆNE FUNKCIJE
  const updateSetting = async (key, value) => {
    await supabase.from('system_settings').upsert({ key, value: value.toString() });
    fetchData();
  };

  const handleSimpleSave = async (e) => {
    e.preventDefault();
    await supabase.from(activeTab).insert([itemForm]);
    setItemForm({}); e.target.reset(); fetchData();
  };

  const deleteItem = async (table, id) => {
    if(confirm("Да ли сте сигурни да желите да обришете ову ставку?")) {
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
    
    if (toInsert.length === 0) return alert("Попуните податке за бар један час!");
    await supabase.from('timetable').insert(toInsert);
    alert("Успешно додато у распоред!");
    setTimetableForm({ ...timetableForm, rows: [{ class_name: '', room: '', period: 1 }] });
    fetchData();
  };

  const getSysVal = (key) => data.sys?.find(s => s.key === key)?.value || '';

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center font-sans p-6">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-md border border-white/20">
          <Lock className="mx-auto text-blue-600 mb-6" size={60} />
          <h1 className="text-3xl font-black text-center mb-8 italic uppercase tracking-tighter">TV КОНТРОЛА</h1>
          <input type="password" placeholder="Унесите шифру" className="w-full p-5 bg-slate-100 rounded-2xl mb-4 font-bold text-center border-2 border-transparent focus:border-blue-500 outline-none text-slate-900 text-xl" 
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkPassword()} />
          <button onClick={checkPassword} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">Приступи панелу</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      
      {/* SIDEBAR */}
      <div className="w-80 bg-slate-900 text-white p-8 flex flex-col gap-2 shrink-0 shadow-2xl">
        <div className="mb-10 px-2">
          <h2 className="text-2xl font-black text-blue-400 italic uppercase leading-none">Админ</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Систем за дигитални приказ</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          {[
            { id: 'announcements', icon: <Bell size={20}/>, label: 'Обавештења' },
            { id: 'timetable', icon: <Calendar size={20}/>, label: 'Распоред часова' },
            { id: 'duty', icon: <UserCheck size={20}/>, label: 'Дежурство' },
            { id: 'birthdays', icon: <Cake size={20}/>, label: 'Рођендани' },
            { id: 'quotes', icon: <Quote size={20}/>, label: 'Цидати' },
            { id: 'settings', icon: <Settings size={20}/>, label: 'Систем & Музика' }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} 
              className={`w-full p-4 rounded-2xl font-black flex items-center gap-4 transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl translate-x-2' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-slate-800 space-y-4">
          <button onClick={() => updateSetting('emergency', getSysVal('emergency') === 'УЗБУНА' ? 'НОРМАЛНО' : 'УЗБУНА')} 
            className={`w-full p-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all ${getSysVal('emergency') === 'УЗБУНА' ? 'bg-white text-red-600 animate-pulse' : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/20'}`}>
            <AlertTriangle size={24}/> {getSysVal('emergency') === 'УЗБУНА' ? 'СТОП УЗБУНА' : 'АКТИВИРАЈ УЗБУНУ'}
          </button>
          <button onClick={() => setIsAuthenticated(false)} className="w-full text-slate-500 font-bold hover:text-white flex items-center justify-center gap-2 text-xs uppercase transition-colors">
            <LogOut size={16}/> Одјави се
          </button>
        </div>
      </div>

      {/* GLAVNI SADRŽAJ */}
      <div className="flex-1 p-16 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex justify-between items-end mb-12 border-b-4 border-slate-100 pb-8">
             <h2 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900">{activeTab}</h2>
             <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Управљање садржајем</div>
          </div>

          {/* RASPORED - SPECIJALNI TAB */}
          {activeTab === 'timetable' && (
            <div className="space-y-10">
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                <h3 className="text-xl font-black mb-8 uppercase italic flex items-center gap-3 text-blue-600"><Plus/> Додај нове часове</h3>
                <div className="grid grid-cols-3 gap-6 mb-10">
                  <select className="w-full p-5 bg-slate-50 rounded-2xl font-black border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" value={timetableForm.day} onChange={e => setTimetableForm({...timetableForm, day: e.target.value})}>
                    {["Понедељак", "Уторак", "Среда", "Четвртак", "Петак"].map(d => <option key={d}>{d}</option>)}
                  </select>
                  <select className="w-full p-5 bg-slate-50 rounded-2xl font-black border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" value={timetableForm.shift} onChange={e => setTimetableForm({...timetableForm, shift: e.target.value})}>
                    <option value="Parna">Парна Смена</option><option value="Neparna">Непарна Смена</option>
                  </select>
                  <select className="w-full p-5 bg-slate-50 rounded-2xl font-black border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" value={timetableForm.time_of_day} onChange={e => setTimetableForm({...timetableForm, time_of_day: e.target.value})}>
                    <option value="Pre podne">Пре подне</option><option value="Posle podne">После подне</option>
                  </select>
                </div>

                <div className="space-y-3 mb-8">
                  {timetableForm.rows.map((row, idx) => (
                    <div key={idx} className="flex gap-4 items-center bg-slate-50 p-4 rounded-[2rem] border border-slate-100">
                      <input type="number" placeholder="Ч" className="w-20 p-4 rounded-xl font-black text-center border-2 border-white focus:border-blue-400 outline-none" value={row.period} onChange={e => {
                        let nr = [...timetableForm.rows]; nr[idx].period = e.target.value; setTimetableForm({...timetableForm, rows: nr});
                      }} />
                      <input placeholder="Одељење (нпр. 7-3)" className="flex-1 p-4 rounded-xl font-black border-2 border-white focus:border-blue-400 outline-none uppercase" value={row.class_name} onChange={e => {
                        let nr = [...timetableForm.rows]; nr[idx].class_name = e.target.value; setTimetableForm({...timetableForm, rows: nr});
                      }} />
                      <input placeholder="Кабинет" className="flex-1 p-4 rounded-xl font-black border-2 border-white focus:border-blue-400 outline-none uppercase" value={row.room} onChange={e => {
                        let nr = [...timetableForm.rows]; nr[idx].room = e.target.value; setTimetableForm({...timetableForm, rows: nr});
                      }} />
                      <button onClick={() => setTimetableForm({...timetableForm, rows: timetableForm.rows.filter((_, i) => i !== idx)})} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20}/></button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-4">
                  <button onClick={() => setTimetableForm({...timetableForm, rows: [...timetableForm.rows, {class_name: '', room: '', period: timetableForm.rows.length + 1}]})} className="flex-1 p-5 border-2 border-dashed border-slate-300 rounded-[2rem] font-black text-slate-400 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-500 transition-all">+ Додај још један ред</button>
                  <button onClick={saveTimetable} className="flex-1 bg-slate-900 text-white p-5 rounded-[2rem] font-black uppercase shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3"><Save/> Сачувај све</button>
                </div>
              </div>

              {/* LISTA ČASOVA SA BRISANJEM */}
              <div className="bg-white rounded-[3.5rem] shadow-xl overflow-hidden border border-slate-100">
                <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                  <h3 className="font-black uppercase italic tracking-widest">Тренутна база података</h3>
                  <div className="flex gap-2">
                    <span className="bg-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase">{timetableForm.day}</span>
                    <span className="bg-slate-700 px-4 py-1 rounded-full text-[10px] font-black uppercase">{timetableForm.time_of_day}</span>
                  </div>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 shadow-sm">
                      <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <th className="p-6">Час</th><th className="p-6">Одељење</th><th className="p-6">Кабинет</th><th className="p-6">Смена</th><th className="p-6 text-right">Акција</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.tt.filter(t => t.day === timetableForm.day && t.time_of_day === timetableForm.time_of_day).map(t => (
                        <tr key={t.id} className="hover:bg-blue-50/30 transition-colors font-bold group">
                          <td className="p-6 text-blue-600 font-black text-2xl">{t.period}.</td>
                          <td className="p-6 uppercase text-slate-900">{t.class_name}</td>
                          <td className="p-6 uppercase text-slate-500">{t.room}</td>
                          <td className="p-6 text-[10px] text-slate-300 font-black uppercase">{t.shift}</td>
                          <td className="p-6 text-right">
                            <button onClick={() => deleteItem('timetable', t.id)} className="text-red-200 group-hover:text-red-500 p-3 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={20}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* OBAVEŠTENJA / ROĐENDANI / CITATI */}
          {(activeTab === 'announcements' || activeTab === 'birthdays' || activeTab === 'quotes') && (
            <div className="space-y-10">
              <form onSubmit={handleSimpleSave} className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 grid gap-6">
                <h3 className="text-xl font-black uppercase italic text-blue-600 flex items-center gap-3"><Plus/> Додај ново</h3>
                {activeTab === 'announcements' && (
                  <>
                    <textarea placeholder="Унесите текст обавештења..." className="w-full p-6 bg-slate-50 rounded-[2rem] font-bold text-xl border-2 border-transparent focus:border-blue-500 outline-none" rows={3} onChange={e => setItemForm({...itemForm, text: e.target.value})} required />
                    <div className="flex gap-4 items-center bg-blue-50 p-4 rounded-2xl border border-blue-100">
                      <ImageIcon className="text-blue-500" />
                      <input placeholder="URL слике (нпр. са Google-а)" className="flex-1 bg-transparent font-bold outline-none" onChange={e => setItemForm({...itemForm, image_url: e.target.value})} />
                    </div>
                  </>
                )}
                {activeTab === 'birthdays' && (
                  <div className="grid grid-cols-2 gap-6">
                    <input placeholder="Име и презиме" className="p-6 bg-slate-50 rounded-2xl font-black border-2 border-transparent focus:border-blue-500 outline-none text-xl" onChange={e => setItemForm({...itemForm, name: e.target.value})} required />
                    <input placeholder="Одељење (нпр. 5-2)" className="p-6 bg-slate-50 rounded-2xl font-black border-2 border-transparent focus:border-blue-500 outline-none text-xl uppercase" onChange={e => setItemForm({...itemForm, class_name: e.target.value})} required />
                  </div>
                )}
                {activeTab === 'quotes' && (
                  <div className="space-y-4">
                    <textarea placeholder="Мисао дана..." className="w-full p-6 bg-slate-50 rounded-[2rem] font-bold italic text-2xl border-2 border-transparent focus:border-blue-500 outline-none text-center" onChange={e => setItemForm({...itemForm, text: e.target.value})} required />
                    <input placeholder="Аутор" className="w-full p-5 bg-slate-50 rounded-2xl font-black text-center border-2 border-transparent focus:border-blue-500 outline-none" onChange={e => setItemForm({...itemForm, author: e.target.value})} required />
                  </div>
                )}
                <button type="submit" className="bg-blue-600 text-white p-6 rounded-[2rem] font-black uppercase shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 text-lg"><Save/> Објави на екран</button>
              </form>
              
              <div className="bg-white rounded-[3.5rem] shadow-xl overflow-hidden border border-slate-100 divide-y divide-slate-50">
                {(activeTab === 'announcements' ? data.ann : activeTab === 'birthdays' ? data.bdays : data.quotes).map(item => (
                  <div key={item.id} className="p-8 flex justify-between items-center hover:bg-slate-50 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black">{item.class_name || <Plus size={16}/>}</div>
                      <span className="font-black text-slate-800 text-xl tracking-tighter">{item.text || item.name}</span>
                    </div>
                    <button onClick={() => deleteItem(activeTab, item.id)} className="text-red-200 group-hover:text-red-500 p-4 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={26}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DEŽURSTVO */}
          {activeTab === 'duty' && (
            <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-100 space-y-10">
              <h3 className="text-2xl font-black uppercase italic border-b pb-6 flex items-center gap-4 text-blue-600"><UserCheck size={32}/> Дневно дежурство</h3>
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-6 mb-2 block tracking-widest">Наставник на дужности</label>
                  <input className="w-full p-8 bg-slate-50 rounded-[2.5rem] font-black text-4xl border-2 border-transparent focus:border-blue-500 outline-none uppercase shadow-inner" value={duty.teacher_name} onChange={e => setDuty({...duty, teacher_name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-6 mb-2 block tracking-widest">Дежурни ученици</label>
                  <textarea className="w-full p-8 bg-slate-50 rounded-[2.5rem] font-bold text-2xl border-2 border-transparent focus:border-blue-500 outline-none uppercase shadow-inner" rows={3} value={duty.student_names} onChange={e => setDuty({...duty, student_names: e.target.value})} />
                </div>
                <button onClick={async () => { await supabase.from('duty_staff').upsert(duty); alert("Дежурство ажурирано!"); }} className="w-full bg-blue-600 text-white p-8 rounded-[3rem] font-black uppercase text-2xl shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-6"><Save size={32}/> Сачувај промене</button>
              </div>
            </div>
          )}

          {/* SISTEMSKA PODEŠAVANJA, MUZIKA I BREAKING NEWS */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              {/* SMENA */}
              <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-xl uppercase italic tracking-tighter">Контрола смена</h3>
                  <p className="text-slate-400 font-bold text-sm">Која смена је данас ПРЕ ПОДНЕ?</p>
                </div>
                <div className="flex bg-slate-100 p-2 rounded-[2rem] gap-2">
                  <button onClick={() => updateSetting('current_morning_shift', 'Parna')} className={`px-10 py-5 rounded-[1.5rem] font-black transition-all ${getSysVal('current_morning_shift') === 'Parna' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>ПАРНА</button>
                  <button onClick={() => updateSetting('current_morning_shift', 'Neparna')} className={`px-10 py-5 rounded-[1.5rem] font-black transition-all ${getSysVal('current_morning_shift') === 'Neparna' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>НЕПАРНА</button>
                </div>
              </div>

              {/* MUZIKA */}
              <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100">
                <h3 className="text-2xl font-black mb-8 uppercase italic flex items-center gap-4 text-blue-600"><Radio size={28}/> Школски радио / Музика</h3>
                <div className="grid gap-6">
                  <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                    <label className="text-[10px] font-black text-blue-400 uppercase mb-2 block">Директан линк до MP3 фајла</label>
                    <input placeholder="https://primer.com/muzika.mp3" className="w-full bg-transparent font-bold text-blue-800 outline-none text-lg" 
                      value={getSysVal('bg_music_url')} 
                      onChange={e => updateSetting('bg_music_url', e.target.value)} />
                  </div>
                  <button onClick={() => updateSetting('music_active', getSysVal('music_active') === 'true' ? 'false' : 'true')} 
                    className={`w-full p-8 rounded-[2rem] font-black uppercase text-xl shadow-lg transition-all flex items-center justify-center gap-4 ${getSysVal('music_active') === 'true' ? 'bg-red-500 text-white shadow-red-200' : 'bg-emerald-500 text-white shadow-emerald-200'}`}>
                    {getSysVal('music_active') === 'true' ? <><Volume2/> ИСКЉУЧИ МУЗИКУ</> : <><Music/> ПУСТИ МУЗИКУ НА ТВ</>}
                  </button>
                </div>
              </div>

              {/* BREAKING NEWS */}
              <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100">
                <h3 className="text-2xl font-black mb-8 uppercase italic flex items-center gap-4 text-orange-500"><Megaphone size={28}/> Breaking News (Трака на дну)</h3>
                <div className="relative">
                  <input placeholder="Унесите хитну информацију која ће се вртети на дну екрана..." className="w-full p-8 bg-slate-50 rounded-[2rem] border-2 border-transparent focus:border-orange-400 outline-none font-black text-xl shadow-inner" 
                    value={getSysVal('breaking_news')} 
                    onChange={e => updateSetting('breaking_news', e.target.value)} />
                  {getSysVal('breaking_news') && (
                    <button onClick={() => updateSetting('breaking_news', '')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2/>
                    </button>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-4 ml-6 font-bold uppercase italic">* Оставите празно ако не желите траку на екрану.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}