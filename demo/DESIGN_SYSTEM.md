# JSBSim Console Design System
## Fun & Unique Hobby Rocketry Theme with Light/Dark/System Mode

### Design Philosophy
**"Command Center Vibes"** — A playful, aerospace-inspired control center that makes rocket simulation feel like piloting a real mission. Blending technical precision with retro-futurism energy.

---

## Color System

### Base Palette (Semantic Tokens)

#### Light Mode (Aerospace Clean)
```css
/* Light Mode Colors */
--color-background: #FFFFFF          /* Clean white canvas */
--color-surface: #F8FAFC             /* Soft gray-blue surface */
--color-surface-variant: #EFF6FC     /* Slightly darker surface */
--color-on-surface: #0F172A          /* Deep navy text */
--color-on-surface-variant: #475569  /* Muted navy */

--color-primary: #0EA5E9            /* Sky blue (launch pad light) */
--color-on-primary: #FFFFFF          /* White on blue */
--color-primary-container: #E0F2FE  /* Light blue container bg */
--color-on-primary-container: #0369A1

--color-secondary: #06B6D4          /* Cyan (flight path tracking) */
--color-on-secondary: #FFFFFF
--color-secondary-container: #CFFAFE
--color-on-secondary-container: #0A505E

--color-accent: #F97316             /* Orange (thrust/flame) */
--color-on-accent: #FFFFFF
--color-accent-container: #FFEDD5
--color-on-accent-container: #7C2D12

--color-success: #10B981            /* Emerald (apogee reached, landing safe) */
--color-warning: #F59E0B            /* Amber (staging, burnout) */
--color-error: #EF4444              /* Red (engine cutoff, error) */
--color-info: #3B82F6               /* Blue (general info) */

--color-border: #E5E7EB             /* Subtle borders */
--color-divider: #D1D5DB            /* Section dividers */
--color-disabled: #9CA3AF           /* Disabled state */

--color-ring: #0EA5E9               /* Focus ring (sky blue) */
```

#### Dark Mode (Deep Space)
```css
/* Dark Mode Colors */
--color-background: #0B0B10         /* Deep space black */
--color-surface: #1A1A24            /* Card/panel surface */
--color-surface-variant: #2A2A35    /* Hover surface */
--color-on-surface: #F8FAFC         /* Bright white text */
--color-on-surface-variant: #CBD5E1 /* Muted white */

--color-primary: #38BDF8            /* Bright sky blue (pop on dark) */
--color-on-primary: #0F172A
--color-primary-container: #0C4A6E
--color-on-primary-container: #BAE6FD

--color-secondary: #06D6D6          /* Bright cyan (neon tracking) */
--color-on-secondary: #000000
--color-secondary-container: #164E63
--color-on-secondary-container: #CFFAFE

--color-accent: #FF8C42            /* Bright orange (flame glow) */
--color-on-accent: #0F172A
--color-accent-container: #7C2D12
--color-on-accent-container: #FFEDD5

--color-success: #34D399            /* Bright emerald */
--color-warning: #FBBF24            /* Bright amber */
--color-error: #F87171              /* Bright red */
--color-info: #60A5FA               /* Bright blue */

--color-border: #374151             /* Subtle borders on dark */
--color-divider: #4B5563            /* Section dividers */
--color-disabled: #6B7280           /* Disabled state */

--color-ring: #38BDF8               /* Focus ring (bright sky blue) */
```

#### Rocketry-Specific Tokens
```css
/* Flight Stages */
--stage-launch: #3B82F6              /* Blue: Ready to launch */
--stage-burnout: #FF6B6B             /* Red-orange: Engine burnout */
--stage-coast: #06B6D4               /* Cyan: Coasting phase */
--stage-apogee: #F59E0B              /* Amber: Apex reached */
--stage-descent: #8B5CF6             /* Purple: Coming down */
--stage-landing: #10B981             /* Green: Safe landing */

/* Telemetry Indicators */
--telemetry-altitude: #0EA5E9        /* Sky blue */
--telemetry-velocity: #06B6D4        /* Cyan */
--telemetry-acceleration: #8B5CF6    /* Purple */
--telemetry-pitch: #F97316           /* Orange */
--telemetry-thrust: #DC2626          /* Red (hot!) */

/* Data Visualization */
--chart-trajectory: #F97316          /* Orange trajectory line */
--chart-grid: rgba(148, 163, 184, 0.1)
--chart-altitude-zone-safe: rgba(16, 185, 129, 0.1)
--chart-altitude-zone-danger: rgba(239, 68, 68, 0.1)
```

---

## Typography

