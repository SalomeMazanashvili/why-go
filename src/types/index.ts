export type Locale = 'en' | 'ka'

export interface Tour {
  id: string
  slug: string
  title_en: string
  subtitle_en: string
  description_en: string
  tag_en: string
  title_ka: string
  subtitle_ka: string
  description_ka: string
  tag_ka: string
  destination: string
  price_from: number | null
  currency: string
  duration_days: number | null
  cover_image: string | null
  is_featured: boolean
  sort_order: number
}

export interface News {
  id: string
  slug: string
  title_en: string
  excerpt_en: string
  tag_en: string
  title_ka: string
  excerpt_ka: string
  tag_ka: string
  cover_image: string | null
  author: string
  reading_time_min: number
  is_featured: boolean
  published_at: string
}

// Static fallback data — used when Supabase is not yet connected
export const STATIC_TOURS: Tour[] = [
  {
    id: '1', slug: 'madrid-spanish',
    title_en: 'Madrid', subtitle_en: 'Spanish Immersion with Expanish',
    description_en: 'Spend two weeks in the heart of Spain combining daily language classes at the renowned Expanish school with guided cultural experiences — flamenco evenings, tapas trails, and weekend trips to Toledo.',
    tag_en: 'Language',
    title_ka: 'მადრიდი', subtitle_ka: 'ესპანური Expanish-თან',
    description_ka: 'ორი კვირა ესპანეთის გულში: ყოველდღიური ენის გაკვეთილები Expanish-ში, ფლამენკოს საღამოები, ტაპასის მარშრუტები.',
    tag_ka: 'ენა',
    destination: 'Madrid, Spain', price_from: 1890, currency: 'EUR', duration_days: 14,
    cover_image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    is_featured: true, sort_order: 1,
  },
  {
    id: '2', slug: 'tokyo-japanese',
    title_en: 'Tokyo', subtitle_en: 'Georgian-Guided Japanese Culture',
    description_en: 'Experience Tokyo through the eyes of a Georgian guide who calls Japan home. From Shinjuku to Yanaka, discover hidden izakayas, tea ceremonies, and calligraphy workshops — all narrated in Georgian.',
    tag_en: 'Language',
    title_ka: 'ტოკიო', subtitle_ka: 'ქართულენოვანი გზამკვლევით',
    description_ka: 'ტოკიო ქართველი გზამკვლევის თვალებით. ჩაის ცერემონია, კალიგრაფია და ფარული იზაკაიები ქართულ ენაზე.',
    tag_ka: 'ენა',
    destination: 'Tokyo, Japan', price_from: 380000, currency: 'JPY', duration_days: 10,
    cover_image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
    is_featured: true, sort_order: 2,
  },
  {
    id: '3', slug: 'peru-adventure',
    title_en: 'Peru', subtitle_en: 'Inca Trail & Cusco Culture',
    description_en: 'Trek the legendary Inca Trail to Machu Picchu, explore the Sacred Valley, and taste Peru\'s world-class cuisine. Our small-group format (max 8) ensures a deeply personal adventure.',
    tag_en: 'Adventure',
    title_ka: 'პერუ', subtitle_ka: 'ინკა ბილიკი და კუსკო',
    description_ka: 'ლეგენდარული ინკა ბილიკი მაჩუ-პიჩუმდე, წმინდა ველი და პერუს მსოფლიო სამზარეულო.',
    tag_ka: 'სათავგადასავლო',
    destination: 'Cusco, Peru', price_from: 2200, currency: 'USD', duration_days: 10,
    cover_image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80',
    is_featured: false, sort_order: 3,
  },
  {
    id: '4', slug: 'tuscany-culinary',
    title_en: 'Tuscany', subtitle_en: 'Italian Cooking & Food Artistry',
    description_en: 'Learn to make fresh pasta, artisan cheeses, and Florentine bistecca from Michelin-trained chefs at a 16th-century Chianti farmhouse. Wine pairing sessions included.',
    tag_en: 'Culinary',
    title_ka: 'ტოსკანა', subtitle_ka: 'იტალიური კულინარიის ხელოვნება',
    description_ka: 'ახალი პასტა, ხელნაკეთი ყველი და ფლორენციული ბისტეკა — მიშელინ-გაწვრთნილი შეფები XVI საუკუნის ფერმაში.',
    tag_ka: 'კულინარია',
    destination: 'Chianti, Tuscany', price_from: 2100, currency: 'EUR', duration_days: 7,
    cover_image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80',
    is_featured: true, sort_order: 4,
  },
  {
    id: '5', slug: 'england-whisky',
    title_en: 'England', subtitle_en: 'Whisky Heritage & Distilleries',
    description_en: 'Journey through the birthplace of Scotch and English whisky — from Yorkshire\'s Harrogate distillery to London\'s craft bars. Includes tastings, masterclasses, and a distillery-stay night.',
    tag_en: 'Heritage',
    title_ka: 'ინგლისი', subtitle_ka: 'ვისკის მემკვიდრეობა',
    description_ka: 'სკოტური და ინგლისური ვისკის სამშობლოში — იორქშირიდან ლონდონის ბარებამდე.',
    tag_ka: 'მემკვიდრეობა',
    destination: 'Yorkshire & London', price_from: 1650, currency: 'GBP', duration_days: 6,
    cover_image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
    is_featured: false, sort_order: 5,
  },
  {
    id: '6', slug: 'six-nations-rugby',
    title_en: '6 Nations', subtitle_en: 'Big Six Nations Rugby Experience',
    description_en: 'Join us for the pinnacle of European rugby — live match tickets, access to team fan zones, iconic stadiums like Twickenham and Principality Stadium, plus rugby skills workshops.',
    tag_en: 'Sport',
    title_ka: '6 ერი', subtitle_ka: 'რაგბის 6 ერი',
    description_ka: '6 ერის ევროპული რაგბის პიკი — ცოცხალი მატჩები, Twickenham-ი და სპორტული ვორქშოფები.',
    tag_ka: 'სპორტი',
    destination: 'London & Cardiff, UK', price_from: 2450, currency: 'GBP', duration_days: 8,
    cover_image: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=800&q=80',
    is_featured: true, sort_order: 6,
  },
]

