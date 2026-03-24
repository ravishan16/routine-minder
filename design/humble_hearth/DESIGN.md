# Design System: The Intentional Companion

This design system is crafted for a Progressive Web App (PWA) that functions as a quiet, supportive partner in a user’s daily life. It rejects the aggressive "productivity" aesthetic in favor of a "High-End Editorial" approach—blending the warmth of a physical journal with the fluid precision of modern digital craft.

---

## 1. Overview & Creative North Star: "The Living Journal"

The Creative North Star for this system is **The Living Journal**. 

Unlike standard habit trackers that feel like spreadsheets or task managers, this system treats the UI as a tactile, breathable space. We avoid the "template" look by ignoring rigid grid structures in favor of intentional asymmetry and "white space as a feature." 

**Key Principles:**
*   **Humble Premium:** High-quality execution through typography and spacing, never through flashy effects or marketing-heavy hero sections.
*   **Organic Pacing:** Content is paced to feel like a conversation. We use large, offset headers and overlapping surface elements to break the "stack of boxes" monotony.
*   **The PWA Edge:** Since this is mobile-first, every interaction is designed for the thumb, utilizing soft transitions and blurred overlays that make the app feel like a native part of the OS.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule

The palette is anchored in a soft, parchment-like background (`#faf9f6`), using organic ochre and clay tones to provide warmth without the "alert" energy of standard orange.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or cards. Boundaries must be created exclusively through background color shifts. 
*   **Nesting:** Place a `surface-container-low` card on a `surface` background.
*   **Contrast:** Use `surface-container-highest` only for the most critical interactive elements (like an active habit state).

### Surface Hierarchy & Layering
Treat the UI as a series of stacked, fine-paper sheets. 
*   **Base Layer:** `surface` (#faf9f6)
*   **Secondary Context:** `surface-container-low` (#f4f4f0) for grouping related habits.
*   **Active/Elevated State:** `surface-container-lowest` (#ffffff) for cards that need to "pop" toward the user.

### Signature Textures & Glass
To move beyond "flat" design, use a **Linear Gradient** for primary actions:
*   **CTA Gradient:** Transition from `primary` (#a33f00) to `primary-container` (#fc7127) at a 135-degree angle. This gives the "organic orange" a subtle, sun-drenched glow rather than a flat, plastic feel.
*   **The Glass Rule:** For floating navigation or bottom sheets, use `surface` at 80% opacity with a `backdrop-blur` of 12px.

---

## 3. Typography: Editorial Clarity

We use **Plus Jakarta Sans** to balance geometric modernity with friendly, open counters.

*   **Display as Art:** Use `display-md` for daily greetings (e.g., "Good morning, Alex."). These should be set with `letter-spacing: -0.02em` to feel bespoke and tight.
*   **Asymmetric Headlines:** `headline-sm` should often be left-aligned with a significant `margin-top` (Spacing 8) to create an editorial "chapter" feel.
*   **The Helper Voice:** `label-md` using `secondary` (#625d6a) is your companion’s voice—use it for gentle reminders and "micro-copy" that doesn't demand immediate action.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are too "tech." We achieve depth through **Ambient Light**.

*   **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card on a `surface-container` background. The subtle shift in hex value creates a "natural lift."
*   **Ambient Shadows:** If a floating action button (FAB) or modal requires a shadow, use: `box-shadow: 0 12px 32px -4px rgba(48, 51, 48, 0.06)`. Note the extremely low opacity (6%) and large blur—it should feel like a soft glow, not a dark edge.
*   **The Ghost Border Fallback:** If accessibility requires a stroke, use `outline-variant` (#b0b3ae) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Soft & Purposeful

### Buttons (The "Soft-Touch" Action)
*   **Primary:** Gradient (Primary to Primary-Container), `rounded-full`, `title-sm` (white text).
*   **Secondary:** `surface-container-high` background with `on-surface` text. No border.
*   **Tertiary:** Text-only using `primary` color, bolded.

### Habit Cards (The "Living" Card)
*   **Style:** No borders. Use `surface-container-low` for the inactive state. 
*   **Interaction:** When a habit is "completed," transition the background to `primary-container` at 10% opacity and change the icon to `primary`.
*   **Spacing:** Use **Spacing 4** (1.4rem) between cards to allow the "parchment" background to breathe.

### Progress Indicators (The "Growth" Visual)
*   Avoid circular "rings of fire." Use soft, horizontal bars with `rounded-full` corners.
*   **Track:** `surface-container-highest`.
*   **Indicator:** `primary` (#a33f00).

### Input Fields
*   **Style:** Only a bottom "Ghost Border" (10% `outline-variant`). When focused, the border transitions to `primary` and the background subtly shifts to `surface-container-low`.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical margins. For example, give a header a left margin of Spacing 4 but a right margin of Spacing 8.
*   **Do** use `title-lg` for habit names to make them feel significant.
*   **Do** leverage the PWA "safe-areas"—ensure the bottom navigation bar uses the Glassmorphism rule to let habit content peek through.

### Don't
*   **Don't** use dividers (`<hr>`). Use a Spacing 5 vertical gap or a subtle background color shift instead.
*   **Don't** use pure black (#000000). Use `on-surface` (#303330) for all primary text to keep the "warmth."
*   **Don't** use "Success Green" for completion. Use the `primary` orange or `tertiary` rose tones (#7f535c) to maintain the unique brand palette.
*   **Don't** use "System for Success" or "Crush your goals" copy. Use "Small steps today" or "Notice your rhythm."

---

## 7. Spacing & Rhythm

This system relies on a **relaxed rhythm**.
*   **Section Gaps:** Use **Spacing 10** (3.5rem) between major content blocks to prevent the mobile screen from feeling cluttered.
*   **Touch Targets:** Every interactive element must have a minimum height of **Spacing 12** (4rem) to ensure the PWA feels effortless under-thumb.