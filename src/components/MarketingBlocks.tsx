import { ArrowRight, Check, Image, Music2, Scissors, Sparkles, Subtitles, Wand2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { MarketingLayout, SectionTitle } from "@/components/SiteChrome";

const features = [
  [Scissors, "Script-driven scene timing", "Use a prepared JSON or SRT timeline to define scene timing. For Auto Sync, match your original script to a word-level timestamp transcript."],
  [Sparkles, "Ken Burns image motion", "Add pan and zoom movement to still images. Inspect several points in the animation to make sure the subject stays inside the frame."],
  [Wand2, "Transitions and motion overlays", "Choose a transition pack and use available graphics such as lower thirds, text callouts, date stamps, location pins and quote cards."],
  [Subtitles, "Caption styling", "Style caption text supplied through your script/timing data. The editor's caption appearance controls do not replace transcript creation or proofreading."],
  [Music2, "Voiceover and music", "Add a voiceover and optional background track. Available controls include music ducking and audio-level adjustments; always listen to the result."],
  [Image, "Framing and colour", "Choose a 16:9, 9:16, 1:1 or 4:5 canvas and adjust the visual treatment. A different canvas shape may crop the edges of the source media."],
] as const;

export function FeaturesPage() {
  return <MarketingLayout>
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionTitle eyebrow="Features" title="A script-led editor for narration-based videos" description="Editsfield AI focuses on the repetitive parts of assembling a narrated video: matching media to timing data, styling scenes, balancing audio and preparing an export." />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{features.map(([Icon,title,text])=><FeatureCard key={title} Icon={Icon} title={title} text={text}/>)}</div>
      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <FeatureDetail title="Inputs and preparation" intro="For the most predictable result, prepare these files before starting." items={[
          "Images or video clips, already arranged in story order",
          "The original narration as an MP3 or WAV file",
          "Optional background music in a supported audio format",
          "A supported JSON or SRT timeline for manual timing",
          "For Auto Sync: the original script plus a word-level timestamp transcript",
          "An optional scene-order list if the media order differs from the story",
        ]}/>
        <FeatureDetail title="Finishing and export" intro="Use the preview to inspect the edit before committing to a long export." items={[
          "Aspect ratios for landscape, vertical, square and portrait-feed video",
          "Transition packs and scene-level motion options",
          "Caption styles, placement and timing adjustments",
          "Colour presets and manual image adjustments",
          "Voiceover and background-music controls",
          "Available export sizes including 720p, 1080p and 4K where supported",
        ]}/>
      </div>
      <section className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-white">What the editor does not do for you</h2>
        <p className="mt-3 max-w-3xl leading-7 text-zinc-400">Auto Sync is not an automatic speech recognizer: it needs a transcript with word timings. Caption styling does not proofread your words. A preview is not a substitute for checking the downloaded MP4, and changing the aspect ratio may require reframing source media. These checks help prevent errors from carrying into a published video.</p>
        <Link to="/how-it-works" className="mt-5 inline-flex items-center gap-2 font-semibold text-amber-400 hover:text-amber-300">Follow the step-by-step workflow <ArrowRight className="h-4 w-4"/></Link>
      </section>
    </section>
  </MarketingLayout>;
}

function FeatureCard({Icon,title,text}:{Icon:React.ElementType;title:string;text:string}) {
  return <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"><Icon className="h-5 w-5"/></span>
    <h2 className="mt-5 font-semibold text-white">{title}</h2>
    <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
  </article>;
}

function FeatureDetail({title,intro,items}:{title:string;intro:string;items:string[]}) {
  return <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-7">
    <h2 className="text-xl font-semibold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-zinc-400">{intro}</p>
    <ul className="mt-5 space-y-3">{items.map(item=><li key={item} className="flex gap-3 text-sm leading-6 text-zinc-300"><Check className="mt-1 h-4 w-4 shrink-0 text-amber-400"/><span>{item}</span></li>)}</ul>
  </section>;
}

const steps = [
  { n:"01", title:"Organize the scene media", body:"Rename and arrange images or clips in the order of the story. Check the first, middle and final items; a correct timestamp cannot fix a wrong media order." },
  { n:"02", title:"Add the voiceover", body:"Upload the recording that the script was written for. If the narration has been re-recorded or edited, make sure the script and transcript reflect that exact version." },
  { n:"03", title:"Add optional background music", body:"Music is optional. Keep the narration understandable and listen for abrupt starts, stops or volume changes in the final mix." },
  { n:"04", title:"Choose a timing workflow", body:"For manual timing, load a supported JSON or SRT file. For Auto Sync, provide the original script and a word-level transcript with start and end times." },
  { n:"05", title:"Check transcript consistency", body:"Script lines and transcript words should follow the same narration in the same order. Auto Sync matches text; it cannot infer missing narration or correct a transcript from another recording." },
  { n:"06", title:"Confirm scene order", body:"Use the optional Scene Order file only when the media-bin order is not already correct. Verify that every script scene has a corresponding image or clip." },
  { n:"07", title:"Review the timeline and preview", body:"Watch the opening, one or two middle sections and the ending. Check that scene changes do not interrupt a word, that captions are readable and that motion does not crop the subject." },
  { n:"08", title:"Choose export settings and inspect the MP4", body:"Select the target aspect ratio and resolution, then export. Browser preview and final encoding are different paths, so watch the downloaded file and check its sound, timing and final seconds." },
];

export function HowItWorksPage() {
  return <MarketingLayout>
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionTitle eyebrow="How it works" title="A repeatable workflow from source files to export" description="The quality of the output depends on the source media, timing data and review. Use these steps to catch mistakes before a full-length render." />
      <div className="mt-10 grid gap-4 md:grid-cols-2">{steps.map(step=><article key={step.n} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-7"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-zinc-950">{step.n}</span><h2 className="mt-4 text-lg font-semibold text-white">{step.title}</h2><p className="mt-2 text-sm leading-7 text-zinc-400">{step.body}</p></article>)}</div>
      <section className="mt-10 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-white">A small test saves rework</h2>
        <p className="mt-3 leading-7 text-zinc-300">Before processing a long documentary, make a short test with three to five scenes. Confirm that the scene order is right, the narration is the expected file, captions are legible, the crop is acceptable and the ending reaches the audio end. Then use the same file structure for the full project.</p>
        <Link to="/blog" className="mt-5 inline-flex items-center gap-2 font-semibold text-amber-400 hover:text-amber-300">Read troubleshooting guides <ArrowRight className="h-4 w-4"/></Link>
      </section>
    </section>
  </MarketingLayout>;
}

export function AboutPage() {
  return <MarketingLayout><section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
    <SectionTitle eyebrow="About Editsfield AI" title="Built around a specific editing workflow" description="Editsfield AI is a browser-based tool for creators assembling narration-led videos from their own media and timing data."/>
    <div className="mt-10 space-y-5 text-base leading-8 text-zinc-300">
      <p>The product focuses on a practical problem: a narrated video often needs many images or clips placed in the right order, timed against a voiceover, styled with captions and transitions, and exported in the right format. Repeating those steps manually can be tedious, especially for projects with many scenes.</p>
      <p>Editsfield AI brings those steps into one workflow. Users provide the media, voiceover and timing information; the editor helps assemble the timeline and provides controls for motion, captions, audio and export. The creator remains responsible for checking the accuracy and quality of the finished video.</p>
      <p>We also publish troubleshooting guides about file formats, scene order, transcript matching, timing, framing and rendering. The aim is to explain both what the tool can do and what users need to prepare themselves.</p>
    </div>
    <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="text-xl font-bold text-white">What matters to us</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">{["Clear instructions rather than hidden requirements","Honest explanations of supported inputs and limitations","Useful troubleshooting for real editing problems","Respect for the user's source media and creative decisions"].map(x=><li key={x} className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-amber-400"/><span>{x}</span></li>)}</ul>
      <Link to="/editor" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-3 font-semibold text-zinc-950 hover:bg-amber-400">Explore the editor <ArrowRight className="h-4 w-4"/></Link>
    </section>
  </section></MarketingLayout>;
}
