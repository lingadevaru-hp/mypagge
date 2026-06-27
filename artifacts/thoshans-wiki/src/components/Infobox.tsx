import type { Infobox as InfoboxType } from '../types/article';

interface InfolboxProps {
  data: InfoboxType;
}

export default function Infobox({ data }: InfolboxProps) {
  return (
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
                className="w-full max-h-48 object-cover"
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
            <td className="py-1 px-2 align-top text-xs">{field.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
