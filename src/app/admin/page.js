'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Save, Bell, Calendar, User, Cake, Quote, AlertTriangle, Megaphone } from 'lucide-react';

export default function AdminPanel() {
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState('');
  const [activeTab, setActiveTab] = useState('obavestenja');
  const [data, setData] = useState({ ann: [], bdays: [], tt: [], duty: {}, sys: [], quotes: [] });
  
  // Forme
  const [textForm, setTextForm] = useState({ text: '', title: '' });
  const [ttForm, setTtForm] = useState({ day: 'Понедељак', shift: 'Prepodesna', period: 1, class_name: '', room: '' });
  const [dutyTeacher, setDutyTeacher] = useState('');

  // 1. UČITAVANJE PODATAKA
  const loadData = async () => {
    const [ann, bdays, tt, dt, sys, qt] = await Promise.all([
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('birthdays').select('*').order('name'),
      supabase.from('timetable').select('*').order('period'),
      supabase.from('duty_staff').select('*').single(),
      supabase.from('system_settings').select('*'),
      supabase.from('quotes').select('*')
    ]);
    
    setData({
      ann: ann.data || [],
      bdays: bdays.data || [],
      tt: tt.data || [],
      duty: dt.data || {},
      sys: sys.data || [],
      quotes: qt.data || []
    });
    if (dt.data) setDutyTeacher(dt.data.teacher_name || '');
  };

  useEffect(() => { if (auth) loadData(); }, [auth]);

  // 2. LOGIKA ZA BRISANJE I ČUVANJE
  const handleDelete = async (table, id) => {
    if (confirm('Да ли желите да обришете?')) {
      await supabase.from(table).delete().eq('id', id);
      loadData();
    }
  };

  const handleSaveAnnouncement = async () => {
    await supabase.from('announcements').insert([{ text: textForm.text }]);
    setTextForm({ text: '' }); loadData(); alert('Успешно додато!');
  };

  const handleSaveBirthday = async () => {
    await supabase.from('birthdays').insert([{ name: textForm.text, class_name: textForm.title }]); // title koristim za odeljenje ovde
    setTextForm({ text: '', title: '' }); loadData(); alert('Успешно додато!');
  };

  const handleSaveQuote = async () => {
    await supabase.from('quotes').insert([{ text: textForm.text, author: textForm.title }]);
    setTextForm({ text: '', title: '' }); loadData(); alert('Успешно додато!');
  };

  const handleSaveTimetable = async () => {
    await supabase.from('timetable').insert([ttForm]);
    loadData(); alert('Час додат!');
  };

  const handleUpdateSystem = async (key, value) => {
    await supabase.from('system_settings').upsert({ key, value }, { onConflict: 'key' });
    loadData();
  };

  const handleLogin = () => {
    if (pass === 'admin123' || pass === 'skola') setAuth(true);
    else alert('Погрешна шифра');
  };

  // 3. LOGIN EKRAN
  if (!auth) return (
    <div className="h-screen flex items-center justify-center bg-slate-100 font-sans">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center w-96">
        <h2 className="text-2xl font-black mb-6 uppercase text-slate-800">Админ Пријава</h2>
        <input type="password" placeholder="Унесите шифру" className="w-full p-4 border-2 border-slate-200 rounded-xl mb-4 text-center text-lg outline-none focus:border-blue-500"
          value={pass} onChange={e => setPass(e.target.value)} />
        <button onClick={handleLogin} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase hover:bg-blue-700">Уђи</button>
      </div>
    </div>
  );

  // 4. ГЛАВНИ ADMIN INTERFEJS
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      
      {/* SIDEBAR */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-8 border-b border-slate-100">
           <h1 className="text-3xl font-black italic text-blue-600">ШКОЛА</h1>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Админ Панел</p>
        </div>
        <nav className="p-4 space-y-2">
           {[
             { id: 'obavestenja', label: 'Обавештења', icon: <Bell size={20}/> },
             { id: 'raspored', label: 'Распоред', icon: <Calendar size={20}/> },
             { id: 'dezurstvo', label: 'Дежурство', icon: <User size={20}/> },
             { id: 'rodjendani', label: 'Рођендани', icon: <Cake size={20}/> },
             { id: 'citati', label: 'Цитати', icon: <Quote size={20}/> },
             { id: 'podesavanja', label: 'Подешавања', icon: <Megaphone size={20}/> },
           ].map(item => (
             <button key={item.id} onClick={() => setActiveTab(item.id)}
               className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold transition-all ${activeTab === item.id ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
               {item.icon} {item.label}
             </button>
           ))}
        </nav>
        <div className="mt-auto p-4 border-t border-slate-100">
           <button onClick={() => handleUpdateSystem('emergency', data.sys.find(s=>s.key==='emergency')?.value === 'true' ? 'false' : 'true')} 
             className={`w-full p-4 rounded-xl font-black uppercase flex items-center justify-center gap-2 ${data.sys.find(s=>s.key==='emergency')?.value === 'true' ? 'bg-red-600 text-white animate-pulse' : 'bg-red-100 text-red-600'}`}>
             <AlertTriangle/> {data.sys.find(s=>s.key==='emergency')?.value === 'true' ? 'ИСКЉУЧИ УЗБУНУ' : 'УЗБУНА'}
           </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-12 overflow-y-auto">
        <h2 className="text-4xl font-black uppercase mb-10 border-b pb-4">{activeTab}</h2>

        {/* --- OBAVESTENJA --- */}
        {activeTab === 'obavestenja' && (
          <div className="max-w-3xl">
            <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8 flex gap-4">
              <textarea placeholder="Текст обавештења..." className="flex-1 p-4 border rounded-xl bg-slate-50 font-bold" value={textForm.text} onChange={e => setTextForm({...textForm, text: e.target.value})} />
              <button onClick={handleSaveAnnouncement} className="bg-blue-600 text-white px-8 rounded-xl font-bold uppercase">Додај</button>
            </div>
            <div className="space-y-3">
              {data.ann.map(a => (
                <div key={a.id} className="bg-white p-4 rounded-xl border flex justify-between items-center font-medium">
                  {a.text} <button onClick={() => handleDelete('announcements', a.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- RASPORED --- */}
        {activeTab === 'raspored' && (
          <div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8 grid grid-cols-6 gap-4 items-end">
              <div className="col-span-1">
                <label className="text-xs font-bold uppercase text-slate-400">Дан</label>
                <select className="w-full p-3 border rounded-lg font-bold" onChange={e => setTtForm({...ttForm, day: e.target.value})}>
                  {["Понедељак","Уторак","Среда","Четвртак","Петак"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-span-1">
                <label className="text-xs font-bold uppercase text-slate-400">Час (Број)</label>
                <input type="number" className="w-full p-3 border rounded-lg font-bold" value={ttForm.period} onChange={e => setTtForm({...ttForm, period: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold uppercase text-slate-400">Предмет / Одељење</label>
                <input className="w-full p-3 border rounded-lg font-bold" placeholder="нпр. 5-1 Математика" onChange={e => setTtForm({...ttForm, class_name: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="text-xs font-bold uppercase text-slate-400">Кабинет</label>
                <input className="w-full p-3 border rounded-lg font-bold" placeholder="Кабинет 3" onChange={e => setTtForm({...ttForm, room: e.target.value})} />
              </div>
              <button onClick={handleSaveTimetable} className="bg-blue-600 text-white p-3 rounded-lg font-bold uppercase col-span-1">Сачувај</button>
            </div>
            
            <div className="bg-white rounded-2xl border overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-slate-100 uppercase text-xs font-bold text-slate-500">
                   <tr><th className="p-4">Дан</th><th className="p-4">Час</th><th className="p-4">Одељење</th><th className="p-4">Кабинет</th><th className="p-4">Акција</th></tr>
                 </thead>
                 <tbody>
                   {data.tt.map(t => (
                     <tr key={t.id} className="border-t hover:bg-slate-50">
                       <td className="p-4 font-bold">{t.day}</td>
                       <td className="p-4 font-bold">{t.period}</td>
                       <td className="p-4 font-bold text-blue-600">{t.class_name}</td>
                       <td className="p-4 font-bold">{t.room}</td>
                       <td className="p-4"><button onClick={() => handleDelete('timetable', t.id)} className="text-red-500"><Trash2 size={18}/></button></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {/* --- DEZURSTVO --- */}
        {activeTab === 'dezurstvo' && (
          <div className="max-w-xl bg-white p-8 rounded-2xl border shadow-sm">
             <label className="block text-sm font-bold uppercase text-slate-400 mb-2">Дежурни наставник</label>
             <input className="w-full p-4 text-2xl font-black border-2 border-slate-200 rounded-xl mb-6 uppercase" 
               value={dutyTeacher} onChange={e => setDutyTeacher(e.target.value)} placeholder="УПИШИ ИМЕ..." />
             <button onClick={async () => { await supabase.from('duty_staff').upsert({ id: 1, teacher_name: dutyTeacher }); alert("Сачувано!"); }} 
               className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold uppercase">Ажурирај дежурство</button>
          </div>
        )}

        {/* --- PODESAVANJA --- */}
        {activeTab === 'podesavanja' && (
          <div className="max-w-xl bg-white p-8 rounded-2xl border shadow-sm">
             <label className="block text-sm font-bold uppercase text-orange-500 mb-2">Хитне Вести (Кајрон доле)</label>
             <input className="w-full p-4 font-bold border-2 border-orange-100 bg-orange-50 rounded-xl mb-6 uppercase text-slate-800" 
               value={data.sys.find(s=>s.key==='breaking_news')?.value || ''} 
               onChange={e => handleUpdateSystem('breaking_news', e.target.value)} placeholder="Текст који тече..." />
          </div>
        )}

        {/* --- RODJENDANI --- */}
        {activeTab === 'rodjendani' && (
          <div className="max-w-3xl">
             <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8 flex gap-4">
                <input placeholder="Име и Презиме" className="flex-1 p-4 border rounded-xl bg-slate-50 font-bold" onChange={e => setTextForm({...textForm, text: e.target.value})} />
                <input placeholder="Одељење" className="w-32 p-4 border rounded-xl bg-slate-50 font-bold" onChange={e => setTextForm({...textForm, title: e.target.value})} />
                <button onClick={handleSaveBirthday} className="bg-pink-500 text-white px-8 rounded-xl font-bold uppercase">Додај</button>
             </div>
             <div className="grid grid-cols-2 gap-4">
               {data.bdays.map(b => (
                 <div key={b.id} className="bg-white p-4 rounded-xl border flex justify-between items-center border-l-4 border-pink-400">
                   <span className="font-bold">{b.name} ({b.class_name})</span>
                   <button onClick={() => handleDelete('birthdays', b.id)} className="text-red-500"><Trash2/></button>
                 </div>
               ))}
             </div>
          </div>
        )}

         {/* --- CITATI --- */}
         {activeTab === 'citati' && (
          <div className="max-w-3xl">
             <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8 flex gap-4">
                <input placeholder="Текст цитата..." className="flex-1 p-4 border rounded-xl bg-slate-50 font-bold" onChange={e => setTextForm({...textForm, text: e.target.value})} />
                <input placeholder="Аутор" className="w-48 p-4 border rounded-xl bg-slate-50 font-bold" onChange={e => setTextForm({...textForm, title: e.target.value})} />
                <button onClick={handleSaveQuote} className="bg-slate-800 text-white px-8 rounded-xl font-bold uppercase">Додај</button>
             </div>
             {data.quotes.map(q => (
               <div key={q.id} className="bg-white p-4 rounded-xl border flex justify-between items-center mb-2">
                 <span className="italic">"{q.text}" - {q.author}</span>
                 <button onClick={() => handleDelete('quotes', q.id)} className="text-red-500"><Trash2/></button>
               </div>
             ))}
          </div>
        )}

      </div>
    </div>
  );
}