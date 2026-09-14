import { Eye, Heart, Clock3, ArrowUpRight, BookOpen, Captions, Music2, Scissors, Sparkles, Video } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { posts } from "@/lib/blog";
import { supportPosts } from "@/lib/supportPosts";

const allPosts = [...posts, ...supportPosts];

type PopularPost = (typeof allPosts)[number] & {
  thumbnail?: string;
  likes?: number;
  views?: number;
};

const iconByCluster: Record<string, typeof BookOpen> = {
  "Beginner video editing": Video,
  Captions,
  Audio: Music2,
  Transitions: Sparkles,
  "Auto Sync": Sparkles,
  Troubleshooting: Scissors,
};

function formatCount(value?: number) {
  if (typeof value !== "number") return "—";
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(".0", "")}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(".0", "")}K`;
  return String(value);
}

function PopularCard({ post, rank }: { post: PopularPost; rank: number }) {
  const Icon = iconByCluster[post.cluster] ?? BookOpen;

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group flex min-h-[112px] items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3 transition hover:border-amber-500/40 hover:bg-zinc-900"
      aria-label={`Read ${post.title}`}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-950">
        {post.thumbnail ? (
          <img src={post.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-amber-400">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full border border-amber-300/30 bg-amber-500 px-1.5 text-[11px] font-black text-zinc-950 shadow-lg">
          {rank}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-bold leading-5 text-white transition group-hover:text-amber-300">
          {post.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
          <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{formatCount(post.likes)}</span>
          <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{formatCount(post.views)}</span>
          <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{post.readingMinutes} min</span>
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-amber-400" />
    </Link>
  );
}

export function MostPopularBlogs() {
  const source = allPosts as PopularPost[];
  if (!source.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6" aria-labelledby="most-popular-blogs-title">
      <style>{`
        @keyframes most-popular-scroll { from { transform: translateY(0); } to { transform: translateY(-50%); } }
        .most-popular-window { position: relative; height: 360px; overflow: hidden; border-radius: 1rem; outline: none; -webkit-mask-image: linear-gradient(to bottom, transparent, black 8%, black 92%, transparent); mask-image: linear-gradient(to bottom, transparent, black 8%, black 92%, transparent); }
        .most-popular-window:focus-visible { box-shadow: 0 0 0 2px rgb(245 158 11 / .7); }
        .most-popular-track { display: grid; gap: .75rem; animation: most-popular-scroll 42s linear infinite; will-change: transform; }
        .most-popular-window:hover .most-popular-track, .most-popular-window:focus .most-popular-track, .most-popular-window:focus-within .most-popular-track { animation-play-state: paused; }
        @media (max-width: 639px) { .most-popular-window { height: 310px; } .most-popular-track { animation-duration: 36s; } }
        @media (prefers-reduced-motion: reduce) { .most-popular-track { animation: none; transform: translateY(0); } }
      `}</style>
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/45 p-5 shadow-2xl sm:p-7">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
          <div className="max-w-xl">
            <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">Most Popular</span>
            <h2 id="most-popular-blogs-title" className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Most Popular Blogs</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">Quick guides for the questions creators ask most. The list uses the same blog source as the rest of the site and loops continuously.</p>
            <Link to="/blog" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300">View all blogs <ArrowUpRight className="h-4 w-4" /></Link>
          </div>

          <div className="most-popular-window" tabIndex={0} aria-label="Most popular blog list. Hover or focus to pause scrolling.">
            <div className="most-popular-track">
              {[...source, ...source].map((post, index) => (
                <PopularCard key={`${post.slug}-${index}`} post={post} rank={(index % source.length) + 1} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