### Font Stack
```css
/* Headings: Fredoka (playful, geometric, space-age) */
--font-display: 'Fredoka', system-ui, sans-serif;
--font-weight-display-light: 400;
--font-weight-display-regular: 500;
--font-weight-display-bold: 700;

/* Body: Nunito (warm, approachable, readable) */
--font-body: 'Nunito', system-ui, sans-serif;
--font-weight-body-light: 300;
--font-weight-body-regular: 400;
--font-weight-body-medium: 500;
--font-weight-body-bold: 600;

/* Monospace: IBM Plex Mono (data readout, technical) */
--font-mono: 'IBM Plex Mono', monospace;
```

### Type Scale
```css
/* Display Sizes */
--text-display-lg: 3.75rem (60px) / 1.2 line-height / 700 weight   /* Hero heading */
--text-display: 3rem (48px) / 1.2 / 700                            /* Page title */
--text-display-sm: 2.25rem (36px) / 1.3 / 600                      /* Section title */

/* Heading Sizes */
--text-h1: 2rem (32px) / 1.3 / 700                  /* Main heading */
--text-h2: 1.5rem (24px) / 1.4 / 600                /* Subheading */
--text-h3: 1.25rem (20px) / 1.4 / 600               /* Section heading */
--text-h4: 1.125rem (18px) / 1.5 / 600              /* Component heading */
--text-h5: 1rem (16px) / 1.5 / 600                  /* Label heading */

/* Body Sizes */
--text-body-lg: 1.125rem (18px) / 1.6 / 400         /* Large body text */
--text-body: 1rem (16px) / 1.6 / 400                /* Regular body text */
--text-body-sm: 0.875rem (14px) / 1.5 / 400         /* Small body text */
--text-body-xs: 0.75rem (12px) / 1.5 / 400          /* Extra small text */

/* Label/UI Sizes */
--text-label-lg: 0.875rem (14px) / 1.43 / 500       /* Button label */
--text-label: 0.75rem (12px) / 1.4 / 600            /* UI label */
--text-label-sm: 0.625rem (10px) / 1.4 / 700        /* Badge label */

/* Caption/Data */
--text-caption: 0.75rem (12px) / 1.5 / 400          /* Caption text */
--text-code: 0.875rem (14px) / 1.5 / 400            /* Code/monospace */
--text-mono-data: 1rem (16px) / 1.5 / 500           /* Telemetry readout */
```

---

## Component Guidelines

