/**
 * Blog content source. Content is authored as structured blocks so every
 * article renders as semantic HTML in the server-rendered output.
 */
export type Block =
  | { t: "p"; text: string }
  | { t: "h2"; text: string }
  | { t: "h3"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "note"; text: string };

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

const AUTHOR = "Auto Edit Team";
export const blogAuthor = AUTHOR;

export const posts: BlogPost[] = [
  {
    slug: "how-to-edit-a-video-online",
    title: "How to Edit a Video Online (Without Installing Software)",
    metaTitle: "How to Edit a Video Online for Free | Auto Edit",
    description:
      "A step-by-step walkthrough of editing a video online in Auto Edit: add media, supply a timing script, set transitions and captions, preview, then export an MP4.",
    cluster: "Beginner video editing",
    datePublished: "2026-06-02",
    dateModified: "2026-08-20",
    readingMinutes: 6,
    summary:
      "Editing online means your media stays in the browser tab and the export happens on a render server. Here is the exact Auto Edit workflow.",
    blocks: [
      {
        t: "p",
        text: "You can edit a video online in Auto Edit in five steps: add your clips and photos, load a voiceover, supply a timing script, adjust transitions and captions, then export an MP4. No installation and no account are required.",
      },
      { t: "h2", text: "What online editing actually means in Auto Edit" },
      {
        t: "p",
        text: "Auto Edit is a browser-based editor. Your media files are read locally by the browser for preview, so nothing is uploaded while you are arranging the edit. Files are only sent to the render service when you press Generate Video, and the finished MP4 comes back as a download link.",
      },
      { t: "h2", text: "Step 1 — Add media to the media bin" },
      {
        t: "p",
        text: "The left panel is the media bin. It accepts image and video files. Images automatically get Ken Burns motion so stills do not sit frozen on screen.",
      },
      { t: "h2", text: "Step 2 — Add a voiceover and optional music" },
      {
        t: "p",
        text: "Auto Edit times the edit against your voiceover track, so the voiceover defines the length of the video. Background music is optional and has its own volume control plus auto-ducking, which lowers the music while the voice is speaking.",
      },
      { t: "h2", text: "Step 3 — Supply the timing script" },
      {
        t: "p",
        text: "The script file tells Auto Edit which media appears when. It accepts a JSON segment list or an SRT file. Each segment carries a start time, an end time, the caption text and the media it should show.",
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
    ],
    related: ["how-to-cut-a-video", "how-to-add-captions-to-a-video", "what-is-an-aspect-ratio"],
  },
  {
    slug: "how-to-cut-a-video",
    title: "How to Cut a Video: Trimming, Jump Cuts and Pacing",
    metaTitle: "How to Cut a Video Online | Auto Edit",
    description:
      "Learn how cutting works in Auto Edit: segment boundaries define every cut, and pacing comes from segment length rather than manual dragging.",
    cluster: "Beginner video editing",
    datePublished: "2026-06-09",
    dateModified: "2026-08-12",
    readingMinutes: 5,
    summary:
      "In Auto Edit a cut is a segment boundary. Shorter segments mean faster pacing; longer segments let a shot breathe.",
    blocks: [
      {
        t: "p",
        text: "In Auto Edit you cut a video by defining segments. Each segment in the script has a start and an end time, and every boundary between two segments is a cut.",
      },
      { t: "h2", text: "Why segment-based cutting is different" },
      {
        t: "p",
        text: "Traditional editors ask you to drag clip edges on a timeline. Auto Edit derives the cut list from the script, so the edit follows your narration exactly. Adjusting a single timestamp re-cuts the video without touching anything else.",
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
    ],
    related: ["how-to-edit-a-video-online", "what-is-a-jump-cut", "how-to-add-transitions-to-a-video"],
  },
  {
    slug: "how-to-add-captions-to-a-video",
    title: "How to Add Captions to a Video",
    metaTitle: "How to Add Captions to a Video Online | Auto Edit",
    description:
      "Add captions to a video in Auto Edit using an SRT or JSON script, then pick a caption style, position, font, size and timing offset.",
    cluster: "Captions",
    datePublished: "2026-06-16",
    dateModified: "2026-08-18",
    readingMinutes: 5,
    summary:
      "Auto Edit renders captions from your script text. It does not transcribe audio for you, so bring an SRT or JSON file.",
    blocks: [
      {
        t: "p",
        text: "Auto Edit burns captions into the video from the text in your script file. Load an SRT or JSON script, choose a caption style, and the captions appear in the preview and in the exported MP4.",
      },
      {
        t: "note",
        text: "Auto Edit does not generate a transcript from your audio. Caption text comes from the file you supply.",
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
    metaTitle: "How to Add Music to a Video Online | Auto Edit",
    description:
      "Add background music in Auto Edit, set the music volume, enable auto-ducking, and use loudness normalisation so narration stays clear.",
    cluster: "Audio",
    datePublished: "2026-06-23",
    dateModified: "2026-08-10",
    readingMinutes: 4,
    summary:
      "Music sits under the voiceover. Auto-ducking lowers it while the voice is speaking, so you do not have to draw volume curves.",
    blocks: [
      {
        t: "p",
        text: "Add a music file in the media bin, then set its volume and leave auto-ducking on. Auto Edit lowers the music automatically while your voiceover is speaking and brings it back up in the gaps.",
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
        text: "Auto Edit does not include a music library. Use tracks you have the rights to publish, especially for monetised uploads.",
      },
    ],
    related: ["how-to-edit-a-video-online", "how-to-cut-a-video", "how-to-edit-youtube-videos"],
  },
  {
    slug: "how-to-add-transitions-to-a-video",
    title: "How to Add Transitions to a Video (And When Not To)",
    metaTitle: "How to Add Video Transitions Online | Auto Edit",
    description:
      "Choose a transition pack in Auto Edit, set the transition duration, and override individual scene transitions on the timeline.",
    cluster: "Transitions",
    datePublished: "2026-06-30",
    dateModified: "2026-08-14",
    readingMinutes: 4,
    summary:
      "Transition packs apply a consistent style across the whole edit, and you can override any single scene from the timeline strip.",
    blocks: [
      {
        t: "p",
        text: "Pick a transition pack in the settings panel, set the duration, and Auto Edit applies transitions across every cut. Individual scenes can be overridden from the timeline strip.",
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
    ],
    related: ["what-is-a-video-transition", "how-to-cut-a-video", "how-to-edit-videos-for-tiktok"],
  },
  {
    slug: "how-to-edit-youtube-videos",
    title: "How to Edit YouTube Videos Online",
    metaTitle: "How to Edit YouTube Videos Online Free | Auto Edit",
    description:
      "A practical Auto Edit workflow for 16:9 YouTube uploads: export settings, caption placement, pacing and audio levels.",
    cluster: "YouTube",
    datePublished: "2026-07-07",
    dateModified: "2026-08-16",
    readingMinutes: 5,
    summary: "Use 16:9, export at 1080p, and let the voiceover drive the cut list.",
    blocks: [
      {
        t: "p",
        text: "For a standard YouTube upload, set the aspect ratio to 16:9 and export at 1080p. Auto Edit produces an MP4 you can upload directly.",
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
        text: "Auto Edit includes optional intro and outro cards with a title, subtitle and channel name. Keep the intro under two seconds — long branded intros lose retention.",
      },
    ],
    related: ["how-to-edit-youtube-shorts", "how-to-add-captions-to-a-video", "how-to-add-music-to-a-video"],
  },
  {
    slug: "how-to-edit-youtube-shorts",
    title: "How to Edit YouTube Shorts: Dimensions, Pacing and Captions",
    metaTitle: "How to Edit YouTube Shorts Online | Auto Edit",
    description:
      "Edit YouTube Shorts in Auto Edit with a 9:16 aspect ratio, 1080x1920 export, tight segments and safe caption placement.",
    cluster: "Shorts",
    datePublished: "2026-07-14",
    dateModified: "2026-08-19",
    readingMinutes: 5,
    summary: "Shorts are 9:16. Export 1080p vertical, keep segments short, and keep captions out of the platform UI.",
    blocks: [
      {
        t: "p",
        text: "YouTube Shorts are vertical. Set the aspect ratio to 9:16 in Auto Edit and export at 1080p, which gives a 1080x1920 MP4.",
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
    metaTitle: "Best Video Dimensions for Shorts, TikTok & Reels | Auto Edit",
    description:
      "Reference dimensions for vertical short-form video, plus the Auto Edit aspect ratio and export resolution that produce each one.",
    cluster: "Export settings",
    datePublished: "2026-07-21",
    dateModified: "2026-08-15",
    readingMinutes: 3,
    summary: "Vertical short-form video is 9:16, which is 1080x1920 at 1080p. Square is 1:1 and portrait feed is 4:5.",
    blocks: [
      {
        t: "p",
        text: "For YouTube Shorts, TikTok and Instagram Reels, use 9:16. At 1080p that is 1080x1920. Auto Edit derives the pixel dimensions from the aspect ratio and export resolution you select.",
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
    metaTitle: "How to Edit TikTok Videos Online Free | Auto Edit",
    description:
      "A vertical TikTok editing workflow in Auto Edit: 9:16 canvas, fast segments, karaoke captions and a clean MP4 export.",
    cluster: "TikTok",
    datePublished: "2026-07-28",
    dateModified: "2026-08-17",
    readingMinutes: 4,
    summary: "TikTok rewards pace and on-screen text. Use 9:16, short segments and karaoke captions.",
    blocks: [
      {
        t: "p",
        text: "Set Auto Edit to 9:16, keep segments short, and turn on captions. Export at 1080p and upload the MP4 to TikTok.",
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
    metaTitle: "How to Edit Instagram Reels Online Free | Auto Edit",
    description:
      "Edit Instagram Reels in Auto Edit: 9:16 canvas, caption placement that avoids the Reels UI, colour grading and MP4 export.",
    cluster: "Instagram",
    datePublished: "2026-08-04",
    dateModified: "2026-08-18",
    readingMinutes: 4,
    summary: "Reels are 9:16. Keep captions clear of the caption and action overlays, and grade for a consistent look.",
    blocks: [
      {
        t: "p",
        text: "Instagram Reels use a 9:16 vertical frame. Set that aspect ratio in Auto Edit, export at 1080p, and download the MP4 for upload.",
      },
      { t: "h2", text: "Caption placement" },
      {
        t: "p",
        text: "Instagram overlays the post caption and action buttons over the lower portion of the frame. Lower-third placement inside Auto Edit sits above that area; centre placement is a safe alternative for text-heavy Reels.",
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
    metaTitle: "What Is Video Editing? A Plain Definition | Auto Edit",
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
        text: "Auto Edit handles timing, transitions, captions and colour from a script and a voiceover, which removes the manual dragging while leaving the creative decisions with you.",
      },
    ],
    related: ["what-is-a-jump-cut", "what-is-a-video-transition", "how-to-edit-a-video-online"],
  },
  {
    slug: "what-is-a-jump-cut",
    title: "What Is a Jump Cut?",
    metaTitle: "What Is a Jump Cut? Definition and Use | Auto Edit",
    description:
      "A jump cut removes time from a continuous shot. Learn what it does, why creators use it, and when it becomes distracting.",
    cluster: "Educational",
    datePublished: "2026-08-08",
    dateModified: "2026-08-12",
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
      { t: "h2", text: "Doing it in Auto Edit" },
      {
        t: "p",
        text: "Set the affected boundary to a hard cut and enable trim silence so removed pauses do not leave dead audio.",
      },
    ],
    related: ["how-to-cut-a-video", "what-is-video-editing", "what-is-a-video-transition"],
  },
  {
    slug: "what-is-a-video-transition",
    title: "What Is a Video Transition?",
    metaTitle: "What Is a Video Transition? Types Explained | Auto Edit",
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
      { t: "h2", text: "In Auto Edit" },
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
    metaTitle: "What Is an Aspect Ratio in Video? | Auto Edit",
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
        text: "1920x1080 and 1280x720 are both 16:9. Ratio is shape; resolution is pixel count. Auto Edit combines the two: pick the aspect ratio, then pick 720p, 1080p or 4K.",
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
