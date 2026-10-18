import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { posts } from "@/lib/blog";
import { supportPosts } from "@/lib/supportPosts";

const allBlogPosts = [...posts, ...supportPosts];

export function BlogMarquee() {
  return <section className="border-y border-zinc-800 bg-zinc-950 py-10 sm:py-12" aria-label="Video editing guides">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-amber-400">Help & resources</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Guides that solve real editing problems</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">Read practical guides for using the editor, fixing common problems and getting better results.</p>
        </div>
        <Link to="/blog" className="inline-flex shrink-0 items-center justify-center gap-2 self-center rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-amber-500/50 hover:bg-zinc-900 sm:self-auto">View all guides <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <div className="relative mt-7 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 py-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-zinc-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-zinc-950 to-transparent" />
        <div className="blog-marquee-track flex w-max gap-4 pr-4" tabIndex={0}>
          {[...allBlogPosts, ...allBlogPosts].map((post, index) => <Link key={`${post.slug}-${index}`} to="/blog/$slug" params={{ slug: post.slug }} className="group/blog block w-[280px] shrink-0 rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-amber-500/50 hover:bg-zinc-900 focus-visible:border-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 sm:w-[320px]">
            <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400"><BookOpen className="h-4 w-4" /></span><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-amber-400">{post.cluster}</p><h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-white group-hover/blog:text-amber-300">{post.title}</h3></div></div>
            <p className="mt-4 line-clamp-2 text-xs leading-5 text-zinc-500">{post.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 group-hover/blog:text-amber-300">Read guide <ArrowRight className="h-3.5 w-3.5" /></span>
          </Link>)}
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-zinc-600">Hover over a guide to pause the loop. Move your cursor away to resume. Click any guide to read the full solution.</p>
    </div>
  </section>;
}
