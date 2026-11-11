export function Divider({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 text-[13px] text-muted" role="separator">
      <span className="h-px flex-1 bg-line" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
