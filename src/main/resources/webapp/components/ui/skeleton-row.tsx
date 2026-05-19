'use client';

export function SkeletonRow({ widths }: { widths: number[] }) {
  return (
    <tr className="border-b border-slate-100">
      {widths.map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}