### Buttons
**Light Mode:**
- **Primary:** Sky blue background (#0EA5E9) → white text → border-radius: 8px
- **Secondary:** Gray-blue surface → navy text → border: 1px #D1D5DB
- **Ghost:** Transparent → navy text → hover: light blue background
- **Destructive:** Red background (#EF4444) → white text

**Dark Mode:**
- **Primary:** Bright sky blue (#38BDF8) → navy text → same radius
- **Secondary:** Dark gray surface (#2A2A35) → white text → border: 1px #374151
- **Ghost:** Transparent → white text → hover: dark surface
- **Destructive:** Bright red (#F87171) → navy text

**Interaction:**
- Minimum 44×44px tap target
- 150ms transition on hover/focus
- Visible focus ring (4px outline, --color-ring)
- Disabled: 50% opacity + cursor: not-allowed

### Status Indicators
```
Launch (pending)      → #3B82F6 (sky blue)
Burnout (active)      → #FF6B6B (hot red-orange)
Coast (in progress)   → #06B6D4 (cyan)
Apogee (milestone)    → #F59E0B (amber glow)
Descent (active)      → #8B5CF6 (purple)
Landing (success)     → #10B981 (emerald)
Error                 → #EF4444 (red)
```

### Cards & Panels
**Light Mode:**
- Background: #F8FAFC
- Border: 1px #E5E7EB
- Border-radius: 12px
- Box-shadow: 0 1px 3px rgba(0,0,0,0.1)

**Dark Mode:**
- Background: #1A1A24
- Border: 1px #374151
- Border-radius: 12px
- Box-shadow: 0 1px 3px rgba(0,0,0,0.3)

### Input Fields
- Min height: 44px (touch target)
- Padding: 10px 12px
- Border: 2px (default), 2px #0EA5E9 (focus)
- Border-radius: 8px
- Transition: 150ms

### Focus States
- Outline: 4px solid --color-ring
- Outline-offset: 2px
- Always visible (never removed)
- Respects prefers-reduced-motion

---

## Light/Dark/System Mode Implementation

### CSS Variables Approach
```css
:root {
  /* Light mode as default */
  --color-background: #FFFFFF;
  --color-surface: #F8FAFC;
  --color-on-surface: #0F172A;
  /* ... all light tokens ... */
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark mode overrides */
    --color-background: #0B0B10;
    --color-surface: #1A1A24;
    --color-on-surface: #F8FAFC;
    /* ... all dark tokens ... */
  }
}

/* Manual dark mode toggle (if needed) */
[data-theme="dark"] {
  --color-background: #0B0B10;
  --color-surface: #1A1A24;
  --color-on-surface: #F8FAFC;
  /* ... */
}

[data-theme="light"] {
  --color-background: #FFFFFF;
  --color-surface: #F8FAFC;
  --color-on-surface: #0F172A;
  /* ... */
}
```

### React Implementation
```typescript
// useTheme hook
function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);
  
  return { theme, setTheme };
}
```

---

## Visual Effects & Animations

### Transitions
- **Micro-interactions:** 150ms (buttons, icons)
- **State changes:** 200ms (panels, modals)
- **Page transitions:** 300ms (nav, large content)
- **Easing:** cubic-bezier(0.4, 0, 0.2, 1) (Material standard)

### Shadows (Z-elevation)
**Light Mode:**
- Elevation-0: none
- Elevation-1: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)
- Elevation-2: 0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)
- Elevation-3: 0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)

**Dark Mode:**
- Elevation-1: 0 1px 3px rgba(0,0,0,0.4)
- Elevation-2: 0 3px 6px rgba(0,0,0,0.5)
- Elevation-3: 0 10px 20px rgba(0,0,0,0.6)

### Glow Effects (Rocketry Theme)
```css
/* Launch pad glow (subtle) */
.launch-ready {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

/* Thrust active (hot!) */
.thruster-active {
  box-shadow: 0 0 30px rgba(239, 68, 68, 0.4), inset 0 0 10px rgba(249, 115, 22, 0.2);
}

/* Flight stage achieved */
.stage-success {
  animation: pulse-glow 1s ease-out;
}

@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  100% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
}
```

---

## Spacing System
```css
--space-xs: 4px
--space-sm: 8px
--space-md: 12px
--space-lg: 16px
--space-xl: 24px
--space-2xl: 32px
--space-3xl: 48px
--space-4xl: 64px
```

---

## Rocketry-Specific UI Patterns

### Flight Stage Indicator
- Visual timeline showing: Launch → Burnout → Coast → Apogee → Descent → Landing
- Each stage as a pill/badge with rocketry-specific color
- Current stage highlighted with glow effect
- Timestamp displayed for completed stages

### Telemetry Display
- Monospace font (IBM Plex Mono) for data precision
- Color-coded by type (altitude=blue, velocity=cyan, etc.)
- Large enough for quick scanning: min 14px
- Live value with unit clearly visible

### Trajectory Map
- Orange/red trajectory line (contrast with blue/green map)
- Launch point: teal marker
- Current position: bright orange marker
- Altitude zone shading (safe/danger)

### Control Panel
- Rocket icon above action buttons (playful touch)
- Speed controls as labeled buttons (1×, 2×, 5×, 10×, MAX)
- Property inspector with searchable list
- Buttons organized: Primary (Launch) → Secondary (Pause/Resume/Step) → Ghost (Reload)

### Event Feed
- Monospace timestamps (t=X.XXs format)
- Color-coded badges: STAGE (teal), LOG (gray), ALERT (amber)
- Subtle background color per event level (info/warn/error)
- Auto-scroll with "↓ Latest" button when scrolled up

---

## Accessibility Checklist
- [ ] Minimum 4.5:1 contrast ratio for all text (verified in both light/dark)
- [ ] Focus rings always visible (4px outline, never removed)
- [ ] Touch targets minimum 44×44px
- [ ] All interactive elements keyboard-navigable
- [ ] Semantic HTML (buttons, labels, forms)
- [ ] ARIA labels for icon-only buttons
- [ ] prefers-reduced-motion respected (no unnecessary animations)
- [ ] Color not the only indicator (use icons + text)
- [ ] Form labels persistent (not placeholder-only)
- [ ] Error messages clear and near field

---

## Anti-Patterns (Avoid)
- ❌ Emoji as icons (use SVG only)
- ❌ Generic vibe-coded design (must feel rocketry-specific)
- ❌ Light mode and dark mode designed separately (design together)
- ❌ Hover-only interactions (must work on touch)
- ❌ Fixed layout widths (must be responsive)
- ❌ Gray-on-gray text (contrast must be readable)
- ❌ Animations longer than 300ms (feels sluggish)
- ❌ No loading feedback on async operations
- ❌ Disabled state looks clickable

---

## Next Steps
1. Update CSS variables in styles.css
2. Implement light/dark mode toggle in UI
3. Replace all hardcoded colors with semantic tokens
4. Add rocketry-themed visual elements (glow effects, stage indicators)
5. Test at: 375px, 768px, 1024px, 1440px
6. Verify contrast in both light and dark modes
7. Test with prefers-reduced-motion enabled
