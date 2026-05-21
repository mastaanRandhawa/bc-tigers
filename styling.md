You are an elite frontend engineer, UI/UX architect, visual systems designer, typography expert, and scalable design-system specialist. Your responsibility is to completely rehaul, modernize, refactor, and elevate this entire website into a premium 2025-level sports tournament platform with a cohesive visual language, scalable architecture, and production-quality frontend implementation.

Your work should feel equivalent to modern:

* FIFA
* UEFA
* Apple Sports
* MLS
* Formula 1
* Riot/Valorant esports interfaces
* premium editorial sports platforms

The final result must NOT look like a generic Tailwind admin dashboard.

You are redesigning ALL pages, ALL layouts, ALL shared components, and ALL UI systems.

---

# PRIMARY OBJECTIVE

Completely redesign the website into a bold, immersive, highly branded tournament platform while simultaneously:

* simplifying architecture,
* improving maintainability,
* removing duplicate styling logic,
* improving responsiveness,
* modernizing interaction design,
* improving spacing rhythm,
* improving typography hierarchy,
* improving component consistency,
* and establishing a scalable reusable design system.

You must approach this like a senior product design engineer building a production-grade sports platform.

---

# FIRST: UNDERSTAND THE EXISTING SYSTEM

Before changing anything:

* Identify the full frontend stack:

  * React
  * Next.js
  * Tailwind
  * shadcn/ui
  * Zustand/Redux
  * routing structure
  * animation libraries
  * icon systems
  * API patterns
  * data fetching architecture
* Understand:

  * folder structure
  * component organization
  * styling conventions
  * utility helpers
  * existing design tokens
  * typography system
  * layout primitives
  * reusable patterns
  * dark/light handling
  * mobile responsiveness issues
* Audit:

  * duplicated Tailwind classes
  * repeated layout patterns
  * dead code
  * inconsistent spacing
  * outdated styling
  * weak responsive behavior
  * inconsistent cards/buttons/badges
  * accessibility issues
  * over-complicated component trees

Then refactor toward:

* reusable primitives,
* centralized styling,
* composable architecture,
* clean scalable UI patterns,
* maintainable component abstractions.

DO NOT blindly rewrite everything.
Preserve good patterns where appropriate.

---

# GLOBAL DESIGN SYSTEM

# Design Style: BAUHAUS SPORTS MODERNISM

The visual identity combines:

* Bauhaus geometry
* modern sports UI
* editorial typography
* premium tournament branding
* immersive dashboard layouts

This should feel like:
“Bauhaus meets FIFA broadcast graphics.”

The interface is NOT merely a website.
It is a geometric sports composition.

---

# CORE VISUAL PHILOSOPHY

The UI should feel:

* bold
* architectural
* geometric
* immersive
* layered
* premium
* athletic
* editorial
* high contrast
* modern

Everything should feel intentionally constructed.

No generic SaaS styling.
No bland admin-panel layouts.
No soft startup aesthetics.

---

# COLOR SYSTEM

Primary brand color:

* `#F48735`

Bauhaus primaries:

* Red: `#D02020`
* Blue: `#1040C0`
* Yellow: `#F0C020`

Core neutrals:

* Background: `#F0F0F0`
* Foreground: `#121212`
* Muted: `#E0E0E0`

Additional sports overlays:

* charcoal overlays
* translucent dark layers
* subtle orange glow accents
* metallic grayscale surfaces

Use strong contrast and intentional color blocking.

Entire sections may use:

* solid primary colors,
* geometric overlays,
* gradients,
* mesh textures,
* layered translucent panels.

---

# TYPOGRAPHY SYSTEM

Use:

* Outfit (Google Font)

Typography should feel:

* athletic,
* editorial,
* modern,
* compact,
* powerful.

Requirements:

* Massive uppercase headlines
* Tight tracking
* Strong visual hierarchy
* Reduced weak gray text
* Better contrast ratios
* Tighter spacing rhythm
* Cleaner metadata styling

Typography scale:

* Display:

  * mobile: text-4xl
  * tablet: text-6xl
  * desktop: text-8xl
