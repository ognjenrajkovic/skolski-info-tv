'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Send, Trash2, ShieldCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [pin, setPin] = useState('')
  const [newNote, setNewNote] = useState('')
  const [list, setList] = useState([])

  const fetchNotes = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setList(data || [])
  }

  useEffect(() => { if(isAdmin) fetchNotes() }, [isAdmin])

  const addNote = async () => {
    if(!newNote) return
    await supabase.from('announcements').insert([{ text: newNote }])
    setNewNote('')
    fetchNotes()
  }

  const deleteNote = async (id) => {
    await supabase.from('announcements').delete().eq('id', id)
    fetchNotes()
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
        <div className="bg-slate-800 p-10 rounded-3xl shadow-2xl w-full max-w-md border border-slate-700">
          <ShieldCheck size={60} className="mx-auto mb-6 text-blue-400" />
          <h1 className="text-3xl font-black text-center mb-8 uppercase tracking-tighter">Админ приступ</h1>
          <input 
            type="password" 
            placeholder="Унесите ПИН" 
            className="w-full p-4 rounded-xl bg-slate-700 border-none text-white text-2xl text-center mb-4 focus:ring-4 ring-blue-500 transition-all"
            onChange={(e) => e.target.value === '2024' && setIsAdmin(true)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Управљање објавама</h1>
          <Link href="/" className="flex items-center gap-2 text-blue-600 font-bold hover:underline"><ArrowLeft size={20}/> Назад на ТВ</Link>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl mb-10 border border-slate-100">
          <textarea 
            className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xl mb-4 focus:border-blue-500 outline-none transition-all"
            placeholder="Унесите ново обавештење..."
            rows="3"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <button onClick={addNote} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-2xl flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-[0.98] transition-all">
            <Send /> ОБЈАВИ НА ТВ
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-500 uppercase tracking-widest">Тренутне објаве</h2>
          {list.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center animate-in slide-in-from-top">
              <p className="text-xl font-medium text-slate-700">{item.text}</p>
              <button onClick={() => deleteNote(item.id)} className="text-red-500 p-3 hover:bg-red-50 rounded-xl transition-colors">
                <Trash2 size={24} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}