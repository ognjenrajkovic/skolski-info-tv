'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Trash2, AlertCircle, Cake, Bell, Lock, Unlock } from 'lucide-react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [ann, setAnn] = useState([]);
  const [newAnn, setNewAnn] = useState('');
  const [bday, setBday] = useState({ name: '', class_name: '' });
  const [emergency, setEmergency] = useState('НОРМАЛНО');

  const ADMIN_PASSWORD = "karadjordje2024"; // ОВДЕ ПРОМЕНИ ШИФРУ

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    const { data: a } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    const { data: s } = await supabase.from('system_settings').select('*').eq('key', 'emergency').single();
    if (a) setAnn(a);
    if (s) setEmergency(s.value);
  };

  const checkPassword = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) setIsAuthenticated(true);
    else alert("Погрешна шифра!");
  };

  const addAnn = async () => {
    if (!newAnn) return;
    await supabase.from('announcements').insert([{ text: newAnn }]);
    setNewAnn('');
    fetchData();
  };

  const deleteAnn = async (id) => {
    await supabase.from('announcements').delete().eq('id', id);
    fetchData();
  };

  const toggleEmergency = async (val) => {
    await supabase.from('system_settings').update({ value: val }).eq('key', 'emergency');
    setEmergency(val);
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-6">
        <form onSubmit={checkPassword} className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md text-center">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="text-blue-600" size={40} />
            </div>
            <h1 className="text-3xl font-[1000] mb-2 uppercase tracking-tight">Приступ Панелу</h1>
            <p className="text-slate-400 font-bold mb-8 uppercase text-xs tracking-widest">Унесите администраторску лозинку</p>
            <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl mb-4 text-center font-black text-2xl focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-blue-700 shadow-xl shadow-blue-200">ПРИЈАВИ СЕ</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
            <h1 className="text-4xl font-black uppercase tracking-tighter italic"><Unlock className="inline mr-2" /> Админ <span className="text-blue-600">Систем</span></h1>
            <button onClick={() => setIsAuthenticated(false)} className="bg-slate-200 px-6 py-2 rounded-xl font-bold">Одјави се</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl">
                <h2 className="text-2xl font-black mb-6 text-blue-600 uppercase italic flex items-center gap-3"><Bell /> Нова Објава</h2>
                <textarea value={newAnn} onChange={(e) => setNewAnn(e.target.value)} className="w-full p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl text-xl font-bold mb-4 h-40 outline-none focus:border-blue-600" placeholder="Упишите вест..." />
                <button onClick={addAnn} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-xl shadow-lg">ПОШАЉИ</button>
                <div className="mt-8 space-y-3">
                    {ann.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold">
                            <span className="truncate pr-4">{item.text}</span>
                            <button onClick={() => deleteAnn(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={20}/></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-8">
                <div className={`p-8 rounded-[3rem] shadow-xl border-4 transition-all ${emergency === 'УЗБУНА' ? 'bg-red-50 border-red-600' : 'bg-white border-transparent'}`}>
                    <h2 className="text-2xl font-black mb-6 text-red-600 uppercase italic flex items-center gap-3"><AlertCircle /> Узбуна</h2>
                    <div className="flex gap-4">
                        <button onClick={() => toggleEmergency('УЗБУНА')} className={`flex-1 py-6 rounded-3xl font-black text-2xl ${emergency === 'УЗБУНА' ? 'bg-red-600 text-white' : 'bg-slate-100 text-red-600'}`}>АКТИВИРАЈ</button>
                        <button onClick={() => toggleEmergency('НОРМАЛНО')} className="flex-1 bg-slate-100 text-slate-400 py-6 rounded-3xl font-black text-2xl">УГАСИ</button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}