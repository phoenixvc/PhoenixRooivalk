# GitHub Copilot Instructions for PhoenixRooivalk

## Project Overview

PhoenixRooivalk is a next-generation modular counter-Unmanned Aircraft System
(c-UAS) defense platform delivering autonomous drone threat detection and
neutralization with sub-200ms response times. The system operates autonomously
even in complete RF-denied/GPS-denied environments.

**Key Technologies:**

- **Frontend**: React, Next.js 14, TypeScript, Leptos (Rust WASM)
- **Backend**: Rust, Solana blockchain, EtherLink
- **Monorepo**: Turborepo + pnpm workspace
- **Testing**: Vitest, Rust cargo test
- **Styling**: CSS Modules, Tailwind CSS
- **Documentation**: Docusaurus

## Repository Structure

```
PhoenixRooivalk/
├── apps/
│   ├── marketing/          # Next.js marketing website
│   ├── docs/              # Docusaurus documentation site
│   ├── threat-simulator-desktop/  # Leptos + Tauri simulator
│   ├── api/               # Rust API server
│   └── keeper/            # Blockchain keeper service
├── packages/
│   └── ui/                # Shared React components
├── crates/                # Shared Rust libraries
└── .github/               # CI/CD workflows
```

## Coding Standards

### TypeScript/JavaScript

1. **Always use TypeScript** with strict mode enabled
2. **Functional components** with hooks (no class components)
3. **Named exports** preferred over default exports
4. **Type everything** - avoid `any`, use proper interfaces/types
5. **CSS Modules** for component styling (not inline styles)
6. **Accessibility first** - proper ARIA labels, semantic HTML, keyboard
   navigation

### Code Style

```typescript
// ✅ GOOD: Named export, proper types, ARIA support
export interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = "primary",
  disabled = false,
}) => {
  return (
    <button
      className={styles[variant]}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      type="button"
    >
      {label}
    </button>
  );
};
```

### Rust

1. **Follow Rust conventions** - snake_case for functions, PascalCase for types
2. **Error handling** - use `Result<T, E>` and `?` operator, avoid panics
3. **Documentation** - add doc comments for public APIs
4. **Testing** - write unit tests for business logic
5. **Clippy compliance** - fix all clippy warnings

```rust
// ✅ GOOD: Proper error handling, documented
/// Validates a weapon deployment against system constraints
///
/// # Arguments
/// * `weapon_type` - The type of weapon to deploy
/// * `energy_available` - Current energy in joules
///
/// # Returns
/// * `Ok(())` if deployment is valid
/// * `Err(DeploymentError)` if constraints violated
pub fn validate_deployment(
    weapon_type: WeaponType,
    energy_available: f64,
) -> Result<(), DeploymentError> {
    if energy_available < weapon_type.energy_cost() {
        return Err(DeploymentError::InsufficientEnergy);
    }
    Ok(())
}
```

## UI/UX Design Patterns

### Component Architecture

1. **Atomic Design** - Break UI into atoms, molecules, organisms
2. **Component Composition** - Build complex UIs from simple components
3. **Props over State** - Pass data down, lift handlers up
4. **Custom Hooks** - Extract reusable logic

### Accessibility (WCAG AA+ Standard)

**ALWAYS include:**

- `aria-label` or `aria-labelledby` for interactive elements
- `role` attributes for custom controls
- `aria-live` regions for dynamic content
- Keyboard navigation support (Tab, Arrow keys, Enter, Escape)
- Focus management for modals and overlays
- Color contrast ratio ≥ 4.5:1 for normal text
- Screen reader announcements for important changes

```tsx
// ✅ GOOD: Complete accessibility
<button
  role="switch"
  aria-checked={isEnabled}
  aria-label="Enable tactical grid overlay"
  onClick={toggleGrid}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleGrid();
    }
  }}
>
  <span className={styles.switchIndicator} aria-hidden="true" />
  Grid Overlay
</button>
```

### Styling Best Practices

1. **CSS Modules** for component-scoped styles
2. **CSS Variables** for theme colors and spacing
3. **Mobile-first** responsive design
4. **Consistent spacing** - use 4px/8px grid system
5. **Dark theme** default (military/tactical aesthetic)

**Color Palette:**

```css
:root {
  /* Primary - Orange/Amber tactical accent */
  --primary: 249 115 22;
  --accent: 251 191 36;

  /* Background - Dark tactical gradient */
  --bg-primary: 15 23 42;
  --bg-secondary: 9 10 15;
  --darker: 6 8 12;

  /* Text */
  --text-primary: 255 255 255;
  --text-secondary: 203 213 225;
  --text-muted: 148 163 184;

  /* Status colors */
  --success: 74 222 128;
  --warning: 251 191 36;
  --error: 239 68 68;
  --info: 96 165 250;
}
```

### Visual Hierarchy

1. **Typography Scale**
   - Headings: 3rem/2.5rem/2rem/1.5rem/1.25rem
   - Body: 1rem (16px)
   - Small: 0.875rem (14px)
   - Monospace for metrics/numbers

2. **Grid Visibility** - Tactical grid overlay at 0.25 opacity
3. **Section Alignment** - All sections: max-width 1400px, padding 5%
4. **Button Hierarchy**:
   - Primary: Orange gradient, prominent
   - Secondary: Gray background
   - Ghost: Transparent, minimal
   - Danger: Red, isolated placement

## Performance Optimization

### React/Next.js

