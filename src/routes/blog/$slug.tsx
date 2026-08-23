import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CalendarDays, Clock } from "lucide-react";
import { MarketingLayout } from "@/components/SiteChrome";
import { blogAuthor, posts, type Block } from "@/lib/blog";
import { breadcrumbLd, jsonLd, pageSeo, site } from "@/lib/site";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const post = posts.find((item) => item.slug === params.slug);
    if (!post) return pageSeo({ title: "Article not found — Auto Edit", description: "The requested article could not be found.", path: `/blog/${params.slug}`, noindex: true });
    return { ...pageSeo({ title: post.metaTitle, description: post.description, path: `/blog/${post.slug}`, type: "article", publishedTime: post.datePublished, modifiedTime: post.dateModified }), scripts: [jsonLd({ "@context": "https://schema.org", "@type": "Article", headline: post.title, description: post.description, datePublished: post.datePublished, dateModified: post.dateModified, author: { "@type": "Person", name: blogAuthor }, publisher: { "@type": "Organization", name: site.name }, mainEntityOfPage: `${site.url}/blog/${post.slug}` }), jsonLd(breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }]))] };
  },
  component: BlogPostPage,
});

function renderBlock(block: Block, index: number) {
  if (block.t === "p") return <p key={index}>{block.text}</p>;
  if (block.t === "h2") return <h2 key={index} className="pt-6 text-2xl font-bold tracking-tight text-white">{block.text}</h2>;
  if (block.t === "h3") return <h3 key={index} className="pt-4 text-xl font-semibold text-white">{block.text}</h3>;
  if (block.t === "note") return <aside key={index} className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-sm text-amber-100">{block.text}</aside>;
  if (block.t === "ul") return <ul key={index} className="list-disc space-y-2 pl-6">{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
  return <ol key={index} className="list-decimal space-y-2 pl-6">{block.items.map((item) => <li key={item}>{item}</li>)}</ol>;
}

function BlogPostPage() {
  const { slug } = Route.useParams();
  const post = posts.find((item) => item.slug === slug);
  if (!post) return <MarketingLayout><section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6"><h1 className="text-4xl font-bold text-white">Article not found</h1><p className="mt-4 text-zinc-500">This article does not exist.</p><Link to="/blog" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-3 font-semibold text-zinc-950">Back to blog</Link></section></MarketingLayout>;
  const related = post.related.map((slug) => posts.find((item) => item.slug === slug)).filter(Boolean);
  return <MarketingLayout><article className="mx-auto max-w-3xl px-4 py-16 sm:px-6"><Link to="/blog" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft className="h-4 w-4"/> All articles</Link><div className="mt-10"><p className="text-sm font-semibold uppercase tracking-[.18em] text-amber-400">{post.cluster}</p><h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">{post.title}</h1><p className="mt-5 text-lg leading-8 text-zinc-400">{post.summary}</p><div className="mt-6 flex flex-wrap gap-4 text-xs text-zinc-600"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5"/>{post.datePublished}</span><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5"/>{post.readingMinutes} min read</span><span>By {blogAuthor}</span></div></div><div className="prose prose-invert mt-12 max-w-none space-y-5 text-[15px] leading-7 text-zinc-400">{post.blocks.map(renderBlock)}</div>{related.length > 0 && <div className="mt-16 border-t border-zinc-800 pt-8"><h2 className="text-lg font-semibold text-white">Related guides</h2><div className="mt-4 grid gap-3">{related.map((item) => item && <Link key={item.slug} to="/blog/$slug" params={{slug:item.slug}} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-300 hover:border-zinc-700 hover:text-white"><span>{item.title}</span><ArrowRight className="h-4 w-4 text-amber-400"/></Link>)}</div></div>}</article></MarketingLayout>;
}
