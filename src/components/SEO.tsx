import { Helmet } from "react-helmet-async";

const SITE_URL = "https://deltonquizz.lovable.app";
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function SEO({ title, description, path = "/", image = DEFAULT_OG_IMAGE, type = "website", jsonLd }: SEOProps) {
  const url = `${SITE_URL}${path}`;
  const safeTitle = title.length > 60 ? title.slice(0, 57) + "…" : title;
  const safeDesc = description.length > 160 ? description.slice(0, 157) + "…" : description;

  return (
    <Helmet>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDesc} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDesc} />
      <meta name="twitter:image" content={image} />
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
