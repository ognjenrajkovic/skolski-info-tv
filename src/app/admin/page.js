'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Lock, Save, Trash2, Plus, UserCheck, 
  Calendar, Bell, Cake, Quote, LogOut, 
  AlertTriangle, Settings, Image as ImageIcon,
  Volume2, Music, Megaphone
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
        supabase.from('birthdays').select('*'),
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
    try {
      const { error } = await supabase.from('system_settings').upsert({ key, value: value.toString() }, { onConflict: 'key' });
      if (error) throw error;
      fetchData();
    } catch (e) { alert("Greška pri čuvanju podešavanja."); }
  };

  const getSysVal = (key) => data.sys?.find(s => s.key === key)?.value || '';

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2rem] shadow-2xl w-full max-w-md">
          <Lock className="mx-auto text-blue-600 mb-6" size={50} />
          <input type="password" placeholder="Шифра" className="w-full p-4 bg-slate-100 rounded-xl mb-4 text-center text-xl font-bold" 
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkPassword()} />
          <button onClick={checkPassword} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase">Уђи</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      <div className="w-72 bg-slate-900 text-white p-6 flex flex-col gap-2 shrink-0">
        <h2 className="text-xl font-black text-blue-400 mb-8 uppercase italic">TV Admin</h2>
        <nav className="flex-1 space-y-1">
          {['announcements', 'timetable', 'duty', 'birthdays', 'quotes', 'settings'].map(id => (
            <button key={id} onClick={() => setActiveTab(id)} 
              className={`w-full p-3 rounded-xl font-bold text-left capitalize transition-all ${activeTab === id ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
              {id === 'settings' ? 'Систем & Музика' : id}
            </button>
          ))}
        </nav>
        <button onClick={() => updateSetting('emergency', getSysVal('emergency') === 'УЗБУНА' ? 'НОРМАЛНО' : 'УЗБУНА')} 
          className={`p-4 rounded-xl font-black ${getSysVal('emergency') === 'УЗБУНА' ? 'bg-white text-red-600 animate-pulse' : 'bg-red-600 text-white'}`}>
          {getSysVal('emergency') === 'УЗБУНА' ? 'СТОП УЗБУНА' : 'УЗБУНА'}
        </button>
      </div>

      <div className="flex-1 p-10 overflow-y-auto">
        {activeTab === 'settings' ? (
          <div className="max-w-3xl space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border">
              <h3 className="text-lg font-black mb-4 flex items-center gap-2"><Music/> МУЗИКА (MP3 Link)</h3>
              <input className="w-full p-4 bg-slate-50 rounded-xl border mb-4" value={getSysVal('bg_music_url')} onChange={e => updateSetting('bg_music_url', e.target.value)} placeholder="https://..." />
              <button onClick={() => updateSetting('music_active', getSysVal('music_active') === 'true' ? 'false' : 'true')} 
                className={`w-full p-4 rounded-xl font-black ${getSysVal('music_active') === 'true' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                {getSysVal('music_active') === 'true' ? 'ИСКЉУЧИ МУЗИКУ' : 'ПУСТИ МУЗИКУ'}
              </button>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border">
              <h3 className="text-lg font-black mb-4 flex items-center gap-2"><Megaphone/> BREAKING NEWS</h3>
              <input className="w-full p-4 bg-slate-50 rounded-xl border" value={getSysVal('breaking_news')} onChange={e => updateSetting('breaking_news', e.target.value)} placeholder="Текст na dnu..." />
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border">
              <h3 className="text-lg font-black mb-4">ТРЕНУТНА СМЕНА</h3>
              <div className="flex gap-2">
                <button onClick={() => updateSetting('current_morning_shift', 'Parna')} className={`flex-1 p-4 rounded-xl font-bold ${getSysVal('current_morning_shift') === 'Parna' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>ПАРНА</button>
                <button onClick={() => updateSetting('current_morning_shift', 'Neparna')} className={`flex-1 p-4 rounded-xl font-bold ${getSysVal('current_morning_shift') === 'Neparna' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>НЕПАРНА</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl border">Ovaj tab radi, unesi podatke... (Vrati se na prethodni kod za forme ako ti trebaju)</div>
        )}
      </div>
    </div>
  );
}