---
name: Ethereal Aura
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#4a454f'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#7c7480'
  outline-variant: '#cdc3d0'
  surface-tint: '#6f5092'
  primary: '#6f5092'
  on-primary: '#ffffff'
  primary-container: '#d8b4fe'
  on-primary-container: '#604283'
  inverse-primary: '#dbb8ff'
  secondary: '#006686'
  on-secondary: '#ffffff'
  secondary-container: '#7ed4fd'
  on-secondary-container: '#005b78'
  tertiary: '#8a486f'
  on-tertiary: '#ffffff'
  tertiary-container: '#fcaad6'
  on-tertiary-container: '#793a60'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#efdbff'
  primary-fixed-dim: '#dbb8ff'
  on-primary-fixed: '#29074a'
  on-primary-fixed-variant: '#573878'
  secondary-fixed: '#c0e8ff'
  secondary-fixed-dim: '#7bd1fa'
  on-secondary-fixed: '#001e2b'
  on-secondary-fixed-variant: '#004d66'
  tertiary-fixed: '#ffd8ea'
  tertiary-fixed-dim: '#ffaeda'
  on-tertiary-fixed: '#3a0329'
  on-tertiary-fixed-variant: '#6f3157'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: 0em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  container-padding-mobile: 20px
  container-padding-desktop: 40px
  gutter: 16px
  element-gap: 12px
---

## Brand & Style
The design system embodies a "Romance-Tech" aesthetic—a fusion of high-end technology and soft, emotive human connection. The visual direction is anchored in **Glassmorphism**, utilizing translucent layers and heavy backdrop blurs to create a sense of depth and lightness. 

The emotional response is one of "AI Magic": professional and modern yet dreamy and ethereal. The target audience values sophisticated, high-fidelity interfaces that feel premium and approachable. Key visual markers include:
- **Ethereal Atmosphere:** Iridescent gradients and blurred cloud motifs in the background.
- **Holographic Details:** 3D icons with translucent, light-refracting qualities.
- **Refined Precision:** Ultra-thin borders and generous letter spacing to convey luxury and technical excellence.

## Colors
The palette is a sophisticated "Light Mode" execution of iridescent pastels. The background is never solid; it uses soft, sweeping gradients of **Lilac (Primary)**, **Azure (Secondary)**, and **Rose (Tertiary)**.

- **Surface Strategy:** UI containers use a semi-transparent white (40-60% opacity) with a mandatory backdrop-blur (minimum 24px) to ensure legibility over the ethereal background.
- **Accents:** Use gradients for primary actions, mixing Lilac and Azure to create a "glowing" effect.
- **Typography:** Deep Slate/Indigo is used for text to maintain high contrast and accessibility against the light, shimmering surfaces.

## Typography
The system uses **Plus Jakarta Sans** for its modern, clean, yet friendly geometric construction. 

- **Styling:** Headlines should utilize tighter tracking for a premium "editorial" look, while body text and labels benefit from generous tracking to enhance readability against glass textures.
- **Hierarchy:** High-fidelity weights (600/700) are reserved for key information markers. 
- **Mobile Adaptivity:** For mobile screens, `display-lg` should scale down to 36px to prevent awkward text wrapping, maintaining the same line-height ratio.

## Layout & Spacing
The layout follows a **Fluid Grid** model with high internal margins to reinforce the "airy" and "ethereal" brand personality. 

- **Desktop:** 12-column grid with 24px gutters and 80px side margins.
- **Mobile:** 4-column grid with 16px gutters and 20px side margins.
- **Rhythm:** Spacing follows an 8px base unit. Containers should feel "un-crowded," often utilizing 32px or 40px internal padding to let the glass textures breathe. Elements are grouped using tight gaps (12px) but separated by large structural white space (48px+).

## Elevation & Depth
Depth in this design system is created through **Backdrop Refraction** rather than traditional drop shadows.

- **Layer 0 (Background):** Moving iridescent gradients with soft, blurred cloud assets.
- **Layer 1 (Standard Card):** 40% White fill, 24px Backdrop Blur, 1px Solid White Border (20% opacity).
- **Layer 2 (Floating/Active):** 60% White fill, 40px Backdrop Blur, 1px Iridescent Gradient Border. Use a very soft, diffused ambient glow (#D8B4FE at 10% opacity) instead of a black shadow.
- **Layer 3 (Modals/Overlays):** 80% White fill, 64px Backdrop Blur. Background behind the modal is dimmed with a 10% saturation boost to the underlying colors.

## Shapes
The shape language is defined by extreme **Roundedness** to evoke softness and safety.

- **Primary Radius:** 24px for cards, chat bubbles, and main containers.
- **Secondary Radius:** 16px for smaller elements like input fields and list items.
- **Full Radius:** Buttons and chips always use a pill-shape (999px).
- **Borders:** All borders are ultra-thin (1px). For primary elements, use a linear gradient border (Azure to Lilac) at 40% opacity to mimic light catching the edge of a glass pane.

## Components
- **Buttons:** Primary buttons feature a soft Lilac-to-Azure gradient with white text. Secondary buttons are glassmorphic with a 1px iridescent border.
- **Input Fields:** Semi-transparent white background (20% opacity) with 24px blur. The active state is signaled by the border gradient increasing in opacity.
- **Chips:** Small pill-shaped containers with high transparency and `label-sm` typography. Used for tags like "AI Matching" or "Compatible."
- **Cards:** Large 24px corner radius. They must include a subtle internal "inner glow" (1px white top-left) to simulate a glass edge.
- **3D Icons:** Use holographic-style iconography with translucent materials. These icons should "break" the container bounds occasionally to add to the magical, 3D feel of the UI.
- **Progress Bars:** Use a "glowing" gradient fill that looks like liquid light within a frosted glass tube.