import { ArrowRight, CheckCircle2, Image, Music2, Scissors, Sparkles, Subtitles, Wand2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { MarketingLayout, SectionTitle } from "@/components/SiteChrome";
import { MostPopularBlogs } from "@/components/MostPopularBlogs";

const features = [
  [Scissors, "Script-driven scene timing", "Use a timestamped JSON or SRT timeline to control when each image or clip appears. For automatic matching, provide a script and word-level transcript."],
  [Sparkles, "Motion for still images", "Add controlled pan and zoom movement to still images. Review the framing in the preview, especially when converting horizontal images to vertical video."],
  [Wand2, "Transitions and overlays", "Choose a transition style and use available overlays such as lower thirds, text callouts, date stamps, location pins and quote cards."],
  [Subtitles, "Caption styling", "Style supplied caption text with supported animation, placement and typography controls. Prepare and check the transcript before export."],
  [Music2, "Voiceover and music controls", "Combine narration with optional background music. Use available ducking and loudness controls, then listen to the exported file before publishing."],
  [Image, "Aspect ratio and export", "Choose a canvas for YouTube, Shorts, Reels or feed posts, then select an available export resolution that suits your source footage and device."],
] as const;

const faqs = [
  { q: "Does Editsfield AI automatically transcribe my voiceover?", a: "No. Auto Sync uses an original script and a word-level timestamp transcript that you provide. It matches the text in speaking order; it is not a speech-to-text transcription service." },
  { q: "Can I use my own images, clips and voiceover?", a: "Yes. Prepare media you have permission to use, add your voiceover, and provide timing data. Check the preview to make sure each visual matches the narration before exporting." },
  { q: "Is the browser preview the same as the downloaded MP4?", a: "The preview helps you check scene order, timing and visual treatment, but browser playback and final export use different processing paths. Always review the downloaded MP4, including its audio and ending." },
  { q: "Which project is a good fit?", a: "The editor is especially suited to narration-led videos with a planned sequence of images or clips, such as explainers, documentary videos and social posts. It is not a replacement for every frame-by-frame editing workflow." },
  { q: "What should I check before a long export?", a: "Test a short section first, confirm script and media order, listen to the voiceover, review crop and captions, and choose a resolution appropriate for the project." },
];

export function HomePageWithPopular() {
  return <MarketingLayout>
    <section className="relative overflow-hidden border-b border-zinc-800">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(245,158,11,.18),transparent_50%)]" />
      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
        <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">A workflow for narration-led videos</span>
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl">Turn a script, voiceover and scene assets into a video timeline.</h1>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">Editsfield AI helps creators assemble narration-led videos from their own images, clips, audio and timing data. Prepare your script and transcript, check the scene timing in the preview, and export when the edit looks right.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/editor" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 font-bold text-zinc-950 hover:bg-amber-400">Open the editor <ArrowRight className="h-5 w-5" /></Link>
          <Link to="/how-it-works" className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-6 py-3.5 font-semibold text-white hover:bg-zinc-900">Read the workflow</Link>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-3 text-left sm:grid-cols-3">
          <Stat title="Script-led" text="Use timestamps to keep scene changes connected to narration." />
          <Stat title="Creator formats" text="Prepare landscape, vertical, square or portrait-feed projects." />
          <Stat title="Review before export" text="Check timing, crop, captions and audio before rendering." />
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionTitle as="h2" eyebrow="What the editor does" title="Tools for the repeated steps in a narration-led edit" description="The editor focuses on assembling scenes, timing them to a prepared script, styling the picture and audio, and exporting a finished file." />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{features.map(([Icon,title,text]) => <FeatureCard key={title} Icon={Icon} title={title} text={text} />)}</div>
    </section>

    <section className="border-y border-zinc-800 bg-zinc-900/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-amber-400">A practical workflow</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Prepare the inputs before you render.</h2>
          <p className="mt-5 leading-7 text-zinc-400">Accurate inputs make a bigger difference than adding more effects. Keep the media in story order, use the script version that matches the recorded voiceover, and check a few scene changes before exporting the full project.</p>
          <ol className="mt-7 space-y-4">{[
            "Arrange images and clips in the intended scene order.",
            "Add the original voiceover and optional background music.",
            "Load a supported script/timing file or use Auto Sync with a word-level transcript.",
            "Preview the opening, a middle section and the ending; check captions and framing.",
            "Choose the export settings and review the downloaded MP4 before publishing.",
          ].map((item,i)=><li key={item} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-zinc-950">{i+1}</span><span className="pt-0.5 text-sm leading-6 text-zinc-300">{item}</span></li>)}</ol>
        </div>
        <div className="rounded-2xl border border-zinc-700 bg-zinc-950 p-6">
          <h3 className="text-xl font-bold text-white">Who is it designed for?</h3>
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="font-semibold text-emerald-200">Good fit</p><p className="mt-2 text-sm leading-6 text-zinc-300">Narrated explainers, documentary-style videos, image sequences, tutorial videos and social clips with a planned script and scene order.</p></div>
            <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-4"><p className="font-semibold text-white">May need another editor</p><p className="mt-2 text-sm leading-6 text-zinc-400">Complex multi-camera work, detailed audio mixing, frame-by-frame rotoscoping, collaborative review workflows or projects requiring advanced manual compositing.</p></div>
            <p className="text-xs leading-5 text-zinc-500">The editor does not replace a careful review. Check media rights, narration accuracy, caption spelling, crop and sound levels before publishing.</p>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionTitle as="h2" eyebrow="Frequently asked questions" title="Know what to expect before you start" description="Short answers to common questions about the editing workflow." />
      <div className="mt-8 space-y-3">{faqs.map(({q,a})=><details key={q} className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"><summary className="cursor-pointer list-none pr-6 font-semibold text-white marker:hidden">{q}</summary><p className="mt-3 text-sm leading-6 text-zinc-400">{a}</p></details>)}</div>
    </section>

    <MostPopularBlogs />
    <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
      <h2 className="text-3xl font-bold text-white sm:text-4xl">Start with a short test project.</h2>
      <p className="mx-auto mt-4 max-w-2xl leading-7 text-zinc-400">A few scenes are enough to check the script format, scene order, audio and framing. Once the result is correct, move on to the full video.</p>
      <Link to="/editor" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 font-bold text-zinc-950 hover:bg-amber-400">Open the editor <ArrowRight className="h-5 w-5" /></Link>
    </section>
  </MarketingLayout>;
}

function Stat({title,text}:{title:string;text:string}) { return <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4"><p className="font-semibold text-white">{title}</p><p className="mt-1 text-sm leading-6 text-zinc-400">{text}</p></div>; }
function FeatureCard({Icon,title,text}:{Icon:React.ElementType;title:string;text:string}) { return <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:-translate-y-0.5 hover:border-zinc-700"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"><Icon className="h-5 w-5"/></span><h3 className="mt-5 font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p></div>; }
