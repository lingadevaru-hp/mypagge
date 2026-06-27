import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import type { Article, ArticleIndexEntry } from '../types/article';
import Infobox from './Infobox';
import TableOfContents from './TableOfContents';
import Section from './Section';
import References from './References';
import RevisionHistory from './RevisionHistory';
import { loadArticlesIndex } from '../lib/articleLoader';
import { useTheme } from '../contexts/ThemeContext';

const categoryColors: Record<string, string> = {
  'Profile':        '#3366CC',
  'Blockchain':     '#E67E22',
  'AI / ML':        '#8E44AD',
  'Infrastructure': '#27AE60',
  'Security':       '#C0392B',
  'Systems':        '#2980B9',
  'Web':            '#16A085',
  'Learning':       '#F39C12',
};

interface ArticleViewProps {
  article: Article;
}

function parseWikiLink(inner: string): { slug: string; text: string } {
  const parts = inner.split('|');
  const rawSlug = parts[0].trim();
  const slug = rawSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const text = parts[1]?.trim() || parts[0].trim();
  return { slug, text };
}

function parseLeadText(text: string) {
  const paras = text.split(/\n\n+/);
  return paras.map((p, i) => {
    const parsed = p
      .replace(/\[\[(.*?)\]\]/g, (_m, inner) => {
        const { slug, text: display } = parseWikiLink(inner);
        return `<a href="/wiki/${slug}" class="text-accent hover:underline">${display}</a>`;
      })
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (_m, label, url) => {
        return `<a href="${url}" class="text-accent hover:underline" target="_blank" rel="noopener noreferrer">${label}</a>`;
      })
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    return <p key={i} className="mb-4 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: parsed }} />;
  });
}

