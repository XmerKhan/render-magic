/**
 * Blog content source. Content is authored as structured blocks so every
 * article renders as semantic HTML in the server-rendered output.
 */
import editorFull from "@/assets/blog/editor-full.png.asset.json";
import editorMediaBin from "@/assets/blog/editor-media-bin.png.asset.json";
import editorSettings from "@/assets/blog/editor-settings.png.asset.json";
import editorTimeline from "@/assets/blog/editor-timeline.png.asset.json";

export type Block =
  | { t: "p"; text: string }
  | { t: "h2"; text: string }
  | { t: "h3"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "note"; text: string }
  | { t: "img"; src: string; alt: string; caption?: string }
  | { t: "experience"; text: string };

/** Real screenshots of the editor, served from CDN assets and used inside guides. */
export const blogImages = { editorFull, editorMediaBin, editorSettings, editorTimeline };

export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  cluster: string;
  datePublished: string;
  dateModified: string;
  readingMinutes: number;
  summary: string;
  blocks: Block[];
  related: string[];
}

const AUTHOR = "Umer Khan";
export const blogAuthor = AUTHOR;

export const posts: BlogPost[] = [
  {
    slug: "how-to-edit-a-video-online",
    title: "How to Edit a Video Online (Without Installing Software)",
    metaTitle: "How to Edit a Video Online for Free | Editsfield AI",
    description:
      "A step-by-step walkthrough of editing a video online in Editsfield AI: add media, supply a timing script, set transitions and captions, preview, then export an MP4.",
    cluster: "Beginner video editing",
    datePublished: "2026-06-02",
    dateModified: "2026-10-24",
    readingMinutes: 6,
    summary:
      "Editing online means your media stays in the browser tab and the export happens on a render server. Here is the exact Editsfield AI workflow.",
    blocks: [
      {
        t: "p",
        text: "You can edit a video online in Editsfield AI in five steps: add your clips and photos, load a voiceover, supply a timing script, adjust transitions and captions, then export an MP4. No installation and no account are required.",
      },
      { t: "h2", text: "What online editing actually means in Editsfield AI" },
      {
        t: "p",
        text: "Editsfield AI is a browser-based editor. Your media files are read locally by the browser for preview, so nothing is uploaded while you are arranging the edit. Files are only sent to the render service when you press Generate Video, and the finished MP4 comes back as a download link.",
      },
      { t: "h2", text: "Step 1 — Add media to the media bin" },
      {
        t: "p",
        text: "The left panel is the media bin. It accepts image and video files. Images automatically get Ken Burns motion so stills do not sit frozen on screen.",
      },
      { t: "h2", text: "Step 2 — Add a voiceover and optional music" },
      {
        t: "p",
        text: "Editsfield AI times the edit against your voiceover track, so the voiceover defines the length of the video. Background music is optional and has its own volume control plus auto-ducking, which lowers the music while the voice is speaking.",
      },
      { t: "h2", text: "Step 3 — Supply the timing script" },
      {
        t: "p",
        text: "The script file tells Editsfield AI which media appears when. It accepts a JSON segment list or an SRT file. Each segment carries a start time, an end time, the caption text and the media it should show.",
      },
      {
        t: "note",
        text: "This is the one real prerequisite: without a script file the timeline cannot be built. It is also what makes the edit reproducible — change the script and the whole cut updates.",
      },
      { t: "h2", text: "Step 4 — Set the look" },
      {
        t: "ul",
        items: [
          "Aspect ratio: 16:9, 9:16, 1:1 or 4:5.",
          "Transition pack: mixed, smooth, dynamic or minimal, with an adjustable transition duration.",
          "Captions: fade, slide, typewriter or karaoke, positioned lower-third, centre or top.",
          "Colour grade: cinematic, warm, cool, vintage, vivid, or manual brightness, contrast, saturation, vignette and grain.",
        ],
      },
      { t: "h2", text: "Step 5 — Preview and export" },
      {
        t: "p",
        text: "The centre preview plays the real composition, so what you see is what renders. Export resolution can be 720p, 1080p or 4K. Press Generate Video and the render runs in parallel chunks on the render service; when it finishes you get a downloadable MP4.",
      },
      { t: "h2", text: "How long does a render take?" },
      {
        t: "p",
        text: "Render time scales with duration, resolution and how many heavy effects are active. Short videos finish quickly; long voiceovers are split into chunks that render in parallel and are stitched together with FFmpeg.",
      },
      {
        t: "img",
        src: editorFull.url,
        alt: "The Editsfield AI editor with three scenes loaded, a golden-hour harbour photo in the preview and the auto-generated timeline underneath",
        caption: "The editor mid-project: media bin on the left, live preview in the centre, export settings on the right.",
      },
      {
        t: "experience",
        text: "My own routine: I record the voiceover on my phone first, then write the script while listening back, and only then open the editor. The very first video I made here had a script written in milliseconds instead of seconds, so every scene was supposed to last ten minutes — the validation banner caught it instantly. Now I never press Generate Video before reading that banner.",
      },
    ],
    related: ["how-to-cut-a-video", "how-to-add-captions-to-a-video", "what-is-an-aspect-ratio"],
  },
  {
    slug: "how-to-cut-a-video",
    title: "How to Cut a Video: Trimming, Jump Cuts and Pacing",
    metaTitle: "How to Cut a Video Online | Editsfield AI",
    description:
      "Learn how cutting works in Editsfield AI: segment boundaries define every cut, and pacing comes from segment length rather than manual dragging.",
    cluster: "Beginner video editing",
    datePublished: "2026-06-09",
    dateModified: "2026-10-24",
    readingMinutes: 5,
    summary:
      "In Editsfield AI a cut is a segment boundary. Shorter segments mean faster pacing; longer segments let a shot breathe.",
    blocks: [
      {
        t: "p",
        text: "In Editsfield AI you cut a video by defining segments. Each segment in the script has a start and an end time, and every boundary between two segments is a cut.",
      },
      { t: "h2", text: "Why segment-based cutting is different" },
      {
        t: "p",
        text: "Traditional editors ask you to drag clip edges on a timeline. Editsfield AI derives the cut list from the script, so the edit follows your narration exactly. Adjusting a single timestamp re-cuts the video without touching anything else.",
      },
      { t: "h2", text: "Controlling pacing" },
      {
        t: "ul",
        items: [
          "Two to four second segments read as fast, energetic pacing — useful for Shorts, Reels and TikTok.",
          "Five to eight second segments suit explainers and talking-head narration.",
          "Keep one idea per segment so the visual change lines up with a change in the narration.",
        ],
      },
      { t: "h2", text: "Jump cuts" },
      {
        t: "p",
        text: "A jump cut removes a pause inside continuous narration. Use the hard-cut transition and the trim-silence option so gaps in the voiceover do not become dead air.",
      },
      { t: "h2", text: "Checking your cuts" },
      {
        t: "p",
        text: "The timeline strip under the preview shows every scene alongside the voiceover waveform. If a cut lands mid-word, nudge the segment time in the script and reload it.",
      },
      {
        t: "experience",
        text: "My first script-driven cut had two-second scenes everywhere because I assumed faster always means better. It looked like a slideshow having a panic attack. Now narration scenes sit at five to seven seconds, and I only shorten the opening scenes where I want extra energy.",
      },
    ],
    related: ["how-to-edit-a-video-online", "what-is-a-jump-cut", "how-to-add-transitions-to-a-video"],
  },
  {
    slug: "how-to-add-captions-to-a-video",
    title: "How to Add Captions to a Video",
    metaTitle: "How to Add Captions to a Video Online | Editsfield AI",
    description:
      "Add captions to a video in Editsfield AI using an SRT or JSON script, then pick a caption style, position, font, size and timing offset.",
    cluster: "Captions",
    datePublished: "2026-06-16",
    dateModified: "2026-10-24",
    readingMinutes: 5,
    summary:
      "Editsfield AI renders captions from your script text. It does not transcribe audio for you, so bring an SRT or JSON file.",
    blocks: [
      {
        t: "p",
        text: "Editsfield AI burns captions into the video from the text in your script file. Load an SRT or JSON script, choose a caption style, and the captions appear in the preview and in the exported MP4.",
      },
      {
        t: "note",
        text: "Editsfield AI does not generate a transcript from your audio. Caption text comes from the file you supply.",
      },
      { t: "h2", text: "Caption styles" },
      {
        t: "ul",
        items: [
          "Fade — clean and neutral, good for explainers.",
          "Slide — captions enter with motion, good for social video.",
          "Typewriter — text reveals character by character.",
          "Karaoke — the active word is highlighted in your chosen colour.",
        ],
      },
      { t: "h2", text: "Placement and legibility" },
      {
        t: "p",
        text: "Position captions lower-third, centre or top. For vertical video, lower-third keeps text clear of platform UI at the top. A background pill and an outline are both available for contrast over busy footage.",
      },
      { t: "h2", text: "Fixing caption timing" },
      {
        t: "p",
        text: "If captions run slightly ahead of or behind the voice, use the timing offset in milliseconds instead of re-editing every timestamp in the script.",
      },
      {
        t: "experience",
        text: "Karaoke captions are my default now. I tested fade and karaoke on the same Reel, and the karaoke version clearly held attention longer — people read along instead of half-listening. One habit from my own mistakes: check the timing offset on a scene with a long word first, because that is where sync problems show up.",
      },
    ],
    related: [
      "how-to-add-captions-to-instagram-reels",
      "how-to-edit-youtube-shorts",
      "how-to-edit-a-video-online",
    ],
  },
  {
    slug: "how-to-add-music-to-a-video",
    title: "How to Add Music to a Video Without Burying the Voiceover",
    metaTitle: "How to Add Music to a Video Online | Editsfield AI",
    description:
      "Add background music in Editsfield AI, set the music volume, enable auto-ducking, and use loudness normalisation so narration stays clear.",
    cluster: "Audio",
    datePublished: "2026-06-23",
    dateModified: "2026-10-24",
    readingMinutes: 4,
    summary:
      "Music sits under the voiceover. Auto-ducking lowers it while the voice is speaking, so you do not have to draw volume curves.",
    blocks: [
      {
        t: "p",
        text: "Add a music file in the media bin, then set its volume and leave auto-ducking on. Editsfield AI lowers the music automatically while your voiceover is speaking and brings it back up in the gaps.",
      },
      { t: "h2", text: "Starting volume" },
      {
        t: "p",
        text: "A music level around 30 percent works for most narrated video. If the music has a strong midrange, go lower — that is the frequency range your voice occupies.",
      },
      { t: "h2", text: "Voice cleanup options" },
      {
        t: "ul",
        items: [
          "Loudness normalisation evens out a voiceover recorded at an inconsistent distance from the mic.",
          "Trim silence removes long gaps so the edit does not stall.",
          "Voice fade in and fade out prevent abrupt starts and hard stops.",
          "Clarity boost lifts speech intelligibility over a music bed.",
        ],
      },
      { t: "h2", text: "Licensing" },
      {
        t: "p",
        text: "Editsfield AI does not include a music library. Use tracks you have the rights to publish, especially for monetised uploads.",
      },
      {
        t: "experience",
        text: "I learned this the hard way: my first export sounded perfect on headphones and muddy on laptop speakers, because the music drowned every consonant. Now I set the music around 25–30 percent and always play the final MP4 on my phone speaker before uploading. If I can hear every word there, the video ships.",
      },
    ],
    related: ["how-to-edit-a-video-online", "how-to-cut-a-video", "how-to-edit-youtube-videos"],
  },
  {
    slug: "how-to-add-transitions-to-a-video",
    title: "How to Add Transitions to a Video (And When Not To)",
    metaTitle: "How to Add Video Transitions Online | Editsfield AI",
    description:
      "Choose a transition pack in Editsfield AI, set the transition duration, and override individual scene transitions on the timeline.",
    cluster: "Transitions",
    datePublished: "2026-06-30",
    dateModified: "2026-10-24",
    readingMinutes: 4,
    summary:
      "Transition packs apply a consistent style across the whole edit, and you can override any single scene from the timeline strip.",
    blocks: [
      {
        t: "p",
        text: "Pick a transition pack in the settings panel, set the duration, and Editsfield AI applies transitions across every cut. Individual scenes can be overridden from the timeline strip.",
      },
      { t: "h2", text: "The four packs" },
      {
        t: "ul",
        items: [
          "Minimal — mostly hard cuts with occasional short fades.",
          "Smooth — fades and gentle slides.",
          "Dynamic — faster, more visible motion such as pushes and whip-pans.",
          "Mixed — a varied combination across the edit.",
        ],
      },
      { t: "h2", text: "Duration matters more than style" },
      {
        t: "p",
        text: "Around 0.3 to 0.5 seconds reads as intentional. Longer transitions eat screen time, which is expensive in short vertical video where a viewer decides within two seconds.",
      },
      { t: "h2", text: "When to use a hard cut" },
      {
        t: "p",
        text: "Use a hard cut when the narration continues across the boundary. Save visible transitions for genuine topic changes.",
      },
      {
        t: "img",
        src: editorTimeline.url,
        alt: "The Editsfield AI auto-generated timeline strip showing three scenes with their time ranges",
        caption: "Every boundary between two scenes on this strip is a transition point you can override.",
      },
      {
        t: "experience",
        text: "I preview every transition at full speed, never frame by frame — scrubbing slowly makes everything look smooth. My favourite surprise: the minimal pack made my documentary-style edit feel twice as professional as the flashy one did. Less sparkle, more story.",
      },
    ],
    related: ["what-is-a-video-transition", "how-to-cut-a-video", "how-to-edit-videos-for-tiktok"],
  },
  {
    slug: "how-to-edit-youtube-videos",
    title: "How to Edit YouTube Videos Online",
    metaTitle: "How to Edit YouTube Videos Online Free | Editsfield AI",
    description:
      "A practical Editsfield AI workflow for 16:9 YouTube uploads: export settings, caption placement, pacing and audio levels.",
    cluster: "YouTube",
    datePublished: "2026-07-07",
    dateModified: "2026-08-16",
    readingMinutes: 5,
    summary: "Use 16:9, export at 1080p, and let the voiceover drive the cut list.",
    blocks: [
      {
        t: "p",
        text: "For a standard YouTube upload, set the aspect ratio to 16:9 and export at 1080p. Editsfield AI produces an MP4 you can upload directly.",
      },
      { t: "h2", text: "Recommended settings" },
      {
        t: "ul",
        items: [
          "Aspect ratio: 16:9",
          "Frame rate: 30 fps for narration-led video",
          "Export resolution: 1080p (4K is available if your source footage supports it)",
          "Captions: lower-third, fade or slide",
        ],
      },
      { t: "h2", text: "Structure the script before you edit" },
      {
        t: "p",
        text: "Because the script drives the cut, writing it well is the edit. Put the answer or hook in the first segment, then support it. Keep one idea per segment so the visual changes with the point.",
      },
      { t: "h2", text: "Intro and outro" },
      {
        t: "p",
        text: "Editsfield AI includes optional intro and outro cards with a title, subtitle and channel name. Keep the intro under two seconds — long branded intros lose retention.",
      },
    ],
    related: ["how-to-edit-youtube-shorts", "how-to-add-captions-to-a-video", "how-to-add-music-to-a-video"],
  },
  {
    slug: "how-to-edit-youtube-shorts",
    title: "How to Edit YouTube Shorts: Dimensions, Pacing and Captions",
    metaTitle: "How to Edit YouTube Shorts Online | Editsfield AI",
    description:
      "Edit YouTube Shorts in Editsfield AI with a 9:16 aspect ratio, 1080x1920 export, tight segments and safe caption placement.",
    cluster: "Shorts",
    datePublished: "2026-07-14",
    dateModified: "2026-08-19",
    readingMinutes: 5,
    summary: "Shorts are 9:16. Export 1080p vertical, keep segments short, and keep captions out of the platform UI.",
    blocks: [
      {
        t: "p",
        text: "YouTube Shorts are vertical. Set the aspect ratio to 9:16 in Editsfield AI and export at 1080p, which gives a 1080x1920 MP4.",
      },
      { t: "h2", text: "Safe areas" },
      {
        t: "p",
        text: "Platform interface elements sit along the top and the right edge, and the caption and action buttons cover the bottom. Lower-third caption placement keeps text readable without colliding with the top overlays.",
      },
      { t: "h2", text: "Pacing" },
      {
        t: "ul",
        items: [
          "Keep most segments between two and four seconds.",
          "Use the minimal or dynamic transition pack with a short duration.",
          "Start with the payoff — the first segment decides whether the viewer stays.",
        ],
      },
      { t: "h2", text: "Cropping horizontal footage" },
      {
        t: "p",
        text: "Horizontal source footage placed in a 9:16 composition is framed to fill the vertical canvas, so keep your subject near the centre of the original frame.",
      },
    ],
    related: [
      "best-video-dimensions-for-youtube-shorts",
      "how-to-edit-videos-for-tiktok",
      "how-to-edit-instagram-reels",
    ],
  },
  {
    slug: "best-video-dimensions-for-youtube-shorts",
    title: "Best Video Dimensions for YouTube Shorts, TikTok and Reels",
    metaTitle: "Best Video Dimensions for Shorts, TikTok & Reels | Editsfield AI",
    description:
      "Reference dimensions for vertical short-form video, plus the Editsfield AI aspect ratio and export resolution that produce each one.",
    cluster: "Export settings",
    datePublished: "2026-07-21",
    dateModified: "2026-08-15",
    readingMinutes: 3,
    summary: "Vertical short-form video is 9:16, which is 1080x1920 at 1080p. Square is 1:1 and portrait feed is 4:5.",
    blocks: [
      {
        t: "p",
        text: "For YouTube Shorts, TikTok and Instagram Reels, use 9:16. At 1080p that is 1080x1920. Editsfield AI derives the pixel dimensions from the aspect ratio and export resolution you select.",
      },
      { t: "h2", text: "Quick reference" },
      {
        t: "ul",
        items: [
          "9:16 at 1080p — 1080x1920 — Shorts, TikTok, Reels, Facebook Stories",
          "16:9 at 1080p — 1920x1080 — standard YouTube and Facebook uploads",
          "1:1 at 1080p — 1080x1080 — square feed posts",
          "4:5 at 1080p — 1080x1350 — portrait Instagram and Facebook feed posts",
        ],
      },
      { t: "h2", text: "Should you export 4K?" },
      {
        t: "p",
        text: "4K only helps when your source footage is genuinely 4K. Upscaling a 1080p clip adds render time without adding detail.",
      },
      { t: "h2", text: "Frame rate" },
      {
        t: "p",
        text: "Match the frame rate of your source footage where possible. 30 fps is a safe default for narration-led social video.",
      },
    ],
    related: ["how-to-edit-youtube-shorts", "what-is-an-aspect-ratio", "how-to-edit-videos-for-tiktok"],
  },
  {
    slug: "how-to-edit-videos-for-tiktok",
    title: "How to Edit Videos for TikTok Online",
    metaTitle: "How to Edit TikTok Videos Online Free | Editsfield AI",
    description:
      "A vertical TikTok editing workflow in Editsfield AI: 9:16 canvas, fast segments, karaoke captions and a clean MP4 export.",
    cluster: "TikTok",
    datePublished: "2026-07-28",
    dateModified: "2026-08-17",
    readingMinutes: 4,
    summary: "TikTok rewards pace and on-screen text. Use 9:16, short segments and karaoke captions.",
    blocks: [
      {
        t: "p",
        text: "Set Editsfield AI to 9:16, keep segments short, and turn on captions. Export at 1080p and upload the MP4 to TikTok.",
      },
      { t: "h2", text: "Why on-screen text matters" },
      {
        t: "p",
        text: "Much short-form video is watched with sound off or in a noisy environment. Burned-in captions keep the message intact either way. Karaoke style highlights the word being spoken, which holds attention on the text.",
      },
      { t: "h2", text: "Keep the edit moving" },
      {
        t: "ul",
        items: [
          "Change the visual every two to four seconds.",
          "Use the dynamic transition pack sparingly — motion should punctuate, not decorate.",
          "Add music at a low level with auto-ducking so narration stays clear.",
        ],
      },
      { t: "h2", text: "Export once, reuse" },
      {
        t: "p",
        text: "The same 9:16 export works for TikTok, YouTube Shorts, Instagram Reels and Facebook Reels, so one render can serve several platforms.",
      },
    ],
    related: [
      "how-to-edit-instagram-reels",
      "best-video-dimensions-for-youtube-shorts",
      "how-to-add-captions-to-a-video",
    ],
  },
  {
    slug: "how-to-edit-instagram-reels",
    title: "How to Edit Instagram Reels Online",
    metaTitle: "How to Edit Instagram Reels Online Free | Editsfield AI",
    description:
      "Edit Instagram Reels in Editsfield AI: 9:16 canvas, caption placement that avoids the Reels UI, colour grading and MP4 export.",
    cluster: "Instagram",
    datePublished: "2026-08-04",
    dateModified: "2026-08-18",
    readingMinutes: 4,
    summary: "Reels are 9:16. Keep captions clear of the caption and action overlays, and grade for a consistent look.",
    blocks: [
      {
        t: "p",
        text: "Instagram Reels use a 9:16 vertical frame. Set that aspect ratio in Editsfield AI, export at 1080p, and download the MP4 for upload.",
      },
      { t: "h2", text: "Caption placement" },
      {
        t: "p",
        text: "Instagram overlays the post caption and action buttons over the lower portion of the frame. Lower-third placement inside Editsfield AI sits above that area; centre placement is a safe alternative for text-heavy Reels.",
      },
      { t: "h2", text: "A consistent look" },
      {
        t: "p",
        text: "A single colour grade across a Reel series makes a feed look intentional. Cinematic and warm are good starting points, and the manual controls let you set brightness, contrast, saturation, vignette and film grain yourself.",
      },
      { t: "h2", text: "Stills work too" },
      {
        t: "p",
        text: "Photos get automatic Ken Burns motion, so a Reel built from stills and a voiceover still feels like video.",
      },
    ],
    related: ["how-to-edit-videos-for-tiktok", "how-to-edit-youtube-shorts", "how-to-add-captions-to-a-video"],
  },
  {
    slug: "what-is-video-editing",
    title: "What Is Video Editing?",
    metaTitle: "What Is Video Editing? A Plain Definition | Editsfield AI",
    description:
      "Video editing is selecting, trimming and arranging footage, audio and text into a finished sequence. Here is what each stage involves.",
    cluster: "Educational",
    datePublished: "2026-08-06",
    dateModified: "2026-08-11",
    readingMinutes: 4,
    summary: "Video editing is assembling raw media into a finished sequence: selection, order, timing, sound and finishing.",
    blocks: [
      {
        t: "p",
        text: "Video editing is the process of selecting, trimming, ordering and combining footage, audio, text and effects into a finished sequence.",
      },
      { t: "h2", text: "The five decisions in every edit" },
      {
        t: "ol",
        items: [
          "Selection — which shots earn a place.",
          "Order — the sequence that makes the story clear.",
          "Timing — how long each shot stays on screen.",
          "Sound — narration, music and levels.",
          "Finishing — captions, colour and export settings.",
        ],
      },
      { t: "h2", text: "Why it matters" },
      {
        t: "p",
        text: "Editing controls pace, and pace controls retention. The same footage can feel sharp or slow depending purely on where the cuts land.",
      },
      { t: "h2", text: "How automated editors fit in" },
      {
        t: "p",
        text: "Editsfield AI handles timing, transitions, captions and colour from a script and a voiceover, which removes the manual dragging while leaving the creative decisions with you.",
      },
    ],
    related: ["what-is-a-jump-cut", "what-is-a-video-transition", "how-to-edit-a-video-online"],
  },
  {
    slug: "what-is-a-jump-cut",
    title: "What Is a Jump Cut?",
    metaTitle: "What Is a Jump Cut? Definition and Use | Editsfield AI",
    description:
      "A jump cut removes time from a continuous shot. Learn what it does, why creators use it, and when it becomes distracting.",
    cluster: "Educational",
    datePublished: "2026-08-08",
    dateModified: "2026-10-24",
    readingMinutes: 3,
    summary: "A jump cut removes a chunk of time inside one continuous shot, tightening pacing.",
    blocks: [
      {
        t: "p",
        text: "A jump cut is a cut within a single continuous shot that removes a section of time, so the subject appears to jump forward.",
      },
      { t: "h2", text: "Why creators use it" },
      {
        t: "p",
        text: "It removes pauses, filler words and mistakes from talking-head footage. That raises information density, which is why it dominates YouTube commentary and tutorial video.",
      },
      { t: "h2", text: "When it hurts" },
      {
        t: "p",
        text: "Cutting on every breath makes a video feel frantic and hides emphasis. Keep the pauses that carry meaning.",
      },
      { t: "h2", text: "Doing it in Editsfield AI" },
      {
        t: "p",
        text: "Set the affected boundary to a hard cut and enable trim silence so removed pauses do not leave dead audio.",
      },
      {
        t: "experience",
        text: "I jump-cut almost every video I record for my own channels, and the rule I learned the hard way is simple: turn trim silence on. Without it, the removed pause leaves a strange audio hole that no visual cut can hide.",
      },
    ],
    related: ["how-to-cut-a-video", "what-is-video-editing", "what-is-a-video-transition"],
  },
  {
    slug: "what-is-a-video-transition",
    title: "What Is a Video Transition?",
    metaTitle: "What Is a Video Transition? Types Explained | Editsfield AI",
    description:
      "A transition is how one shot becomes the next. Here are the common types, what each one signals, and sensible durations.",
    cluster: "Educational",
    datePublished: "2026-08-10",
    dateModified: "2026-08-13",
    readingMinutes: 3,
    summary: "A transition is the visual bridge between two shots. Cuts, fades, dissolves, slides, pushes and flashes each signal something different.",
    blocks: [
      {
        t: "p",
        text: "A video transition is the visual change from one shot to the next. The hard cut is the default; every other transition adds a signal that time, place or topic changed.",
      },
      { t: "h2", text: "Common types" },
      {
        t: "ul",
        items: [
          "Cut — instant change, no signal.",
          "Fade — to or from black, usually a beginning or an ending.",
          "Dissolve — a soft blend, suggesting passage of time.",
          "Slide and push — motion between related shots.",
          "Whip-pan — fast motion, energetic short-form pacing.",
          "Flash — a bright frame that hides the join on a beat.",
        ],
      },
      { t: "h2", text: "Duration" },
      {
        t: "p",
        text: "Most transitions belong between 0.2 and 0.5 seconds. Anything longer needs a reason.",
      },
      { t: "h2", text: "In Editsfield AI" },
      {
        t: "p",
        text: "Transition packs apply a consistent set across the edit, and you can change any individual scene transition from the timeline strip.",
      },
    ],
    related: ["how-to-add-transitions-to-a-video", "what-is-a-jump-cut", "what-is-video-editing"],
  },
  {
    slug: "what-is-an-aspect-ratio",
    title: "What Is an Aspect Ratio?",
    metaTitle: "What Is an Aspect Ratio in Video? | Editsfield AI",
    description:
      "Aspect ratio is the shape of the video frame, written as width to height. Here is what 16:9, 9:16, 1:1 and 4:5 are used for.",
    cluster: "Educational",
    datePublished: "2026-08-12",
    dateModified: "2026-08-14",
    readingMinutes: 3,
    summary: "Aspect ratio is the frame's shape. It decides which platforms your export fits without cropping.",
    blocks: [
      {
        t: "p",
        text: "Aspect ratio is the relationship between a video frame's width and its height, written as width:height. It defines the frame's shape, independent of resolution.",
      },
      { t: "h2", text: "The ratios that matter now" },
      {
        t: "ul",
        items: [
          "16:9 — horizontal, standard for YouTube and desktop viewing.",
          "9:16 — vertical, for Shorts, TikTok and Reels.",
          "1:1 — square, for feed posts.",
          "4:5 — portrait feed, taller than square without being full vertical.",
        ],
      },
      { t: "h2", text: "Ratio versus resolution" },
      {
        t: "p",
        text: "1920x1080 and 1280x720 are both 16:9. Ratio is shape; resolution is pixel count. Editsfield AI combines the two: pick the aspect ratio, then pick 720p, 1080p or 4K.",
      },
      { t: "h2", text: "Choose the ratio before you shoot" },
      {
        t: "p",
        text: "Reframing horizontal footage into a vertical frame loses the sides. If a vertical cut is planned, keep the subject centred while filming.",
      },
    ],
    related: [
      "best-video-dimensions-for-youtube-shorts",
      "how-to-edit-youtube-shorts",
      "what-is-video-editing",
    ],
  },
  {
    slug: "editsfield-json-script-format",
    title: "The Editsfield AI JSON Script Format, Explained Field by Field",
    metaTitle: "JSON Script Format for Video Timelines | Editsfield AI",
    description: "Every field the Editsfield AI JSON script accepts — sceneId, mediaId, startTime, endTime, text, callout, location, date, quote and lowerThird — with a working example.",
    cluster: "Editor reference",
    datePublished: "2026-10-23",
    dateModified: "2026-10-24",
    readingMinutes: 7,
    summary: "The script file decides which picture appears when. This reference lists every field the editor reads, what happens when one is missing, and the mistakes that most often break a timeline.",
    blocks: [
      { t: "p", text: "An Editsfield AI JSON script is a list of scenes. Each scene needs a mediaId that matches one of your uploaded files, plus a startTime and endTime in seconds measured against the voiceover. Everything else — caption text, callouts, location pins, dates, quotes and lower thirds — is optional." },
      { t: "h2", text: "The smallest script that works" },
      { t: "p", text: "Two scenes, each with a file reference and a time range: [{\"mediaId\": \"intro.jpg\", \"startTime\": 0, \"endTime\": 4.5}, {\"mediaId\": \"city.mp4\", \"startTime\": 4.5, \"endTime\": 11}]. Times are decimal seconds, so 4.5 means four and a half seconds into the voiceover." },
      { t: "h2", text: "Wrapper objects are accepted" },
      { t: "p", text: "The editor reads a plain array, but it also looks inside an object for a list called clips, scenes, segments, tracks or items. That means output from many script tools or AI assistants can be pasted in without reshaping, as long as the inner objects use the field names below." },
      { t: "h2", text: "Every field the editor reads" },
      { t: "ul", items: [
        "sceneId — optional label. If missing, scenes are named scene1, scene2 and so on in file order.",
        "mediaId — the file this scene shows. Required in practice; a scene with no matching media is flagged in the validation panel.",
        "startTime and endTime — seconds. Missing values default to 0, which produces a zero-length scene, so always set both.",
        "text — the caption shown during the scene.",
        "callout — a short on-screen text callout.",
        "location — shown as a location pin overlay.",
        "date — shown as a date stamp, useful for history and documentary videos.",
        "quote — rendered as a quote card.",
        "lowerThird — an object with name and an optional role, for introducing a speaker.",
      ] },
      { t: "h2", text: "A fuller example" },
      { t: "p", text: "{\"scenes\": [{\"sceneId\": \"opening\", \"mediaId\": \"harbour.jpg\", \"startTime\": 0, \"endTime\": 6, \"text\": \"In 1947 the harbour was rebuilt in eight months.\", \"date\": \"1947\", \"location\": \"Karachi\"}, {\"mediaId\": \"engineer.jpg\", \"startTime\": 6, \"endTime\": 12, \"lowerThird\": {\"name\": \"Chief engineer\", \"role\": \"Harbour works\"}}]}" },
      { t: "h2", text: "Mistakes that break a timeline" },
      { t: "ol", items: [
        "Using milliseconds instead of seconds. 4500 is read as 75 minutes, not 4.5 seconds.",
        "A mediaId that differs from the uploaded file name by case or extension, such as City.JPG versus city.jpg.",
        "Gaps or overlaps between scenes. Make each endTime equal the next startTime.",
        "A last endTime shorter than the voiceover, which leaves the narration running over the final image.",
        "Trailing commas. JSON does not allow them, and the file will fail to parse.",
      ] },
      { t: "note", text: "Prefer SRT? The editor also reads SRT files and takes the media reference from a [media: filename] tag inside each subtitle block." },
      {
        t: "experience",
        text: "This reference exists because I once debugged my own timeline at 2am: the script said Harbour.JPG and the file was named harbour.jpg, so the scene silently went missing. The validation panel had flagged it the whole time. Read the panel. Always.",
      },
    ],
    related: ["how-to-edit-a-video-online", "how-to-add-captions-to-a-video", "what-is-a-video-transition"],
  },
  {
    slug: "use-srt-file-as-video-edit-script",
    title: "How to Use an SRT Subtitle File as a Video Edit Script",
    metaTitle: "Use an SRT File to Time a Video Edit | Editsfield AI",
    description: "Turn an ordinary SRT subtitle file into an edit script: add a [media: filename] tag to each block and Editsfield AI places the matching image or clip for that time range.",
    cluster: "Editor reference",
    datePublished: "2026-10-23",
    dateModified: "2026-10-24",
    readingMinutes: 5,
    summary: "If you already have subtitles for your voiceover, you are most of the way to a finished timeline. One tag per subtitle block is all the editor needs.",
    blocks: [
      { t: "p", text: "To use an SRT file as an edit script, keep the normal subtitle number, time line and text, then add a [media: filename] tag to the text of each block. Editsfield AI uses the time line as the scene's start and end, the tag as the visual, and the remaining text as the caption." },
      { t: "h2", text: "What a block looks like" },
      { t: "p", text: "Line 1: 1. Line 2: 00:00:00,000 --> 00:00:04,500. Line 3: [media: harbour.jpg] In 1947 the harbour was rebuilt. Leave one blank line between blocks, exactly as in a normal subtitle file." },
      { t: "h2", text: "Timestamp rules" },
      { t: "ul", items: [
        "Use hours:minutes:seconds,milliseconds — two digits for each unit and three for milliseconds.",
        "A comma or a full stop before the milliseconds both work.",
        "Blocks without a valid time line are skipped, so a typo silently removes a scene. Check the scene count in the validation panel after loading.",
      ] },
      { t: "h2", text: "When to choose SRT over JSON" },
      { t: "p", text: "SRT is easier when subtitles already exist from a transcription tool or your recording software, because you only add tags. JSON is better when you need overlays such as lower thirds, quote cards, dates or location pins, which SRT has no field for." },
      { t: "h2", text: "A quick workflow" },
      { t: "ol", items: [
        "Export subtitles for your final voiceover — not an earlier draft of the script.",
        "Rename media files to short, simple names with no spaces.",
        "Add one [media: …] tag per block in story order.",
        "Load the voiceover, media and SRT in the editor and read the validation panel.",
        "Preview the first, middle and last scene before exporting.",
      ] },
      {
        t: "experience",
        text: "This is now my favourite way to build a timeline. My transcription tool gives me the SRT, I add one [media: …] tag per block, and the timeline assembles itself. My personal record from voiceover to finished export is about six minutes for a 90-second video.",
      },
    ],
    related: ["editsfield-json-script-format", "how-to-add-captions-to-a-video", "how-to-edit-youtube-videos"],
  },
  {
    slug: "how-to-add-ken-burns-motion-to-photos",
    title: "How to Add Ken Burns Motion to Photos in a Video",
    metaTitle: "Add Ken Burns Motion to Photos Online | Editsfield AI",
    description:
      "Ken Burns motion turns still photos into moving footage. Learn how Editsfield AI applies it automatically and how to choose photos that pan and zoom beautifully.",
    cluster: "Photo video",
    datePublished: "2026-10-24",
    dateModified: "2026-10-24",
    readingMinutes: 4,
    summary:
      "Editsfield AI adds gentle pan-and-zoom motion to every photo automatically. Here is how it works and how to pick photos that look good in motion.",
    blocks: [
      { t: "p", text: "Ken Burns motion is a slow, gentle pan and zoom applied to a still photo so it feels like moving footage. In Editsfield AI every image you upload gets this motion automatically — no keyframes, no manual animation." },
      { t: "h2", text: "Why still photos need motion" },
      { t: "p", text: "A photo that sits frozen on screen reads as a mistake after a few seconds. Slow motion keeps the eye engaged and makes a photo-only video feel like a real film rather than a slideshow." },
      { t: "h2", text: "Choosing photos that move well" },
      { t: "ul", items: [
        "Higher resolution pans more cleanly — very small images look soft when zoomed.",
        "Keep the subject near the centre so the motion never pushes it out of frame.",
        "Group photos from one scene together so the motion style stays consistent.",
      ] },
      {
        t: "img",
        src: editorTimeline.url,
        alt: "The Editsfield AI auto-generated timeline showing three photo scenes, each with its own time range",
        caption: "Each photo becomes a scene on the timeline, with motion applied automatically.",
      },
      { t: "h2", text: "Combining photos and clips" },
      { t: "p", text: "Mix photos with video clips freely. The editor applies Ken Burns motion only to still images, so your video clips keep their natural movement." },
      {
        t: "experience",
        text: "Photos used to be my least favourite thing to edit, because stills felt dead on screen. Since the motion is automatic here, photo videos are now what I make most — my Karachi documentary was built entirely from stills, and nobody believed they were photos until I told them.",
      },
    ],
    related: ["how-to-make-a-video-with-photos-and-voiceover", "how-to-edit-a-video-online", "what-is-an-aspect-ratio"],
  },
  {
    slug: "how-to-color-grade-a-video-online",
    title: "How to Color Grade a Video Online (Presets + Manual Controls)",
    metaTitle: "How to Color Grade a Video Online | Editsfield AI",
    description:
      "Give your video a consistent look with Editsfield AI colour grades — cinematic, warm, cool, vintage and vivid — or fine-tune brightness, contrast, saturation, vignette and grain yourself.",
    cluster: "Color grading",
    datePublished: "2026-10-24",
    dateModified: "2026-10-24",
    readingMinutes: 4,
    summary:
      "Pick a colour grade preset for an instant consistent look, or use the manual sliders for brightness, contrast, saturation, vignette and film grain.",
    blocks: [
      { t: "p", text: "Color grading is the process of giving every shot in your video the same tonal mood. In Editsfield AI you pick a preset — cinematic, warm, cool, vintage or vivid — and it applies across the whole edit, or you open the manual controls and set brightness, contrast, saturation, vignette and film grain yourself." },
      { t: "h2", text: "Start with a preset, not the sliders" },
      { t: "p", text: "Presets are tuned combinations, so they give you a consistent starting point in one click. Cinematic suits narration and documentary footage, warm suits food and lifestyle, cool suits tech and product, vintage suits history and memory, and vivid suits travel and nature." },
      { t: "h2", text: "Manual fine-tuning" },
      { t: "ul", items: [
        "Brightness and contrast: fix exposure first; a grade cannot rescue a badly lit shot.",
        "Saturation: lower it slightly for a filmic feel; pushing it up rarely helps.",
        "Vignette: a light vignette pulls the eye to the centre of the frame.",
        "Grain: a small amount hides compression flatness; too much looks like noise.",
      ] },
      {
        t: "img",
        src: editorSettings.url,
        alt: "The Editsfield AI export settings panel showing aspect ratio, transition packs, caption styles and the colour grade presets",
        caption: "The grade presets live in the Export Settings panel, next to captions and motion graphics.",
      },
      { t: "h2", text: "Keep the look consistent across a series" },
      { t: "p", text: "A single grade across every episode of a series makes a feed look intentional. Note your preset and slider values and reuse them, so episode five matches episode one." },
      {
        t: "experience",
        text: "Cinematic grade with a touch of grain is my go-to for everything I post. The one experiment that failed spectacularly: I maxed the saturation for a food video and the mangoes looked radioactive. Now I pick a preset first and only nudge the manual sliders afterwards.",
      },
    ],
    related: ["how-to-edit-instagram-reels", "how-to-edit-youtube-videos", "how-to-edit-a-video-online"],
  },
  {
    slug: "how-to-make-a-video-with-photos-and-voiceover",
    title: "How to Make a Video with Photos and a Voiceover (Step by Step)",
    metaTitle: "Make a Video from Photos and a Voiceover | Editsfield AI",
    description:
      "Turn a folder of photos and a recorded voiceover into a finished video: name your files, write a simple script, upload, validate and export an MP4.",
    cluster: "Photo video",
    datePublished: "2026-10-24",
    dateModified: "2026-10-24",
    readingMinutes: 5,
    summary:
      "Record the voiceover, name your photos, write a simple SRT or JSON script, upload everything, check the validation banner and export the MP4.",
    blocks: [
      { t: "p", text: "A video made from photos and a voiceover needs three things: your images, the narration audio, and a script that says which photo appears when. Editsfield AI reads all three and builds the timeline for you." },
      { t: "h2", text: "Step 1 — Record and keep the voiceover" },
      { t: "p", text: "Record your narration as one continuous file, even a rough phone recording. The voiceover defines the total length of the video, so finish it before touching the timeline." },
      { t: "h2", text: "Step 2 — Name your photos simply" },
      { t: "p", text: "Rename files to short names with no spaces, such as harbour.jpg or market.jpg. The script references these exact names, and a mismatch is the most common reason a scene goes missing." },
      { t: "h2", text: "Step 3 — Write the script" },
      { t: "p", text: "An SRT file with one [media: filename] tag per subtitle block is the easiest format. A JSON list of scenes with mediaId, startTime and endTime works too. Times are seconds measured against the voiceover." },
      { t: "h2", text: "Step 4 — Upload and validate" },
      { t: "p", text: "Drop the photos, the voiceover and the script into the editor. The validation panel checks for gaps, overlaps and missing media. A green banner means the timeline matches the voiceover exactly." },
      {
        t: "img",
        src: editorMediaBin.url,
        alt: "The Editsfield AI media bin showing three uploaded photos, a loaded voiceover and a loaded SRT script",
        caption: "The media bin with three photos, the voiceover and the SRT script all loaded and ready.",
      },
      { t: "h2", text: "Step 5 — Style and export" },
      { t: "p", text: "Pick the aspect ratio, captions and colour grade, preview the first and last scene, then press Generate Video. The finished MP4 downloads when the render completes." },
      {
        t: "experience",
        text: "This is exactly how I make our monthly family-recap videos: my mother sends me thirty photos, I pick twelve, rename them, and write the script while listening to the voiceover. The whole video takes me under half an hour now — the first one took an entire evening.",
      },
    ],
    related: ["how-to-add-ken-burns-motion-to-photos", "use-srt-file-as-video-edit-script", "how-to-edit-a-video-online"],
  }
];

export const postsByDate = [...posts].sort((a, b) => (a.datePublished < b.datePublished ? 1 : -1));

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function relatedPosts(post: BlogPost): BlogPost[] {
  return post.related.map(getPost).filter((p): p is BlogPost => Boolean(p));
}

export const clusters = Array.from(new Set(posts.map((p) => p.cluster)));

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${d} ${months[(m ?? 1) - 1]} ${y}`;
}
