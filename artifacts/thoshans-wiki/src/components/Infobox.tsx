import { useState } from 'react';
import type { Infobox as InfoboxType } from '../types/article';

interface InfoboxProps {
  data: InfoboxType;
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
    >
      <div className="relative max-w-3xl max-h-full flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} className="max-w-full max-h-[75vh] object-contain border border-white/10" />
        {caption && <p className="text-white/70 text-sm italic text-center">{caption}</p>}
        <div className="flex gap-2">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded border border-white/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            ↗ Open in new tab
          </a>
          <a
            href={src}
            download
            className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded border border-white/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            ⬇ Download
          </a>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded border border-white/20 transition-colors"
          >
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Infobox({ data }: InfoboxProps) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string; caption?: string } | null>(null);

  return (
    <>
      <table
        data-testid="infobox"
        className="
          w-full mb-4 text-sm border border-border bg-card
          md:float-right md:clear-right md:ml-4 md:mb-4 md:w-auto md:max-w-[280px]
          block md:table
        "
        style={{ clear: 'right' }}
      >
        <tbody>
          <tr>
            <th
              colSpan={2}
              className="text-center font-bold py-1.5 px-2 bg-border/60 text-foreground border-b border-border text-sm"
            >
              {data.title}
            </th>
          </tr>
          {data.image && (
            <tr>
              <td colSpan={2} className="p-1 text-center">
                <img
                  src={data.image}
                  alt={data.imageCaption || data.title}
                  className="w-full max-h-48 object-cover cursor-zoom-in"
                  onClick={() => setLightbox({ src: data.image!, alt: data.imageCaption || data.title, caption: data.imageCaption })}
                />
                {data.imageCaption && (
                  <p className="text-xs text-muted-foreground mt-1 italic text-center">{data.imageCaption}</p>
                )}
              </td>
            </tr>
          )}
          {data.fields.map((field, i) => (
            <tr key={i} className="border-t border-border">
              <th className="py-1 px-2 font-bold text-left align-top bg-card/50 w-2/5 text-xs">
                {field.label}
              </th>
              <td className="py-1 px-2 align-top text-xs">
                {field.url ? (
                  <a
                    href={field.url}
                    target={field.url.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {field.value}
                  </a>
                ) : (
                  field.value
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {lightbox && <Lightbox {...lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}
