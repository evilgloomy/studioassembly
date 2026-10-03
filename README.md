# Studio Assembly

Architectural practice site for modular, brick-built environments. The studio is a portfolio; the store is a separate, quieter section.

Live site: https://evilgloomy.github.io/studioassembly/

## Design system

```text
PROJECT: Studio Assembly
TYPE: Portfolio & E-commerce (Architectural/Minimalist)
VIBE: Cold, precise, high-end, gallery-like. NOT a toy store.

DESIGN SYSTEM:
- Background: #F6F6F4 (Warm White/Off-White)
- Text Primary: #1C1C1C (Charcoal)
- Text Secondary: #6E6E6E (Muted Gray)
- Accent: Muted Concrete/Stone (Use strictly for dividers/links only)
- Typography: Inter (clean sans) mixed with a sharp Serif (like Playfair Display or Libre Baskerville) for Headlines.
- Radius: 0px on everything. No rounded corners.
- Shadows: None. Flat design.
- Grid: Strict alignment. High whitespace usage.

UI RULES (STRICT):
1. No "Buy Now" buttons. Use textual links like "Add to Selection" or "Acquire".
2. No icons unless strictly functional (hamburger menu, simple cart).
3. Images must be full-width or strictly grid-aligned.
4. Navigation: Simple text row. No drop-downs.
5. Footer: Minimal text columns.

CONTENT STRUCTURE:
- Section 1: Hero (Image only, no overlay text).
- Section 2: Manifesto (Serif typography, large scale).
- Section 3: The City (Archive style entry).
- Section 4: Store Access (Subtle link, not a banner).

BEHAVIOR:
- Scroll interactions should be smooth but not bouncy.
- Hover states should be an underline or a slight opacity shift. No movement.
```

## Studio copy

**Hero text (below image):**

> **Studio Assembly**
> A spatial design practice focused on modular cities, recursive systems, and brick-built environments.

**The "What We Do" block:**

> **System**
> We do not sell sets; we architect systems. Our work bridges the gap between digital design and physical assembly, creating modular components that allow for city-scale environments.
> **Archive**
> The City is a living project—a long-term urban model exploring density, infrastructure, and realism through the medium of the brick.

**Footer:**

> **Studio Assembly**
> Est. 2025.
> Based in Canada.
> *An independent design studio. Not affiliated with the LEGO® Group.*

## Product page template

**Title:** [Product Name, e.g., *HVAC Industrial Unit 04*]
**Price:** [Small, distinct, aligned right]

**Description block:**

> **Architectural Role**
> Designed to add realistic rooftop texture to commercial districts. This unit serves as a scale reference and breaks up uniform skylines in modular city layouts.
> **System Specification**
> * **Scale:** 1:40 (Minifigure standard)
> * **Footprint:** 4x4 Studs
> * **Color Profile:** Light Bluish Grey / Flat Silver
> * **Mounting:** Standard jumper plate connection
>
> **Included Components**
> * 14x ABS Injection Molded Elements (New condition)
> * 1x Digital Instruction File (PDF)
>
> **Exclusions**
> * Baseplates and surrounding roof tiles are for context only.
> * Minifigures not included.
>
> **System Note**
> *This component is part of the 'Industrial District' collection. It is designed to integrate seamlessly with Studio Assembly modular standards.*

**Button:**

> [ Add to Project Cart ]

## Notes

* Build the studio site as the portfolio front end. Keep the cart off content pages; link the store at `shop.studioassembly.ca` or a `/shop` route.
* For an empty City page, use wireframes or CAD renders rather than a "Coming Soon" badge.
* Name components by architectural role, not generic brick bags.

## Development

Node.js and npm. Install with legacy peer deps, then start Vite.

```sh
npm install --legacy-peer-deps
npm run dev
```

GitHub Pages is published from the `gh-pages` branch (`dist`, plus `404.html` copied from `index.html`).
