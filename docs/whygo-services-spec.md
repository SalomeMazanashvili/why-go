# Why Go — Services Layer: Product & UX Spec

Companion to `docs/whygo-strategy-brief.md`. Defines the four services, their user flows, page architecture, and accessibility requirements.

**Status:** draft for review. Open questions at the end must be answered before WHY-65/66 are built.

---

## 1. The four services

| # | Service | Input type | Fulfilment |
|---|---|---|---|
| 1 | **Airport transfers** | Structured, deterministic | Contracted driver, by city |
| 2 | **Day trips / excursions** | Semi-structured | Driver, fixed routes |
| 3 | **Guides** — private, group, walking | Consultative | Contracted guide, by city |
| 4 | **Experiences** — classes, wine & market tours, paddleboard, surfing, museums, architecture | Mixed | Varies by partner |

### The distinction that drives everything

**Transfers and day trips are transactional.** The customer knows what they want. Every input is a fact: from, to, date, time, passengers, luggage. There is one correct answer and a price. The job of the interface is to collect facts with the least friction possible.

**Guides and experiences are consultative.** The customer half-knows what they want. "A day in Barcelona, we like food, we're four people, one has a bad knee." There is no single correct answer. The job of the interface is to build confidence in a *person*, then start a conversation.

**Do not build one generic inquiry form for both.** A consultative form asked for luggage count would be absurd; a transfer form asking about interests would be friction. Two flows.

---

## 2. Page architecture

```
/                          Home
/[destination]             Destination hub — ties everything together for one city

/transfers                 Transfer product page + quote form
/transfers/[route]         Programmatic route pages (barcelona-airport-centre)

/day-trips                 Day trip index
/day-trips/[slug]          barcelona-costa-brava, barcelona-montserrat

/guides                    Guide directory, filterable by city
/guides/[slug]             Guide profile — the ToursByLocals model

/experiences               Experience index, by category
/experiences/[slug]        Individual experience

/tours                     Signature expert-led tours (existing)
/tips                      Blog (existing)
```

The **destination hub** (`/barcelona`) is the SEO anchor: it links to every transfer route, day trip, guide and experience in that city, plus the blog posts about it. Every child page links back.

---

## 3. Flow 1 — Transfers (transactional)

Reference model: `transfers.aegeanair.com`. Note what it does: quote widget immediately visible, then a timeline answering "what happens after I book?", then FAQ. No hero paragraph before the form.

### The form

| Field | Type | Notes |
|---|---|---|
| From | **Dropdown** | Only cities with contracted drivers. Never free text. |
| To | Dropdown or text | Hotel/address — free text acceptable here |
| Date | Native date input | See accessibility note below |
| Time | Native time input | |
| Passengers | Stepper | Default 2 |
| Luggage pieces | Stepper | Affects vehicle choice |
| Payment | Radio | **Cash on arrival** (MVP). Card marked "coming soon" or omitted. |
| Name | Text | |
| Phone | Tel | Required — this is how you actually confirm |
| Email | Email | |
| Notes | Textarea, optional | Flight number, child seat, etc. |

**The dropdown constraint is the most important design decision here.** Restricting origin to cities where you have contracted drivers means you never receive an inquiry you can't fulfil. Apply the same rule to guides and experiences.