* Subheadings:

  * text-2xl → text-4xl
* Body:

  * text-base → text-lg

Weights:

* Headlines:

  * font-black
  * uppercase
  * tracking-tighter
* Labels:

  * uppercase
  * tracking-widest
  * font-bold

---

# BORDER + SHADOW SYSTEM

Borders:

* thick black borders
* border-2 mobile
* border-4 desktop

Radius rules:

* either:

  * rounded-none
  * or rounded-full
* avoid generic medium rounding

Shadows:

* hard offset shadows only
* no soft blurry startup shadows

Examples:

* shadow-[4px_4px_0px_0px_black]
* shadow-[8px_8px_0px_0px_black]

---

# MOTION + INTERACTIONS

Animations should feel:

* snappy
* mechanical
* geometric
* deliberate

Use:

* duration-200
* duration-300
* ease-out

Interactions:

* card lift on hover
* segmented tab animations
* active button press
* glow transitions
* hover overlays
* micro-interactions
* skeleton loaders
* page transitions
* gradient glows

Avoid:

* excessive floating
* slow animations
* soft organic motion

---

# GLOBAL LAYOUT IMPROVEMENTS

Across ALL pages:

* reduce unnecessary whitespace
* improve spacing rhythm
* improve grouping
* improve information density
* improve responsive layouts
* improve alignment consistency
* improve navigation visibility
* improve hierarchy
* improve section separation

Use:

* proper max-width containers
* reusable layout primitives
* responsive grid systems
* modular sections
* reusable cards
* reusable headers
* reusable badge systems
* reusable segmented navigation

---

# IMPORTANT

DO NOT simply reskin the existing UI.

You MUST:

* rethink layouts,
* restructure hierarchy,
* improve navigation systems,
* improve component architecture,
* improve content grouping,
* improve responsiveness,
* improve visual storytelling,
* and make the platform feel like a real premium tournament product.

---

# SITE-WIDE REQUIREMENTS

* React + TypeScript + Tailwind CSS
* Fully responsive
* Mobile-first
* Accessibility compliant
* Reusable UI primitives
* Remove duplicated Tailwind classes
* Utility helpers/constants where appropriate
* Composition-based component architecture
* Maintainable scalable code
* Reusable design tokens
* Reusable motion patterns
* Reusable card systems
* Reusable typography utilities
* Proper loading states
* Proper empty states
* Responsive skeletons
* Strong desktop AND mobile experiences

---

# HERO / TOURNAMENT HEADER REDESIGN

Current problems:

* flat
* empty
* weak hierarchy
* floating content
* poor branding

Redesign into:

* immersive sports hero
* layered gradients
* geometric overlays
* mesh/noise texture
* darker readability overlays
* floating metadata chips
* tournament branding composition
* premium editorial spacing

Add:

* dates
* location
* live status
* tournament type
* floating stat cards
* glow accents
* abstract geometric graphics
* sticky/floating navigation on scroll
* improved breadcrumbs

---

# NAVIGATION TABS

Current issue:

* outdated
* weak active state
* too much empty space

Rebuild as:

* premium segmented navigation
* sticky on scroll
* glassmorphism accents
* animated active indicator
* responsive horizontal scrolling
* icon support
* better hover states
* stronger active states

---

# ABOUT SECTION

Convert from:

* plain text in box

Into:

* editorial content card
* better hierarchy
* proper spacing
* supporting stats/highlights
* stronger visual grouping

---

# DIVISIONS SECTION

Current problems:

* repetitive
* oversized
* visually weak
* flat hierarchy

Rebuild division cards to feel:

* interactive
* premium
* compact
* data-rich
* modern sports branded

Each division card should support:

* division crest/icon
* metadata
* team count
* match count
* live status
* format badges
* quick actions
* hover animations
* gradient accents
* better responsive stacking

Quick actions:

* standings
* schedule
* teams

Improve:

* badge system
* spacing
* hover interactions
* empty states

---

# SEARCH + FILTERS

Modernize completely:

* premium search input
* segmented filters
* sorting controls
* animated focus states
* responsive layout
* chip-based filters
* better alignment

