# Mazou Brand Guidelines

**Version 1.0 | March 2026**
**Prepared by: Brand Agency**

---

## 1. Brand Essence

### Who We Are
Mazou is the AI infrastructure layer for Africa. We give developers and product teams a single API to access 40+ AI models  - global and African  - with local currency billing, intelligent cost routing, and full spend visibility.

### Brand Promise
> One API. Local currency. Full control.

### Brand Positioning Statement
For African developers and product teams building with AI, Mazou is the unified gateway that eliminates the complexity of multi-provider AI access  - with local currency billing, African language intelligence, and cost visibility no one else offers.

### Brand Archetype: The Builder
Not flashy. Not hype-driven. Mazou is infrastructure  - reliable, precise, enabling. The brand should feel like a tool built by people who understand your problems because they live them too.

### Core Values
1. **Clarity**  - We make the complex simple. In product, in pricing, in communication.
2. **Precision**  - Every kobo tracked. Every model measured. We don't guess.
3. **Proximity**  - Built in Africa, for Africa. We understand the context because we live it.
4. **Openness**  - BYOK, open API standards, no lock-in. We earn retention, not force it.

---

## 2. Visual Identity

### 2.1 Logo

#### Primary Wordmark
The Mazou wordmark is set in **lowercase**, in a heavy weight, with a **signal dot** (period) in the accent color.

```
mazou.
```

- **Typeface**: Inter ExtraBold (800)
- **Case**: Always lowercase
- **The Dot**: The period is the brand's signature element. It represents the single point of access  - one API, one gateway, one dot. It is always rendered in **Electric Mint (#00E5A0)** on dark backgrounds or **Deep Midnight (#0A1628)** on light backgrounds.

