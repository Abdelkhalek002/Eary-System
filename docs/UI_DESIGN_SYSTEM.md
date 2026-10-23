# UI Design System Specification
## Project: Eary System – Language Words Hearing Assessment Platform

**Document Version:** 2.0.0  
**Status:** Approved / Active  
**Author / Team:** Eary Design & Frontend Engineering Team  
**Last Updated:** October 2026  

---

## 1. Design Vision & Foundations

The **Eary** design system combines clinical precision with a calming, accessible, and modern healthcare aesthetic. Designed for both pediatric and adult users in Arabic and English, the interface minimizes cognitive load during auditory testing while conveying diagnostic trust and authority.

### 1.1 Core Principles
- **Acoustic Focus & Zero Distraction**: High-contrast, clutter-free layouts that direct maximum focus to audio cues and word choices.
- **Bi-Directional Fluency (LTR / RTL)**: Native first-class support for English (LTR) and Arabic (RTL) typography, icon mirroring, and directional transitions.
- **Clinical Accessibility**: Large, distinct tap targets ($\ge 56\text{px}$) accommodating pediatric patients, elderly test-takers, and mobile touch devices.
- **Immediate Diagnostic Clarity**: Color-coded diagnostic badges (Excellent, Good, Fair, Poor) instantly communicating speech discrimination health.

---

## 2. Color Palette & Semantic Tokens

### 2.1 Brand & Primary Colors
| Token | CSS Variable | Hex | HSL | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Navy** | `--color-primary` | `#0F172A` | `hsl(222, 47%, 11%)` | Primary brand, main headings, deep backgrounds |
| **Clinical Teal** | `--color-brand-accent` | `#0D9488` | `hsl(175, 84%, 32%)` | Primary interactive buttons, active indicators, waves |
| **Teal Light** | `--color-brand-light` | `#CCFBF1` | `hsl(168, 84%, 90%)` | Subtle highlights, badges, selected card backdrops |
| **Ocean Blue** | `--color-secondary` | `#2563EB` | `hsl(217, 91%, 60%)` | Informational callouts, hyperlinks, active steps |

### 2.2 Diagnostic Tier Palette (Clinical Results)
| Tier | Token | Hex | Badge Background | Diagnostic Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Excellent** | `--tier-excellent` | `#059669` | `#ECFDF5` | Normal discrimination (90% – 100%) |
| **Good** | `--tier-good` | `#2563EB` | `#EFF6FF` | Slight impairment (76% – 88%) |
| **Fair** | `--tier-fair` | `#D97706` | `#FFFBEB` | Moderate discrimination difficulty (60% – 74%) |
| **Poor** | `--tier-poor` | `#DC2626` | `#FEF2F2` | Significant hearing handicap (< 60%) |

### 2.3 Neutral Surfaces & Borders
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--surface-canvas` | `#F8FAFC` | App page background |
| `--surface-card` | `#FFFFFF` | Primary elevated cards & modal sheets |
| `--surface-subtle` | `#F1F5F9` | Option background, audio bar container |
| `--border-subtle` | `#E2E8F0` | Card borders, dividers, subtle separators |
| `--border-focus` | `#0D9488` | Keyboard focus ring, selected radio state |
| `--text-primary` | `#0F172A` | High-contrast body & titles |
| `--text-muted` | `#64748B` | Subtitles, meta tags, timestamps |

---

## 3. Typography Hierarchy

