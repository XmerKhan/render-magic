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

function FeaturedPopularCard({ post }: { post: PopularPost }) {
  const Icon = iconByCluster[post.cluster] ?? BookOpen;

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group block overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl transition hover:-translate-y-1 hover:border-amber-500/40"
      aria-label={`Read featured blog ${post.title}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-amber-500/20 via-zinc-900 to-zinc-950">
        {post.thumbnail ? (
          <img src={post.thumbnail} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(245,158,11,.22),transparent_58%)] text-amber-400">
            <Icon className="h-20 w-20 opacity-90 transition duration-500 group-hover:scale-110" aria-hidden="true" />
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full border border-amber-300/30 bg-amber-500 px-3 py-1 text-xs font-black uppercase tracking-wider text-zinc-950 shadow-lg">
          #1 Popular
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-400">Most Popular Blogs</p>
        <h2 className="mt-2 line-clamp-2 text-xl font-black leading-7 text-white transition group-hover:text-amber-300 sm:text-2xl">
          {post.title}
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5"><Heart className="h-3.5 w-3.5" />{formatCount(post.likes)}</span>
          <span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />{formatCount(post.views)}</span>
          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{post.readingMinutes} min read</span>
        </div>
      </div>
    </Link>
  );
}

export function MostPopularBlogs() {
  const source = allPosts as PopularPost[];
  if (!source.length) return null;
  const featuredPost = source[0];

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
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div>
            <FeaturedPopularCard post={featuredPost} />
            <Link to="/blog" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300">
              View all blogs <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-400">Most Popular</p>
              <h2 id="most-popular-blogs-title" className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Popular blogs</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">Explore the most useful guides from our blog collection.</p>
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
      </div>
    </section>
  );
}
