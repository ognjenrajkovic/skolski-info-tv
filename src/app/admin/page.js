'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Trash2, AlertCircle, Cake, Bell, Quote, Lock } from 'lucide-react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeView, setActiveView] = useState('ann'); // ann, bday, quote
  const [data, setData] = useState({ ann: [], bdays: [], quotes: [] });
  const [emergency, setEmergency] = useState('НОРМАЛНО');
  
  // Forme
  const [newAnn, setNewAnn] = useState('');
  const [newBday, setNewBday] = useState({ name: '', class_name: '' });
  const [newQuote, setNewQuote] = useState({ text: '', author: '' });

  const ADMIN_PASSWORD = "karadjordje2024";

  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated]);

  const fetchData = async () => {
    const { data: ann } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    const { data: bdays } = await supabase.from('birthdays').select('*');
    const { data: quotes } = await supabase.from('quotes').select('*');
    const { data: sys } = await supabase.from('system_settings').select('*').eq('key', 'emergency').single();
    setData({ ann: ann || [], bdays: bdays || [], quotes: quotes || [] });
    if (sys) setEmergency(sys.value);
  };

  const handleAdd = async (table, payload) => {
    await supabase.from(table).insert([payload]);
    fetchData();
    setNewAnn(''); setNewBday({name:'', class_name:''}); setNewQuote({text:'', author:''});
  };

  const handleDelete = async (table, id) => {
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  const setStatus = async (val) => {
    await supabase.from('system_settings').update({ value: val }).eq('key', 'emergency');
    setEmergency(val);
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center">
        <form onSubmit={(e) => {e.preventDefault(); if(password === ADMIN_PASSWORD) setIsAuthenticated(true); else alert("Грешка!");}} 
              className="bg-white p-10 rounded-[3rem] shadow-2xl text-center w-[400px]">
          <Lock className="mx-auto mb-6 text-blue-600" size={50} />
          <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">Админ Приступ</h2>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} 
                 className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl mb-4 text-center font-bold outline-none" placeholder="Унесите шифру..." />
          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">ПРИЈАВИ СЕ</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">Школски <span className="text-blue-600">Командни Центар</span></h1>
            <div className="flex gap-4">
                <button onClick={() => setStatus('УЗБУНА')} className={`px-8 py-3 rounded-xl font-black ${emergency === 'УЗБУНА' ? 'bg-red-600 text-white animate-pulse' : 'bg-red-100 text-red-600'}`}>УЗБУНА</button>
                <button onClick={() => setStatus('НОРМАЛНО')} className="bg-slate-200 px-8 py-3 rounded-xl font-black">НОРМАЛНО</button>
            </div>
        </div>

        <div className="flex gap-4 mb-8">
            {['ann', 'bday', 'quote'].map(type => (
                <button key={type} onClick={() => setActiveView(type)} className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${activeView === type ? 'bg-blue-600 text-white shadow-xl' : 'bg-white text-slate-400'}`}>
                    {type === 'ann' ? 'Обавештења' : type === 'bday' ? 'Рођендани' : 'Цитати'}
                </button>
            ))}
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-white">
            {activeView === 'ann' && (
                <div>
                    <textarea value={newAnn} onChange={e => setNewAnn(e.target.value)} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl mb-4 font-bold text-xl" placeholder="Ново обавештење..." />
                    <button onClick={() => handleAdd('announcements', {text: newAnn})} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black">ОБЈАВИ</button>
                    <div className="mt-8 space-y-3">{data.ann.map(a => <div key={a.id} className="flex justify-between p-4 bg-slate-50 rounded-xl font-bold italic">{a.text} <Trash2 className="text-red-400 cursor-pointer" onClick={() => handleDelete('announcements', a.id)}/></div>)}</div>
                </div>
            )}
            {activeView === 'bday' && (
                <div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input value={newBday.name} onChange={e => setNewBday({...newBday, name: e.target.value})} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" placeholder="Име и презиме" />
                        <input value={newBday.class_name} onChange={e => setNewBday({...newBday, class_name: e.target.value})} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" placeholder="Одељење" />
                    </div>
                    <button onClick={() => handleAdd('birthdays', newBday)} className="w-full bg-pink-500 text-white py-4 rounded-2xl font-black">ДОДАЈ СЛАВЉЕНИКА</button>
                    <div className="mt-8 grid grid-cols-2 gap-3">{data.bdays.map(b => <div key={b.id} className="flex justify-between p-4 bg-slate-50 rounded-xl font-bold">{b.name} ({b.class_name}) <Trash2 className="text-red-400 cursor-pointer" onClick={() => handleDelete('birthdays', b.id)}/></div>)}</div>
                </div>
            )}
            {activeView === 'quote' && (
                <div>
                    <input value={newQuote.text} onChange={e => setNewQuote({...newQuote, text: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-4 font-bold" placeholder="Текст цитата..." />
                    <input value={newQuote.author} onChange={e => setNewQuote({...newQuote, author: e.target.value})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-4 font-bold" placeholder="Аутор..." />
                    <button onClick={() => handleAdd('quotes', newQuote)} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black">ДОДАЈ ЦИТАТ</button>
                    <div className="mt-8 space-y-3">{data.quotes.map(q => <div key={q.id} className="flex justify-between p-4 bg-slate-50 rounded-xl font-bold italic">"{q.text}" — {q.author} <Trash2 className="text-red-400 cursor-pointer" onClick={() => handleDelete('quotes', q.id)}/></div>)}</div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}