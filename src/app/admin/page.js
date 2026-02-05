'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Cake, Quote, Calendar, AlertTriangle, Save, Trash2, Plus } from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('announcements');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [form, setForm] = useState({});

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    let { data: res } = await supabase.from(activeTab).select('*');
    setData(res || []);
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await supabase.from(activeTab).insert([form]);
    setForm({});
    fetchData();
  };

  const deleteItem = async (id) => {
    await supabase.from(activeTab).delete().eq('id', id);
    fetchData();
  };

  const toggleEmergency = async (val) => {
    await supabase.from('system_settings').upsert({ key: 'emergency', value: val });
    alert("Status uzbune promenjen!");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-6 space-y-4">
        <h1 className="text-xl font-black mb-8 italic">TV KONTROLA</h1>
        <button onClick={() => setActiveTab('announcements')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'announcements' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><Bell size={20}/> Obaveštenja</button>
        <button onClick={() => setActiveTab('timetable')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'timetable' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><Calendar size={20}/> Raspored</button>
        <button onClick={() => setActiveTab('birthdays')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'birthdays' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><Cake size={20}/> Rođendani</button>
        <button onClick={() => setActiveTab('quotes')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'quotes' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><Quote size={20}/> Citati</button>
        
        <div className="pt-10 space-y-2">
          <p className="text-xs text-slate-500 uppercase font-bold">Bezbednost</p>
          <button onClick={() => toggleEmergency('UZBUNA')} className="w-full bg-red-600 p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700"><AlertTriangle size={20}/> AKTIVIRAJ UZBUNU</button>
          <button onClick={() => toggleEmergency('NORMALNO')} className="w-full border border-slate-700 p-3 rounded-xl text-slate-400 hover:bg-slate-800 italic">Prekini uzbunu</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">Upravljanje: {activeTab}</h2>
            
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4 mb-10 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300">
              {activeTab === 'announcements' && (
                <input className="col-span-2 p-3 rounded-lg border" placeholder="Tekst obaveštenja..." onChange={e => setForm({text: e.target.value})} />
              )}
              {activeTab === 'timetable' && (
                <>
                  <select className="p-3 border rounded-lg text-slate-700" onChange={e => setForm({...form, day: e.target.value})}>
                    <option>Izaberi dan</option>
                    <option value="Ponedeljak">Ponedeljak</option>
                    <option value="Utorak">Utorak</option>
                    <option value="Sreda">Sreda</option>
                    <option value="Četvrtak">Četvrtak</option>
                    <option value="Petak">Petak</option>
                  </select>
                  <select className="p-3 border rounded-lg text-slate-700" onChange={e => setForm({...form, shift: e.target.value})}>
                    <option>Smena</option>
                    <option value="Parna">Parna</option>
                    <option value="Neparna">Neparna</option>
                  </select>
                  <input className="p-3 border rounded-lg" placeholder="Odeljenje (npr. VIII-1)" onChange={e => setForm({...form, class_name: e.target.value})} />
                  <input className="p-3 border rounded-lg" placeholder="Predmet / Kabinet" onChange={e => setForm({...form, room: e.target.value})} />
                </>
              )}
              {activeTab === 'birthdays' && (
                <>
                  <input className="p-3 border rounded-lg" placeholder="Ime i prezime" onChange={e => setForm({...form, name: e.target.value})} />
                  <input className="p-3 border rounded-lg" placeholder="Odeljenje" onChange={e => setForm({...form, class_name: e.target.value})} />
                </>
              )}
              <button type="submit" className="col-span-2 bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"><Plus size={20}/> DODAJ U SISTEM</button>
            </form>

            <div className="space-y-3">
              {loading ? <p>Učitavanje...</p> : data.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all">
                  <div>
                    <p className="font-bold text-slate-800">{item.text || item.name || `${item.class_name} - ${item.room}`}</p>
                    <p className="text-xs text-slate-400 uppercase font-black">{item.day} {item.shift}</p>
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={20}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}