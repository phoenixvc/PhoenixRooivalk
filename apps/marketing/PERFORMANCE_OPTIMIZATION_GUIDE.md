# Performance Optimization Guide - Phoenix Rooivalk Marketing Site

## Wave 4 Implementation Guide (Phase 8)

This document outlines the performance optimization strategy for the Phoenix
Rooivalk marketing site, implementing Phase 8 of the UI/UX improvement plan.

## 🎯 Performance Goals

- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.5s
- **Cumulative Layout Shift (CLS):** < 0.1
- **Total Blocking Time (TBT):** < 300ms
- **Lighthouse Score:** 90+ (Performance, Accessibility, Best Practices, SEO)

## 📊 Current Status

### Completed Optimizations

1. **CSS Performance Enhancements** ✅
   - GPU acceleration for animations
   - Content visibility for off-screen content
   - Optimized shadow rendering with pseudo-elements
   - Skeleton loaders for perceived performance
   - Font display swap for faster text rendering

2. **Image Loading Optimization** ✅
   - Native lazy loading enabled
   - Layout shift prevention (height: auto)
   - Image rendering optimization
   - Background image optimization utilities

3. **Responsive Performance** ✅
   - Mobile-first CSS approach
   - Conditional animations based on motion preferences
   - Print stylesheet optimization

## 🚀 Implementation Checklist

### 1. Image Optimization (High Priority)

#### Current Images to Optimize

Located in `apps/marketing/public/img/`:

- `MessageBroker.png`
- `revenue_costs_profit_break_even.png`
- `MessageBroker+Mesh+Morpheus2.png`
- `MessageBroker+Mesh+Morpheus.png`
- `MessageBroker+Mesh+Morpheus+Kafka.png`
- `marketing_website.png`
- `profit_margin_growth_over_time.png`
- `drone_over_treetops.png`
- `MessageBroker+Mesh.png`
- `High-Tech Surveillance Network.png`
- `Leptos+Tauri.png`
- Architecture diagrams in `Architecture/` subdirectory

#### Action Items

**Option 1: Manual Optimization**

```bash
# Install image optimization tools
npm install -g sharp-cli

# Convert PNG to WebP with 80% quality
for file in apps/marketing/public/img/*.png; do
  sharp -i "$file" -o "${file%.png}.webp" --webp quality=80
done

# Optimize existing PNGs
for file in apps/marketing/public/img/*.png; do
  sharp -i "$file" -o "$file" --png compressionLevel=9
done
```

**Option 2: Next.js Image Optimization (Recommended)**

Update components to use Next.js `<Image>` component:

```tsx
import Image from "next/image";

// Before
<img src="/img/drone_over_treetops.png" alt="Drone" />

// After
<Image
  src="/img/drone_over_treetops.png"
  alt="Drone"
  width={800}
  height={600}
  quality={80}
  loading="lazy"
  placeholder="blur"
/>
```

### 2. Code Splitting (Medium Priority)

#### Heavy Components to Split

Identify and lazy-load heavy components:

```tsx
// apps/marketing/src/components/ThreatSimulator.tsx
import dynamic from "next/dynamic";

const ThreatSimulator = dynamic(() => import("./components/ThreatSimulator"), {
  loading: () => <SkeletonLoader />,
  ssr: false, // If component is client-only
});
```

#### Recommended Splits

1. **ThreatSimulator** - Large interactive component
2. **Charts/Graphs** - Data visualization libraries
3. **Interactive Demos** - Complex user interactions
4. **Third-party widgets** - External scripts

### 3. Bundle Size Reduction (Medium Priority)

#### Current Bundle Analysis

Run bundle analyzer:

```bash
cd apps/marketing
ANALYZE=true pnpm build
```

#### Optimization Strategies

1. **Remove unused dependencies**

   ```bash
   npx depcheck
   ```

2. **Tree-shake CSS utilities**

   ```js
   // tailwind.config.js
   module.exports = {
     content: [
       "./src/**/*.{js,ts,jsx,tsx}",
       // Add all component paths
     ],
     // ... rest of config
   };
   ```

3. **Minimize CSS bundle**
   - Already using CSS Modules for scoping
   - Consider PurgeCSS for additional cleanup

### 4. Lazy Loading Implementation (High Priority)

#### Components to Lazy Load

1. **Below-the-fold sections**

   ```tsx
   import { lazy, Suspense } from "react";

   const ProductHighlights = lazy(
     () => import("./sections/ProductHighlightsSection"),
   );
   const Timeline = lazy(() => import("./sections/TimelineSection"));

   function HomePage() {
     return (
       <>
         <HeroSection />
         <Suspense fallback={<SectionSkeleton />}>
           <ProductHighlights />
           <Timeline />
         </Suspense>
       </>
     );
   }
   ```

