import { useState } from 'react';
import { Link } from 'wouter';
import type { ContentBlock as ContentBlockType } from '../types/article';

function parseWikiLink(inner: string): { slug: string; text: string } {
  const parts = inner.split('|');
  const rawSlug = parts[0].trim();
  const slug = rawSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const text = parts[1]?.trim() || parts[0].trim();
  return { slug, text };
}

function parseWikiText(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const parts = text.split(/(\[\[.*?\]\]|\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/);
  parts.forEach((part, i) => {
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const { slug, text: display } = parseWikiLink(part.slice(2, -2));
      nodes.push(
        <Link key={i} href={`/wiki/${slug}`} className="text-accent hover:underline">
          {display}
        </Link>
      );
    } else if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push(<strong key={i}>{part.slice(2, -2)}</strong>);
    } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      nodes.push(<em key={i}>{part.slice(1, -1)}</em>);
    } else if (part.match(/^\[.*?\]\(.*?\)$/)) {
      const m = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (m) {
        nodes.push(
          <a key={i} href={m[2]} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
            {m[1]}
          </a>
        );
      }
    } else {
      nodes.push(part);
    }
  });
  return nodes;
}

function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n');
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      result.push(<h3 key={i} className="text-lg font-bold mt-4 mb-2 font-serif">{line.slice(4)}</h3>);
      i++;
    } else if (line.startsWith('## ')) {
      result.push(<h2 key={i} className="text-xl font-bold mt-5 mb-2 border-b border-border pb-1 font-serif">{line.slice(3)}</h2>);
      i++;
    } else if (line.startsWith('# ')) {
      result.push(<h1 key={i} className="text-2xl font-bold mt-5 mb-2 font-serif">{line.slice(2)}</h1>);
      i++;
    } else if (line.trim() === '') {
      i++;
    } else {
      const paraLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#')) {
        paraLines.push(lines[i]);
        i++;
      }
      const text = paraLines.join(' ');
      result.push(
        <p key={i} className="mb-4 text-sm leading-relaxed" style={{ lineHeight: '1.6' }}>
          {parseWikiText(text)}
        </p>
      );
    }
  }

  return <>{result}</>;
}

interface LightboxProps {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}

function Lightbox({ src, alt, caption, onClose }: LightboxProps) {
  return (
    <div
      className="fixed inset-0 bg-black/85 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Image: ${alt}`}
    >
      <div className="relative max-w-5xl max-h-full flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[75vh] object-contain"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        />
        {caption && <p className="text-white/70 text-sm italic text-center max-w-xl">{caption}</p>}
        <div className="flex flex-wrap gap-2 justify-center">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded border border-white/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            ↗ Open in new tab
          </a>
          <a
            href={src}
            download
            className="px-4 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded border border-white/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            ⬇ Download
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded border border-white/20 transition-colors"
          >
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContentBlock({ block }: { block: ContentBlockType }) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string; caption?: string } | null>(null);

  switch (block.type) {
    case 'text':
      return <div className="wiki-text mb-2">{renderMarkdown(block.content || '')}</div>;

    case 'banner':
      return (
        <div
          className="mb-5 border border-border overflow-hidden cursor-zoom-in"
          data-testid="banner-block"
          onClick={() => setLightbox({ src: block.src!, alt: block.alt || '', caption: block.caption })}
          title="Click to expand"
        >
          <img
            src={block.src}
            alt={block.alt || ''}
            className="w-full object-cover"
            loading="eager"
            style={{ maxHeight: '340px', display: 'block' }}
          />
          {block.caption && (
            <p className="text-xs text-muted-foreground p-2 italic text-center bg-card/50 border-t border-border">
              {block.caption}
            </p>
          )}
          {lightbox && <Lightbox {...lightbox} onClose={() => setLightbox(null)} />}
        </div>
      );

    case 'image':
      return (
        <div className="float-right clear-right ml-4 mb-4 max-w-[240px] border border-border bg-card text-center">
          <img
            src={block.src}
            alt={block.alt || ''}
            className="w-full cursor-zoom-in"
            loading="lazy"
            onClick={() => setLightbox({ src: block.src!, alt: block.alt || '', caption: block.caption })}
            data-testid={`image-block-${block.src?.split('/').pop()}`}
            title="Click to expand"
          />
          {block.caption && (
            <p className="text-xs text-muted-foreground p-1 italic">{block.caption}</p>
          )}
          {lightbox && <Lightbox {...lightbox} onClose={() => setLightbox(null)} />}
        </div>
      );

    case 'table':
      return (
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-border text-sm" data-testid="table-block">
            {block.columns && (
              <thead>
                <tr className="bg-card">
                  {block.columns.map((col, i) => (
                    <th key={i} className="border border-border px-3 py-1.5 text-left font-bold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows?.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 1 ? 'bg-card/40' : ''}>
                  {block.columns?.map((col, ci) => (
                    <td key={ci} className="border border-border px-3 py-1.5">
                      {parseWikiText(row[col] || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'video':
      return (
        <div className="mb-4" data-testid="video-block">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={block.src}
              title={block.caption || 'Video'}
              className="absolute inset-0 w-full h-full border border-border"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          {block.caption && (
            <p className="text-xs text-muted-foreground mt-1 italic">{block.caption}</p>
          )}
        </div>
      );

    case 'gallery':
      return (
        <div className="mb-4" data-testid="gallery-block">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {block.items?.map((item, i) => (
              <div
                key={i}
                className="border border-border bg-card cursor-zoom-in"
                onClick={() => setLightbox(item)}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  className="w-full h-32 object-cover"
                  data-testid={`gallery-image-${i}`}
                />
                {item.caption && (
                  <p className="text-xs text-muted-foreground p-1 italic">{item.caption}</p>
                )}
              </div>
            ))}
          </div>
          {lightbox && (
            <Lightbox {...lightbox} onClose={() => setLightbox(null)} />
          )}
        </div>
      );

    case 'callout': {
      const variantStyles: Record<string, string> = {
        info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800',
        warning: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-400 dark:border-yellow-700',
        success: 'bg-green-50 dark:bg-green-950/30 border-green-400 dark:border-green-700',
        error: 'bg-red-50 dark:bg-red-950/30 border-red-400 dark:border-red-700',
      };
      const v = block.variant || 'info';
      return (
        <div
          className={`border-l-4 px-4 py-3 mb-4 text-sm ${variantStyles[v]}`}
          data-testid={`callout-${v}`}
        >
          {block.title && <p className="font-bold mb-1">{block.title}</p>}
          <div>{renderMarkdown(block.content || '')}</div>
        </div>
      );
    }

    case 'quote':
      return (
        <blockquote
          className="border-l-4 border-border pl-4 pr-2 py-2 mb-4 italic text-muted-foreground"
          data-testid="quote-block"
        >
          <p className="text-sm leading-relaxed">&ldquo;{block.content}&rdquo;</p>
          {block.author && (
            <cite className="text-xs not-italic block mt-1">— {block.author}</cite>
          )}
        </blockquote>
      );

    default:
      return null;
  }
}