export const STATIC_NEWS: News[] = [
  {
    id: '1', slug: 'tokyo-japanese-changes-everything',
    title_en: 'Why Learning Japanese in Tokyo Changes Everything',
    excerpt_en: 'There is a moment — usually around day four — when the city stops being noise and starts being language.',
    tag_en: 'Language Travel',
    title_ka: 'რატომ ცვლის ყველაფერს ტოკიოში იაპონური ენის სწავლა',
    excerpt_ka: 'ოთხი დღის შემდეგ ქალაქი შეწყვეტს ყოფნას ხმაურად და იქცევა ენად.',
    tag_ka: 'ენობრივი მოგზაურობა',
    cover_image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=900&q=80',
    author: 'Whygo Team', reading_time_min: 7, is_featured: true,
    published_at: '2025-04-01T00:00:00Z',
  },
  {
    id: '2', slug: 'tuscany-pasta-wine',
    title_en: 'Pasta, Wine & Perspective: A Week in Tuscany',
    excerpt_en: 'What happens when you slow down in one of the world\'s most beautiful landscapes.',
    tag_en: 'Culinary',
    title_ka: 'მაკარონი, ღვინო და პერსპექტივა: კვირა ტოსკანაში',
    excerpt_ka: 'რა ხდება, როდესაც შეანელებ ტემპს ერთ-ერთ ყველაზე ლამაზ ლანდშაფტში.',
    tag_ka: 'კულინარია',
    cover_image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=900&q=80',
    author: 'Whygo Team', reading_time_min: 6, is_featured: false,
    published_at: '2025-03-15T00:00:00Z',
  },
  {
    id: '3', slug: 'six-nations-guide',
    title_en: 'The Complete Guide to the Six Nations Experience',
    excerpt_en: 'From ticket strategy to pub etiquette — everything a first-time visitor needs to know.',
    tag_en: 'Sport',
    title_ka: 'სრული გზამკვლევი: 6 ერის გამოცდილება',
    excerpt_ka: 'ბილეთის სტრატეგიიდან ბარის ეტიკეტამდე.',
    tag_ka: 'სპორტი',
    cover_image: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=900&q=80',
    author: 'Whygo Team', reading_time_min: 5, is_featured: false,
    published_at: '2025-02-20T00:00:00Z',
  },
]

// Helpers
export function getTourTitle(t: Tour, l: Locale) { return l === 'ka' && t.title_ka ? t.title_ka : t.title_en }
export function getTourSubtitle(t: Tour, l: Locale) { return l === 'ka' && t.subtitle_ka ? t.subtitle_ka : t.subtitle_en }
export function getTourDescription(t: Tour, l: Locale) { return l === 'ka' && t.description_ka ? t.description_ka : t.description_en }
export function getTourTag(t: Tour, l: Locale) { return l === 'ka' && t.tag_ka ? t.tag_ka : t.tag_en }
export function getNewsTitle(n: News, l: Locale) { return l === 'ka' && n.title_ka ? n.title_ka : n.title_en }
export function getNewsExcerpt(n: News, l: Locale) { return l === 'ka' && n.excerpt_ka ? n.excerpt_ka : n.excerpt_en }

export function formatPrice(amount: number | null, currency: string): string {
  if (!amount) return 'POA'
  const s: Record<string, string> = { EUR: '€', GBP: '£', USD: '$', JPY: '¥', GEL: '₾' }
  const sym = s[currency] ?? currency
  return currency === 'JPY'
    ? `From ${sym}${Math.round(amount).toLocaleString()}`
    : `From ${sym}${amount.toLocaleString()}`
}
