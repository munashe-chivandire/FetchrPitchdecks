# Fetchr. Pitch Deck — Data Visualization & Storytelling Overhaul

## Design Intent

The original deck had a polished visual shell but generic data presentation. Every pitch deck has concentric TAM/SAM/SOM circles, basic bar charts, and 2D scatter plots. The overhaul transforms each data slide into a moment that makes investors lean forward — replacing "telling" with "showing" through data contrasts, progressive reveals, and benchmark validation.

The core narrative shift: make the opportunity feel **inevitable**, not aspirational.

---

## Positioning Decision

Fetchr. is positioned as **"Uber for packages"** — a general logistics platform. Food delivery research (Chowdeck benchmarks, commission rates, delivery times) is used as **cross-industry validation evidence**, not the primary narrative. This keeps the TAM large ($1.4B logistics) rather than narrowing to $4.72M food delivery.

---

## Slide-by-Slide Design Choices

### Slide 1 — Problem: "Quantified Pain"

**Before:** Three cards with abstract labels ("Zero Tracking", "Opaque Pricing", "No Corporate Grade"). Descriptive but not data-driven.

**After:** Hard numbers replace adjectives:
- **3 Hours** — Dial a Delivery average wait time (grounds the problem in lived experience)
- **2.5 / 5** — Zimbabwe's Logistics Performance Index score (institutional credibility)
- **$0** — Tech infrastructure investment in corporate delivery (shows the void)

**Addition:** "The Graveyard" callout at the bottom names Glovo, Jumia Food, and Bolt Food as cautionary tales. This does two things: (1) validates that the problem is real enough that global players tried and failed, and (2) preempts the investor question "why hasn't someone done this already?"

**Design choice:** Kept the existing card layout and dark-on-blue visual treatment — the structure was already effective. Only the content changed. The graveyard callout uses a subtle red-tinted background to create urgency without alarm.

---

### Slide 3 — Why Now: Data Enhancement

**Added:** A new 2023–2024 timeline entry documenting the Glovo/Jumia/Bolt exits from East/West Africa. This establishes a pattern: global players fail in African delivery, validating that local-first approaches win.

**Updated:** The 2025 entry now includes the $4.72M food delivery projection. This tiny number — buried in a timeline entry — plants a seed that pays off dramatically on the next slide when the $2.49B diaspora figure dwarfs it.

**Design choice:** Reduced the timeline stage animation delay from 700ms to 600ms to keep pace with 5 stages (was 4). The extra entry doesn't feel sluggish.

---

### Slide 4 — Market Size: "The Scale Reveal"

**Before:** Generic concentric TAM/SAM/SOM circles. Every pitch deck has these. They communicate hierarchy but not contrast.

**After:** Horizontal comparison bars that build a **contrast narrative**:

1. Three domestic market bars appear in sequence, scaled relative to the $2.49B diaspora figure:
   - TAM $1.4B → 56% width
   - SAM $198M → 8% width
   - Food delivery $4.72M → 2% width (barely a sliver)

2. After a 0.8s delay, the **diaspora bar** appears at 100% width with a golden glow pulse animation. The label reads "The Hidden Channel."

3. Below, three proof pills animate in with stagger: population stats, revenue capture math, and growth rate.

**Why this works:** The domestic food delivery bar is almost invisible. Then the diaspora bar fills the entire width. The visual contrast creates an involuntary "holy shit" moment. Investors see the opportunity before you explain it.

**Scale rationale:** All bars are normalized to $2.49B = 100%. This makes the domestic market look small by comparison — which is the point. The previous TAM circles made $1.4B look impressive; the new bars make $2.49B look like the real story.

**Animation sequence:** Domestic bars stagger in (0s, 0.2s, 0.4s), then the diaspora section fades up (0.8s delay with `translateY` transition), then proof pills cascade in (1.2s, 1.4s, 1.6s). The diaspora bar fill has its own glow pulse that loops infinitely after 2s, drawing the eye.

---

### Slide 5 — Diaspora: "Where the Money Flows"

