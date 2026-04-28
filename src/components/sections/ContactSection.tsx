'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Tour, Locale } from '@/types'
import { getTourTitle } from '@/types'

export default function ContactSection({ tours, locale }: { tours: Tour[]; locale: Locale }) {
  const t = useTranslations('contact')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [form, setForm] = useState({ full_name: '', email: '', tour_slug: '', message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, language: locale }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setForm({ full_name: '', email: '', tour_slug: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  const input = "w-full bg-transparent border border-white/15 text-white text-sm px-4 py-3.5 focus:outline-none focus:border-yellow-400 transition-colors placeholder:text-white/25"

  return (
    <section className="bg-black border-t-4 border-yellow-400 py-20 px-6 md:px-10">
      <div className="max-w-2xl">
        <p className="text-[10px] font-bold tracking-widest uppercase text-yellow-400 mb-4">{t('label')}</p>
        <h2 className="font-black uppercase text-white leading-none tracking-tight"
          style={{ fontSize: 'clamp(40px,7vw,80px)', letterSpacing: '-0.04em', lineHeight: 0.9 }}>
          {t('title_1')}<br />{t('title_2')}<br />
          <span className="text-yellow-400">{t('title_3')}</span>
        </h2>

        <form onSubmit={handleSubmit} className="mt-12 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold tracking-widest uppercase text-white/40 block mb-1.5">{t('name')}</label>
              <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                className={input} placeholder={t('placeholder_name')} required minLength={2} />
            </div>
            <div>
              <label className="text-[9px] font-bold tracking-widest uppercase text-white/40 block mb-1.5">{t('email')}</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className={input} placeholder={t('placeholder_email')} required />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-bold tracking-widest uppercase text-white/40 block mb-1.5">{t('interest')}</label>
            <select value={form.tour_slug} onChange={e => setForm({...form, tour_slug: e.target.value})}
              className={input + ' cursor-pointer'}>
              <option value="" className="bg-black">—</option>
              {tours.map(tour => (
                <option key={tour.slug} value={tour.slug} className="bg-black">{getTourTitle(tour, locale)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-bold tracking-widest uppercase text-white/40 block mb-1.5">{t('message')}</label>
            <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})}
              rows={4} className={input + ' resize-none'} placeholder={t('placeholder_message')} required minLength={10} />
          </div>
          <div className="flex items-center gap-6 pt-2 flex-wrap">
            <button type="submit" disabled={status === 'loading'}
              className="bg-yellow-400 text-black font-black text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-yellow-300 transition-colors disabled:opacity-50">
              {status === 'loading' ? '...' : `${t('submit')} →`}
            </button>
            <span className="text-[11px] text-white/30">
              {status === 'success' ? t('success') : status === 'error' ? t('error') : t('reply_note')}
            </span>
          </div>
        </form>
      </div>
    </section>
  )
}
