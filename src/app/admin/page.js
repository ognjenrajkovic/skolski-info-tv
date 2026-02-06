'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Lock, Save, Trash2, Plus, UserCheck, Calendar, Bell, Cake, 
  Quote, LogOut, AlertTriangle, Settings, Video, Image as ImageIcon,
  Volume2, Megaphone, Radio, Layout
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
    alert("Сачувано!");
  };

  const deleteItem = async (table, id) => {
    if(confirm("Обрисати ставку?")) {
      await supabase.from(table).delete().eq('id', id);
      fetchData();
    }
  };

  const getSysVal = (key) => data.sys?.find(s => s.key === key)?.value || '';

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md text-center">
          <Lock className="mx-auto text-blue-600 mb-6" size={60} />
          <h1 className="text-3xl font-black mb-8 uppercase italic">АДМИН ПАНЕЛ</h1>
          <input type="password" placeholder="Шифра" className="w-full p-5 bg-slate-100 rounded-2xl mb-4 font-bold text-center text-xl" 
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkPassword()} />
          <button onClick={checkPassword} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase">УЂИ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-900">
      <div className="w-80 bg-slate-950 text-white p-8 flex flex-col gap-2 shrink-0 border-r border-white/10">
        <h2 className="text-2xl font-black text-blue-500 mb-8 uppercase italic tracking-tighter">TV КОНТРОЛА</h2>
        <nav className="flex-1 space-y-1">
          {[
            { id: 'announcements', label: 'Обавештења', icon: <Bell size={20}/> },
            { id: 'timetable', label: 'Распоред часова', icon: <Calendar size={20}/> },
            { id: 'duty', label: 'Дежурство', icon: <UserCheck size={20}/> },
            { id: 'birthdays', label: 'Рођендани', icon: <Cake size={20}/> },
            { id: 'quotes', label: 'Цитати', icon: <Quote size={20}/> },
            { id: 'settings', label: 'Подешавања & Видео', icon: <Settings size={20}/> }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} 
              className={`w-full p-4 rounded-xl font-bold flex items-center gap-3 transition-all ${activeTab === item.id ? 'bg-blue-600 shadow-lg translate-x-2' : 'text-slate-400 hover:bg-white/5'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        
        <button onClick={() => updateSetting('emergency', getSysVal('emergency') === 'true' ? 'false' : 'true')} 
          className={`p-6 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl transition-all ${getSysVal('emergency') === 'true' ? 'bg-white text-red-600 animate-pulse' : 'bg-red-600 hover:bg-red-700'}`}>
          <AlertTriangle/> {getSysVal('emergency') === 'true' ? 'СТОП УЗБУНА' : 'АКТИВИРАЈ УЗБУНУ'}
        </button>
      </div>

      <div className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <header className="mb-12 border-b-4 border-slate-200 pb-8 flex justify-between items-end">
            <h2 className="text-6xl font-black uppercase italic tracking-tighter">{activeTab}</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest">ОШ „Карађорђе”</p>
          </header>

          {activeTab === 'announcements' && (
            <div className="space-y-8">
              <form onSubmit={handleSimpleSave} className="bg-white p-10 rounded-[3rem] shadow-xl border grid gap-6">
                <textarea placeholder="Унесите текст обавештења..." className="w-full p-6 bg-slate-50 rounded-2xl font-bold text-xl border-2 focus:border-blue-500 outline-none transition-all" rows={4} onChange={e => setItemForm({...itemForm, text: e.target.value})} required />
                <input placeholder="Линк до слике (опционо)" className="w-full p-5 bg-slate-50 rounded-2xl border-2" onChange={e => setItemForm({...itemForm, image_url: e.target.value})} />
                <button type="submit" className="bg-blue-600 text-white p-6 rounded-2xl font-black uppercase text-xl shadow-xl hover:bg-blue-700">ОБЈАВИ НА ЕКРАН</button>
              </form>
              <div className="grid grid-cols-1 gap-4">
                {data.ann.map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-2xl shadow flex justify-between items-center border-l-8 border-blue-500">
                    <p className="font-bold text-lg">{item.text}</p>
                    <button onClick={() => deleteItem('announcements', item.id)} className="text-red-500 p-3 hover:bg-red-50 rounded-xl"><Trash2/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-blue-600"><Video/> ВИДЕО ПОЗАДИНА</h3>
                <input className="w-full p-4 bg-slate-50 rounded-xl border mb-4 font-bold" value={getSysVal('bg_video_url')} onChange={e => updateSetting('bg_video_url', e.target.value)} placeholder="YouTube / Direct MP4 link..." />
                <div className="flex gap-2">
                  <button onClick={() => updateSetting('video_mode', 'fullscreen')} className={`flex-1 p-4 rounded-xl font-bold ${getSysVal('video_mode') === 'fullscreen' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>Цео екран</button>
                  <button onClick={() => updateSetting('video_mode', 'overlay')} className={`flex-1 p-4 rounded-xl font-bold ${getSysVal('video_mode') === 'overlay' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>Само позадина</button>
                  <button onClick={() => updateSetting('video_active', getSysVal('video_active') === 'true' ? 'false' : 'true')} className={`flex-1 p-4 rounded-xl font-bold ${getSysVal('video_active') === 'true' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {getSysVal('video_active') === 'true' ? 'Угаси' : 'Упали'}
                  </button>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] shadow-xl border">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-emerald-600"><Volume2/> ШКОЛСКИ РАДИО</h3>
                <input className="w-full p-4 bg-slate-50 rounded-xl border mb-4 font-bold" value={getSysVal('bg_music_url')} onChange={e => updateSetting('bg_music_url', e.target.value)} placeholder="MP3 Линк..." />
                <button onClick={() => updateSetting('music_active', getSysVal('music_active') === 'true' ? 'false' : 'true')} className={`w-full p-4 rounded-xl font-black ${getSysVal('music_active') === 'true' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}>
                  {getSysVal('music_active') === 'true' ? 'УГАСИ МУЗИКУ' : 'ПУСТИ МУЗИКУ'}
                </button>
              </div>

              <div className="bg-white p-10 rounded-[3rem] shadow-xl border col-span-full">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-orange-500"><Megaphone/> BREAKING NEWS (ХИТНА ТРАКА)</h3>
                <input className="w-full p-6 bg-slate-50 rounded-2xl border-4 border-orange-100 font-black text-2xl uppercase shadow-inner" value={getSysVal('breaking_news')} onChange={e => updateSetting('breaking_news', e.target.value)} placeholder="Унесите текст вести..." />
              </div>
            </div>
          )}
          
          {/* Dodaj ostale module (Rođendani, Citati) po istom principu forme... */}
        </div>
      </div>
    </div>
  );
}