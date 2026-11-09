# EU Bite UI & Design System Specification (`project_ui.md`)

This document defines the official visual identity, color palette, typography, and component styling standards across all four EU Bite applications (`landing-page`, `vendor`, `rider`, and `admin`).

---

## 1. Official Brand Color Palette

All interfaces in the EU Bite ecosystem use the following four-color palette as the default theme:

| Swatch | Hex Code | RGB | Semantic Role | Tailwind Token | Usage Guidelines |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ** Primary Coral Orange** | `#FE724C` | `rgb(254, 114, 76)` | **Primary Brand & Action** | `brand-orange` / `primary` / `emerald-*` | Primary CTA buttons, brand logos, active navigation indicators, prices, and interactive links. |
| ** Golden Amber Yellow** | `#FFC529` | `rgb(255, 197, 41)` | **Secondary Accent & Highlight** | `brand-yellow` / `secondary` / `amber-*` | Status badges, star ratings, delivery PIN highlights, live radar pulses, and secondary callouts. |
| ** Charcoal Slate Dark** | `#272D2F` | `rgb(39, 45, 47)` | **Dark Surface & Primary Text** | `brand-dark` / `slate-900` / `slate-950` | Primary typography, dark mode cards, navigation headers, footers, and rider/admin dark surfaces. |
| ** Soft Neutral Grey** | `#D7D7D7` | `rgb(215, 215, 215)` | **Neutral Border & Muted Surface** | `brand-grey` / `slate-200` / `slate-300` | Card borders, dividers, input outlines, disabled states, and subtle background containers. |

### CSS Custom Properties (`:root`)
```css
:root {
  --font-pinterest-sans: 'pinterest-sans';
  --color-primary: #FE724C;
  --color-secondary: #FFC529;
  --color-dark: #272D2F;
  --color-grey: #D7D7D7;
}
```

---

## 2. Typography

- **Exclusive Font Family:** `pinterest-sans` (Pinterest Sans)
- **Local Font Assets:** Hosted locally in `/public/fonts/Pin-Sans-*.woff2` across all four portals (`Regular`, `Regular-Italic`, `Medium`, `Medium-Italic`, `Bold`, `Bold-Italic`, `Heavy`, `Heavy-Italic`).
- **Font Weights:**
  - `300 - 400`: Regular body copy (`Pin-Sans-Regular.woff2`)
  - `500 - 600`: Medium UI labels, navigation links, and table cells (`Pin-Sans-Medium.woff2`)
  - `700 - 800`: Bold section headings, card titles, and buttons (`Pin-Sans-Bold.woff2`)
  - `900`: Heavy hero headlines, KPIs, and security PIN displays (`Pin-Sans-Heavy.woff2`)

---

## 3. Component & Portal Styling Rules

1. **Buttons & Interactive Controls**
   - **Primary CTA:** Background `#FE724C`, text `#FFFFFF` (or `#272D2F` on `#FFC529` buttons), hover state darkened `#e85d38`.
   - **Secondary / Highlight CTA:** Background `#FFC529`, text `#272D2F`, bold weight.
   - **Dark Action Pill:** Background `#272D2F`, text `#FFFFFF`, hover background `#FE724C`.

2. **Cards, Surfaces & Borders**
   - **Light Cards:** White `#FFFFFF` surface with `1px solid #D7D7D7` border and subtle hover border `#FE724C`.
   - **Dark Keynote / Terminal Cards:** `#272D2F` surface with `#FFC529` and `#FE724C` accents and `#D7D7D7` muted text.

3. **Portal Consistency**
   - **Student Landing & Checkout (`landing-page`):** Warm, appetizing `#FE724C` and `#FFC529` accents paired with clean `#272D2F` typography and `#D7D7D7` structural borders.
   - **Vendor Kitchen Portal (`vendor`):** High-contrast order queue cards using `#FE724C` primary actions, `#FFC529` preparation badges, and `#272D2F` headers.
   - **Rider Courier Portal (`rider`):** Dark `#272D2F` mobile-first dispatch interface with high-visibility `#FFC529` and `#FE724C` action buttons and PIN verification modals.
   - **Admin Operations Portal (`admin`):** `#272D2F` top command bar, `#D7D7D7` table/card borders, `#FE724C` primary controls, and `#FFC529` operational highlights.

