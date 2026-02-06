'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Save, AlertTriangle, GraduationCap, Plus, Bell, Quote, Cake, ShieldCheck, Clock, Settings, LogOut } from 'lucide-react';

export default function AdminPanel() {
  const [pass, setPass] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [tab, setTab] = useState('raspored');
  const [data, setData] = useState({ tt: [], ann: [], duty: {}, sys: [], bells: [] });
  
  const [ttForm, setTtForm] = useState({ smena: 'parna', doba_dana: 'prepodne', razred: 6, odeljenje: 1, predmet: '', kabinet: '', cas: 1 });
  const [annForm, setAnnForm] = useState({ tip: 'VEST', sadrzaj: '', autor: '' });
  const [dutyName, setDutyName] = useState('');

  const loadData = async () => {
    try {
      const { data: tt } = await supabase.from('timetable').select('*').order('razred').order('odeljenje');
      const { data: ann } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      const { data: dt } = await supabase.from('duty_staff').select('*').single();
      const { data: sys } = await supabase.from('system_settings').select('*');
      const { data: bl } = await supabase.from('bell_schedule').select('*').order('cas');
      
      setData({ 
        tt: tt || [], 
        ann: ann || [], 
        duty: dt || { teacher_name: 'Није унето' }, 
        sys: sys || [], 
        bells: bl || [] 
      });
      if (dt) setDutyName(dt.teacher_name);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (isLogged) loadData();
  }, [isLogged]);

  const toggleModule = async (key) => {
    const currentObj = data.sys.find(s => s.key === `show_${key}`);
    const newVal = currentObj?.value === 'true' ? 'false' : 'true';
    await supabase.from('system_settings').upsert({ key: `show_${key}`, value: newVal });
    loadData();
  };

  const updateBell = async (id, field, val) => {
    await supabase.from('bell_schedule').update({ [field]: parseInt(val) }).eq('id', id);
    loadData();
  };

  const saveTimetable = async () => {
    if (!ttForm.predmet || !ttForm.kabinet) return alert("Popuni predmet i kabinet!");
    await supabase.from('timetable').insert(ttForm);
    loadData();
    setTtForm({...ttForm, odeljenje: ttForm.odeljenje + 1, predmet: '', kabinet: ''});
  };

  const saveAnn = async () => {
    if (!annForm.sadrzaj) return alert("Unesi tekst!");
    await supabase.from('announcements').insert(annForm);
    setAnnForm({ tip: 'VEST', sadrzaj: '', autor: '' });
    loadData();
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
          <h1 className="text-3xl font-black uppercase italic text-slate-800">Admin Panel</h1>
          <input 
            type="password" 
            placeholder="Unesite šifru" 
            className="border-4 border-slate-100 p-4 rounded-2xl text-center text-2xl font-bold outline-none focus:border-blue-600 transition-all"
            onKeyDown={(e) => e.key === 'Enter' && pass === 'karadjordje2024' && setIsLogged(true)}
            onChange={(e) => setPass(e.target.value)}
          />
          <button onClick={() => pass === 'karadjordje2024' ? setIsLogged(true) : alert('Pogrešna šifra')} className="bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl font-black uppercase text-xl shadow-lg transition-all">Prijavi se</button>
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
          <h1 className="text-xl font-black uppercase italic leading-none text-slate-800">Karađorđe<br/><span className="text-blue-600 text-sm italic">Инфо Систем</span></h1>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          <button onClick={() => setTab('raspored')} className={`flex items-center gap-4 p-4 rounded-2xl font-black uppercase text-sm transition-all ${tab === 'raspored' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-slate-100'}`}><Plus size={20}/> Raspored</button>
          <button onClick={() => setTab('vesti')} className={`flex items-center gap-4 p-4 rounded-2xl font-black uppercase text-sm transition-all ${tab === 'vesti' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-slate-100'}`}><Bell size={20}/> Vesti / Citati</button>
          <button onClick={() => setTab('postavke')} className={`flex items-center gap-4 p-4 rounded-2xl font-black uppercase text-sm transition-all ${tab === 'postavke' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-slate-100'}`}><Settings size={20}/> TV Postavke</button>
        </nav>

        <div className="space-y-4">
          <button 
            onClick={async () => {
              const curr = data.sys.find(s => s.key === 'emergency')?.value === 'true';
              await supabase.from('system_settings').upsert({ key: 'emergency', value: (!curr).toString() });
              loadData();
            }}
            className={`w-full p-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all ${isEmergency ? 'bg-red-600 text-white animate-pulse shadow-xl' : 'bg-red-50 text-red-600 border-2 border-red-100'}`}
          >
            <AlertTriangle/> {isEmergency ? 'GASI UZBUNU!' : 'AKTIVIRAJ UZBUNU'}
          </button>
          <button onClick={() => setIsLogged(false)} className="w-full p-4 rounded-2xl font-bold text-slate-400 hover:text-slate-900 flex items-center justify-center gap-2"><LogOut size={18}/> Odjavi se</button>
        </div>
      </div>

      {/* SADRŽAJ */}
      <div className="flex-1 p-12 overflow-y-auto bg-slate-50">
        
        {tab === 'postavke' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
             <h2 className="text-4xl font-black uppercase italic text-slate-800 border-l-8 border-blue-600 pl-6">Vidljivost Modula</h2>
             <div className="grid grid-cols-2 gap-4">
                {['vreme', 'vesti', 'rodjendani', 'misao_dana'].map(mod => {
                  const active = data.sys.find(s => s.key === `show_${mod}`)?.value === 'true';
                  return (
                    <button key={mod} onClick={() => toggleModule(mod)} className={`p-8 rounded-[2rem] font-black uppercase border-4 transition-all flex flex-col items-center gap-3 ${active ? 'bg-green-50 border-green-500 text-green-700 shadow-lg' : 'bg-white border-slate-100 text-slate-300 shadow-sm opacity-50'}`}>
                      <div className={`w-4 h-4 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-slate-200'}`}></div>
                      {mod.replace('_', ' ')}
                    </button>
                  )
                })}
             </div>

             <h2 className="text-4xl font-black uppercase italic text-slate-800 border-l-8 border-blue-600 pl-6">Satnica Zvona</h2>
             <div className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-100 space-y-6 shadow-sm">
                <div className="grid grid-cols-4 gap-6 font-black uppercase text-xs text-slate-400 mb-2">
                   <span>Čas</span><span>Početak (Min)</span><span>Kraj (Min)</span><span>Pomoć</span>
                </div>
                {data.bells.map(b => (
                  <div key={b.id} className="grid grid-cols-4 gap-6 items-center border-b pb-4 border-slate-50">
                     <span className="text-2xl font-black text-blue-600 uppercase">{b.cas}. ЧАС</span>
                     <input type="number" className="p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" value={b.pocetak} onChange={e => updateBell(b.id, 'pocetak', e.target.value)} />
                     <input type="number" className="p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" value={b.kraj} onChange={e => updateBell(b.id, 'kraj', e.target.value)} />
                     <span className="text-[10px] text-slate-300 uppercase leading-none">{Math.floor(b.pocetak/60)}:{ (b.pocetak%60).toString().padStart(2,'0') } h</span>
                  </div>
                ))}
             </div>

             <h2 className="text-4xl font-black uppercase italic text-slate-800 border-l-8 border-blue-600 pl-6">Dežurni Nastavnik</h2>
             <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 flex gap-4 shadow-sm">
                <input className="flex-1 p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-xl uppercase italic outline-none focus:border-blue-600 transition-all" value={dutyName} onChange={e => setDutyName(e.target.value)} />
                <button onClick={async () => { await supabase.from('duty_staff').upsert({ id: 1, teacher_name: dutyName }); alert("Sačuvano!"); }} className="bg-slate-900 text-white px-8 rounded-xl font-black uppercase">Snimi</button>
             </div>
          </div>
        )}

        {tab === 'vesti' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-4xl font-black uppercase italic text-slate-800 border-l-8 border-blue-600 pl-6">Vesti i Citati</h2>
            
            <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 space-y-6 shadow-sm">
               <div className="flex gap-4">
                  {['VEST', 'CITAT', 'RODJENDAN'].map(type => (
                    <button key={type} onClick={() => setAnnForm({...annForm, tip: type})} className={`flex-1 p-4 rounded-2xl font-black uppercase transition-all ${annForm.tip === type ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                      {type}
                    </button>
                  ))}
               </div>
               <textarea className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl h-40 font-bold text-xl outline-none focus:border-blue-600 transition-all" placeholder="Tekst obaveštenja..." value={annForm.sadrzaj} onChange={e => setAnnForm({...annForm, sadrzaj: e.target.value})}></textarea>
               {annForm.tip === 'CITAT' && (
                  <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-lg outline-none focus:border-blue-600 transition-all" placeholder="Ime autora..." value={annForm.autor} onChange={e => setAnnForm({...annForm, autor: e.target.value})} />
               )}
               <button onClick={saveAnn} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase text-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"><Save/> Objavi odmah</button>
            </div>

            <div className="grid grid-cols-1 gap-4">
               {data.ann.map(a => (
                 <div key={a.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 flex justify-between items-center hover:shadow-md transition-all">
                    <div className="flex items-center gap-6">
                       <span className={`px-4 py-2 rounded-xl font-black text-xs uppercase ${a.tip === 'RODJENDAN' ? 'bg-pink-100 text-pink-600' : (a.tip === 'VEST' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500')}`}>
                         {a.tip}
                       </span>
                       <div>
                          <p className="font-bold text-lg uppercase italic">{a.sadrzaj}</p>
                          {a.autor && <p className="text-sm font-black text-blue-600 uppercase tracking-widest mt-1">— {a.autor}</p>}
                       </div>
                    </div>
                    <button onClick={() => deleteItem('announcements', a.id)} className="text-slate-200 hover:text-red-500 transition-all p-2"><Trash2 size={24}/></button>
                 </div>
               ))}
            </div>
          </div>
        )}

        {tab === 'raspored' && (
          <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
             <h2 className="text-4xl font-black uppercase italic text-slate-800 border-l-8 border-blue-600 pl-6">Raspored Časova</h2>
             <div className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-100 grid grid-cols-4 gap-6 shadow-sm">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">Smena</label>
                   <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-blue-600" value={ttForm.smena} onChange={e => setTtForm({...ttForm, smena: e.target.value, razred: e.target.value === 'parna' ? 6 : 5})}>
                      <option value="parna">Parna (6,8)</option>
                      <option value="neparna">Neparna (5,7)</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">Razred i Od.</label>
                   <div className="flex gap-2">
                     <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" value={ttForm.razred} onChange={e => setTtForm({...ttForm, razred: parseInt(e.target.value)})}>
                        {ttForm.smena === 'parna' ? <><option value="6">6</option><option value="8">8</option></> : <><option value="5">5</option><option value="7">7</option></>}
                     </select>
                     <input type="number" className="w-20 p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" value={ttForm.odeljenje} onChange={e => setTtForm({...ttForm, odeljenje: parseInt(e.target.value)})} />
                   </div>
                </div>
                <div className="space-y-2 col-span-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">Predmet i Kabinet</label>
                   <div className="flex gap-2">
                      <input placeholder="Predmet" className="flex-1 p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold uppercase" value={ttForm.predmet} onChange={e => setTtForm({...ttForm, predmet: e.target.value})} />
                      <input placeholder="Kab." className="w-24 p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold uppercase" value={ttForm.kabinet} onChange={e => setTtForm({...ttForm, kabinet: e.target.value})} />
                      <button onClick={saveTimetable} className="bg-blue-600 text-white px-6 rounded-xl font-black uppercase hover:bg-blue-700 transition-all"><Plus/></button>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase italic border-b-2">
                      <tr>
                        <th className="p-6">Smena</th><th className="p-6">Razred</th><th className="p-6">Predmet</th><th className="p-6">Čas</th><th className="p-6">Kabinet</th><th className="p-6"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y-2 divide-slate-50">
                      {data.tt.map(t => (
                        <tr key={t.id} className="group hover:bg-slate-50 transition-all">
                           <td className="p-6 font-bold uppercase text-xs">{t.smena}</td>
                           <td className="p-6 text-2xl font-black text-blue-600 italic">{t.razred}-{t.odeljenje}</td>
                           <td className="p-6 font-black uppercase text-lg">{t.predmet}</td>
                           <td className="p-6 font-bold uppercase text-slate-400">{t.cas}. čas</td>
                           <td className="p-6 font-black uppercase"><span className="bg-slate-900 text-white px-4 py-1 rounded-lg">{t.kabinet}</span></td>
                           <td className="p-6 text-right opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => deleteItem('timetable', t.id)} className="text-red-500 p-2"><Trash2 size={20}/></button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}