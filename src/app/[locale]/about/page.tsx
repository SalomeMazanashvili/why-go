export default function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <section className="pt-36 pb-20 px-6 md:px-10 bg-black min-h-screen">
      <p className="text-[10px] font-bold tracking-widest uppercase text-yellow-400 mb-4">Our Philosophy</p>
      <h1 className="font-black uppercase text-white leading-none tracking-tight"
        style={{ fontSize: 'clamp(48px,8vw,96px)', letterSpacing: '-0.04em', lineHeight: 0.88 }}>
        EXPERIENCE<br />+ DEVELOP<br /><span className="text-yellow-400">MENT</span>
      </h1>
      <div className="mt-16 max-w-2xl">
        <p className="text-base leading-relaxed text-white/70 mb-6">
          Whygo was born in Tbilisi with a simple belief: travel should change you. Not just your photo album — but your skills, your language, your perspective on what you're capable of.
        </p>
        <p className="text-base leading-relaxed text-white/70 mb-6">
          Every tour we design pairs an unforgettable destination with a real skill — a language to learn, a dish to master, a sport to play. We call it Experience + Development.
        </p>
        <p className="text-base leading-relaxed text-white/70">
          We're a boutique Georgian agency. We keep groups small, guides personal, and itineraries honest. No tourist traps, no filler days. Just the places and skills that matter.
        </p>
      </div>
    </section>
  )
}
