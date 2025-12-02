---
patterns:
  - apps/marketing/**
---

# Marketing Website Instructions

This Next.js 14 application serves as the primary marketing website for
PhoenixRooivalk.

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: CSS Modules + Tailwind CSS
- **Components**: React 18 with functional components and hooks

## Key Features

- Static site generation (SSG) for optimal performance
- Interactive threat simulator demo
- ROI calculator for enterprise customers
- Responsive design (mobile-first)
- Dark theme with tactical aesthetic

## Development Commands

```bash
# Start development server (port 3000)
pnpm --filter marketing dev

# Build static export
pnpm --filter marketing build

# Type check
pnpm --filter marketing typecheck

# Lint
pnpm --filter marketing lint
```

## Component Guidelines

### File Structure

```
apps/marketing/src/
├── app/              # App Router pages
├── components/       # React components
│   ├── ComponentName.tsx
│   └── ComponentName.module.css
└── lib/             # Utility functions
```

### Component Template

```tsx
import styles from "./ComponentName.module.css";

export interface ComponentNameProps {
  // Props interface
}

export const ComponentName: React.FC<ComponentNameProps> = (props) => {
  // Component implementation
  return <div className={styles.container}>{/* Content */}</div>;
};
```

## Styling Rules

1. **Always use CSS Modules** - No inline styles
2. **CSS Variables** - Use theme variables from `:root`
3. **Mobile-first** - Write mobile styles first, then add breakpoints
4. **Consistent Spacing** - Use 4px/8px grid system
5. **Dark Theme Default** - Orange/amber accents on dark backgrounds

### Color Palette

```css
--primary: 249 115 22; /* Orange accent */
--accent: 251 191 36; /* Amber highlight */
--bg-primary: 15 23 42; /* Dark background */
--bg-secondary: 9 10 15; /* Darker background */
--text-primary: 255 255 255; /* White text */
```

## Accessibility Requirements (Critical)

Every interactive component MUST include:

1. **ARIA Labels** - `aria-label` or `aria-labelledby`
2. **Keyboard Support** - Tab, Enter, Escape, Arrow keys
3. **Focus Management** - Visible focus indicators
4. **Screen Reader Support** - Proper semantic HTML
5. **Color Contrast** - Minimum 4.5:1 ratio

### Example

```tsx
<button
  aria-label="Start threat simulation"
  onClick={handleStart}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleStart();
    }
  }}
  className={styles.button}
>
  Start Simulation
</button>
```

## Performance Guidelines

1. **Image Optimization** - Always use Next.js `<Image>` component
2. **Code Splitting** - Dynamic imports for heavy components
3. **Bundle Size** - Keep route bundles under 200KB
4. **Lazy Loading** - Defer non-critical components

```tsx
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <div>Loading...</div>,
});
```

## Testing

### Component Tests

- Test rendering with different props
- Test user interactions (clicks, keyboard)
- Test accessibility features
- Use Vitest for testing

```typescript
import { render, screen } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

## Build and Deploy

- **Build Output**: `apps/marketing/out/` (static files)
- **Deploy Target**: Netlify
- **Build Command**: `pnpm --filter marketing build`
- **Environment Variables**: Set in Netlify dashboard
  - `NEXT_PUBLIC_DOCS_URL` - URL to documentation site

## Common Issues

1. **Hydration Errors** - Ensure server/client rendering matches
2. **Image Loading** - Use Next.js Image component with proper dimensions
3. **CSS Specificity** - Keep CSS Modules scoped, avoid global styles
4. **Bundle Size** - Check bundle analyzer if builds are slow

## Special Considerations

- **Defense Context** - Marketing materials must be appropriate for defense
  industry
- **Restricted Content** - Some technical details are for approved partners only
- **Compliance** - Follow responsible use guidelines in `RESPONSIBLE_USE.md`
