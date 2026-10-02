import { Link } from '@/i18n/navigation'

// WHY-67: shared frame for the homepage card sections — heading, an optional
// "view all" link, then the cards. Callers return null before rendering this
// when their data is empty, so an empty section never reaches the page.
export default function HomeSection({
  id,
  title,
  viewAll,
  children,
}: {
  id: string
  title: string
  viewAll?: { href: string; label: string }
  children: React.ReactNode
}) {
  const headingId = `${id}-heading`
  return (
    <section aria-labelledby={headingId} className="px-6 md:px-10 py-16 md:py-20 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-8 md:mb-10">
          <h2
            id={headingId}
            className="font-black tracking-tight leading-none text-3xl md:text-5xl"
          >
            {title}
          </h2>
          {viewAll && (
            <Link
              href={viewAll.href}
              aria-describedby={headingId}
              className="inline-flex items-center min-h-[44px] text-[11px] font-bold tracking-widest uppercase text-white border-b-2 border-yellow-400 hover:text-yellow-400 transition-colors"
            >
              {viewAll.label}
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  )
}

// Column count follows the number of cards so 1–3 items don't sit in a grid
// sized for four (brief: "must look right at 1, 2 or 3"). A single card
// spans the row in its wide, image-beside-text layout.
export function gridColsFor(count: number): string {
  if (count <= 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2'
  if (count === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
}