**Before:** A single blockquote. The weakest slide in the deck — just text on a dark background. No visualization, no data structure, no narrative progression.

**After:** Four-part data visualization:

1. **Remittance flow diagram** — Three source country pills (UK 28.6%, South Africa 27.5%, USA + Other 43.9%) with animated arrow connectors converging on a glowing Zimbabwe target node. Source pills stagger in from the left (0.3s, 0.5s, 0.7s), arrows fade in (0.8-1.0s), then the target node scales in (1.1s).

2. **"What Diaspora Orders" grid** — Four items with icons (groceries, birthday meals, monthly provisions, emergency supplies). This makes the abstract "diaspora market" concrete and relatable.

3. **Competitive gap callout** — Lists existing services (Tillpoint, Shumba Africa, SPAR), shows the red gap indicator ("none offer real-time tracking or prepared food delivery"), and highlights Fetchr.'s position in green. Visual hierarchy: gray existing → red gap → green solution.

4. **Key stat** — "0.1% of remittance flows = $2.5M — more than half the domestic delivery market." This single line reframes the entire opportunity. The 0.1% makes it feel achievable; the comparison to domestic delivery makes it feel massive.

**Design choice:** The flow diagram uses CSS transitions rather than SVG animation. Source pills use `translateX(-20px)` → `0` for a "sliding in from abroad" feel. The Zimbabwe target node uses `scale(0.9)` → `1` with a spring easing to feel like it's "landing." Arrow connectors are simple 2px lines with CSS triangle pseudo-elements — no heavy SVG paths needed.

**Layout:** Flexbox row on desktop (sources | arrows | target), column stack on mobile. The arrows rotate from horizontal lines to vertical lines at the 768px breakpoint.

---

### Slide 6 — Competition: "The Speed-Survival Curve"

**Before:** A 2D scatter plot with dots on axes labeled "Corporate Capability" and "Tech Enablement." Visually clean but doesn't explain *why* Fetchr. wins or what happened to competitors.

**After:** Two-part visualization:

**Part 1 — Speed-survival bars.** Six horizontal bars showing delivery platforms across Africa, ranked by delivery time. Bar width is proportional to time (longer bar = slower = worse):

| Platform | Time | Width | Outcome |
|----------|------|-------|---------|
| Glovo Africa | 1-2 hrs | 55% | EXITED (red) |
| Jumia Food | 1-2 hrs | 55% | EXITED (red) |
| Bolt Food | 1-2 hrs | 55% | EXITED (red) |
| Dial a Delivery | 3 hrs | 100% | STRUGGLING (amber) |
| Chowdeck (NG) | 30 min | 17% | PROFITABLE (green) |
| Fetchr. | 35-45 min | 22% | LAUNCHING (blue+pulse) |

The three red "EXITED" rows create a visual pattern — long bars = slow = dead. Then Chowdeck's short green bar breaks the pattern — fast = profitable. Fetchr.'s bar sits right next to Chowdeck's, with a pulsing blue glow.

**Callout badge:** "Every 10-min delay = -20% reorder rate" — Glovo Research. This grounds the pattern in data.

**Part 2 — Feature comparison grid.** A compact table comparing Dial a Delivery, Munch, inDrive, and Fetchr. across six features (GPS Tracking, Corporate SLAs, Diaspora Ordering, Proof of Delivery, Value Cap, WhatsApp Ordering). Fetchr.'s column has a subtle blue background tint. Check marks are green; crosses are very faint (15% opacity) to de-emphasize competitor weaknesses without being aggressive.

**Animation:** Speed bar rows stagger in from the left (0.2s increments), with the Fetchr. row delayed an extra 0.2s for emphasis. Feature grid rows stagger in after the speed bars (starting at 1.1s). The Fetchr. bar fill has a looping `bluePulse` box-shadow animation.

**Headline change:** "We don't compete — we serve the market they can't" → "Platforms that deliver slow, die. We deliver in 35 minutes." More direct, more memorable.