---

# MATCHES / UPCOMING SECTIONS

Current issue:

* dead empty cards
* weak layouts

Improve with:

* featured match cards
* live indicators
* placeholder illustrations
* premium empty states
* better visual grouping
* responsive card layouts
* stronger hierarchy

---

# TEAM ROSTERS / SQUAD COMPONENTS

Create a fully reusable and modern “Tournament Squad / Roster Card” system inspired by:

* FIFA World Cup graphics
* UEFA squad posters
* premium sports editorial roster layouts

IMPORTANT:

* NO hardcoded team names
* NO hardcoded players
* NO hardcoded gradients
* NO hardcoded roster sizes
* fully data-driven

Use:

* React
* TypeScript
* Tailwind

The component must feel:

* bold
* premium
* editorial
* dark sports-poster aesthetic
* modern
* immersive

---

# ROSTER COMPONENT REQUIREMENTS

Responsive:

* mobile-first
* fully responsive

Data structure:

```ts
type Player = {
  id: string
  number: number
  name: string
  position: "goalkeeper" | "defender" | "midfielder" | "attacker"
}
```

Props:

```ts
type RosterCardProps = {
  title: string
  teamName: string
  players: Player[]
  gradientFrom: string
  gradientTo: string
  accentColor?: string
}
```

Must:

* auto-group by position
* render sections dynamically
* support any roster size
* support uneven section counts
* maintain balanced layouts
* avoid duplicated styling
* use helper components/utilities

Sections:

* Goalkeepers
* Defenders
* Midfielders
* Attackers

Only render sections that contain players.

If sections grow:

* auto-wrap into responsive columns
* maintain clean balance
* preserve spacing rhythm

---

# ROSTER VISUAL DIRECTION

Design should feel like:

* World Cup lineup graphics
* premium tournament posters
* modern sports media cards

Styling:

* giant team heading
* compact player rows
* uppercase names
* tight spacing
* elegant transparency
* layered overlays
* subtle glow accents
* thin section dividers
* responsive multi-column layouts

Add:

* gradient noise textures
* translucent overlays
* modern hover interactions
* subtle blur layering
* elegant spacing hierarchy

Ensure:

* accessibility
* smooth transitions
* long names don’t break layouts
* maintainability
* reusable structure

Avoid:

* clutter
* over-decoration
* generic cards

---

# NON-GENERICNESS REQUIREMENTS

This MUST NOT look like:

* generic Tailwind templates
* admin dashboards
* SaaS marketing pages
* bootstrap cards

Mandatory:

* geometric compositions
* rotated accent elements
* layered shapes
* hard borders
* bold color blocking
* editorial sports layouts
* abstract sports graphics
* asymmetric balance
* branded visual rhythm

Use:

* circles
* squares
* triangles
* rotated geometric accents
* large decorative overlays
* grayscale image treatments
* strong typography compositions

---

# COMPONENT SYSTEM REQUIREMENTS

Create reusable primitives for:

* buttons
* cards
* segmented tabs
* badges
* chips
* section headers
* stat blocks
* metadata rows
* floating overlays
* roster rows
* division cards
* hero layouts
* search bars
* empty states
* loading states

Refactor repeated Tailwind into:

* utility helpers
* variants
* reusable components
* shared constants

---

# ACCESSIBILITY + RESPONSIVENESS

Ensure:

* keyboard accessibility
* proper focus states
* semantic HTML
* responsive typography
* responsive spacing
* proper contrast ratios
* mobile-first layouts
* touch-friendly interactions

Desktop should feel:

* dense
* immersive
* premium

Mobile should feel:

* clean
* layered
* smooth
* optimized

---

# FINAL EXPECTATION

The final result should feel like:
“A premium international tournament platform designed by elite sports product designers.”

Every page should feel:

* immersive,
* branded,
* intentional,
* modern,
* editorial,
* athletic,
* geometric,
* premium,
* and scalable.

The codebase should simultaneously become:

* cleaner,
* more maintainable,
* more reusable,
* and more architecturally coherent.
