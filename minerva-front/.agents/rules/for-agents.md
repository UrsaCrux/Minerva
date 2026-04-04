---
trigger: always_on
---

# Agent Guidelines & Design System

## General Agent Instructions
* **MUST ALWAYS SEE THE ROADMAP FILE (`roadmap.md`)**.
* Make simple functions with descriptive names and with as few lines as possible.
* Filenames must be descriptive.
* **MUST ALWAYS UPDATE `README.md`** with proper documentation after adding each new feature.

## 1. Clean Code & Architecture
* **Single Responsibility:** Functions and classes must do exactly one thing.
* **Descriptive Naming:** No single-letter variables or abbreviations. Use explicit names.
* **Early Returns:** Use guard clauses to handle errors first. Avoid deep nesting. 
* **Meaningful Comments:** Explain the "Why" (business logic, workarounds), never the "What". Code must be self-documenting.

## 2. Zero Hardcoding
* **No Magic Values:** Extract all raw strings and numbers into global constants.
* **Environment Variables:** All secrets, tokens, URLs, and configurations must come from `.env` or injected config files.

## 3. Efficiency & Performance
* **Optimal Data Structures:** Use HashMaps/Sets/Dicts for O(1) lookups instead of filtering arrays.
* **Async & Concurrency:** Never block the main thread. Run independent async tasks in parallel.
* **Batching:** Prevent N+1 queries. Fetch DB/API data in bulk.

## 4. Human-Friendly Debugging
* **Contextual Logging:** No generic logs. Include specific parameters, IDs, and context in `error` and `warn` logs.
* **Strict Error Handling:** No empty `try/catch` blocks. Handle, log, or rethrow errors with clear messages.
* **Strict Typing:** No `any` or weak dynamic types. Define explicit input/output interfaces.

## 5. Communication (Caveman Mode)
* Talk like caveman. Few words.
* No explain code. No greetings. No yapping.
* Speak ONLY if blocked or need human input. 
* Otherwise, output ONLY code.

---

# Design System Specification: Galactic Oversight

## 1. Overview & Creative North Star: "The Celestial Navigator"
This design system is not a mere utility; it is a high-performance cockpit for the next generation of aerospace management. The "Creative North Star" is **The Celestial Navigator**—an aesthetic that balances the cold, vast precision of deep space with the vibrant, glowing data of a star-map.

To break the "standard dashboard" mold, we reject the rigid, boxy grid in favor of **intentional depth and atmospheric layering.** By utilizing wide margins, overlapping "glass" surfaces, and asymmetrical data clusters, we create a UI that feels fluid and expansive rather than confined. We treat the screen as a viewport into a nebula, where information floats with purpose.

## 2. Colors & Surface Philosophy
The palette transitions from the infinite void of deep space into the high-energy glow of propulsion systems.

### Surface Hierarchy & Nesting
We achieve structure through **Tonal Layering**, not lines. 
- **Base Layer:** `surface` (#0d0d1c) acts as the deep space background.
- **Sectioning:** Use `surface_container_low` (#111124) for large layout blocks.
- **Component Level:** Use `surface_container` (#17172d) for primary cards.
- **Interaction Level:** Use `surface_container_high` (#1d1d36) or `highest` (#232340) for hovered states or active "drilled-down" content.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are strictly prohibited for sectioning content. Boundaries must be defined through:
1. **Background Shifts:** Placing a `surface_container_low` card against the `background`.
2. **Luminous Transitions:** Using a subtle gradient from `primary` to `primary_container` to define an edge.

### The "Glass & Gradient" Rule
To evoke a high-end aerospace feel, floating panels (modals, dropdowns, navigation) must use **Glassmorphism**:
- **Background:** `surface_variant` at 60% opacity.
- **Effect:** `backdrop-filter: blur(20px)`.
- **Signature Texture:** Primary CTAs should use a linear gradient: `primary` (#9fa3ff) to `secondary` (#00dbe7) at a 135-degree angle to simulate "ion engine" luminescence.

## 3. Typography: Technical Authority
We pair **Space Grotesk** (Display/Headlines) with **Inter** (Body/Labels) to balance futuristic character with extreme legibility.

- **Display (Space Grotesk):** Large-scale values and hero metrics. These should feel like telemetry data on a HUD.
- **Headline/Title (Space Grotesk):** Used for section headers to provide a "branded" editorial feel.
- **Body (Inter):** Reserved for data tables, ERP logs, and descriptions. High x-height ensures readability in low-light environments.
- **Label (Inter):** Used for micro-copy and metadata. Always in `on_surface_variant` (#a9a8cc) to reduce visual noise.

## 4. Elevation & Depth: Atmospheric Stacking
We move away from Material shadows toward **Ambient Luminosity.**

- **The Layering Principle:** Depth is achieved by "stacking" the surface tiers. An inner data module sits on `surface_container_lowest` (#000000) within a `surface_container` card to create a "recessed" look.
- **Ambient Shadows:** For floating elements, use extra-diffused shadows.
    - `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 10px rgba(159, 163, 255, 0.05);` 
    - The shadow is tinted with the `surface_tint` to make it feel like light is bending around the object.
- **The "Ghost Border" Fallback:** If a container requires a border for accessibility, use the `outline_variant` token (#454564) at **15% opacity**. It should be felt, not seen.

## 5. Component Guidelines

### Buttons (Propulsion Units)
- **Primary:** Gradient fill (`primary` to `secondary`). `on_primary` text. `xl` roundedness (0.75rem).
- **Secondary:** `surface_container_high` background with a `secondary` "Ghost Border."
- **Tertiary:** Text-only using `tertiary` (#ebb2ff) for high-visibility utility actions (e.g., "Emergency Override").

### Inputs & Fields
- **Container:** `surface_container_lowest` background. 
- **States:** On focus, the "Ghost Border" becomes a 1px `primary` glow with a 4px outer blur.
- **Error:** Use `error` (#fd6f85) text and a `error_container` subtle background glow.

### Cards & Data Modules
- **Constraint:** **Zero dividers.** Separate content blocks using `48px` or `64px` vertical spacing from the scale.
- **Visual Soul:** Add a 2px "Top Glow" to cards—a subtle `linear-gradient(to right, primary, transparent)` only at the top edge of the card to simulate overhead cockpit lighting.

### Aerospace-Specific Components
- **Telemetry Chips:** Use `secondary_container` for "Active" status, providing a vibrant cyan "on" state.
- **Orbital Progress Bars:** Background `surface_container_highest`; fill `primary` gradient. No rounded ends—use sharp `none` or `sm` corners for a technical, "measured" look.

## 6. Do's and Don'ts

### Do:
- **Use "Space" as a Material:** Use generous white space (kerning and margins) to allow complex ERP data to "breathe."
- **Embrace Asymmetry:** Align primary KPIs to the left and secondary telemetry to the right to create a sophisticated, non-template layout.
- **Layer Glass:** Let background gradients or orbital maps peek through blurred navigation panels.

### Don't:
- **No Pure Grays:** Never use `#333` or `#666`. Every "neutral" must be tinted with indigo (`surface` tones) or purple (`on_surface_variant`).
- **No Hard Dividers:** Never use a solid line to separate table rows. Use alternating `surface_container_low` and `surface_container` backgrounds.
- **No Over-Rounding:** While cards use `xl` (0.75rem), avoid "pill" shapes for everything. Keep some technical edges (using `sm` or `md`) to maintain an "aerospace engineering" feel.