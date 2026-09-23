import type { MetaFunction, MetaDescriptor } from 'react-router';
import { BRAND_NAME, BRAND_TAGLINE, BRAND_DESCRIPTION, BRAND_DOMAIN } from '~/constants/brand';

export interface CreateMetaOptions {
  title?: string;
  description?: string;
  keywords?: string[] | string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrl?: string;
  noIndex?: boolean;
  extra?: MetaDescriptor[];
}

/**
 * Creates dynamic, production-grade SEO & OpenGraph MetaFunction for React Router v7 routes.
 */
export function createMeta<TLoader = any>(
  optionsOrFn:
    CreateMetaOptions | ((args: { data: TLoader; params: any; location: any }) => CreateMetaOptions)
): MetaFunction {
  return (args: any) => {
    const opts: CreateMetaOptions =
      typeof optionsOrFn === 'function'
        ? optionsOrFn({
            data: (args?.data as any)?.data !== undefined ? (args?.data as any).data : args?.data,
            params: args?.params,
            location: args?.location,
          })
        : optionsOrFn;

    const fullTitle = opts.title
      ? `${opts.title} — ${BRAND_NAME}`
      : `${BRAND_NAME} — ${BRAND_TAGLINE}`;

    const description = opts.description || BRAND_DESCRIPTION;
    const ogImage = opts.ogImage || `https://${BRAND_DOMAIN}/pwa-512.png`;
    const ogType = opts.ogType || 'website';
    const twitterCard = opts.twitterCard || 'summary_large_image';

    const descriptors: MetaDescriptor[] = [
      { title: fullTitle },
      { name: 'description', content: description },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:type', content: ogType },
      { property: 'og:image', content: ogImage },
      { name: 'twitter:card', content: twitterCard },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage },
    ];

    if (opts.keywords) {
      const kw = Array.isArray(opts.keywords) ? opts.keywords.join(', ') : opts.keywords;
      descriptors.push({ name: 'keywords', content: kw });
    }

    if (opts.canonicalUrl) {
      descriptors.push({ tagName: 'link', rel: 'canonical', href: opts.canonicalUrl });
    }

    if (opts.noIndex) {
      descriptors.push({ name: 'robots', content: 'noindex, nofollow' });
    }

    if (opts.extra && opts.extra.length > 0) {
      descriptors.push(...opts.extra);
    }

    return descriptors;
  };
}
