import { SITE } from '../data/site';
import type { Crumb, Faq } from '../data/site';

const abs = (path: string) => new URL(path, SITE.url).href;

export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': SITE.url + '/#organization',
    name: SITE.organization.name,
    url: SITE.url,
    logo: { '@type': 'ImageObject', url: abs(SITE.organization.logo) },
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': SITE.url + '/#website',
    name: SITE.name,
    url: SITE.url,
    inLanguage: SITE.lang,
    publisher: { '@id': SITE.url + '/#organization' },
  };
}

export function personSchema() {
  return {
    '@type': 'Person',
    '@id': SITE.url + '/about#author',
    name: SITE.author.name,
    jobTitle: SITE.author.jobTitle,
    description: SITE.author.bio,
    ...(SITE.author.sameAs.length ? { sameAs: SITE.author.sameAs } : {}),
  };
}

export function articleSchema(p: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
}) {
  return {
    '@type': 'Article',
    headline: p.title,
    description: p.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': abs(p.path) },
    datePublished: p.datePublished,
    dateModified: p.dateModified || p.datePublished,
    author: { '@id': SITE.url + '/about#author' },
    publisher: { '@id': SITE.url + '/#organization' },
    inLanguage: SITE.lang,
  };
}

export function breadcrumbSchema(items: Crumb[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      ...(it.url ? { item: abs(it.url) } : {}),
    })),
  };
}

// NOTE: Review/AggregateRating schema is intentionally NOT provided — using it
// without genuine, verifiable reviews is a compliance/penalty risk.
export function faqSchema(faqs?: Faq[]) {
  if (!faqs || !faqs.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function graph(...nodes: unknown[]) {
  return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) };
}