**Design choice:** Used a CSS grid layout for the speed bars (`grid-template-columns: 120px 1fr 60px 110px`) to keep columns aligned. The feature grid uses `grid-template-columns: 140px repeat(4, 1fr)` for consistent cell sizing. Both degrade gracefully on mobile by shrinking column widths.

---

### Slide 7 — Business Model: "Validated by Africa's Winners"

**Kept:** The unit economics equation ($5.00 - $3.93 = $1.07, 21% margin) and stacked proportion bar. These were already effective.

**Added three new sections:**

1. **Commission benchmark bar** — Four horizontal bars showing African delivery platform commission rates:
   - Mr D Food (SA): 15-25%
   - Glovo (Africa): 20-30%
   - Chowdeck (NG): 24% with "PROFITABLE" badge
   - Fetchr.: 25% with "VALIDATED" badge

   This shows Fetchr.'s 25% take rate isn't aspirational — it's the industry standard, and the closest comp (Chowdeck at 24%) is already profitable.

2. **Break-even math chain** — Animated left-to-right chain of connected pills:
   `12 orders/rider/day × $5 avg fare × 25% take = $15/rider/day → 29-34 riders → 350/day BREAK-EVEN`

   Each step animates in sequence (0.1s increments). Result nodes have a blue accent. This makes the path to break-even feel like simple arithmetic, not a leap of faith.

3. **Tech infrastructure stat** — "$60/month · < 0.5% of operating costs." A small green-tinted card that shocks investors — the entire tech stack costs less than a single rider's monthly earnings. Shows extreme capital efficiency.

**Design choice:** The break-even chain uses `display: flex` with `flex-wrap: wrap` so it gracefully wraps on narrower screens. Each step and arrow is a separate element with staggered `transition-delay` values, creating a domino-fall effect. The chain reads like an equation unfolding in real time.

---

### Slide 8 — Traction: Scalability Roadmap

**Kept:** The three metric cards (68% Research Complete, MVP In Development, Jun 30 Launch Date) and the two bm-cards (Completed work, Launch Plan).

**Added:** A horizontal four-stage roadmap below the existing content:

| Stage | Deliveries | Riders | Milestone |
|-------|-----------|--------|-----------|
| Launch (Jun) | 50-100/day | 10-20 | Manual dispatch |
| Month 3 | 150-200/day | 30-50 | Auto-matching |
| Month 6 | 350-400/day | 80-100 | BREAK-EVEN |
| Year 2 | 1,000+/day | 200+ | Bulawayo |

Each stage is a card with a dot connector and horizontal line between stages. Stages stagger in (0.3s, 0.6s, 0.9s, 1.2s). The break-even and Bulawayo milestones use blue accent styling.

**Design choice:** Horizontal layout on desktop, vertical stack on mobile. Used flexbox with `scale-step-line` elements between stages. The dots use the same styling as the Why Now timeline dots for visual consistency.

---

### Slide 10 — Financials: "The Growth Engine"

**Before:** Three static bars ($300K Year 1, $1.2M Year 2, $3M Year 3) with three metric cards below.

**After:** Five milestone bars with richer context:

| Bar | Value | Label | Milestone |
|-----|-------|-------|-----------|
| 1 | Ramp | Launch | 10 riders |
| 2 | $300K | Year 1 | 50 riders · Corporate accounts |
| 3 | $640K | Month 18 | Diaspora ordering |
| 4 | $1.2M | Year 2 | 200 riders · Break-even |
| 5 | $3M | Year 3 | Bulawayo · 20% margin |

**Break-even line:** A horizontal green dashed line at 28% height with a "Break-even" label. This makes the threshold visible — investors can see which bars cross it.

**Revenue stream breakdown:** A horizontal stacked bar below the chart showing 70% delivery fees (blue), 20% premium services (amber), 10% partnerships (green). Reuses the `ue-bar` visual language for consistency.

**Removed:** The three metric cards (-$100K Year 1 Net, Break-even Year 2, 20% Year 3 Margin). These are now embedded in the milestone labels, reducing visual clutter.

