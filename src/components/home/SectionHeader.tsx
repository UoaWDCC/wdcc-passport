interface SectionHeaderProps {
  title: string;
  count?: number;
}

export function SectionHeader({ title, count }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {count !== undefined && (
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-sm font-semibold text-white/75">
          {count}
        </span>
      )}
    </div>
  );
}
