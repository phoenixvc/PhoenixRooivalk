/**
 * Article Meta Component
 *
 * Provides Open Graph and Twitter Card meta tags for rich share previews.
 * Used on news articles and documentation pages.
 */

import React from "react";
import Head from "@docusaurus/Head";

export interface ArticleMetaProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  imageAlt?: string;
  type?: "article" | "website";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  twitterHandle?: string;
}

// Default OG image dimensions for optimal display
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

// Default site information
const SITE_NAME = "Phoenix Rooivalk";
const DEFAULT_TWITTER_HANDLE = "@phoenixrooivalk";

export function ArticleMeta({
  title,
  description,
  url,
  image,
  imageAlt,
  type = "article",
  author,
  publishedTime,
  modifiedTime,
  section,
  tags,
  twitterHandle = DEFAULT_TWITTER_HANDLE,
}: ArticleMetaProps): React.ReactElement {
  // Truncate description for meta tags (recommended max 155 chars)
  const truncatedDescription =
    description.length > 155
      ? `${description.substring(0, 152)}...`
      : description;

  // Generate a default OG image URL if none provided
  const ogImage =
    image ||
    `/img/og-default.png`;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={truncatedDescription} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
      <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
      {imageAlt && <meta property="og:image:alt" content={imageAlt} />}
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Article-specific OG tags */}
      {type === "article" && (
        <>
          {publishedTime && (
            <meta property="article:published_time" content={publishedTime} />
          )}
          {modifiedTime && (
            <meta property="article:modified_time" content={modifiedTime} />
          )}
          {author && <meta property="article:author" content={author} />}
          {section && <meta property="article:section" content={section} />}
          {tags?.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={truncatedDescription} />
      <meta name="twitter:image" content={ogImage} />
      {imageAlt && <meta name="twitter:image:alt" content={imageAlt} />}
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}
      {twitterHandle && <meta name="twitter:creator" content={twitterHandle} />}

      {/* Additional Meta */}
      <link rel="canonical" href={url} />
    </Head>
  );
}

/**
 * Generate structured data (JSON-LD) for articles
 */
export function ArticleStructuredData({
  title,
  description,
  url,
  image,
  author,
  publishedTime,
  modifiedTime,
}: Omit<ArticleMetaProps, "type">): React.ReactElement {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    image: image ? [image] : undefined,
    author: author
      ? {
          "@type": "Person",
          name: author,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: "/img/logo.svg",
      },
    },
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  return (
    <Head>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Head>
  );
}

/**
 * Combined component for full SEO optimization
 */
export function ArticleSEO(
  props: ArticleMetaProps,
): React.ReactElement {
  return (
    <>
      <ArticleMeta {...props} />
      <ArticleStructuredData {...props} />
    </>
  );
}

export default ArticleMeta;
