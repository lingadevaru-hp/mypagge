import { useEffect } from 'react';

interface SeoHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  type?: 'article' | 'website';
  schemaJson?: object;
}

const BASE_URL = 'https://brockennn.vercel.app';

export default function SeoHead({ title, description, canonicalPath, type = 'website', schemaJson }: SeoHeadProps) {
  useEffect(() => {
    if (title) document.title = title;

    const setMeta = (sel: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(sel);
      if (!el) {
        el = document.createElement('meta');
        const attr = sel.match(/\[([^\]]+)="([^"]+)"\]/);
        if (attr) el.setAttribute(attr[1], attr[2]);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (description) {
      setMeta('meta[name="description"]', description);
      setMeta('meta[property="og:description"]', description);
      setMeta('meta[name="twitter:description"]', description);
    }

    if (title) {
      setMeta('meta[property="og:title"]', title);
      setMeta('meta[name="twitter:title"]', title);
    }

    if (type) setMeta('meta[property="og:type"]', type);

    if (canonicalPath) {
      const url = `${BASE_URL}${canonicalPath}`;
      setMeta('meta[property="og:url"]', url);
      let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = url;
    }

    let schemaScript: HTMLScriptElement | null = null;
    if (schemaJson) {
      const existing = document.querySelector('script[data-page-schema]');
      if (existing) existing.remove();
      schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.setAttribute('data-page-schema', 'true');
      schemaScript.textContent = JSON.stringify(schemaJson);
      document.head.appendChild(schemaScript);
    }

    return () => {
      if (schemaScript) schemaScript.remove();
    };
  }, [title, description, canonicalPath, type, schemaJson]);

  return null;
}