export default function ArticleView({ article }: ArticleViewProps) {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('');
  const [fontSize, setFontSize] = useState<'small' | 'standard' | 'large'>('large');
  const [contentWidth, setContentWidth] = useState<'standard' | 'wide'>('wide');
  const [allArticles, setAllArticles] = useState<ArticleIndexEntry[]>([]);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefs = localStorage.getItem('wiki-preferences');
    if (prefs) {
      const p = JSON.parse(prefs);
      if (p.fontSize) setFontSize(p.fontSize);
      if (p.contentWidth) setContentWidth(p.contentWidth);
    }
    loadArticlesIndex().then((idx) => setAllArticles(idx.articles));
  }, []);

  useEffect(() => {
    localStorage.setItem('wiki-preferences', JSON.stringify({ fontSize, contentWidth }));
  }, [fontSize, contentWidth]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    const sections = document.querySelectorAll('.wiki-section[id]');
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [article]);

  const fontSizeClass = fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm';
  const maxWidthClass = contentWidth === 'wide' ? 'max-w-none' : 'max-w-[680px]';

  return (
    <div className="flex gap-6 flex-1">
      <div className={`flex-1 min-w-0 ${fontSizeClass}`} ref={articleRef}>
        <div className={`${maxWidthClass}`}>
          <h1
            className="text-[1.95em] font-normal font-serif mb-1 text-foreground"
            data-testid="article-title"
          >
            {article.metadata.title}
          </h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 pb-3 border-b border-border">
            <span>Last edited {new Date(article.metadata.lastEdited).toLocaleDateString()}</span>
            <span>·</span>
            <span>{article.metadata.editCount} edits</span>
            <span>·</span>
            <span>{article.metadata.views.toLocaleString()} views</span>
            <span>·</span>
            <span className="text-accent">{article.metadata.category}</span>
          </div>

          {article.infobox && (
            <Infobox data={article.infobox} />
          )}

          <div className="lead mb-2">
            {parseLeadText(article.lead)}
          </div>

          <TableOfContents sections={article.sections} activeId={activeSection} />

          <div className="clearfix">
            {article.sections.map((section) => (
              <Section key={section.id} section={section} />
            ))}
          </div>

          {article.perspectives && article.perspectives.length > 0 && (
            <section className="mt-6 border-t border-border pt-4">
              <h2 className="text-[1.4em] font-bold border-b border-border pb-1 mb-3 font-serif">
                Different Perspectives
              </h2>
              <div className="space-y-3">
                {article.perspectives.map((p, i) => (
                  <div key={i} className="border border-border p-3 bg-card">
                    <h3 className="font-bold text-sm mb-1">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">{p.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <References references={article.references} />

          <div className="mt-4 pt-3 border-t border-border text-sm">
            <span className="font-bold">Categories: </span>
            {article.categories.map((cat, i) => (
              <span key={cat}>
                {i > 0 && ' · '}
                <Link href={`/wiki/search?q=${encodeURIComponent(cat)}`} className="text-accent hover:underline">
                  {cat}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>

      <aside className="hidden lg:block w-[210px] shrink-0">
        <div className="sticky top-[56px] space-y-3">

          <div
            className="border border-border bg-card overflow-hidden"
            data-testid="appearance-panel"
          >
            <div className="px-3 py-2 border-b border-border bg-card/60">
              <p className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Appearance</p>
            </div>

            <div className="px-3 py-2.5 space-y-3">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Text size</p>
                <div className="flex gap-1">
                  {(['small', 'standard', 'large'] as const).map((s) => (
                    <button
                      key={s}
                      data-testid={`font-size-${s}`}
                      onClick={() => setFontSize(s)}
                      className={`flex-1 py-1 text-xs border transition-colors ${
                        fontSize === s
                          ? 'border-accent bg-accent/15 text-accent font-semibold'
                          : 'border-border hover:border-border/80 hover:bg-card/60'
                      }`}
                    >
                      {s === 'small' ? 'S' : s === 'large' ? 'L' : 'M'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/50" />

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Width</p>
                <div className="flex gap-1">
                  {(['standard', 'wide'] as const).map((w) => (
                    <button
                      key={w}
                      data-testid={`width-${w}`}
                      onClick={() => setContentWidth(w)}
                      className={`flex-1 py-1 text-xs border transition-colors ${
                        contentWidth === w
                          ? 'border-accent bg-accent/15 text-accent font-semibold'
                          : 'border-border hover:border-border/80 hover:bg-card/60'
                      }`}
                    >
                      {w === 'standard' ? 'Standard' : 'Wide'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/50" />

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Theme</p>
                <div className="flex gap-1">
                  {(['light', 'dark'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`flex-1 py-1 text-xs border transition-colors ${
                        theme === t
                          ? 'border-accent bg-accent/15 text-accent font-semibold'
                          : 'border-border hover:border-border/80 hover:bg-card/60'
                      }`}
                    >
                      {t === 'light' ? '☀ Light' : '☾ Dark'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {article.relatedArticles.length > 0 && (
            <div data-testid="related-articles">
              <p className="font-bold text-[11px] uppercase tracking-widest mb-2 text-muted-foreground px-1">
                Read next
              </p>
              <div className="space-y-2">
                {article.relatedArticles.map((slug) => {
                  const entry = allArticles.find((a) => a.slug === slug);
                  const title = entry?.title ?? slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                  const category = entry?.category ?? '';
                  const color = categoryColors[category] || '#3366CC';
                  return (
                    <Link key={slug} href={`/wiki/${slug}`} className="block group">
                      <div className="border border-border bg-card hover:border-accent/60 transition-colors overflow-hidden">
                        {entry?.thumbnail && (
                          <div className="w-full h-[72px] overflow-hidden bg-card/50">
                            <img
                              src={entry.thumbnail}
                              alt={title}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="p-2">
                          {category && (
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{ color }}
                            >
                              {category}
                            </span>
                          )}
                          <p className="text-xs font-semibold text-accent group-hover:underline leading-tight mt-0.5 mb-1">
                            {title}
                          </p>
                          {entry?.excerpt && (
                            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                              {entry.excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border border-border bg-card" data-testid="edit-history-sidebar">
            <RevisionHistory history={article.editHistory} />
          </div>
        </div>
      </aside>
    </div>
  );
}
