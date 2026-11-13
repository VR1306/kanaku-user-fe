import type { CSSProperties, ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  /** Start offset in px (translate). */
  x?: number;
  y?: number;
  className?: string;
};

/**
 * Fades and slides its content into place on mount. Pure CSS (see `.reveal-mount` in globals.css), so the content
 * paints without waiting for any JavaScript: it used to start at opacity 0 and only appear after the animation
 * library had loaded and hydrated, which delayed the Largest Contentful Paint of every page that used it.
 */
export function Reveal({ children, delay = 0, x = 0, y = 16, className }: RevealProps) {
  const style = { "--rd": `${delay}s`, "--rx": `${x}px`, "--ry": `${y}px` } as CSSProperties;
  return (
    <div className={`reveal-mount${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </div>
  );
}

/** Parent that staggers its <StaggerItem> children in (CSS delays by position; see `.stagger` in globals.css). */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`stagger${className ? ` ${className}` : ""}`}>{children}</div>;
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
