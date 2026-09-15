import { ArrowUpRight, BookOpen, Captions, Clock3, Music2, Scissors, Sparkles, Video } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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

const fallbackIcons = [Video, Captions, Music2, Sparkles, Scissors, BookOpen];

function getPostIcon(post: PopularPost, index: number) {
  return iconByCluster[post.cluster] ?? fallbackIcons[index % fallbackIcons.length];
}

function formatCount(value?: number) {
  if (typeof value !== "number") return "—";
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(".0", "")}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(".0", "")}K`;
  return String(value);
}

function PopularTextCard({ post, rank }: { post: PopularPost; rank: number }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group flex min-h-[96px] items-center gap-4 rounded-2xl border border-zinc-800 bg-amber-400 px-4 py-3 transition hover:border-white hover:bg-amber-300"
      aria-label={`Read ${post.title}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-amber-300 text-xs font-black text-white">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-bold leading-5 text-zinc-950 transition group-hover:text-zinc-800">
          {post.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-800">
          <span>{post.cluster}</span>
          <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{post.readingMinutes} min read</span>
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-white transition group-hover:text-zinc-950" />
    </Link>
  );
}

function FeaturedStack({ source }: { source: PopularPost[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const visibleCount = Math.min(4, source.length);
  const visibleCards = useMemo(() => {
    return Array.from({ length: visibleCount }, (_, offset) => ({
      post: source[(activeIndex + offset) % source.length],
      offset,
      sourceIndex: (activeIndex + offset) % source.length,
    }));
  }, [activeIndex, source, visibleCount]);

  useEffect(() => {
    if (source.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % source.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [paused, source.length]);

  return (
    <div
      className="relative min-h-[430px] sm:min-h-[450px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
      aria-label="Featured popular blog cards"
    >
      <div className="absolute inset-x-4 top-3 h-full rounded-3xl border border-zinc-800/60 bg-zinc-950/40" aria-hidden="true" />
      <div className="absolute inset-x-2 top-1 h-full rounded-3xl border border-zinc-800/80 bg-zinc-950/65" aria-hidden="true" />

      {visibleCards.map(({ post, offset, sourceIndex }) => {
        const Icon = getPostIcon(post, sourceIndex);
        const isActive = offset === 0;

        return (
          <Link
            key={`${post.slug}-${activeIndex}-${offset}`}
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="group absolute inset-x-0 top-0 block overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl transition-[transform,opacity,filter] duration-700 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            style={{
              transform: `translateY(${offset * 14}px) scale(${1 - offset * 0.035})`,
              opacity: offset === visibleCount - 1 ? 0.42 : 1 - offset * 0.13,
              zIndex: visibleCount - offset,
              filter: offset > 0 ? "saturate(.8)" : undefined,
            }}
            aria-label={`Read featured blog ${post.title}`}
          >
            <div className="relative flex min-h-[360px] flex-col justify-between p-6 sm:min-h-[380px] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10 text-amber-400 shadow-inner">
                  <Icon className="h-10 w-10" aria-hidden="true" />
                </div>
                <span className="rounded-full border border-amber-300/25 bg-amber-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-950">
                  {isActive ? "Featured" : `Next ${offset}`}
                </span>
              </div>

              <div className="mt-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">{post.cluster}</p>
                <h2 className="mt-3 line-clamp-3 text-2xl font-black leading-8 text-white sm:text-3xl">
                  {post.title}
                </h2>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">{post.description}</p>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{post.readingMinutes} min read</span>
                  {post.likes !== undefined && <span>{formatCount(post.likes)} likes</span>}
                  {post.views !== undefined && <span>{formatCount(post.views)} views</span>}
                </div>
                <span className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-zinc-950 transition group-hover:bg-amber-400">
                  Read Guide <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}

      <div className="absolute bottom-0 left-0 z-30 flex items-center gap-1.5" aria-hidden="true">
        {source.slice(0, Math.min(source.length, 8)).map((post, index) => (
          <span
            key={post.slug}
            className={`h-1.5 rounded-full transition-all duration-300 ${index === activeIndex % Math.min(source.length, 8) ? "w-7 bg-amber-400" : "w-1.5 bg-zinc-700"}`}
          />
        ))}
      </div>

      <span className="absolute bottom-0 right-0 z-30 text-[11px] font-medium text-zinc-600">
        {paused ? "Paused — click a card to read" : "Auto-changing featured guides"}
      </span>
    </div>
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
        .most-popular-window:focus-visible { box-shadow: 0 0 0 2px rgb(255 255 255 / .8); }
        .most-popular-track { display: grid; gap: .75rem; animation: most-popular-scroll 42s linear infinite; will-change: transform; }
        .most-popular-window:hover .most-popular-track, .most-popular-window:focus .most-popular-track, .most-popular-window:focus-within .most-popular-track { animation-play-state: paused; }
        @media (max-width: 639px) { .most-popular-window { height: 310px; } .most-popular-track { animation-duration: 36s; } }
        @media (prefers-reduced-motion: reduce) { .most-popular-track { animation: none; transform: translateY(0); } }
      `}</style>

      <div className="rounded-3xl border border-zinc-800 bg-amber-400 p-5 shadow-2xl sm:p-7">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-white">Featured collection</p>
            <FeaturedStack source={source} />
          </div>

          <div>
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white">Most Popular</p>
              <h2 id="most-popular-blogs-title" className="mt-2 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Popular blogs</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-800">A simple text list of useful guides. Hover to pause the loop, then click any title to open it.</p>
            </div>

            <div className="most-popular-window" tabIndex={0} aria-label="Most popular blog list. Hover or focus to pause scrolling.">
              <div className="most-popular-track">
                {[...source, ...source].map((post, index) => (
                  <PopularTextCard key={`${post.slug}-${index}`} post={post} rank={(index % source.length) + 1} />
                ))}
              </div>
            </div>

            <Link to="/blog" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white hover:text-zinc-950">
              View all blogs <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
