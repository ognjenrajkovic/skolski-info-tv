'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Save, AlertTriangle, GraduationCap, Plus, Bell, Quote, Thermometer } from 'lucide-react';

export default function AdminPanel() {
  const [data, setData] = useState({ tt: [], ann: [], duty: {}, sys: [] });
  const [tab, setTab] = useState('raspored');
  
  // Forme za unos
  const [ttForm, setTtForm] = useState({
    smena: 'parna', doba_dana: 'prepodne', razred: 5, odeljenje: 1, predmet: '', kabinet: '', cas: 1
  });
  const [annForm, setAnnForm] = useState({ tip: 'VEST', sadrzaj: '' });
  const [dutyName, setDutyName] = useState('');

  const loadData = async () => {
    const { data: tt } = await supabase.from('timetable').select('*').order('razred').order('odeljenje');
    const { data: ann } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    const { data: dt } = await supabase.from('duty_staff').select('*').single();
    const { data: sys } = await supabase.from('system_settings').select('*');
    setData({ tt: tt || [], ann: ann || [], duty: dt || {}, sys: sys || [] });
    if (dt) setDutyName(dt.teacher_name);
  };

  useEffect(() => { loadData(); }, []);

  // AKCIJE
  const saveTimetable = async () => {
    if (!ttForm.predmet || !ttForm.kabinet) return alert("Popuni predmet i kabinet!");
    await supabase.from('timetable').insert(ttForm);
    loadData();
  };

  const saveAnn = async () => {
    if (!annForm.sadrzaj) return alert("Unesi sadržaj!");
    await supabase.from('announcements').insert(annForm);
    setAnnForm({ ...annForm, sadrzaj: '' });
    loadData();
  };

  const toggleSys = async (key, currentVal) => {
    const newVal = currentVal === 'true' ? 'false' : 'true';
    await supabase.from('system_settings').upsert({ key, value: newVal });
    loadData();
  };

  const updateDuty = async () => {
    await supabase.from('duty_staff').upsert({ id: 1, teacher_name: dutyName });
    alert("Dežurstvo ažurirano!");
  };

  const deleteItem = async (table, id) => {
    if (confirm("Obriši stavku?")) {
      await supabase.from(table).delete().eq('id', id);
      loadData();
    }
  };

  const isEmergency = data.sys.find(s => s.key === 'emergency')?.value === 'true';
  const showLower = data.sys.find(s => s.key === 'show_lower_grades')?.value === 'true';

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-900">
      {/* SIDEBAR */}
      <div className="w-72 bg-slate-900 text-white p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-black italic text-blue-400 mb-8 border-b border-white/10 pb-4">KARAĐORĐE ADMIN</h1>
        
        <button onClick={() => setTab('raspored')} className={`p-4 rounded-xl font-bold flex gap-3 ${tab === 'raspored' ? 'bg-blue-600' : 'hover:bg-white/5'}`}><GraduationCap/> Raspored</button>
        <button onClick={() => setTab('obavestenja')} className={`p-4 rounded-xl font-bold flex gap-3 ${tab === 'obavestenja' ? 'bg-blue-600' : 'hover:bg-white/5'}`}><Bell/> Obaveštenja</button>
        <button onClick={() => setTab('postavke')} className={`p-4 rounded-xl font-bold flex gap-3 ${tab === 'postavke' ? 'bg-blue-600' : 'hover:bg-white/5'}`}><Plus/> Dežurstvo & Info</button>

        <div className="mt-auto space-y-4">
          <button onClick={() => toggleSys('show_lower_grades', showLower ? 'true' : 'false')} className={`w-full p-4 rounded-xl font-black uppercase text-xs ${showLower ? 'bg-green-600' : 'bg-slate-700'}`}>
             Prikaz nižih razreda: {showLower ? 'UKLJUČEN' : 'ISKLJUČEN'}
          </button>
          <button onClick={() => toggleSys('emergency', isEmergency ? 'true' : 'false')} className={`w-full p-6 rounded-xl font-black flex items-center justify-center gap-2 animate-pulse ${isEmergency ? 'bg-red-600 text-white' : 'bg-red-900/30 text-red-500 border border-red-500'}`}>
            <AlertTriangle/> {isEmergency ? 'GASI UZBUNU!' : 'AKTIVIRAJ UZBUNU'}
          </button>
        </div>
      </div>

      {/* GLAVNI SADRŽAJ */}
      <div className="flex-1 p-10 overflow-auto">
        
        {tab === 'raspored' && (
          <div className="space-y-8">
            <h2 className="text-4xl font-black uppercase italic">Unos Rasporeda (Bulk)</h2>
            <div className="bg-white p-8 rounded-3xl shadow-sm grid grid-cols-4 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-xs uppercase opacity-50 text-blue-600">Smena / Doba dana</label>
                <div className="flex gap-2">
                  <select className="border p-3 rounded-lg w-full font-bold" value={ttForm.smena} onChange={e => setTtForm({...ttForm, smena: e.target.value})}>
                    <option value="parna">Parna</option>
                    <option value="neparna">Neparna</option>
                  </select>
                  <select className="border p-3 rounded-lg w-full font-bold" value={ttForm.doba_dana} onChange={e => setTtForm({...ttForm, doba_dana: e.target.value})}>
                    <option value="prepodne">Pre podne</option>
                    <option value="popodne">Po podne</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-xs uppercase opacity-50 text-blue-600">Razred i Odeljenje</label>
                <div className="flex gap-2">
                  <input type="number" className="border p-3 rounded-lg w-full font-bold" placeholder="Razred" value={ttForm.razred} onChange={e => setTtForm({...ttForm, razred: parseInt(e.target.value)})}/>
                  <input type="number" className="border p-3 rounded-lg w-full font-bold" placeholder="Od." value={ttForm.odeljenje} onChange={e => setTtForm({...ttForm, odeljenje: parseInt(e.target.value)})}/>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-xs uppercase opacity-50 text-blue-600">Predmet i Kabinet</label>
                <div className="flex gap-2">
                  <input className="border p-3 rounded-lg w-full font-bold" placeholder="Predmet" value={ttForm.predmet} onChange={e => setTtForm({...ttForm, predmet: e.target.value})}/>
                  <input className="border p-3 rounded-lg w-24 font-bold" placeholder="Kab." value={ttForm.kabinet} onChange={e => setTtForm({...ttForm, kabinet: e.target.value})}/>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-xs uppercase opacity-50 text-blue-600">Čas</label>
                <div className="flex gap-2">
                  <input type="number" className="border p-3 rounded-lg w-20 font-bold" value={ttForm.cas} onChange={e => setTtForm({...ttForm, cas: parseInt(e.target.value)})}/>
                  <button onClick={saveTimetable} className="bg-blue-600 text-white flex-1 rounded-lg font-black uppercase hover:bg-blue-700">Dodaj Čas</button>
                </div>
              </div>
            </div>

            <table className="w-full bg-white rounded-3xl overflow-hidden shadow-sm">
              <thead className="bg-slate-200">
                <tr className="text-left font-black uppercase text-xs text-slate-500">
                  <th className="p-4">Smena</th><th className="p-4">Doba</th><th className="p-4">Razred</th><th className="p-4">Predmet</th><th className="p-4">Čas</th><th className="p-4">Kabinet</th><th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {data.tt.map(t => (
                  <tr key={t.id} className="border-t border-slate-100 font-bold">
                    <td className="p-4 uppercase">{t.smena}</td>
                    <td className="p-4 uppercase text-blue-600">{t.doba_dana}</td>
                    <td className="p-4 text-xl">{t.razred}-{t.odeljenje}</td>
                    <td className="p-4 italic uppercase">{t.predmet}</td>
                    <td className="p-4">{t.cas}. čas</td>
                    <td className="p-4 font-black">{t.kabinet}</td>
                    <td className="p-4 text-right"><button onClick={() => deleteItem('timetable', t.id)} className="text-red-400 hover:text-red-600"><Trash2/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'obavestenja' && (
          <div className="max-w-4xl space-y-8">
            <h2 className="text-4xl font-black uppercase italic">Vesti i Citati</h2>
            <div className="bg-white p-8 rounded-3xl shadow-sm flex flex-col gap-4">
              <select className="border p-4 rounded-xl font-bold" value={annForm.tip} onChange={e => setAnnForm({...annForm, tip: e.target.value})}>
                <option value="VEST">VEST / OBAVEŠTENJE</option>
                <option value="CITAT">MISAO DANA / CITAT</option>
              </select>
              <textarea className="border p-4 rounded-xl font-bold h-32" placeholder="Unesi tekst ovde..." value={annForm.sadrzaj} onChange={e => setAnnForm({...annForm, sadrzaj: e.target.value})}></textarea>
              <button onClick={saveAnn} className="bg-blue-600 text-white p-4 rounded-xl font-black uppercase">Objavi na TV</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {data.ann.map(a => (
                <div key={a.id} className="bg-white p-6 rounded-2xl border-l-8 border-blue-500 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase opacity-40">{a.tip}</span>
                    <p className="font-bold text-lg mt-1 italic leading-tight">"{a.sadrzaj}"</p>
                  </div>
                  <button onClick={() => deleteItem('announcements', a.id)} className="text-red-400 ml-4"><Trash2/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'postavke' && (
          <div className="max-w-2xl space-y-8">
            <h2 className="text-4xl font-black uppercase italic">Dežurstvo</h2>
            <div className="bg-white p-8 rounded-3xl shadow-sm space-y-4">
              <label className="font-bold text-slate-500 uppercase text-xs">Ime dežurnog nastavnika:</label>
              <input className="w-full border p-4 rounded-xl font-black text-2xl uppercase" value={dutyName} onChange={e => setDutyName(e.target.value)} />
              <button onClick={updateDuty} className="w-full bg-slate-900 text-white p-4 rounded-xl font-black uppercase">Sačuvaj izmenu</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}