#### Logomark (Icon)
A custom lowercase **"m"** in white, set on a **Deep Midnight (#0A1628)** rounded square (6px radius at 32px), with the signal dot in **Electric Mint (#00E5A0)** at the bottom-right.

#### Clear Space
Maintain clear space around the logo equal to the height of the letter "m" on all sides.

#### Minimum Size
- Wordmark: 80px wide minimum
- Logomark: 24px minimum

#### Don'ts
- Do not change the logo colors outside the approved palette
- Do not stretch, rotate, or distort the logo
- Do not add effects (shadows, gradients, outlines) to the logo
- Do not separate the dot from the wordmark
- Do not set the wordmark in uppercase or title case
- Do not use the old blue (#1D4ED8) dot  - it has been replaced by Electric Mint

---

### 2.2 Color Palette

#### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Deep Midnight** | `#0A1628` | 10, 22, 40 | Primary brand color. Backgrounds, text, logo ground. Infrastructure = depth. |
| **Electric Mint** | `#00E5A0` | 0, 229, 160 | Primary accent. CTAs, the signal dot, success states, currency/money contexts. |

#### Secondary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Warm Amber** | `#F5A623` | 245, 166, 35 | Emphasis, alerts, warmth. Used sparingly for highlights and warnings. |
| **Signal Blue** | `#3B82F6` | 59, 130, 246 | Links, interactive elements, data visualization primary. |

#### Neutral Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Ink** | `#1A1D26` | 26, 29, 38 | Body text, headings on light backgrounds. |
| **Slate** | `#5B6070` | 91, 96, 112 | Secondary text, descriptions. |
| **Ash** | `#8A8F9E` | 138, 143, 158 | Tertiary text, placeholders, disabled states. |
| **Mist** | `#E2E4E9` | 226, 228, 233 | Borders, dividers. |
| **Cloud** | `#F8F9FB` | 248, 249, 251 | Page backgrounds, subtle surface. |
| **White** | `#FFFFFF` | 255, 255, 255 | Cards, surfaces, inputs. |

#### Provider Colors (Ecosystem)
These are used only in model/provider badge contexts:

| Provider | Hex |
|----------|-----|
| OpenAI | `#10A37F` |
| Anthropic | `#C084FC` |
| Google | `#4285F4` |
| Meta | `#0668E1` |
| Mistral | `#F43F5E` |
| DeepSeek | `#4D6BFE` |

#### Color Usage Rules
- **Dark backgrounds**: Use Deep Midnight (#0A1628), not pure black
- **Green for money**: Electric Mint is always associated with currency, savings, and financial values
- **Amber is rare**: Use Warm Amber for maximum 10% of any composition. It's for emphasis, not decoration
- **Never use blue and green as equal co-primaries**  - Electric Mint leads, Signal Blue supports
- **Contrast**: All text must meet WCAG AA contrast ratios (4.5:1 for body, 3:1 for large text)

---

### 2.3 Typography

#### Primary: Inter
- **Use for**: All UI, body text, navigation, forms, dashboards
- **Weights**: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)
- **Source**: Google Fonts

#### Display: Space Grotesk
- **Use for**: Marketing headlines, landing pages, pitch decks, large display text (24px+)
- **Weights**: 500 (Medium), 600 (SemiBold), 700 (Bold)
- **Source**: Google Fonts
- **Why**: More character and geometric energy than Inter at large sizes. Feels technical but warm.

#### Monospace: JetBrains Mono
- **Use for**: Code samples, API keys, numerical values, terminal output
- **Weights**: 400, 500
- **Source**: JetBrains

#### Type Scale (Dashboard / App)

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Page Title | Inter | 24px | 700 | 1.2 |
| Section Heading | Inter | 18px | 600 | 1.3 |
| Card Title | Inter | 14px | 600 | 1.4 |
| Body | Inter | 14px | 400 | 1.6 |
| Caption | Inter | 12px | 500 | 1.4 |
| Code / Numbers | JetBrains Mono | 13px | 400 | 1.5 |

#### Type Scale (Marketing / Landing)

| Element | Font | Size | Weight | Letter Spacing |
|---------|------|------|--------|----------------|
| Hero Headline | Space Grotesk | clamp(2.5rem, 6vw, 4.5rem) | 700 | -0.03em |
| Section Heading | Space Grotesk | clamp(1.75rem, 4vw, 2.75rem) | 700 | -0.02em |
| Subheading | Inter | 18px | 400 | 0 |
| Body | Inter | 16px | 400 | 0 |
| Label / Mono Tag | JetBrains Mono | 11px | 500 | 0.15em |

---

### 2.4 Spacing & Layout

#### Grid
- **Max content width**: 1100px (marketing), 1280px (dashboard)
- **Gutter**: 24px (desktop), 16px (mobile)
- **Section padding**: 96px vertical (desktop), 64px (mobile)

#### Border Radius
- **Buttons**: 8px
- **Cards**: 12px
- **Modals**: 16px
- **Pills/Tags**: 9999px (full round)
- **Inputs**: 8px

#### Shadows
- **Card**: `0 1px 3px rgba(10, 22, 40, 0.06)`
- **Card Hover**: `0 8px 32px rgba(10, 22, 40, 0.08)`
- **Dropdown**: `0 4px 16px rgba(10, 22, 40, 0.1)`
- **CTA Hover**: `0 4px 24px rgba(0, 229, 160, 0.25)`

---

### 2.5 Iconography

- **Style**: Lucide icons (outline, 1.5px stroke)
- **Size**: 16px (inline), 20px (buttons), 24px (feature blocks)
- **Color**: Inherit from text color. Never use filled/solid icons.

---

### 2.6 Imagery & Illustration Style

#### Do
- Use **line-based technical diagrams** for architecture, flow, and "how it works"
- Use **dark code blocks** with syntax highlighting to show the product
- Use **data dashboards** and real UI screenshots (the product is the hero)
- Use **geometric patterns** sparingly for backgrounds (dots, grids)

#### Don't
- No stock photos of people in offices
- No African-themed patterns, textures, or sunset imagery  - the brand is African by solving African problems, not by visual cliches
- No 3D renders, gradients-on-gradients, or "AI brain" imagery
- No illustrations of robots or AI assistants

---

## 3. Motion & Animation

### Principles
- **Subtle**: Animations enhance, never distract
- **Fast**: 120ms for micro-interactions, 300-400ms for reveals
- **Purposeful**: Every animation communicates state change

### Standard Animations
- **Fade Up**: Elements entering the viewport  - `translateY(8px)` to `0`, `opacity 0` to `1`, 400ms ease-out
- **Hover Lift**: Interactive cards  - `translateY(-2px)` with shadow increase
- **Scale In**: Pills and tags  - `scale(0.95)` to `1`, 300ms ease
- **Pulse**: Status indicators  - subtle opacity pulse, 2s infinite

### Don'ts
- No bouncing or elastic easing
- No animations longer than 500ms
- No auto-playing carousels or sliders
- Always respect `prefers-reduced-motion`

---

## 4. Application Examples

### Business Cards
- Front: **Deep Midnight** background, white "mazou." wordmark with Electric Mint dot, name and title in Inter 500
- Back: White background, contact details in Ink, Electric Mint accent line at top

### Email Signatures
```
[Name] | [Title]
mazou.  - AI infrastructure for Africa
team@mazou.ai | mazou.ai
```

### Social Media Avatar
- The logomark (white "m" + green dot on Deep Midnight square) at 400x400px
- No text, no tagline in avatar  - just the mark

### Presentation Slides
- Title slides: Deep Midnight background, white text, Electric Mint accents
- Content slides: White/Cloud background, Ink text, data in Signal Blue + Electric Mint
- Font: Space Grotesk for headings, Inter for body
- Always include the wordmark in bottom-left or top-left corner

---

## 5. Co-Branding Rules

- The Mazou logo should never appear smaller than a partner's logo
- Maintain minimum clear space between Mazou and partner logos
- Do not combine the Mazou logo with other logos in a single lockup
- Use the monochrome (white or Ink) version of the logo when placed on colored partner backgrounds

---

*Last updated: March 2026*
*Contact: team@mazou.ai*