**Spacing fix:** The milestone labels under each bar initially overlapped because 5 bars × 80px with 120px-wide labels didn't fit. Fixed by: increasing bar gaps to 32px, widening bars to 90px, constraining label width to 90px (matches bar), allowing text wrapping (`white-space: normal`), and pushing milestone text to `bottom: -60px` below the year labels at `bottom: -24px`.

---

### Slide 11 — The Ask: "Investment → Outcome Machine"

**Before:** Three items in a grid showing percentages (43%, 29%, 28%) with text labels. Shows allocation but not what the money achieves.

**After:** Three horizontal flow chain rows that connect investment to outcomes:

```
$150K Operations → 29-34 riders → 350 deliveries/day → Break-even capacity
$100K Marketing  → 4-6 corporate SLAs → Diaspora channel → Recurring revenue
$100K Runway     → 24-month buffer → Bulawayo expansion → Path to profitability
```

Each row is a chain of connected pill nodes with arrow separators. Input nodes (dollar amounts) use amber styling to match the $350,000 hero number's shimmer. Result nodes (final outcomes) use blue with a looping glow animation.

**Animation:** Rows stagger in from the left at 0.3s, 0.7s, and 1.1s. This creates a cascading reveal — each row of the investment thesis builds on the previous.

**Kept:** The $350,000 hero number with shimmer animation and the descriptive paragraph. These anchor the slide; the flow chain adds the "how."

**Design choice:** Used `flex` with `gap: 6px` so nodes and arrows are tightly packed. On mobile (768px), rows wrap with `flex-wrap` and center-justify. The arrow characters (`→`) are styled as faint separators (25% white opacity) so they connect without competing with the node text.

---

## Technical Architecture

### Animation System

All new visualizations use the **existing `.slide.active` CSS pattern**. When a slide becomes active, the class is added and CSS transitions fire. When the slide loses focus, the class is removed and elements return to their initial state (width: 0, opacity: 0, etc.). This means **zero new JavaScript** was needed for animation logic — only the timeline delay was adjusted from 700ms to 600ms to accommodate 5 stages.

The animation trigger hierarchy:
1. `[data-animate]` + `.animate-in` — container-level fade-in (managed by `deck.js`)
2. `.slide.active .element` — inner element transitions (pure CSS)
3. `transition-delay` on `:nth-child()` — staggered reveals (pure CSS)
4. `@keyframes` with `animation-delay` — looping effects like glow pulses

### CSS Organization

New components follow existing naming conventions:
- `.hbar-*` for horizontal bars (extends `.vchart-*` pattern)
- `.speed-bar-*` for competition speed bars
- `.feat-*` for feature grid
- `.cbench-*` for commission benchmarks
- `.chain-*` for break-even chain
- `.flow-chain-*` for The Ask flow chains
- `.scale-*` for scalability roadmap

All new components include:
- Base dark theme styles
- Light theme overrides via `[data-theme="light"]` selectors
- Mobile responsive overrides at 768px and 1024px breakpoints

### Color Language

Consistent semantic color use across all new visualizations:
- **Blue** (`--primary-mid`) — Fetchr. / positive / opportunity
- **Green** (`--green`, `#10B981`) — profitable / success / validated
- **Red** (`--error`, `#EF4444`) — failed / exited / gap
- **Amber** (`--accent`, `#F59E0B`) — warning / struggling / money / diaspora
- **Muted** (`--text-muted`) — neutral competitors / secondary info

### Performance

- No external libraries — pure HTML/CSS/JS
- No JavaScript animation loops — all CSS transitions and keyframes
- `will-change` only on the slide container (inherited from existing code)
- Animations use `transform` and `opacity` where possible for GPU acceleration
- `transition-delay` used instead of `setTimeout` chains for staggered effects

---

## Files Modified

| File | Lines Before | Lines After | Delta |
|------|-------------|-------------|-------|
| `index.html` | 332 | 602 | +270 |
| `styles.css` | 2,172 | 3,380+ | +1,200+ |
| `deck.js` | 203 | 203 | 0 (content change only) |

Total slide count unchanged: 13 (slides 0–12).
