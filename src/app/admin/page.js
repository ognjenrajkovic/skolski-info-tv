'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Lock, Save, Trash2, Plus, UserCheck, Calendar, Bell, Cake, 
  Quote, AlertTriangle, Settings, Video, Volume2, Megaphone, List
} from 'lucide-react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('announcements');
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], sys: [], quotes: [] });
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
    try {
      const [ann, bdays, tt, dt, sys, qt] = await Promise.all([
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('birthdays').select('*').order('name', { ascending: true }),
        supabase.from('timetable').select('*').order('period', { ascending: true }),
        supabase.from('duty_staff').select('*').single(),
        supabase.from('system_settings').select('*'),
        supabase.from('quotes').select('*')
      ]);
      setData({ 
        ann: ann.data || [], bdays: bdays.data || [], 
        tt: tt.data || [], sys: sys.data || [], 
        quotes: qt.data || [] 
      });
      if (dt.data) setDuty(dt.data);
    } catch (e) { console.error("Greška pri preuzimanju:", e); }
  };

  useEffect(() => { if (isAuthenticated) fetchData(); }, [activeTab, isAuthenticated]);

  const updateSetting = async (key, value) => {
    await supabase.from('system_settings').upsert({ key, value: value.toString() }, { onConflict: 'key' });
    fetchData();
  };

  const handleSimpleSave = async (e, table) => {
    e.preventDefault();
    await supabase.from(table).insert([itemForm]);
    setItemForm({}); e.target.reset(); fetchData();
    alert("Успешно додато!");
  };

  const deleteItem = async (table, id) => {
    if(confirm("Да ли сте сигурни?")) {
      await supabase.from(table).delete().eq('id', id);
      fetchData();
    }
  };

  const getSysVal = (key) => data.sys?.find(s => s.key === key)?.value || '';

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center font-sans">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md text-center">
          <Lock className="mx-auto text-blue-600 mb-6" size={60} />
          <h1 className="text-3xl font-black mb-8 italic">АДМИН ПРИЈАВА</h1>
          <input type="password" placeholder="Унесите шифру" className="w-full p-5 bg-slate-100 rounded-2xl mb-4 font-bold text-center text-xl" 
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkPassword()} />
          <button onClick={checkPassword} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase">УЂИ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* SIDEBAR - OVDE SU SVE KARTICE */}
      <div className="w-80 bg-slate-900 text-white p-8 flex flex-col gap-2 shrink-0 border-r border-white/10">
        <h2 className="text-2xl font-black text-blue-400 mb-10 uppercase italic tracking-tighter text-center">TV СИСТЕМ</h2>
        <nav className="flex-1 space-y-2">
          {[
            { id: 'announcements', label: 'Обавештења', icon: <Bell size={18}/> },
            { id: 'timetable', label: 'Распоред часова', icon: <Calendar size={18}/> },
            { id: 'duty', label: 'Дежурство', icon: <UserCheck size={18}/> },
            { id: 'birthdays', label: 'Рођендани', icon: <Cake size={18}/> },
            { id: 'quotes', label: 'Цитати', icon: <Quote size={18}/> },
            { id: 'settings', label: 'Подешавања & Видео', icon: <Settings size={18}/> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
              className={`w-full p-4 rounded-xl font-bold flex items-center gap-4 transition-all ${activeTab === tab.id ? 'bg-blue-600 shadow-lg translate-x-2' : 'text-slate-400 hover:bg-white/5'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
        <button onClick={() => updateSetting('emergency', getSysVal('emergency') === 'true' ? 'false' : 'true')} 
          className={`p-6 rounded-2xl font-black flex items-center justify-center gap-3 transition-all ${getSysVal('emergency') === 'true' ? 'bg-white text-red-600 animate-pulse' : 'bg-red-600 text-white shadow-xl hover:bg-red-700'}`}>
          <AlertTriangle/> {getSysVal('emergency') === 'true' ? 'УГАСИ УЗБУНУ' : 'АКТИВИРАЈ УЗБУНУ'}
        </button>
      </div>

      <div className="flex-1 p-16 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-black uppercase italic mb-12 border-b-4 border-slate-200 pb-6">{activeTab === 'announcements' ? 'Обавештења' : activeTab === 'timetable' ? 'Распоред' : activeTab === 'duty' ? 'Дежурство' : activeTab === 'birthdays' ? 'Рођендани' : activeTab === 'quotes' ? 'Цитати' : 'Подешавања'}</h2>

          {activeTab === 'announcements' && (
            <div className="space-y-8">
              <form onSubmit={(e) => handleSimpleSave(e, 'announcements')} className="bg-white p-8 rounded-[2.5rem] shadow-lg border grid gap-6">
                <textarea placeholder="Текст обавештења..." className="p-5 bg-slate-50 rounded-2xl border font-bold text-lg" rows={4} onChange={e => setItemForm({...itemForm, text: e.target.value})} required />
                <input placeholder="URL слике (опционо)" className="p-4 bg-slate-50 rounded-xl border" onChange={e => setItemForm({...itemForm, image_url: e.target.value})} />
                <button type="submit" className="bg-blue-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg">ДОДАЈ ОБАВЕШТЕЊЕ</button>
              </form>
              <div className="grid gap-4">
                {data.ann.map(a => (
                  <div key={a.id} className="bg-white p-6 rounded-2xl shadow flex justify-between items-center border-l-8 border-blue-500">
                    <span className="font-bold">{a.text}</span>
                    <button onClick={() => deleteItem('announcements', a.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'birthdays' && (
            <div className="space-y-8">
              <form onSubmit={(e) => handleSimpleSave(e, 'birthdays')} className="bg-white p-8 rounded-[2.5rem] shadow-lg border grid grid-cols-2 gap-6">
                <input placeholder="Име и презиме" className="p-4 bg-slate-50 rounded-xl border font-bold" onChange={e => setItemForm({...itemForm, name: e.target.value})} required />
                <input placeholder="Одељење (нпр. 5-3)" className="p-4 bg-slate-50 rounded-xl border font-bold uppercase" onChange={e => setItemForm({...itemForm, class_name: e.target.value})} required />
                <button type="submit" className="col-span-2 bg-pink-500 text-white p-5 rounded-2xl font-black uppercase shadow-lg">ДОДАЈ СЛАВЉЕНИКА</button>
              </form>
              <div className="grid grid-cols-2 gap-4">
                {data.bdays.map(b => (
                  <div key={b.id} className="bg-white p-6 rounded-2xl shadow flex justify-between items-center border-l-8 border-pink-500">
                    <span className="font-bold uppercase">{b.name} ({b.class_name})</span>
                    <button onClick={() => deleteItem('birthdays', b.id)} className="text-red-500"><Trash2/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="space-y-8">
              <form onSubmit={(e) => handleSimpleSave(e, 'quotes')} className="bg-white p-8 rounded-[2.5rem] shadow-lg border grid gap-6">
                <textarea placeholder="Цитат..." className="p-5 bg-slate-50 rounded-2xl border font-bold italic text-lg" onChange={e => setItemForm({...itemForm, text: e.target.value})} required />
                <input placeholder="Аутор" className="p-4 bg-slate-50 rounded-xl border font-bold" onChange={e => setItemForm({...itemForm, author: e.target.value})} required />
                <button type="submit" className="bg-slate-900 text-white p-5 rounded-2xl font-black uppercase">ДОДАЈ ЦИТАТ</button>
              </form>
              <div className="grid gap-4">
                {data.quotes.map(q => (
                  <div key={q.id} className="bg-white p-6 rounded-2xl shadow flex justify-between items-center border-l-8 border-slate-900">
                    <span className="italic">"{q.text}" - <b>{q.author}</b></span>
                    <button onClick={() => deleteItem('quotes', q.id)} className="text-red-500"><Trash2/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'duty' && (
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border space-y-8">
              <div>
                <label className="block text-slate-400 font-black uppercase text-sm mb-3 tracking-widest">Дежурни наставник</label>
                <input className="w-full p-8 bg-slate-50 rounded-[2rem] font-black text-4xl border-4 border-slate-100 uppercase focus:border-blue-500 outline-none transition-all" value={duty.teacher_name} onChange={e => setDuty({...duty, teacher_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-slate-400 font-black uppercase text-sm mb-3 tracking-widest">Дежурни ученици</label>
                <textarea className="w-full p-6 bg-slate-50 rounded-[2rem] font-bold text-2xl border-4 border-slate-100 uppercase" rows={3} value={duty.student_names} onChange={e => setDuty({...duty, student_names: e.target.value})} />
              </div>
              <button onClick={async () => { await supabase.from('duty_staff').upsert(duty); alert("Ажурирано!"); }} className="w-full bg-blue-600 text-white p-8 rounded-[2.5rem] font-black text-2xl uppercase shadow-xl hover:scale-[1.02] transition-all">САЧУВАЈ ДЕЖУРСТВО</button>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid gap-10">
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border">
                <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-blue-600"><Video/> ВИДЕО ПОЗАДИНА / ФУЛ СКРИН</h3>
                <input className="w-full p-5 bg-slate-50 rounded-2xl border mb-6 font-bold" value={getSysVal('bg_video_url')} onChange={e => updateSetting('bg_video_url', e.target.value)} placeholder="YouTube линк (нпр. https://www.youtube.com/watch?v=id)" />
                <div className="grid grid-cols-3 gap-4">
                  <button onClick={() => updateSetting('video_mode', 'fullscreen')} className={`p-5 rounded-2xl font-black uppercase transition-all ${getSysVal('video_mode') === 'fullscreen' ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400'}`}>Цео екран</button>
                  <button onClick={() => updateSetting('video_mode', 'overlay')} className={`p-5 rounded-2xl font-black uppercase transition-all ${getSysVal('video_mode') === 'overlay' ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400'}`}>Позадина</button>
                  <button onClick={() => updateSetting('video_active', getSysVal('video_active') === 'true' ? 'false' : 'true')} className={`p-5 rounded-2xl font-black uppercase transition-all ${getSysVal('video_active') === 'true' ? 'bg-red-500 text-white shadow-xl' : 'bg-emerald-500 text-white shadow-xl'}`}>
                    {getSysVal('video_active') === 'true' ? 'ИСКЉУЧИ' : 'УКЉУЧИ'}
                  </button>
                </div>
                <p className="mt-4 text-sm font-bold text-slate-400 italic text-center">* Напомена: Ако је "Цео екран" укључен, видео прекрива све док се не искључи овде.</p>
              </div>

              <div className="bg-white p-10 rounded-[3rem] shadow-xl border">
                <h3 className="text-2xl font-black mb-6 text-orange-600 flex items-center gap-4"><Megaphone/> ХИТНА ТРАКА (BREAKING NEWS)</h3>
                <input className="w-full p-6 bg-slate-50 rounded-2xl border-4 border-orange-100 font-black text-2xl uppercase italic" value={getSysVal('breaking_news')} onChange={e => updateSetting('breaking_news', e.target.value)} placeholder="Унесите текст који ће се вртети на дну..." />
              </div>

              <div className="bg-white p-10 rounded-[3rem] shadow-xl border">
                <h3 className="text-2xl font-black mb-6 text-emerald-600 flex items-center gap-4"><Volume2/> ШКОЛСКИ РАДИО</h3>
                <input className="w-full p-5 bg-slate-50 rounded-2xl border mb-4 font-bold" value={getSysVal('bg_music_url')} onChange={e => updateSetting('bg_music_url', e.target.value)} placeholder="Директан MP3 линк..." />
                <button onClick={() => updateSetting('music_active', getSysVal('music_active') === 'true' ? 'false' : 'true')} className={`w-full p-5 rounded-2xl font-black uppercase transition-all ${getSysVal('music_active') === 'true' ? 'bg-red-500 text-white shadow-xl' : 'bg-emerald-500 text-white shadow-xl'}`}>
                  {getSysVal('music_active') === 'true' ? 'УГАСИ МУЗИКУ' : 'ПУСТИ МУЗИКУ'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}