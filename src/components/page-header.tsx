export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">{title}</h1>
      {children}
    </div>
  );
}
