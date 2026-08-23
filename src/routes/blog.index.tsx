import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { MarketingLayout, SectionTitle } from "@/components/SiteChrome";
import { blogAuthor, posts } from "@/lib/blog";
import { jsonLd, pageSeo, site } from "@/lib/site";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    ...pageSeo({ title: `Video Editing Guides & Tutorials — ${site.name}`, description: "Practical video editing guides covering online editing, captions, transitions, audio, YouTube and social video workflows.", path: "/blog" }),
    scripts: [jsonLd({ "@context": "https://schema.org", "@type": "Blog", name: `${site.name} Blog`, url: `${site.url}/blog`, publisher: { "@type": "Organization", name: site.name } })],
  }),
  component: BlogIndex,
});
function BlogIndex() { return <MarketingLayout><section className="mx-auto max-w-6xl px-4 py-20 sm:px-6"><SectionTitle eyebrow="Guides & tutorials" title="Learn the workflow, not just the buttons" description="Practical articles based on the editor's real capabilities, from timing scripts and captions to audio and platform-specific exports."/><div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{posts.map((post)=><article key={post.slug} className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-700"><div className="flex items-center gap-3 text-xs text-zinc-500"><span>{post.cluster}</span><span>•</span><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5"/>{post.readingMinutes} min</span></div><h2 className="mt-4 text-xl font-semibold leading-7 text-white group-hover:text-amber-300">{post.title}</h2><p className="mt-3 flex-1 text-sm leading-6 text-zinc-500">{post.description}</p><div className="mt-6 flex items-center justify-between text-xs text-zinc-600"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5"/>{post.datePublished}</span><Link to="/blog/$slug" params={{ slug: post.slug }} className="inline-flex items-center gap-1 font-semibold text-amber-400 hover:text-amber-300">Read <ArrowRight className="h-3.5 w-3.5"/></Link></div></article>)}</div><p className="mt-10 text-center text-xs text-zinc-600">Written by {blogAuthor}</p></section></MarketingLayout>; }
