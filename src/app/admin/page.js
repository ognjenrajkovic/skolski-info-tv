'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Trash2, AlertCircle, Cake, Bell, RefreshCw } from 'lucide-react';

export default function AdminPanel() {
  const [ann, setAnn] = useState([]);
  const [newAnn, setNewAnn] = useState('');
  const [bday, setBday] = useState({ name: '', class_name: '' });
  const [emergency, setEmergency] = useState('НОРМАЛНО');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: a } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    const { data: s } = await supabase.from('system_settings').select('*').eq('key', 'emergency').single();
    if (a) setAnn(a);
    if (s) setEmergency(s.value);
  };

  const addAnn = async () => {
    if (!newAnn) return;
    await supabase.from('announcements').insert([{ text: newAnn }]);
    setNewAnn('');
    fetchData();
  };

  const addBday = async () => {
    if (!bday.name || !bday.class_name) return;
    await supabase.from('birthdays').insert([bday]);
    setBday({ name: '', class_name: '' });
    alert("Рођендан додат!");
  };

  const deleteAnn = async (id) => {
    await supabase.from('announcements').delete().eq('id', id);
    fetchData();
  };

  const toggleEmergency = async (val) => {
    await supabase.from('system_settings').update({ value: val }).eq('key', 'emergency');
    setEmergency(val);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-10">
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">Школска <span className="text-blue-600">Команда</span></h1>
            <div className={`px-8 py-3 rounded-full font-black text-xl shadow-lg transition-all ${emergency === 'УЗБУНА' ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
                СТАТУС: {emergency}
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* OBAVEŠTENJA */}
            <div className="bg-white p-8 rounded-[3rem] shadow-xl">
                <h2 className="text-2xl font-black mb-6 text-blue-600 uppercase italic flex items-center gap-3"><Bell /> Објаве</h2>
                <textarea value={newAnn} onChange={(e) => setNewAnn(e.target.value)} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-xl font-bold mb-4 h-40 focus:outline-none focus:border-blue-500" placeholder="Унесите важну вест..." />
                <button onClick={addAnn} className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">ПОШАЉИ НА ТВ</button>
                
                <div className="mt-10 space-y-4">
                    {ann.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-slate-50 p-5 rounded-3xl border border-slate-100">
                            <p className="text-lg font-bold pr-4">{item.text}</p>
                            <button onClick={() => deleteAnn(item.id)} className="p-4 bg-white text-red-500 rounded-2xl shadow-sm hover:bg-red-50"><Trash2 /></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-8">
                {/* HITНО СТАЊЕ */}
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-red-50">
                    <h2 className="text-2xl font-black mb-6 text-red-600 uppercase italic flex items-center gap-3"><AlertCircle /> Сигурносни Мод</h2>
                    <div className="flex gap-4">
                        <button onClick={() => toggleEmergency('УЗБУНА')} className="flex-1 bg-red-600 text-white py-6 rounded-3xl font-black text-2xl hover:bg-red-700 shadow-lg shadow-red-100 transition-all">УЗБУНА</button>
                        <button onClick={() => toggleEmergency('НОРМАЛНО')} className="flex-1 bg-slate-100 text-slate-400 py-6 rounded-3xl font-black text-2xl hover:bg-slate-200 transition-all">ОТКАЖИ</button>
                    </div>
                </div>

                {/* ROĐENDANI */}
                <div className="bg-white p-8 rounded-[3rem] shadow-xl">
                    <h2 className="text-2xl font-black mb-6 text-pink-500 uppercase italic flex items-center gap-3"><Cake /> Рођендани</h2>
                    <div className="space-y-4">
                        <input value={bday.name} onChange={(e) => setBday({...bday, name: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" placeholder="Име и презиме ученика" />
                        <input value={bday.class_name} onChange={(e) => setBday({...bday, class_name: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" placeholder="Одељење (нпр. 6-2)" />
                        <button onClick={addBday} className="w-full bg-pink-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-pink-600 shadow-lg shadow-pink-100 transition-all">ДОДАЈ СЛАВЉЕНИКА</button>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}