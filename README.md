# Studio Assembly

This is a pristine specification. You have correctly identified the biggest failure mode of brick-based websites: they usually look like toy stores. By framing this as an **architectural practice that happens to sell components**, you elevate the perceived value of the product immediately.

Since you are using **Lovable** (which thrives on precise system prompts), I have converted your design document into a **Master System Prompt** and a **Content Kit**.

You can copy and paste the blocks below directly into Lovable to get the exact output you want without hallucinated "marketing fluff."

---

### Part 1: The Master Prompt for Lovable

**Copy this block into the initial project setup or chat in Lovable. It forces the AI to adhere to your strict constraints.**

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

---

### Part 2: The Studio Copy (Ready to Paste)

**Lovable often struggles to write "cold" text. Use this copy for the Studio Homepage to ensure the tone remains architectural.**

**Hero Text (Below Image):**

> **Studio Assembly**
> A spatial design practice focused on modular cities, recursive systems, and brick-built environments.

**The "What We Do" Block:**

> **System**
> We do not sell sets; we architect systems. Our work bridges the gap between digital design and physical assembly, creating modular components that allow for city-scale environments.
> **Archive**
> The City is a living project—a long-term urban model exploring density, infrastructure, and realism through the medium of the brick.

**The Footer Blurb:**

> **Studio Assembly**
> Est. 2025.
> Based in Canada.
> *An independent design studio. Not affiliated with the LEGO® Group.*

---

### Part 3: The Product Page Template (Store)

**This is the critical "Anti-Hype" template. Paste this structure into Lovable when generating the Product Detail Page.**

**Title:** [Product Name, e.g., *HVAC Industrial Unit 04*]
**Price:** [Small, distinct, aligned right]

**Description Block:**

> **Architectural Role**
> Designed to add realistic rooftop texture to commercial districts. This unit serves as a scale reference and breaks up uniform skylines in modular city layouts.
> **System Specification**
> * **Scale:** 1:40 (Minifigure standard)
> * **Footprint:** 4x4 Studs
> * **Color Profile:** Light Bluish Grey / Flat Silver
> * **Mounting:** Standard jumper plate connection
> 
> 
> **Included Components**
> * 14x ABS Injection Molded Elements (New condition)
> * 1x Digital Instruction File (PDF)
> 
> 
> **Exclusions**
> * Baseplates and surrounding roof tiles are for context only.
> * Minifigures not included.
> 
> 
> **System Note**
> *This component is part of the 'Industrial District' collection. It is designed to integrate seamlessly with Studio Assembly modular standards.*

**Button:**

> [ Add to Project Cart ]

---

### Part 4: Technical & Strategic Advice

**1. The Domain Structure**
Since you are using Lovable (which likely exports code or hosts on a specific stack), ensure you treat `.ca` and `.shop` correctly.

* **Recommendation:** Build the **Studio (.ca)** as the "Headless" front end. It is pure content/portfolio.
* **The Store:** Link "Visit the Store" to `shop.studioassembly.ca` or just a `/shop` route if you want to keep it simple.
* *Why?* It keeps the "Studio" feeling pure. If the cart icon is visible on the "Process" page, it ruins the immersion. The cart should only appear once they enter the "Store" section.

**2. Image Strategy**
For the "City Page" (which you noted is critical but might be empty early on):

* **Do not use empty placeholders.**
* **Use "Wireframes":** Since this is a design studio, posting a black-and-white *digital render* or a CAD drawing of the planned city is better than a "Coming Soon" badge. It reinforces the "Architect" vibe.

**3. Dropshipping Integration**
Since you are dropshipping components (likely MOC parts/kits):

* **The "Rebranding" is vital.** You aren't selling "Generic Brick Bag A." You are selling "Structural Element Pack B."
* **Packaging:** If you can't control the physical shipping box, control the **Digital Delivery**. When they buy, send a beautifully designed PDF "Spec Sheet" immediately via email. It creates a premium feeling even if the bricks arrive in a bubble mailer.

---

### Next Step

Which of the following would you like me to tackle next to get this live?

1. **First 10 Dropship SKUs:** I can select 10 generic MOC items (e.g., specific windows, tile packs, plant stems) and write their "Architectural Descriptions" so they sound like premium components.
2. **Brand Language Rules:** A "Do's and Don'ts" list for writing future copy to ensure you never accidentally sound like a toy store.
3. **City Page "Placeholder" Copy:** Detailed text about "Future Phases" of the city (Industrial Zone, Transit Hub) to populate the page before you have built the physical models.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://studioassembly.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d3f068c0-cad6-4a5a-b467-860848450bfc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
