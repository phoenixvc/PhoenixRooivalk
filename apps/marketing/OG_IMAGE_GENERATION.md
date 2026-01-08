> **⚠️ DEPRECATED**: This document contains references to Netlify deployment.
> The project now deploys exclusively to Azure Static Web Apps. See
> `.github/workflows/deploy-marketing-azure.yml` for current deployment
> configuration.

# Open Graph Image Generation Guide

## Quick Setup (Manual - 10 minutes)

Since automated image generation requires additional dependencies, here's the
fastest manual approach:

### Option 1: Using the HTML Template (Recommended)

1. Open `og-image-template.html` in Chrome/Firefox
2. Set window size to 1200x630:
   - Open DevTools (F12)
   - Toggle device toolbar (Ctrl/Cmd + Shift + M)
   - Select "Responsive"
   - Set width: 1200px, height: 630px
3. Take a screenshot:
   - Chrome: Right-click → "Capture screenshot"
   - Or use DevTools → Cmd/Ctrl + Shift + P → "Capture screenshot"
4. Save as:
   - `apps/marketing/public/og-image.png`
   - `apps/marketing/public/twitter-image.png`

### Option 2: Using Canva (5 minutes)

1. Go to [Canva.com](https://canva.com)
2. Create custom size: 1200 x 630 px
3. Use template settings:
   - Background: Gradient from #0F172A to #1E293B
   - Add text: "Phoenix Rooivalk"
   - Subtitle: "SAE Level 4 Autonomous Defense"
   - Metrics: "<200ms Response | 100% Offline | $26B Market"
   - Colors: Orange #F97316, White #FFFFFF, Slate #CBD5E1
4. Export as PNG
5. Save to `apps/marketing/public/og-image.png`
6. Copy to `apps/marketing/public/twitter-image.png`

### Option 3: Automated Generation (Advanced)

If you want automated generation in CI/CD:

```bash
# Install dependencies (adds ~50MB)
npm install --save-dev @vercel/og

# Or use playwright for screenshots
npm install --save-dev playwright
```

Then create a script or use Next.js OG Image generation:
https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image

## After Creating Images

1. Update metadata in `src/app/layout.tsx`:

   ```typescript
   openGraph: {
     images: [
       {
         url: '/og-image.png',  // Changed from /logo.svg
         width: 1200,
         height: 630,
         alt: 'Phoenix Rooivalk - Autonomous Counter-Drone Defense System',
       },
     ],
   },
   twitter: {
     images: ['/twitter-image.png'],  // Changed from /logo.svg
   },
   ```

2. Test the images:
   - Visit: https://www.opengraph.xyz/
   - Enter: https://phoenixrooivalk.netlify.app
   - Verify image displays correctly

## Current Status

- ✅ HTML template created (`og-image-template.html`)
- ⏳ Manual image generation needed (use Option 1 or 2 above)
- ⏳ Update metadata after images are created

## Design Specifications

- **Size**: 1200 x 630 pixels (OG standard)
- **Format**: PNG (better quality than JPG for text)
- **Background**: Dark gradient (#0F172A → #1E293B)
- **Primary Color**: Orange #F97316 (Phoenix Rooivalk brand)
- **Text Colors**: White #FFFFFF, Gray #CBD5E1
- **Font**: System sans-serif (Arial, Helvetica, Segoe UI)
- **Key Metrics**: <200ms, 100% Offline, $26B Market

## Alternative: Next.js OG Image Generation

For fully automated approach, you can use Next.js built-in OG image generation:

```typescript
// src/app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Phoenix Rooivalk - Autonomous Counter-Drone Defense'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
      }}>
        {/* Your design here */}
      </div>
    ),
    { ...size }
  )
}
```

This requires no manual steps and regenerates automatically!