2. **Intersection Observer for sections**

   ```tsx
   import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

   function LazySection({ children }) {
     const [ref, isVisible] = useIntersectionObserver({
       threshold: 0.1,
       triggerOnce: true,
     });

     return (
       <div ref={ref} className={isVisible ? "visible" : ""}>
         {isVisible ? children : <SectionSkeleton />}
       </div>
     );
   }
   ```

### 5. Service Worker Setup (Low Priority)

#### Workbox Integration

```bash
cd apps/marketing
pnpm add workbox-webpack-plugin
```

```js
// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  // ... existing config
});
```

### 6. Performance Monitoring (Ongoing)

#### Lighthouse CI Setup

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Create configuration
cat > lighthouserc.json << EOF
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}]
      }
    }
  }
}
EOF
```

#### Real User Monitoring (RUM)

Consider integrating:

- **Vercel Analytics** (if deploying to Vercel)
- **Google Analytics with Web Vitals**
- **Sentry Performance Monitoring**

## 🔍 Testing & Validation

### Performance Testing Checklist

- [ ] Run Lighthouse audit (target: 90+ in all categories)
- [ ] Test on 3G network throttling
- [ ] Verify LCP < 2.5s on mobile
- [ ] Check CLS < 0.1
- [ ] Validate image lazy loading
- [ ] Test code splitting effectiveness
- [ ] Verify service worker caching
- [ ] Check bundle size reduction

### Testing Commands

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Run Lighthouse
lighthouse http://localhost:3000 --view

# Check bundle size
pnpm run analyze
```

## 📈 Expected Improvements

| Metric                         | Before | Target | Method                     |
| ------------------------------ | ------ | ------ | -------------------------- |
| First Contentful Paint         | 2.5s   | 1.2s   | Image optimization, CDN    |
| Largest Contentful Paint       | 4.0s   | 2.3s   | Lazy loading, code split   |
| Total Blocking Time            | 500ms  | 200ms  | Code splitting, defer JS   |
| Cumulative Layout Shift        | 0.15   | 0.05   | Image dimensions, skeleton |
| Time to Interactive            | 5.0s   | 3.0s   | Code splitting, caching    |
| Bundle Size                    | TBD    | -30%   | Tree shaking, splitting    |
| Lighthouse Performance Score   | TBD    | 90+    | All optimizations          |
| Lighthouse Accessibility Score | 95     | 95+    | Already optimized          |

## 🎨 CSS Utilities Added

The following performance-optimized CSS classes are now available:

### Image Optimization

- `.bg-image` - Optimized background images
- `img[loading="lazy"]` - Automatic lazy loading
- `img[loading="eager"]` - Critical images

### Content Loading

- `.lazy-section` - Content visibility optimization
- `.skeleton` - Loading placeholders
- `.defer-render` - Deferred rendering

### Performance Hints

- `.gpu-accelerated` - GPU acceleration
- `.fixed-optimized` - Optimized fixed positioning
- `.shadow-optimized` - Efficient shadow rendering
- `.critical-content` - Priority rendering
- `.perf-mark` - Performance marking

### Conditional Features

- `.component-heavy` - Code split candidates
- `.feature-optional` - Optional features
- `.animate-on-scroll` - Intersection-based animations

## 🔧 Implementation Priority

### Phase 8A: Immediate (Week 1)

1. ✅ Add CSS performance utilities
2. ✅ Enable native lazy loading
3. ✅ Add skeleton loaders
4. 🔲 Convert critical images to WebP
5. 🔲 Implement lazy section loading

### Phase 8B: Short-term (Week 2)

1. 🔲 Code split heavy components
2. 🔲 Optimize bundle size
3. 🔲 Add Intersection Observer
4. 🔲 Run Lighthouse audit
5. 🔲 Fix identified issues

### Phase 8C: Long-term (Week 3-4)

1. 🔲 Implement service worker
2. 🔲 Set up performance monitoring
3. 🔲 Add RUM tracking
4. 🔲 Optimize remaining images
5. 🔲 Document best practices

## 📚 Resources

- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Workbox](https://developers.google.com/web/tools/workbox)
- [Sharp CLI](https://sharp.pixelplumbing.com/install#cli)

## 🎯 Success Criteria

Wave 4 is considered complete when:

- ✅ CSS performance utilities implemented
- ✅ Image lazy loading enabled
- ✅ Skeleton loaders added
- 🔲 80% of images converted to WebP
- 🔲 Heavy components code-split
- 🔲 Bundle size reduced by 20%+
- 🔲 Lighthouse score 90+ across all metrics
- 🔲 Service worker implemented
- 🔲 Performance monitoring active

## 🔄 Continuous Improvement

Performance optimization is ongoing. After Wave 4:

1. Monitor Core Web Vitals monthly
2. Run Lighthouse CI on each deployment
3. Review bundle size on major updates
4. Optimize new images before deployment
5. Profile and optimize slow components
6. Keep dependencies updated
7. Review and update best practices

---

**Last Updated:** 2026-01-11 **Status:** Wave 4 CSS optimizations complete,
image/code splitting pending **Next Steps:** Implement image optimization and
code splitting
