> **⚠️ DEPRECATED**: This document contains references to Netlify deployment.
> The project now deploys exclusively to Azure Static Web Apps. See
> `.github/workflows/deploy-marketing-azure.yml` for current deployment
> configuration.

# Sitemap Submission Guide

## Quick Setup (5 minutes)

### Step 1: Verify Sitemap is Working

1. Build the site to generate the sitemap:

   ```bash
   cd apps/marketing
   npm run build
   ```

2. Check locally (if running dev server):

   ```
   http://localhost:3000/sitemap.xml
   ```

3. Verify on production:
   ```
   https://phoenixrooivalk.netlify.app/sitemap.xml
   ```

You should see XML content with all your pages listed.

### Step 2: Submit to Google Search Console

1. **Sign up / Log in**
   - Go to: https://search.google.com/search-console
   - Sign in with Google account

2. **Add Property**
   - Click "Add Property"
   - Select "URL prefix"
   - Enter: `https://phoenixrooivalk.netlify.app`
   - Click "Continue"

3. **Verify Ownership** (Choose one method):

   **Option A: HTML File Upload** (Easiest for Netlify)
   - Download the verification file (e.g., `google123abc.html`)
   - Place in `apps/marketing/public/`
   - Commit and deploy
   - Click "Verify" in Search Console

   **Option B: DNS Verification** (Recommended for long-term)
   - Copy the TXT record provided
   - Add to your DNS settings (where you manage phoenixrooivalk.netlify.app)
   - Wait 5-10 minutes for DNS propagation
   - Click "Verify"

4. **Submit Sitemap**
   - Once verified, go to "Sitemaps" in left sidebar
   - Enter: `sitemap.xml`
   - Click "Submit"
   - Status should change to "Success" within minutes

5. **Monitor Indexing**
   - Check "Coverage" report after 24-48 hours
   - Should see pages being indexed
   - Can request immediate indexing via "URL Inspection" tool

### Step 3: Submit to Bing Webmaster Tools

1. **Sign up / Log in**
   - Go to: https://www.bing.com/webmasters
   - Sign in with Microsoft account

2. **Add Site**
   - Click "Add Site"
   - Enter: `https://phoenixrooivalk.netlify.app`
3. **Import from Google** (Fastest)
   - Click "Import from Google Search Console"
   - Authorize connection
   - Your site and sitemap will be imported automatically

   **OR Verify Manually**:
   - Choose verification method (XML file, meta tag, or DNS)
   - Follow similar steps as Google

4. **Submit Sitemap** (if not imported)
   - Go to "Sitemaps"
   - Enter: `https://phoenixrooivalk.netlify.app/sitemap.xml`
   - Click "Submit"

### Step 4: Verify Submission Success

**Google Search Console**:

- ✅ Property verified
- ✅ Sitemap submitted without errors
- ✅ "Valid" pages count matches your site (should be 16)
- ⏳ Wait 24-48 hours for initial indexing

**Bing Webmaster Tools**:

- ✅ Site verified
- ✅ Sitemap processed
- ✅ Pages discovered

## Expected Timeline

| Timeframe       | What Happens                                  |
| --------------- | --------------------------------------------- |
| **Immediate**   | Sitemap submitted and validated               |
| **24-48 hours** | First pages indexed (usually homepage first)  |
| **1 week**      | Most pages indexed and appearing in search    |
| **2-4 weeks**   | Full indexing, rankings begin to appear       |
| **2-3 months**  | Optimal rankings achieved for target keywords |

## Monitoring & Optimization

### Weekly Tasks

1. Check "Coverage" report for indexing errors
2. Review "Performance" for search queries bringing traffic
3. Monitor click-through rates on search results

### Monthly Tasks

1. Review which pages get most organic traffic
2. Identify top-performing keywords
3. Update meta descriptions for low-CTR pages
4. Add new pages to sitemap (automatic with Next.js)

### Tools for Monitoring

- Google Search Console: Primary SEO monitoring
- Bing Webmaster Tools: Secondary search engine
- Plausible Analytics: User behavior and conversions
- Google Analytics: Detailed traffic analysis (if using)

## Troubleshooting

### Sitemap Not Found (404 Error)

- Ensure site is deployed to production
- Check `apps/marketing/src/app/sitemap.ts` exists
- Verify Next.js build completed successfully
- Clear Netlify cache and rebuild

### Sitemap Contains Errors

- Validate XML at: https://www.xml-sitemaps.com/validate-xml-sitemap.html
- Check for typos in URLs
- Ensure all URLs are absolute (include domain)

### Pages Not Being Indexed

- Check robots.txt isn't blocking pages
- Ensure pages have unique titles and descriptions
- Verify pages are linked in navigation (internal linking)
- Use "URL Inspection" tool to request indexing
- Check for "noindex" tags in page HTML

### Low Rankings

- Takes 2-3 months for new sites
- Ensure meta descriptions are compelling
- Add more quality content (blog posts, case studies)
- Build backlinks from defense industry sites
- Optimize for target keywords

## Advanced: Request Immediate Indexing

For important pages you want indexed quickly:

### Google

1. Go to Google Search Console
2. Use "URL Inspection" tool
3. Enter the URL
4. Click "Request Indexing"
5. Can do 10-20 per day

### Bing

1. Go to Bing Webmaster Tools
2. Use "URL Submission" tool
3. Enter the URL
4. Submit
5. Can do 10 per day for free

## Defense Industry Specific Tips

1. **ITAR-Controlled Content**
   - Add `Disallow:` rules in robots.txt for sensitive pages
   - Use authentication for technical specifications
   - Don't index classified information

2. **Government Buyers**
   - Optimize for .mil and .gov search patterns
   - Target keywords like "counter-drone", "C-UAS", "autonomous defense"
   - Include case studies and compliance information

3. **B2B Sales Cycle**
   - Expect longer time-to-conversion
   - Focus on qualified lead generation, not volume
   - Track demo requests and partnership inquiries as primary KPIs

## Current Status

- ✅ Sitemap generated (`src/app/sitemap.ts`)
- ✅ robots.txt with sitemap reference
- ⏳ **Next Step**: Submit to Google Search Console
- ⏳ **Next Step**: Submit to Bing Webmaster Tools
- ⏳ Monitor indexing progress

## Resources

- [Google Search Console Help](https://support.google.com/webmasters)
- [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmasters-guidelines-30fba23a)
- [Next.js Sitemap Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