1. **Code Splitting** - Dynamic imports for heavy components
2. **Image Optimization** - Use Next.js Image component
3. **Memoization** - useMemo/useCallback for expensive operations
4. **Lazy Loading** - Load components as needed
5. **Bundle Analysis** - Keep bundle <200KB per route

### Rust/WASM

1. **wasm-pack** for builds
2. **Minimize WASM size** - use release optimizations
3. **Async operations** for I/O
4. **Memory management** - avoid unnecessary clones

## Testing Guidelines

### Frontend Tests

```typescript
// ✅ GOOD: Comprehensive component test
describe("EventFeed", () => {
  it("displays severity indicators correctly", () => {
    const events = [
      { severity: "critical", message: "System alert" },
      { severity: "warning", message: "Check sensors" },
    ];

    render(<EventFeed events={events} />);

    expect(screen.getByText("🔴")).toBeInTheDocument();
    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });

  it("announces new events to screen readers", () => {
    const { container } = render(<EventFeed events={[]} />);
    const liveRegion = container.querySelector('[aria-live="polite"]');

    expect(liveRegion).toBeInTheDocument();
  });
});
```

### Rust Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_weapon_deployment_validation() {
        let weapon = WeaponType::Kinetic;
        let result = validate_deployment(weapon, 1000.0);
        assert!(result.is_ok());

        let result = validate_deployment(weapon, 10.0);
        assert!(result.is_err());
    }
}
```

## Git Commit Conventions

Use conventional commits format:

```
feat: Add tactical grid overlay to hero section
fix: Resolve header gap spacing issue
docs: Update README with installation steps
style: Apply Prettier formatting to CSS modules
refactor: Extract button variants into separate components
test: Add accessibility tests for control bar
perf: Optimize grid rendering performance
chore: Update dependencies to latest versions
```

## Common Tasks

### Adding a New Component

1. Create component file: `ComponentName.tsx`
2. Create styles: `ComponentName.module.css`
3. Add tests: `ComponentName.test.tsx`
4. Export from `index.ts`
5. Document props with JSDoc comments
6. Include accessibility features
7. Add to Storybook (if applicable)

### Fixing UI Issues

1. **Check accessibility first** - screen readers, keyboard nav
2. **Verify responsive design** - mobile, tablet, desktop
3. **Test color contrast** - use browser DevTools
4. **Check grid alignment** - all sections should align at 1400px
5. **Validate against reference designs** - match spacing, colors

### Performance Issues

1. **Profile with React DevTools** - identify re-renders
2. **Check bundle size** - use webpack-bundle-analyzer
3. **Optimize images** - WebP format, proper sizing
4. **Lazy load** - code split heavy components
5. **Memoize** - expensive calculations

## Documentation Requirements

### Code Comments

- **JSDoc** for all exported functions/components
- **Inline comments** for complex logic only
- **TODOs** with issue numbers: `// TODO(#123): Implement feature`

### Component Documentation

````typescript
/**
 * EventFeed displays a real-time feed of system events with severity indicators.
 *
 * @component
 * @example
 * ```tsx
 * <EventFeed
 *   events={events}
 *   maxItems={50}
 *   onEventClick={handleClick}
 * />
 * ```
 *
 * @param {EventFeedProps} props - Component props
 * @param {FeedEvent[]} props.events - Array of events to display
 * @param {number} props.maxItems - Maximum events to show (default: 100)
 * @param {(event: FeedEvent) => void} props.onEventClick - Event click handler
 */
````

## Security Best Practices

1. **Input Validation** - Sanitize all user inputs
2. **XSS Prevention** - Use React's built-in escaping
3. **CSRF Protection** - Use tokens for state changes
4. **Secrets Management** - Use environment variables, never commit secrets
5. **Dependency Audits** - Run `npm audit` regularly
6. **Content Security Policy** - Restrict script sources

## Deployment

### Marketing Site (Netlify)

- Auto-deploy on push to `main`
- Preview deployments for PRs
- Build command: `pnpm run build`
- Publish directory: `apps/marketing/out`

### Documentation Site (Netlify)

- Auto-deploy on push to `main`
- Build command: `pnpm -C apps/docs build`
- Publish directory: `apps/docs/build`

## Troubleshooting

### Common Issues

1. **Build failures** - Check Node version (18+), run `pnpm install`
2. **Type errors** - Run `pnpm typecheck`, fix strict mode issues
3. **Linting errors** - Run `pnpm lint --fix`
4. **Formatting** - Run `pnpm format`
5. **WASM build errors** - Check Rust toolchain, run `cargo check`

### Getting Help

1. Check documentation at
   [docs-phoenixrooivalk.netlify.app](https://docs-phoenixrooivalk.netlify.app)
   or in `apps/docs/`
2. Review similar implementations in codebase
3. Check GitHub Issues for related problems

## Code Review Checklist

Before submitting PR:

- [ ] Code follows style guidelines
- [ ] All tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Formatting applied (`pnpm format`)
- [ ] TypeScript compiles (`pnpm typecheck`)
- [ ] Accessibility verified (keyboard nav, ARIA labels, color contrast)
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Documentation updated
- [ ] No console errors in browser
- [ ] Performance impact assessed
- [ ] Security implications considered

## Additional Resources

- **Documentation Portal**:
  [docs-phoenixrooivalk.netlify.app](https://docs-phoenixrooivalk.netlify.app)
- **Documentation Source**: `apps/docs/docs/` - Technical, business, and
  operations documentation
- **Responsible Use**: See `RESPONSIBLE_USE.md`

---

**Note**: These instructions are designed to help GitHub Copilot generate code
that matches the project's standards, patterns, and best practices. Always
review and test generated code before committing.
