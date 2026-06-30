---
name: Luminous Romance-Tech
colors:
  surface: '#fcf8ff'
  surface-dim: '#d8d7fb'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#efecff'
  surface-container-high: '#e8e6ff'
  surface-container-highest: '#e2dfff'
  on-surface: '#181934'
  on-surface-variant: '#48464b'
  inverse-surface: '#2d2e4a'
  inverse-on-surface: '#f2efff'
  outline: '#79767c'
  outline-variant: '#cac5cb'
  surface-tint: '#615c69'
  primary: '#615c69'
  on-primary: '#ffffff'
  primary-container: '#f8f0ff'
  on-primary-container: '#716c79'
  inverse-primary: '#cbc4d2'
  secondary: '#50616b'
  on-secondary: '#ffffff'
  secondary-container: '#d3e5f2'
  on-secondary-container: '#566772'
  tertiary: '#665c60'
  on-tertiary: '#ffffff'
  tertiary-container: '#feeff4'
  on-tertiary-container: '#766c70'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e7e0ee'
  primary-fixed-dim: '#cbc4d2'
  on-primary-fixed: '#1d1a24'
  on-primary-fixed-variant: '#494550'
  secondary-fixed: '#d3e5f2'
  secondary-fixed-dim: '#b7c9d5'
  on-secondary-fixed: '#0c1d27'
  on-secondary-fixed-variant: '#384953'
  tertiary-fixed: '#eddfe4'
  tertiary-fixed-dim: '#d1c3c8'
  on-tertiary-fixed: '#211a1d'
  on-tertiary-fixed-variant: '#4e4448'
  background: '#fcf8ff'
  on-background: '#181934'
  surface-variant: '#e2dfff'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding-mobile: 20px
  container-padding-desktop: 64px
  gutter: 24px
  glass-padding: 1.5rem
---

## Brand & Style

The brand personality is a fusion of high-end cinematic elegance and futuristic AI intelligence. It aims to evoke a sense of "digital magic"—an experience that feels both ethereal and deeply human. This design system moves away from physical metaphors like stickers or paper, embracing a **Luminous Glassmorphism** style that prioritizes light, transparency, and depth.

The target audience seeks a sophisticated, professional matchmaking environment where technology feels like a warm, invisible guide. The visual language utilizes pearlescent finishes, holographic accents, and high-fidelity frosted textures to create a premium atmosphere that justifies its "Front-end Gold Award" ambition.

## Colors

The palette is rooted in **Soft Pearlescent Whites** and **Ethereal Glows**. Rather than solid blocks of color, the system relies on subtle chromatic shifts:

- **Primary (Pearlescent Lilac):** Used for soft background glows and primary glass tinting.
- **Secondary (Atmospheric Blue):** Injected into secondary interactive elements to provide a sense of calm and technical precision.
- **Tertiary (Warm Pink):** Used sparingly to denote romance, heart-actions, and emotional connectivity.
- **Neutral:** A deep, desaturated violet-grey used for high-readability text, ensuring the futuristic aesthetic remains accessible.
- **Holographic Accents:** Iridescent gradients are applied to high-impact moments like "Match Found" or "AI Analysis" to create a sense of premium magic.

## Typography

Typography focuses on **Precise Tracking and Leading** to maintain a futuristic yet legible feel. 

- **Display & Headlines:** Using *Plus Jakarta Sans* for its soft, welcoming geometry. Tracking is tightened in larger sizes to create a cinematic, editorial look.
- **Body:** *Hanken Grotesk* provides a sharp, contemporary edge that balances the softness of the glass UI, ensuring long-form content (like bios) remains highly readable.
- **Technical Labels:** *Geist* is used for AI-driven data points, compatibility scores, and timestamps. Its monospaced-influenced proportions convey a sense of "Tech" precision.

## Layout & Spacing

The layout philosophy is **Floating Fluidity**. Elements should never feel "locked" to a rigid grid; instead, they float as layered panes over a soft, atmospheric background.

- **Grid:** A 12-column fluid system for desktop, transitioning to a single-column stack for mobile with generous 20px side margins.
- **Rhythm:** An 8px base unit is used, but internal padding for glass containers is intentionally oversized (1.5rem+) to allow the frosted textures room to breathe.
- **Safe Areas:** Deep vertical padding (80px+) between major sections ensures the UI feels "high-end" and unhurried.

## Elevation & Depth

Depth is the core differentiator of this design system. It is achieved through **Advanced Glassmorphism**:

- **Frosted Textures:** Surfaces use a high-refraction backdrop blur (30px-50px) with a semi-transparent white tint (opacity 0.4 to 0.7).
- **Iridescent Borders:** Every container is framed by an ultra-thin (1px or 0.5px) border. These borders use a linear gradient with 40% opacity, simulating the way light catches the edge of a glass prism.
- **Holographic Shadows:** Instead of black shadows, use "Glow Shadows"—diffused, low-opacity colored blurs (Lilac or Blue) that match the element's primary accent.
- **Layering:** Backgrounds should feature organic, animated "blobs" of pink and blue light that move slowly, creating a sense of cinematic life behind the glass panes.

## Shapes

The shape language is **Organic & Refined**. 

- **Containers:** Standard radius is 1rem (16px), providing a balance between modern structure and approachable softness.
- **Interactive Elements:** Buttons and input fields use a slightly more aggressive "Pill" shape (rounded-xl) to distinguish them from the informational glass panes.
- **3D Accents:** Icons and AI indicators should utilize soft 3D volumes—spheres and toruses with pearlescent shading rather than flat vector glyphs.

## Components

- **Glass Buttons:** Primary buttons feature the holographic gradient with a subtle white inner glow. Hover states should "brighten" the iridescence rather than changing the color.
- **Input Fields:** Translucent surfaces with an iridescent "active" border. The cursor and focus state should emit a soft lilac glow.
- **Match Cards:** Use a stacked glass effect. The user's photo is nested within a frosted frame, creating a "picture-in-picture" depth.
- **Compatibility Score:** Represented by a holographic semi-circle gauge. The needle is a thin light-streak.
- **Chips/Badges:** Small, high-blur glass pills with `label-caps` typography to denote interests or AI tags.
- **Navigation Bar:** A floating glass dock at the bottom of the screen, separated from the edge by 16px, using backdrop-blur to allow content to scroll behind it beautifully.