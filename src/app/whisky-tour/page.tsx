'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface FormState {
  first_name: string
  last_name: string
  email: string
  phone: string
  travelers: string
  period: string
  message: string
}

const EMPTY: FormState = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  travelers: '2',
  period: 'September 2025',
  message: '',
}

export default function WhiskyTourPage() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const reserveRef = useRef<HTMLElement>(null)

  const scrollToReserve = (e: React.MouseEvent) => {
    e.preventDefault()
    reserveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const field =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/whisky-tour-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('server error')
      setStatus('success')
      setForm(EMPTY)
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please email us at info@whygo.ge')
    }
  }

  const TICKER_ITEMS = [
    'EDINBURGH', '·', 'HOLYROOD DISTILLERY', '·', 'GLENKINCHIE', '·',
    'ROYAL MILE WHISKIES', '·', 'GLASGOW', '·', 'PRIVATE DINING', '·',
    'PREMIUM TASTING', '·', 'SCOTCH MALT WHISKY SOCIETY', '·',
    'EDINBURGH', '·', 'HOLYROOD DISTILLERY', '·', 'GLENKINCHIE', '·',
    'ROYAL MILE WHISKIES', '·', 'GLASGOW', '·', 'PRIVATE DINING', '·',
    'PREMIUM TASTING', '·', 'SCOTCH MALT WHISKY SOCIETY', '·',
  ]

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #0a0a0a;
          color: #f5f0e8;
          font-family: var(--font-dm-sans, 'DM Sans', sans-serif);
          font-weight: 300;
          font-size: 16px;
          line-height: 1.6;
          overflow-x: hidden;
        }
        .bebas { font-family: var(--font-bebas, 'Bebas Neue', sans-serif); }
        .playfair { font-family: var(--font-playfair, 'Playfair Display', serif); font-style: italic; }

        /* NAV */
        .wt-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 80px; height: 64px;
          background: rgba(10,10,10,0.92);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #1a1a1a;
        }
        @media (max-width: 900px) { .wt-nav { padding: 0 24px; } }

        /* HERO */
        .hero {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
          overflow: hidden;
          padding-top: 64px;
        }
        .hero-left {
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 80px 60px 80px 80px;
          position: relative;
          z-index: 2;
        }
        .hero-right {
          position: relative;
          overflow: hidden;
        }
        .hero-right::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, #0a0a0a 0%, transparent 35%);
          z-index: 1;
        }
        .collab-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #f0c419;
          color: #0a0a0a;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 8px 16px;
          margin-bottom: 32px;
          width: fit-content;
        }
        .hero-eyebrow {
          font-size: 11px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #f0c419;
          margin-bottom: 16px;
          font-weight: 500;
        }
        .hero-title {
          font-size: clamp(64px, 8vw, 110px);
          line-height: 0.9;
          letter-spacing: -0.01em;
          margin-bottom: 8px;
        }
        .hero-title .accent { color: #f0c419; }
        .hero-subtitle {
          font-size: clamp(16px, 1.8vw, 22px);
          color: #888;
          margin-bottom: 40px;
        }
        .hero-meta {
          display: flex;
          gap: 32px;
          margin-bottom: 48px;
          flex-wrap: wrap;
        }
        .meta-item { display: flex; flex-direction: column; gap: 4px; }
        .meta-label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; }
        .meta-value { font-size: 15px; font-weight: 500; }
        .cta-group { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
        .btn-primary {
          background: #f0c419;
          color: #0a0a0a;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 16px 32px;
          text-decoration: none;
          transition: background 0.2s, transform 0.2s;
          display: inline-block;
          cursor: pointer;
          border: none;
        }
        .btn-primary:hover { background: #c9a310; transform: translateY(-2px); }
        .btn-secondary {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #f5f0e8;
          text-decoration: none;
          border-bottom: 1px solid #888;
          padding-bottom: 2px;
          transition: color 0.2s, border-color 0.2s;
        }
        .btn-secondary:hover { color: #f0c419; border-color: #f0c419; }

        /* TICKER */
        .ticker { background: #f0c419; color: #0a0a0a; overflow: hidden; padding: 14px 0; white-space: nowrap; }
        .ticker-inner { display: inline-flex; animation: ticker 22s linear infinite; }
        .ticker-item { font-size: 15px; letter-spacing: 0.15em; padding: 0 40px; }
        .ticker-dot { opacity: 0.4; }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        /* SECTIONS */
        section { padding: 100px 80px; }
        .section-label { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #f0c419; margin-bottom: 20px; font-weight: 500; }
        .section-title { font-size: clamp(48px, 6vw, 80px); line-height: 0.95; letter-spacing: -0.01em; margin-bottom: 32px; }

        /* OVERVIEW */
        .overview { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
        .overview-text p { font-size: 17px; line-height: 1.8; color: #ccc; margin-bottom: 24px; }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; margin-top: 48px; }
        .stat-box { background: #1a1a1a; padding: 32px 28px; border-top: 2px solid #f0c419; }
        .stat-num { font-size: 52px; color: #f0c419; line-height: 1; margin-bottom: 6px; }
        .stat-desc { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #888; }

        /* DAVID */
        .david-section { background: #1a1a1a; padding: 100px 80px; }
        .david-inner { display: grid; grid-template-columns: 360px 1fr; gap: 80px; align-items: center; max-width: 1100px; margin: 0 auto; }
        .david-photo-wrap { position: relative; }
        .david-photo-wrap::before {
          content: '';
          position: absolute;
          top: 16px; left: 16px; right: -16px; bottom: -16px;
          background: #f0c419;
          z-index: 0;
        }
        .david-photo { position: relative; z-index: 1; width: 100%; aspect-ratio: 4/5; object-fit: cover; object-position: center top; filter: grayscale(15%); display: block; }
        .david-tag {
          position: absolute;
          bottom: 24px; right: -8px;
          background: #0a0a0a;
          color: #f0c419;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 10px 16px;
          z-index: 2;
          font-weight: 700;
        }
        .david-name { font-size: clamp(42px, 5vw, 68px); line-height: 0.95; margin-bottom: 8px; }
        .david-title-line { font-size: 18px; color: #f0c419; margin-bottom: 32px; }
        .david-bio p { font-size: 16px; line-height: 1.85; color: #bbb; margin-bottom: 20px; }
        .collab-line { display: flex; align-items: center; gap: 16px; margin-top: 40px; padding-top: 32px; border-top: 1px solid #2e2e2e; }
        .collab-text { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #888; }
        .collab-names { font-size: 22px; letter-spacing: 0.08em; }
        .collab-names .x { color: #f0c419; margin: 0 8px; }

        /* DISTILLERIES */
        .distillery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 56px; }
        .distillery-card { background: #1a1a1a; padding: 40px 36px; position: relative; overflow: hidden; transition: background 0.3s; }
        .distillery-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #f0c419; transform: scaleX(0); transform-origin: left; transition: transform 0.35s ease; }
        .distillery-card:hover::before { transform: scaleX(1); }
        .distillery-card:hover { background: #252525; }
        .dist-num { font-size: 64px; color: #2e2e2e; line-height: 1; margin-bottom: 20px; }
        .dist-name { font-size: 26px; letter-spacing: 0.03em; margin-bottom: 6px; line-height: 1.1; }
        .dist-location { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #f0c419; margin-bottom: 20px; }
        .dist-desc { font-size: 14px; line-height: 1.75; color: #999; }

        /* BARS */
        .bars-section { background: #1a1a1a; }
        .bars-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; margin-top: 56px; }
        .bar-card { background: #0a0a0a; padding: 40px 36px; display: flex; gap: 24px; transition: background 0.2s; }
        .bar-card:hover { background: #111; }
        .bar-num { font-size: 40px; color: #f0c419; line-height: 1; min-width: 40px; }
        .bar-name { font-size: 22px; letter-spacing: 0.03em; margin-bottom: 8px; }
        .bar-desc { font-size: 14px; line-height: 1.7; color: #999; }

        /* ITINERARY */
        .day-list { margin-top: 56px; }
        .day-row { display: grid; grid-template-columns: 80px 1fr; gap: 32px; padding: 32px 0; border-top: 1px solid #1e1e1e; transition: border-color 0.2s; }
        .day-row:hover { border-color: #f0c419; }
        .day-num { font-size: 48px; color: #2a2a2a; line-height: 1; text-align: right; }
        .day-tag { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #f0c419; margin-bottom: 6px; }
        .day-title { font-size: 28px; letter-spacing: 0.02em; margin-bottom: 10px; }
        .day-desc { font-size: 15px; line-height: 1.75; color: #999; }

        /* INCLUDES */
        .includes-section { background: #1a1a1a; }
        .includes-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 56px; }
        .include-item { background: #0a0a0a; padding: 36px 32px; }
        .include-icon { font-size: 28px; margin-bottom: 16px; }
        .include-title { font-size: 22px; letter-spacing: 0.03em; margin-bottom: 10px; }
        .include-desc { font-size: 13px; line-height: 1.7; color: #888; }

        /* RESERVE */
        .reserve-section { background: #0a0a0a; padding: 100px 80px; }
        .reserve-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; max-width: 1100px; margin: 0 auto; }
        .reserve-info p { font-size: 16px; line-height: 1.8; color: #999; margin-bottom: 20px; }
        .reserve-detail { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 16px; }
        .reserve-detail-icon { color: #f0c419; font-size: 16px; margin-top: 2px; }
        .reserve-detail-text { font-size: 14px; color: #bbb; line-height: 1.5; }
        .reserve-detail-text strong { color: #f5f0e8; display: block; font-weight: 500; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 2px; }
        .form-card { background: #1a1a1a; padding: 48px 40px; }
        .form-title { font-size: 32px; letter-spacing: 0.03em; margin-bottom: 32px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-field { display: flex; flex-direction: column; gap: 8px; }
        .form-field.full { grid-column: 1 / -1; }
        .form-field label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; }
        .form-field input,
        .form-field select,
        .form-field textarea {
          background: #0a0a0a;
          border: 1px solid #2e2e2e;
          color: #f5f0e8;
          font-family: var(--font-dm-sans, 'DM Sans', sans-serif);
          font-size: 14px;
          padding: 14px 16px;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
          appearance: none;
        }
        .form-field input:focus,
        .form-field select:focus,
        .form-field textarea:focus { border-color: #f0c419; }
        .form-field select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 40px;
        }
        .form-field textarea { resize: vertical; min-height: 100px; }
        .form-submit {
          margin-top: 24px;
          width: 100%;
          background: #f0c419;
          color: #0a0a0a;
          font-family: var(--font-dm-sans, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 18px;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .form-submit:hover:not(:disabled) { background: #c9a310; transform: translateY(-2px); }
        .form-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .form-msg-success { margin-top: 16px; padding: 14px 16px; font-size: 13px; letter-spacing: 0.05em; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #6ee7b7; }
        .form-msg-error { margin-top: 16px; padding: 14px 16px; font-size: 13px; letter-spacing: 0.05em; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }
        .form-note { margin-top: 16px; font-size: 11px; color: #555; letter-spacing: 0.05em; text-align: center; }

        /* CTA STRIP */
        .cta-strip { background: #f0c419; color: #0a0a0a; padding: 80px; text-align: center; }
        .cta-strip .section-title { color: #0a0a0a; }
        .cta-strip p { font-size: 16px; max-width: 520px; margin: 0 auto 40px; opacity: 0.75; }
        .btn-dark { background: #0a0a0a; color: #f0c419; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 18px 40px; text-decoration: none; display: inline-block; transition: opacity 0.2s; }
        .btn-dark:hover { opacity: 0.85; }

        /* FOOTER */
        footer { background: #0a0a0a; border-top: 1px solid #1a1a1a; padding: 48px 80px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 24px; }
        .footer-logo { font-size: 26px; letter-spacing: 0.1em; }
        .footer-logo em { color: #f0c419; font-style: normal; }
        .footer-contacts { display: flex; flex-direction: column; gap: 4px; text-align: right; }
        .footer-contacts a { font-size: 13px; color: #888; text-decoration: none; transition: color 0.2s; }
        .footer-contacts a:hover { color: #f0c419; }
        .footer-copy { width: 100%; font-size: 12px; color: #444; text-align: center; padding-top: 24px; border-top: 1px solid #1a1a1a; margin-top: 8px; }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; min-height: auto; }
          .hero-right { height: 55vw; min-height: 300px; }
          .hero-left { padding: 60px 24px 60px 24px; }
          .hero-right::after { background: linear-gradient(to top, #0a0a0a 0%, transparent 40%); }
          section { padding: 60px 24px; }
          .overview { grid-template-columns: 1fr; gap: 48px; }
          .david-inner { grid-template-columns: 1fr; }
          .david-photo-wrap { max-width: 300px; }
          .distillery-grid { grid-template-columns: 1fr; }
          .bars-grid { grid-template-columns: 1fr; }
          .includes-grid { grid-template-columns: 1fr 1fr; }
          .reserve-inner { grid-template-columns: 1fr; }
          .form-grid { grid-template-columns: 1fr; }
          .cta-strip { padding: 60px 24px; }
          footer { padding: 40px 24px; }
          .david-section { padding: 60px 24px; }
          .reserve-section { padding: 60px 24px; }
        }
        @media (max-width: 540px) {
          .includes-grid { grid-template-columns: 1fr; }
          .stat-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {/* NAV */}
      <nav className="wt-nav">
        <span className="bebas" style={{ fontSize: 22, letterSpacing: '0.1em', color: '#f5f0e8' }}>
          WHY<em style={{ color: '#f0c419', fontStyle: 'normal' }}>GO</em>
        </span>
        <button className="btn-primary" onClick={scrollToReserve}>
          Book Now
        </button>
      </nav>

      {/* HERO */}
      <section className="hero" style={{ padding: 0 }}>
        <div className="hero-left">
          <div className="collab-badge bebas" style={{ letterSpacing: '0.15em' }}>
            WHYGO × DAVID VELIJANASHVILI
          </div>
          <p className="hero-eyebrow">Scotland · September / October</p>
          <h1 className="hero-title bebas">
            EDINBURGH<br />
            <span className="accent">WHISKY</span><br />
            TOUR
          </h1>
          <p className="hero-subtitle playfair">A curated journey through Scotland's finest drams</p>
          <div className="hero-meta">
            <div className="meta-item">
              <span className="meta-label">Duration</span>
              <span className="meta-value">5–6 Days</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Group Size</span>
              <span className="meta-value">8–12 People</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Cities</span>
              <span className="meta-value">Edinburgh + Glasgow</span>
            </div>
          </div>
          <div className="cta-group">
            <button className="btn-primary" onClick={scrollToReserve}>
              Reserve Your Spot →
            </button>
            <a className="btn-secondary" href="tel:+995598988711">+995 598 988 711</a>
          </div>
        </div>
        <div className="hero-right">
          <Image
            src="/hero-edinburgh.jpg"
            alt="Royal Mile Whiskies, Edinburgh"
            fill
            priority
            className="hero-img"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            sizes="50vw"
          />
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker">
        <div className="ticker-inner">
          {TICKER_ITEMS.map((item, i) => (
            <span
              key={i}
              className={`ticker-item bebas${item === '·' ? ' ticker-dot' : ''}`}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* DAVID */}
      <section className="david-section">
        <div className="david-inner">
          <div className="david-photo-wrap">
            <Image
              src="/david-velijanashvili.png"
              alt="David Velijanashvili"
              width={360}
              height={450}
              className="david-photo"
              style={{ filter: 'grayscale(15%)' }}
            />
            <div className="david-tag">Tour Host</div>
          </div>
          <div>
            <p className="section-label">Your Host</p>
            <h2 className="david-name bebas">DAVID<br />VELIJANASHVILI</h2>
            <p className="david-title-line playfair">Whisky Enthusiast & Tour Guide</p>
            <div className="david-bio">
              <p>David brings a rare combination of genuine passion for Scotch whisky and the warmth of Georgian hospitality. Having explored Scotland's whisky regions extensively, he curates experiences that go far beyond the standard distillery tour.</p>
              <p>His approach is personal, knowledgeable, and deeply authentic — he knows the stories behind the barrels, the people who make the whisky, and the hidden bars where locals actually drink. Travelling with David means gaining access to a Scotland that most visitors never see.</p>
            </div>
            <div className="collab-line">
              <span className="collab-text">A collaboration by</span>
              <span className="collab-names bebas">WHYGO<span className="x">×</span>DAVID VELIJANASHVILI</span>
            </div>
          </div>
        </div>
      </section>

      {/* OVERVIEW */}
      <section>
        <div className="overview" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="overview-text">
            <p className="section-label">The Experience</p>
            <h2 className="section-title bebas">SCOTLAND<br />IN A GLASS</h2>
            <p>This is not a sightseeing trip. It's a full immersion into Scotland's most storied craft — from the earthy peat of the Highlands to the refined lowland spirits of Edinburgh's own distilleries.</p>
            <p>WHYGO and David Velijanashvili have crafted a 5–6 day journey that takes 8–12 travellers from Tbilisi to the heart of Scotland's whisky culture — private distillery visits, rare tastings, authentic pubs, and a private dinner that brings it all together.</p>
          </div>
          <div>
            <div className="stat-grid">
              <div className="stat-box"><div className="stat-num bebas">3</div><div className="stat-desc">Distillery Visits</div></div>
              <div className="stat-box"><div className="stat-num bebas">4</div><div className="stat-desc">Iconic Whisky Bars</div></div>
              <div className="stat-box"><div className="stat-num bebas">1</div><div className="stat-desc">Private Dinner</div></div>
              <div className="stat-box"><div className="stat-num bebas">2</div><div className="stat-desc">Scottish Cities</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* DISTILLERIES */}
      <section style={{ background: '#0a0a0a' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p className="section-label">Distillery Programme</p>
          <h2 className="section-title bebas">WHERE THE<br />WHISKY LIVES</h2>
          <div className="distillery-grid">
            {[
              { num: '01', location: 'Edinburgh, City Centre', name: 'HOLYROOD DISTILLERY', desc: "Edinburgh's city distillery, focused on experimental and innovative techniques. The home of the new wave of Scottish urban whisky-making." },
              { num: '02', location: 'East Lothian, near Edinburgh', name: 'GLENKINCHIE DISTILLERY', desc: 'The "Lowland Home of Johnnie Walker." A stunning Victorian-era garden distillery — classical method, classical beauty.' },
              { num: '03', location: 'Glasgow, Clydeside', name: 'CLYDESIDE or AUCHENTOSHAN', desc: 'On Glasgow day: The Clydeside Distillery on the River Clyde, or Auchentoshan — celebrated for its rare triple-distillation process.' },
            ].map((d) => (
              <div key={d.num} className="distillery-card">
                <div className="dist-num bebas">{d.num}</div>
                <div className="dist-location">{d.location}</div>
                <div className="dist-name bebas">{d.name}</div>
                <div className="dist-desc">{d.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BARS */}
      <section className="bars-section">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p className="section-label">Top 4 Authentic Bars</p>
          <h2 className="section-title bebas">THE SPIRIT<br />OF EDINBURGH</h2>
          <div className="bars-grid">
            {[
              { num: '01', name: 'SHEEP HEID INN', desc: "Scotland's oldest pub, est. 1360. History soaked into every stone — a mandatory pilgrimage for any whisky traveller." },
              { num: '02', name: 'THE BLACK CAT', desc: "One of Rose Street's most beloved bars — exceptional whisky selection paired with live folk music." },
              { num: '03', name: "SANDY BELL'S", desc: 'A legendary haunt for traditional Scottish folk music and an outstanding range of drams. Unpretentious and utterly authentic.' },
              { num: '04', name: 'THE BOW BAR', desc: "Over 300 whiskies. Classic Edinburgh atmosphere. The connoisseur's favourite on Victoria Street." },
            ].map((b) => (
              <div key={b.num} className="bar-card">
                <div className="bar-num bebas">{b.num}</div>
                <div>
                  <div className="bar-name bebas">{b.name}</div>
                  <div className="bar-desc">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ITINERARY */}
      <section style={{ background: '#0a0a0a' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p className="section-label">Sample Itinerary</p>
          <h2 className="section-title bebas">DAY BY<br />DAY</h2>
          <div className="day-list">
            {[
              { num: '01', tag: 'Arrival Day', title: 'TBILISI → EDINBURGH', desc: 'International flight from Tbilisi. Airport transfer, hotel check-in, and a first evening walk along the Royal Mile. Welcome dram at the hotel.' },
              { num: '02', tag: 'Distillery Day', title: 'HOLYROOD & OLD TOWN', desc: "Morning visit to Holyrood Distillery with private group tasting. Afternoon: Edinburgh's Old Town — hidden closes, Royal Mile Whiskies, and Cadenhead's." },
              { num: '03', tag: 'Garden Distillery + Evening', title: 'GLENKINCHIE & WHISKY BARS', desc: "Morning at Glenkinchie — the Victorian Garden Distillery. Evening bar crawl: Sandy Bell's and The Bow Bar, with David guiding the whisky selection." },
              { num: '04', tag: 'Premium Evening', title: 'SCOTCH MALT WHISKY SOCIETY + PRIVATE DINNER', desc: 'Exclusive tasting at The Scotch Malt Whisky Society. Private dinner at Whisky Collection: a curated menu, rare pours, and the best conversation of the trip.' },
              { num: '05', tag: 'Day Trip', title: 'GLASGOW', desc: "Coach to Glasgow. Distillery visit, architectural contrasts, the Kelvingrove area, and Glasgow's whisky trail. Return to Edinburgh by evening." },
              { num: '06', tag: 'Departure', title: 'EDINBURGH → TBILISI', desc: 'Morning at leisure for last-minute shopping at Royal Mile Whiskies. Airport transfer and flight home — with a bag full of bottles and a head full of memories.' },
            ].map((d) => (
              <div key={d.num} className="day-row">
                <div className="day-num bebas">{d.num}</div>
                <div>
                  <div className="day-tag">{d.tag}</div>
                  <div className="day-title bebas">{d.title}</div>
                  <div className="day-desc">{d.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INCLUDES */}
      <section className="includes-section">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p className="section-label">What&apos;s Included</p>
          <h2 className="section-title bebas">THE FULL<br />PACKAGE</h2>
          <div className="includes-grid">
            {[
              { icon: '✈️', title: 'FLIGHTS', desc: 'Return flights Tbilisi – Edinburgh – Tbilisi. All airport transfers on arrival and departure.' },
              { icon: '🏨', title: 'ACCOMMODATION', desc: 'Hotel in Edinburgh for the full duration, including breakfast each morning. Centrally located in the Old Town.' },
              { icon: '🚌', title: 'TRANSFERS', desc: 'All ground transport within Scotland: coach Edinburgh → Glasgow → Edinburgh and local transfers to distilleries.' },
              { icon: '🥃', title: 'DISTILLERY VISITS', desc: 'Pre-booked group tours and private tastings at all three distilleries, with priority September reservations.' },
              { icon: '🍽️', title: 'PRIVATE DINING', desc: 'An exclusive private dinner at Whisky Collection — a curated food and whisky pairing in an intimate setting.' },
              { icon: '👤', title: 'DAVID AS YOUR HOST', desc: "David accompanies the group throughout — guiding tastings, sharing stories, and opening doors standard tours don't." },
            ].map((item) => (
              <div key={item.title} className="include-item">
                <div className="include-icon">{item.icon}</div>
                <div className="include-title bebas">{item.title}</div>
                <div className="include-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESERVATION FORM */}
      <section className="reserve-section" id="reserve" ref={reserveRef}>
        <div className="reserve-inner">
          <div className="reserve-info">
            <p className="section-label">Reserve Your Spot</p>
            <h2 className="section-title bebas">JOIN THE<br />TOUR</h2>
            <p>Places are limited to 8–12 people to ensure an intimate, personal experience. Fill in the form and we&apos;ll be in touch within 24 hours to confirm availability and next steps.</p>
            {[
              { icon: '📅', label: 'When', value: 'September / October 2025' },
              { icon: '👥', label: 'Group Size', value: '8–12 participants maximum' },
              { icon: '✉️', label: 'Contact', value: 'info@whygo.ge' },
              { icon: '📞', label: 'Phone / WhatsApp', value: '+995 598 988 711' },
            ].map((d) => (
              <div key={d.label} className="reserve-detail">
                <span className="reserve-detail-icon">{d.icon}</span>
                <div className="reserve-detail-text">
                  <strong>{d.label}</strong>
                  {d.value}
                </div>
              </div>
            ))}
          </div>

          <div className="form-card">
            <div className="form-title bebas">RESERVE MY SPOT</div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="firstName">First Name *</label>
                  <input id="firstName" type="text" value={form.first_name} onChange={field('first_name')} placeholder="Giorgi" required />
                </div>
                <div className="form-field">
                  <label htmlFor="lastName">Last Name *</label>
                  <input id="lastName" type="text" value={form.last_name} onChange={field('last_name')} placeholder="Beridze" required />
                </div>
                <div className="form-field">
                  <label htmlFor="email">Email *</label>
                  <input id="email" type="email" value={form.email} onChange={field('email')} placeholder="you@example.com" required />
                </div>
                <div className="form-field">
                  <label htmlFor="phone">Phone / WhatsApp *</label>
                  <input id="phone" type="tel" value={form.phone} onChange={field('phone')} placeholder="+995 5XX XXX XXX" required />
                </div>
                <div className="form-field">
                  <label htmlFor="travelers">Number of Travellers</label>
                  <select id="travelers" value={form.travelers} onChange={field('travelers')}>
                    <option value="1">1 person</option>
                    <option value="2">2 people</option>
                    <option value="3">3 people</option>
                    <option value="4">4 people</option>
                    <option value="5+">5+ people</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="period">Preferred Period</label>
                  <select id="period" value={form.period} onChange={field('period')}>
                    <option value="September 2025">September 2025</option>
                    <option value="October 2025">October 2025</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
                <div className="form-field full">
                  <label htmlFor="message">Message (optional)</label>
                  <textarea id="message" value={form.message} onChange={field('message')} placeholder="Any questions or special requests..." />
                </div>
              </div>

              <button
                type="submit"
                className="form-submit"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Sending...' : 'Send My Reservation →'}
              </button>

              {status === 'success' && (
                <div className="form-msg-success">
                  ✓ Thank you! We&apos;ll be in touch within 24 hours.
                </div>
              )}
              {status === 'error' && (
                <div className="form-msg-error">{errorMsg}</div>
              )}

              <p className="form-note">We reply within 24 hours · No payment required to reserve</p>
            </form>
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <div className="cta-strip">
        <p className="section-label" style={{ color: 'rgba(0,0,0,0.5)' }}>Limited to 8–12 People</p>
        <h2 className="section-title bebas">READY TO<br />GO?</h2>
        <p>This tour runs in September and October. Places are strictly limited — early enquiry is strongly recommended.</p>
        <button className="btn-dark" onClick={scrollToReserve}>Reserve Now →</button>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo bebas">WHY<em>GO</em></div>
        <div style={{ fontSize: 13, color: '#555', letterSpacing: '0.05em' }}>A collaboration with David Velijanashvili</div>
        <div className="footer-contacts">
          <a href="mailto:info@whygo.ge">info@whygo.ge</a>
          <a href="tel:+995598988711">+995 598 988 711</a>
          <a href="https://whygo.ge">whygo.ge</a>
        </div>
        <div className="footer-copy">© {new Date().getFullYear()} WHYGO · Edinburgh Whisky Tour · All rights reserved</div>
      </footer>
    </>
  )
}
