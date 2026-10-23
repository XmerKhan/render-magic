import { site } from "@/lib/site";

const icons: Record<string, React.ReactNode> = {
  YouTube: <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="M10 9l5 3-5 3z" fill="currentColor" /></>,
  LinkedIn: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 014 0v4M12 10v7" /></>,
  Instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5v.01" /></>,
  Facebook: <path d="M15 3h-2.5A3.5 3.5 0 009 6.5V10H6v4h3v7h4v-7h3l1-4h-4V7a1 1 0 011-1h2z" />,
  TikTok: <path d="M14 3v11.5a3.5 3.5 0 11-3.5-3.5M14 3c.5 2.5 2.5 4.5 5 5" />,
};

export function SocialLinks({ className = "" }: { className?: string }) {
  return <div className={`flex flex-wrap gap-2 ${className}`}>{site.socials.map((s) => (
    <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer me" aria-label={`${site.founder.name} on ${s.name}`} title={`${s.name} — ${site.founder.handle}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-amber-500/50 hover:text-amber-400">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[s.name]}</svg>
    </a>
  ))}</div>;
}
