---
name: Logistics Intelligence
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e2'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fc'
  surface-container: '#ededf6'
  surface-container-high: '#e7e7f0'
  surface-container-highest: '#e2e2eb'
  on-surface: '#191b22'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3037'
  inverse-on-surface: '#f0f0f9'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#585f6c'
  on-secondary: '#ffffff'
  secondary-container: '#dce2f3'
  on-secondary-container: '#5e6572'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dce2f3'
  secondary-fixed-dim: '#c0c7d6'
  on-secondary-fixed: '#151c27'
  on-secondary-fixed-variant: '#404754'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#191b22'
  surface-variant: '#e2e2eb'
  surface-background: '#FFFFFF'
  border-subtle: '#E5E7EB'
  text-primary: '#0F1117'
  text-secondary: '#6B7280'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  mono-label:
    fontFamily: courierPrime
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1'
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system is built for the high-stakes, data-intensive environment of logistics and route planning. It prioritizes clarity, speed, and precision over decorative elements.

The style is **Professional Minimalism**, heavily inspired by modern productivity tools. It utilizes a "Utility-First" aesthetic: every pixel must serve a functional purpose. By leveraging significant whitespace and a restrained color palette, the system reduces cognitive load for users managing complex trip schedules. The visual language is defined by sharp lines, subtle dividers, and a rigid adherence to a structured grid, creating an environment that feels both high-tech and dependable.

## Colors

The palette is strictly functional, optimized for readability and focus. 

- **Primary:** Steel Blue (#2563EB) is reserved for interactive states, primary actions, and critical data highlights. It is the "signal" within the noise.
- **Surface:** Pure White (#FFFFFF) is used for all primary backgrounds to ensure maximum contrast for text and data.
- **Text:** Deep Charcoal (#0F1117) provides a premium, high-contrast feel for headings and primary information. Slate Gray (#6B7280) is used for metadata and secondary context.
- **Borders:** A consistent light gray (#E5E7EB) defines the structure without visual heaviness.

## Typography

The typography system relies on **Inter** to deliver a neutral, highly legible experience. 

- **Headings:** Use tight letter-spacing (`-0.01em` to `-0.02em`) and semi-bold weights to create a dense, authoritative feel.
- **Body Text:** Use generous line-heights (`1.6`) to improve readability in data-heavy views. 
- **Data Display:** For coordinates, truck IDs, or timestamps, use a monospaced font (Courier Prime) to ensure character alignment and a technical aesthetic.

## Layout & Spacing

The design system operates on an **8px base grid**. Layouts should be structured using a **Fixed Grid** model for desktop dashboards to maintain data density control, while reflowing to a fluid single-column layout for mobile drivers.

- **Desktop:** 12-column grid with 16px gutters and 32px margins. 
- **Data Tables:** Use compact vertical spacing (8px) but generous horizontal padding within cells (16px) to maintain a "clean" feel despite high density.
- **White Space:** Use whitespace as a separator instead of lines where possible to keep the interface light.

## Elevation & Depth

This system avoids traditional depth markers like heavy shadows or gradients. 

- **Layers:** Use **Tonal Layers** to establish hierarchy. Surfaces are flat white; background areas for sidebars or secondary panels use a very subtle light gray or are simply separated by 1px borders (#E5E7EB).
- **Shadows:** Restricted exclusively to **Modals** and **Popovers**. Shadows must be light, diffused, and neutral (e.g., `0px 10px 15px -3px rgba(0,0,0,0.05)`).
- **Borders:** Hierarchy is primarily communicated through 1px solid borders.

## Shapes

The shape language is disciplined and geometric. 

- **Radius:** A maximum border radius of **6px** (Soft) is applied to cards, buttons, and inputs. 
- **Consistency:** All interactive elements must share the same corner radius to maintain a cohesive, "tooled" appearance.

## Components

- **Buttons:** 
  - **Primary:** Solid Steel Blue (#2563EB) background, white text. Height is strictly 44px for accessibility. 
  - **Secondary:** Ghost style. No background, 1px border in Steel Blue, Steel Blue text. 
- **Inputs:** A unique "Minimalist" style. No containing box; 1px bottom border only (#E5E7EB). On focus, the bottom border transitions to Steel Blue. Labels are 12px Medium, positioned above the input.
- **Cards:** White background, 1px solid #E5E7EB border, 6px radius. No shadows. Use for grouping route segments or vehicle stats.
- **Chips/Status:** Small (24px height), low-saturation backgrounds with high-contrast text to indicate log status (e.g., "Active", "Duty", "Rest").
- **Icons:** Use Lucide-style line icons. 20px size, 1.5px stroke weight. Icons should always be the same color as the text they accompany.
- **Data Tables:** Header rows should have a light gray background tint or a slightly thicker bottom border (2px) to ground the data columns.