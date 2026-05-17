---
name: Luminal Staging
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#b9c8de'
  on-secondary: '#233143'
  secondary-container: '#39485a'
  on-secondary-container: '#a7b6cc'
  tertiary: '#bcc7de'
  on-tertiary: '#263143'
  tertiary-container: '#8691a7'
  on-tertiary-container: '#1f2a3c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#d4e4fa'
  secondary-fixed-dim: '#b9c8de'
  on-secondary-fixed: '#0d1c2d'
  on-secondary-fixed-variant: '#39485a'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 16px
  gutter: 12px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  glass-padding: 16px
---

## Brand & Style
The design system is engineered for a premium, AI-driven real estate staging experience within the Telegram ecosystem. The brand personality is sophisticated, high-tech, and visionary, aiming to evoke a sense of "digital magic" as empty rooms transform into curated living spaces.

The visual style leverages **Glassmorphism** and **Modern Corporate** aesthetics. It utilizes deep, immersive slate backgrounds to let high-quality real estate imagery pop, while employing translucent layers and vibrant blue accents to guide user interaction. The interface feels lightweight yet powerful, mirroring the speed and intelligence of the underlying AI.

## Colors
The palette is rooted in a dark, professional "Deep Slate" environment that reduces eye strain and emphasizes visual content. 

- **Primary:** Vibrant Blue (#3B82F6) is used exclusively for calls to action, progress indicators, and active states.
- **Surface:** The background uses #0F172A, while elevated cards use a slightly lighter #1E293B or semi-transparent glass layers.
- **Accents:** Muted slates are used for secondary information to maintain a high-contrast hierarchy without cluttering the visual field.

## Typography
This design system uses **Inter** for all roles to ensure maximum legibility and a clean, technical feel. 

Headlines use tight letter spacing and heavy weights to command attention, particularly for property titles and AI status updates. Body text is kept airy with a 1.5x line height to ensure readability against dark backgrounds. Labels use a semi-bold weight and occasional uppercase styling to distinguish metadata from primary content.

## Layout & Spacing
As a Telegram Mini App, the layout is strictly **Fluid Grid**, optimized for mobile portrait orientations. 

Content is contained within a 16px side margin. The vertical rhythm follows an 8px base grid. Components such as image galleries and staging style selectors should use horizontal snapping carousels to maximize vertical real estate. Large-scale elements like AI "before/after" sliders should span the full width of the container.

## Elevation & Depth
Depth is created through **Glassmorphism** rather than traditional heavy shadows. 

1.  **Base Layer:** The deepest slate background (#0F172A).
2.  **Mid Layer:** Floating cards and containers use a semi-transparent fill (`rgba(30, 41, 59, 0.7)`) with a `backdrop-filter: blur(12px)`.
3.  **Top Layer:** Modals and bottom sheets use a more opaque fill with a subtle 1px inner border (stroke) of `rgba(255, 255, 255, 0.1)` to simulate light hitting the edge of the glass.

Shadows, where used for buttons, should be colored (Blue-tinted) and highly diffused to create a "glow" effect rather than a physical drop shadow.

## Shapes
The shape language is defined by **2xl rounded corners**. 

Standard cards and main UI containers use a 1rem (16px) radius. Buttons and input fields use a slightly more pronounced rounding to feel friendly and modern. This generous rounding balances the technical "coldness" of the dark theme, making the AI staging tool feel accessible and sophisticated.

## Components
- **Buttons:** Primary buttons are solid Blue (#3B82F6) with white text. Secondary buttons are "Ghost" style with a glass background and a 1px white-alpha border.
- **Inputs:** Text fields use a dark, inset appearance with 12px padding and a subtle blue focus ring.
- **Cards:** Property and style cards use the glassmorphism treatment. They include a subtle 1px border and a background blur to separate them from the main background.
- **Comparison Slider:** A signature component for this system. A vertical or horizontal handle allowing users to slide between the "Empty" and "Staged" versions of a room.
- **Chips:** Used for "Style Tags" (e.g., Scandi, Industrial, Modern). These are pill-shaped with low-opacity slate backgrounds and high-contrast text.
- **Bottom Sheets:** For selecting staging options. These must have a distinct "grabber" handle and a high backdrop-blur to dim the content behind them.