Add a line under the dropdown: *"ვერ ხედავ შენს ქალაქს? მოგვწერე"* (don't see your city? message us) — captures demand for cities you haven't covered yet, without promising service.

### After submit — the section most sites forget

Copy Aegean's structure. Immediately on success, and again in the confirmation email:

1. **We've received your request** — reference number
2. **We confirm with the driver** — within [X hours, see open questions]
3. **You get driver details** — name, photo, phone, vehicle, meeting point
4. **On the day** — where to find them, what the sign says

This section is not decoration. With request-to-book, the customer's only real anxiety is *did that work, and when will I hear back*. Answer it before they ask.

---

## 4. Flow 2 — Guides (consultative)

Reference model: ToursByLocals guide profile. Look at what it leads with: face, name, languages spoken, tours delivered, average response time, and a **Message** button rather than a Book button.

### Guide profile page — required elements

- **Photo.** A real one. This is the whole product.
- **Name and city**
- **Languages** — with Georgian shown prominently. This is your entire differentiation; do not bury it.
- **Bio in Georgian**, first person
- **What they specialise in** — food, history, architecture, family-friendly
- **Their tours/programmes**, each with duration and starting price
- **Response time**, once you have real data. Don't invent it.

### The inquiry form

| Field | Type |
|---|---|
| City | Dropdown (cities with guides) |
| Dates | Date range, flexible allowed |
| Number of travellers | Stepper |
| Interests | Multi-select chips — food, history, architecture, family, nightlife, shopping |
| Anything we should know | Textarea |
| Name, phone, email | |

Interests are optional and should be visibly optional. They improve the match; requiring them adds friction to a form that already asks a lot.

### Experiences

Same consultative shape, simpler: experience, date, number of people, contact. Some (museum tickets) are closer to transactional — treat those like transfers.

---

## 5. Day trips — the hybrid

Fixed routes (Barcelona → Costa Brava), so the destination is known, but it's a full day and people have questions.

Page: photos, route, duration, what's included, what to bring, price from, meeting point, then a short form — date, passengers, contact, notes.

**These pages are also your best blog content.** "6 things worth doing in Costa Brava in one day" *is* the day trip page. Editorial and sales are the same page — that's the core insight from the content strategy, and this is where it applies most directly.

---

## 6. Operations — what happens on your side

You described: web → email → WhatsApp → driver, routed by destination.

### Build this now

1. Form submits → row in Supabase `inquiries`
2. Email notification to you, immediately, with all fields
3. Admin inquiry list — new / contacted / confirmed / declined status
4. **Each inquiry shows a pre-formatted "copy for WhatsApp" block**, already containing the right driver for that city, and a WhatsApp link
5. You paste it. Driver confirms. You reply to the customer.

### Do NOT build yet

**Automated WhatsApp sending.** The WhatsApp Business API requires approval and a provider; the alternative is a paid intermediary. Both are real cost and setup for a step that takes you fifteen seconds manually.

More importantly: you don't yet know what the message to a driver should say. Do it by hand for a month, notice what you always add, then automate the version you actually use.

**The routing logic is worth building now** — city → driver mapping in the admin, so the right contact appears automatically. That's the part that stops working when you have twelve cities.

---

## 7. Accessibility

WHY-70 exists but hasn't been run. Forms are where accessibility matters most for you, because forms are the entire conversion path.

### Non-negotiable

- **Visible labels on every field.** Not placeholder-only — placeholders vanish on focus and are invisible to screen readers.
- **Errors announced.** `aria-live="polite"` region, error text linked to the input via `aria-describedby`. "This field is required" must be *heard*, not only seen.
- **Full keyboard operability.** Every form completable with Tab and Enter, no mouse. Visible focus ring — do not remove outlines.
- **Touch targets ≥ 44×44px.** Steppers and radio buttons especially. Most of your traffic is phone.
- **Contrast ≥ 4.5:1.** Yellow on black passes. **Yellow on white does not** — check every button.
- **Never colour alone** to signal an error. Colour + icon + text.

### Use native date and time inputs

`<input type="date">` and `<input type="time">`. Custom date pickers are the single most common accessibility failure on booking sites, and native inputs are better on mobile anyway. Only build custom if a real requirement forces it.

### Georgian screen reader support is genuinely limited

NVDA and VoiceOver handle Georgian unevenly. This means semantic HTML matters more, not less — correct heading order, real `<label>`, real `<button>`, proper landmarks. Don't rely on ARIA to patch bad markup.

Target: **WCAG 2.1 AA.**

---

## 8. Deliberately not in MVP

- Card payment — cash on arrival for transfers, invoice for the rest
- Instant booking or live availability — request-to-book throughout
- Reviews and ratings — no fake ones, and you have no real ones yet
- Guide-side login or dashboard — you are the interface between customer and guide
- Multi-city itinerary building
- Automated WhatsApp dispatch

---

## 9. Cross-selling between services

Someone viewing a Barcelona guide is a strong candidate for a Barcelona transfer. Same trip, same city, adjacent need.

### The rule: data-driven, never hardcoded

Show *other published services that exist in this destination*. Never "guide pages always show a transfer."

```
Given: current page's destination_id + current service type
Show:  other published services in that destination,
       excluding the current service type
       ordered by: transfers → day trips → guides → experiences
       max 3
```

**Why this matters — coverage is uneven:**

| City | Drivers | Guides |
|---|---|---|
| Barcelona | ✅ | ✅ |
| Paris | ✅ | ✅ |
| Venice | ✅ | ❌ |
| Rome | ✅ | ❌ |
| Madrid | ❌ | ✅ |

Hardcode "guide page → show transfer" and every Madrid guide page advertises a transfer that doesn't exist. That's the fake-tours failure in a new form. The query must return only what's real and published.

### Placement

- **Below the inquiry form**, not above it. Never distract from the primary conversion.
- Heading in the voice of the trip, not the catalogue: *"ბარსელონაში ასევე შეგვიძლია"* — in Barcelona we can also.
- Maximum three. This is a helpful reminder, not a marketplace grid.
- If nothing else exists in that destination, render nothing. No empty state, no placeholder.

### Also on the destination hub

`/barcelona` naturally cross-sells by listing everything. That's the strongest version of this and needs no special logic.

---

## 10. The gap worth closing — business, not code

Four of ten possible city/service combinations are empty:

- **Madrid needs a driver** — you have guides there, and their customers fly in
- **Venice and Rome need guides** — you have drivers there already

Each gap is revenue you currently have to decline. Recruiting one driver and two guides closes all four, and costs nothing in engineering.

---

## 11. Answered — 18 Aug

| Question | Answer |
|---|---|
| Cities with drivers | **Barcelona, Venice, Rome, Paris** |
| Cities with guides | **Barcelona, Madrid, Paris** |
| Response time | **Next morning at the latest** — state this on the form and in the confirmation email |
| Payment | **Cash on arrival** + **bank transfer by IBAN**. No card in MVP. |
| Who answers inquiries | **Both founders** — admin needs two accounts, no assignment logic needed yet |
| Guide pricing | **Guides set prices, Why Go uploads them.** Prices live on the service record, not the guide record. Guide-managed profiles are post-MVP. |

### Consequences

**"Next morning" is a promise, so put it in writing.** On the form: *"პასუხს მოგცემთ მაქსიმუმ მეორე დილით."* In the confirmation email too. A promise kept builds more trust than a faster promise broken.

**IBAN adds a step the flow must handle.** Bank details have to reach the customer, and someone has to confirm the payment arrived. The admin needs a payment status field — awaiting / received / cash on arrival — or you will lose track of who has paid.

**Two admin accounts, both full access.** No roles or permissions needed at two people.

---

## 12. Still open

1. **Yoga instructor / development coach** — this is expert-led programmes with fixed dates, not an on-demand service. Structurally it matches signature tours, not the services layer. It also fills the `განვითარება` (development) strand already in the homepage positioning. Decide where it lives before building.
2. **Cash and IBAN no-shows** — the driver commits time either way. Deposit, or accept the loss?
3. **Do the yoga and coaching experts consent to being named and photographed?** Unlike the Oktoberfest expert, this is presumably fine — but confirm before building profile pages around them.