### 3.1 Font Families
- **English Font (LTR)**: `'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
- **Arabic Font (RTL)**: `'Tajawal', 'Cairo', -apple-system, sans-serif`

### 3.2 Scale & Type Styles

| Style | English Size / Weight | Arabic Size / Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display 1** | `36px` / SemiBold (600) | `36px` / Bold (700) | `1.2` | Landing hero, final test score percentage |
| **Heading 1** | `28px` / SemiBold (600) | `28px` / Bold (700) | `1.3` | Page titles (Test Session, Diagnostic Report) |
| **Heading 2** | `22px` / Medium (500) | `22px` / Bold (700) | `1.35` | Card titles, section headers |
| **Word Option** | `24px` / Medium (500) | `26px` / Bold (700) | `1.4` | Test multiple-choice card text |
| **Body Regular**| `16px` / Regular (400) | `16px` / Regular (400) | `1.5` | Standard paragraphs, instruction labels |
| **Caption** | `13px` / Regular (400) | `13px` / Medium (500) | `1.4` | Timestamps, metadata, phonetic tags |

---

## 4. Spacing, Elevation & Radii

### 4.1 Spacing Scale (8pt Grid)
- `space-1`: `4px` | `space-2`: `8px` | `space-3`: `12px` | `space-4`: `16px`
- `space-6`: `24px` | `space-8`: `32px` | `space-12`: `48px` | `space-16`: `64px`

### 4.2 Border Radius
- `radius-sm`: `6px` (badges, tags)
- `radius-md`: `12px` (buttons, input fields)
- `radius-lg`: `16px` (word choice cards, modal dialogs)
- `radius-xl`: `24px` (audio player hub, summary score container)
- `radius-full`: `9999px` (avatar, play buttons, progress bar)

### 4.3 Shadows & Elevation
- `elevation-card`: `0 2px 4px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.06)`
- `elevation-hover`: `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.05)`
- `elevation-modal`: `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 10px 10px -5px rgba(15, 23, 42, 0.04)`

---

## 5. Core UI Component Specifications

### 5.1 Interactive Word Option Card
The primary decision component presented to test-takers:
- **Dimensions**: Min-height `72px`, full-width or 2-column grid.
- **Default State**: Background `--surface-card`, border `1.5px solid --border-subtle`, text `24px` (`26px` in Arabic).
- **Hover State**: Border `1.5px solid --color-brand-accent`, elevation `--elevation-hover`.
- **Selected State**: Background `--color-brand-light`, border `2px solid --color-brand-accent`, check indicator badge on right (LTR) / left (RTL).
- **Touch Active**: Scale transform `scale(0.98)` on tap.

### 5.2 Audio Player & Animated Waveform Hub
- **Central Play Action**: Circular button (`64px x 64px`), background `--color-brand-accent`, white sound wave icon.
- **Waveform Visualizer**: 5 animated vertical bars that dance when audio is playing (`pulseWave` keyframe animation) and freeze when audio finishes.
- **Replay Counter**: Subtle tag beneath: *"Click to replay (Played 1/2 times)"*.

### 5.3 Step Progress Bar
- **Header Tracker**: Displays current question progress: *"Word 7 of 20"*.
- **Visual Bar**: Height `8px`, track `--surface-subtle`, filled bar `--color-brand-accent` with smooth transition (`transition: width 300ms ease-out`).

### 5.4 Diagnostic Score Gauge & Tier Badge
- **Circular Donut Gauge**: Large central percentage indicator (e.g., `95%`), circumference animated on load.
- **Tier Badge**: Rounded pill container (`padding: 6px 16px`), bold uppercase font, dynamic color mapping:
  - *EXCELLENT*: Background `#ECFDF5`, text `#059669`.
  - *POOR*: Background `#FEF2F2`, text `#DC2626`.

### 5.5 Phoneme Confusion Error Chips
- **Display**: Pill chips in result view denoting error types:
  - Consonant Voicing (`[Voicing Error: /b/ vs /p/]`).
  - Place of Articulation (`[Place Error: /s/ vs /sh/]`).
  - Vowel Formant (`[Vowel Error: /i/ vs /e/]`).

---

## 6. Accessibility & Localization (RTL Guidelines)

1. **RTL Directional Flipping**:
   - Layout automatically mirrors when `dir="rtl"` is applied to `<html>`.
   - Margin/padding uses logical CSS properties (`margin-inline-start`, `padding-inline-end`).
   - Breadcrumbs, chevron icons, and navigation arrows mirror horizontally.
2. **Audio Indicators**:
   - Screen reader announcements (`aria-live="polite"`) when audio starts and finishes.
   - High-contrast visual sound ripple for hard-of-hearing or dual-sensory assistance.
3. **Keyboard Accessibility**:
   - Full keyboard navigation: Options selectable via number keys (`1`, `2`, `3`, `4`), Spacebar to replay audio, Enter to advance.
