import { Helmet } from 'react-helmet-async';
import { useTenant } from '@/hooks/useTenant';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  structuredData?: object;
}

const SEOHead = ({
  title,
  description,
  keywords,
  canonical,
  ogImage = '/assets/hb-logo-square.png',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  structuredData,
}: SEOHeadProps) => {
  const { tenant } = useTenant();
  
  // Use tenant defaults if not provided
  const resolvedTitle = title || tenant.seo.defaultTitle;
  const resolvedDescription = description || tenant.seo.defaultDescription;
  const resolvedKeywords = keywords || tenant.seo.keywords;
  
  const baseUrl = 'https://healingbuds.co.za';
  const fullCanonical = canonical ? `${baseUrl}${canonical}` : baseUrl;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;

  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: tenant.name,
    url: baseUrl,
    logo: `${baseUrl}/assets/hb-logo-square.png`,
    description: resolvedDescription,
    sameAs: [
      tenant.social.twitter,
      tenant.social.linkedin,
    ].filter(Boolean),
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@healingbuds.co.za',
      contactType: 'customer service',
    },
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{resolvedTitle}</title>
      <meta name="title" content={resolvedTitle} />
      <meta name="description" content={resolvedDescription} />
      <meta name="keywords" content={resolvedKeywords} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content={tenant.name} />
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content={tenant.name} />
      <meta property="og:locale" content="en_ZA" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={fullOgImage} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
    </Helmet>
  );
};

export default SEOHead;
