'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trash2, Save, AlertTriangle, GraduationCap, 
  Plus, Bell, Quote, Cake, ShieldCheck, LogOut 
} from 'lucide-react';

export default function AdminPanel() {
  const [pass, setPass] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [tab, setTab] = useState('raspored');
  const [data, setData] = useState({ tt: [], ann: [], duty: {}, sys: [] });

  // Forme za unos
  const [ttForm, setTtForm] = useState({
    smena: 'parna', doba_dana: 'prepodne', razred: 6, odeljenje: 1, predmet: '', kabinet: '', cas: 1
  });
  const [annForm, setAnnForm] = useState({ tip: 'VEST', sadrzaj: '' });
  const [dutyName, setDutyName] = useState('');

  // Provera šifre
  const checkPass = () => {
    if (pass === 'karadjordje2024') {
      setIsLogged(true);
    } else {
      alert('Pogrešna šifra!');
    }
  };

  const loadData = async () => {
    const { data: tt } = await supabase.from('timetable').select('*').order('razred').order('odeljenje');
    const { data: ann } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    const { data: dt } = await supabase.from('duty_staff').select('*').single();
    const { data: sys } = await supabase.from('system_settings').select('*');
    setData({ tt: tt || [], ann: ann || [], duty: dt || { teacher_name: 'Није унето' }, sys: sys || [] });
    if (dt) setDutyName(dt.teacher_name);
  };

  useEffect(() => {
    if (isLogged) loadData();
  }, [isLogged]);

  // AKCIJE
  const saveTimetable = async () => {
    if (!ttForm.predmet || !ttForm.kabinet) return alert("Popuni predmet i kabinet!");
    await supabase.from('timetable').insert(ttForm);
    loadData();
    setTtForm({...ttForm, odeljenje: ttForm.odeljenje + 1, predmet: '', kabinet: ''}); // Olakšava bulk unos
  };

  const saveAnn = async () => {
    if (!annForm.sadrzaj) return alert("Unesi tekst!");
    await supabase.from('announcements').insert(annForm);
    setAnnForm({ ...annForm, sadrzaj: '' });
    loadData();
  };

  const toggleEmergency = async () => {
    const current = data.sys.find(s => s.key === 'emergency')?.value === 'true';
    await supabase.from('system_settings').upsert({ key: 'emergency', value: (!current).toString() });
    loadData();
  };

  const updateDuty = async () => {
    await supabase.from('duty_staff').upsert({ id: 1, teacher_name: dutyName });
    alert("Dežurni nastavnik sačuvan!");
  };

  const deleteItem = async (table, id) => {
    if (confirm("Da li ste sigurni?")) {
      await supabase.from(table).delete().eq('id', id);
      loadData();
    }
  };

  if (!isLogged) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center font-sans">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col gap-6 text-center w-96">
          <div className="mx-auto bg-blue-100 p-5 rounded-full text-blue-600"><ShieldCheck size={50}/></div>
          <h1 className="text-3xl font-black uppercase italic italic text-slate-800">Admin Panel</h1>
          <input 
            type="password" 
            placeholder="Unesite šifru" 
            className="border-4 border-slate-100 p-4 rounded-2xl text-center text-2xl font-bold outline-none focus:border-blue-600 transition-all"
            onKeyDown={(e) => e.key === 'Enter' && checkPass()}
            onChange={(e) => setPass(e.target.value)}
          />
          <button onClick={checkPass} className="bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl font-black uppercase text-xl shadow-lg transition-all">Prijavi se</button>
        </div>
      </div>
    );
  }

  const isEmergency = data.sys.find(s => s.key === 'emergency')?.value === 'true';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden h-screen">
      {/* SIDEBAR */}
      <div className="w-80 bg-white border-r-2 border-slate-200 p-8 flex flex-col shadow-xl">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><GraduationCap/></div>
          <h1 className="text-xl font-black uppercase italic leading-none">Karađorđe<br/><span className="text-blue-600 text-sm">Upravljanje</span></h1>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          <button onClick={() => setTab('raspored')} className={`flex items-center gap-4 p-4 rounded-2xl font-black uppercase text-sm transition-all ${tab === 'raspored' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-slate-100'}`}><Plus size={20}/> Raspored časova</button>
          <button onClick={() => setTab('vesti')} className={`flex items-center gap-4 p-4 rounded-2xl font-black uppercase text-sm transition-all ${tab === 'vesti' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-slate-100'}`}><Bell size={20}/> Vesti & Citati</button>
          <button onClick={() => setTab('dezurstvo')} className={`flex items-center gap-4 p-4 rounded-2xl font-black uppercase text-sm transition-all ${tab === 'dezurstvo' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-slate-100'}`}><ShieldCheck size={20}/> Dežurstvo</button>
        </nav>

        <div className="space-y-4">
          <button 
            onClick={toggleEmergency} 
            className={`w-full p-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all ${isEmergency ? 'bg-red-600 text-white animate-pulse shadow-xl shadow-red-200' : 'bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100'}`}
          >
            <AlertTriangle/> {isEmergency ? 'GASI UZBUNU!' : 'AKTIVIRAJ UZBUNU'}
          </button>
          <button onClick={() => setIsLogged(false)} className="w-full p-4 rounded-2xl font-bold text-slate-400 hover:text-slate-900 flex items-center justify-center gap-2"><LogOut size={18}/> Odjavi se</button>
        </div>
      </div>

      {/* GLAVNI SADRŽAJ */}
      <div className="flex-1 p-12 overflow-y-auto">
        
        {tab === 'raspored' && (
          <div className="max-w-6xl mx-auto space-y-10">
            <h2 className="text-5xl font-black uppercase italic italic text-slate-800 border-l-8 border-blue-600 pl-6">Unos rasporeda</h2>
            
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border-2 border-slate-100 grid grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">Smena i Razred</label>
                <div className="flex gap-2">
                  <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-blue-600 outline-none" value={ttForm.smena} onChange={e => setTtForm({...ttForm, smena: e.target.value, razred: e.target.value === 'parna' ? 6 : 5})}>
                    <option value="parna">Parna (6,8)</option>
                    <option value="neparna">Neparna (5,7)</option>
                  </select>
                  <select className="w-24 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={ttForm.razred} onChange={e => setTtForm({...ttForm, razred: parseInt(e.target.value)})}>
                    {ttForm.smena === 'parna' ? <><option value="6">6</option><option value="8">8</option></> : <><option value="5">5</option><option value="7">7</option></>}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">Odeljenje i Čas</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Odelj." className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={ttForm.odeljenje} onChange={e => setTtForm({...ttForm, odeljenje: parseInt(e.target.value)})}/>
                  <input type="number" placeholder="Čas" className="w-20 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={ttForm.cas} onChange={e => setTtForm({...ttForm, cas: parseInt(e.target.value)})}/>
                </div>
              </div>

              <div className="space-y-2 col-span-2 flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400">Predmet i Kabinet</label>
                  <div className="flex gap-2">
                    <input placeholder="Predmet" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-blue-600 outline-none uppercase" value={ttForm.predmet} onChange={e => setTtForm({...ttForm, predmet: e.target.value})}/>
                    <input placeholder="Kab." className="w-24 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={ttForm.kabinet} onChange={e => setTtForm({...ttForm, kabinet: e.target.value})}/>
                  </div>
                </div>
                <button onClick={saveTimetable} className="bg-blue-600 text-white p-4 h-[60px] rounded-2xl font-black uppercase shadow-lg shadow-blue-100 hover:scale-105 transition-all">Dodaj</button>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border-2 border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b-2 border-slate-100">
                  <tr className="text-slate-400 uppercase text-[10px] font-black tracking-widest">
                    <th className="p-6">Smena</th><th className="p-6">Razred</th><th className="p-6">Predmet</th><th className="p-6">Čas</th><th className="p-6">Kabinet</th><th className="p-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.tt.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-all font-bold group">
                      <td className="p-6 uppercase text-xs">{t.smena}</td>
                      <td className="p-6 text-xl text-blue-600">{t.razred}-{t.odeljenje}</td>
                      <td className="p-6 uppercase">{t.predmet}</td>
                      <td className="p-6">{t.cas}. čas</td>
                      <td className="p-6 font-black"><span className="bg-slate-100 px-3 py-1 rounded-lg">{t.kabinet}</span></td>
                      <td className="p-6 text-right">
                        <button onClick={() => deleteItem('timetable', t.id)} className="text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'vesti' && (
          <div className="max-w-4xl mx-auto space-y-10">
            <h2 className="text-5xl font-black uppercase italic text-slate-800 border-l-8 border-blue-600 pl-6">Vesti i Citati</h2>
            
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border-2 border-slate-100 space-y-6">
              <div className="flex gap-4">
                <button onClick={() => setAnnForm({...annForm, tip: 'VEST'})} className={`flex-1 p-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2 border-2 transition-all ${annForm.tip === 'VEST' ? 'bg-blue-50 border-blue-600 text-blue-600' : 'border-slate-100 text-slate-400'}`}><Bell size={18}/> VEST</button>
                <button onClick={() => setAnnForm({...annForm, tip: 'CITAT'})} className={`flex-1 p-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2 border-2 transition-all ${annForm.tip === 'CITAT' ? 'bg-blue-50 border-blue-600 text-blue-600' : 'border-slate-100 text-slate-400'}`}><Quote size={18}/> CITAT / MISAO</button>
                <button onClick={() => setAnnForm({...annForm, tip: 'RODJENDAN'})} className={`flex-1 p-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2 border-2 transition-all ${annForm.tip === 'RODJENDAN' ? 'bg-pink-50 border-pink-600 text-pink-600' : 'border-slate-100 text-slate-400'}`}><Cake size={18}/> ROĐENDAN</button>
              </div>
              
              <textarea 
                className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold text-xl outline-none focus:border-blue-600 h-40" 
                placeholder="Unesite sadržaj..."
                value={annForm.sadrzaj}
                onChange={e => setAnnForm({...annForm, sadrzaj: e.target.value})}
              ></textarea>
              
              <button onClick={saveAnn} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase text-xl shadow-lg hover:bg-blue-700 transition-all shadow-blue-100 flex items-center justify-center gap-3"><Save/> Objavi odmah</button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {data.ann.map(a => (
                <div key={a.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-6">
                    <span className={`p-3 rounded-xl font-black text-xs uppercase ${a.tip === 'RODJENDAN' ? 'bg-pink-100 text-pink-600' : (a.tip === 'VEST' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600')}`}>
                      {a.tip}
                    </span>
                    <p className="font-bold text-lg italic uppercase leading-none italic">"{a.sadrzaj}"</p>
                  </div>
                  <button onClick={() => deleteItem('announcements', a.id)} className="text-slate-300 hover:text-red-500 transition-all"><Trash2 size={22}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'dezurstvo' && (
          <div className="max-w-2xl mx-auto space-y-10">
            <h2 className="text-5xl font-black uppercase italic text-slate-800 border-l-8 border-blue-600 pl-6">Dežurstvo</h2>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border-2 border-slate-100 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">Ime i prezime nastavnika</label>
                <input 
                  className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-3xl uppercase outline-none focus:border-blue-600" 
                  value={dutyName} 
                  onChange={e => setDutyName(e.target.value)} 
                />
              </div>
              <button onClick={updateDuty} className="w-full bg-slate-900 text-white p-6 rounded-2xl font-black uppercase text-xl hover:bg-black transition-all">Sačuvaj izmenu</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}