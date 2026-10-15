import type { Block } from "@/lib/blog";

/**
 * Extra, topic-specific checklists and examples that make the core guides useful
 * beyond a short feature summary. Keep advice practical and avoid unsupported
 * performance or platform-ranking promises.
 */
export const articleEnhancements: Record<string, Block[]> = {
  "how-to-edit-a-video-online": [
    { t: "h2", text: "A five-minute pre-export review" },
    { t: "ol", items: [
      "Play the first 20–30 seconds and confirm that the opening visual matches the opening narration.",
      "Jump to a middle scene and check that the timeline has not drifted away from the voiceover.",
      "Check one scene with a face or important object to make sure the crop and zoom preserve it.",
      "Listen with headphones for music that masks speech, clipped words or abrupt audio endings.",
      "Watch the final 10 seconds and confirm that the picture and voiceover finish where expected."
    ] },
    { t: "h2", text: "Choose browser editing for the right kind of project" },
    { t: "p", text: "A script-led browser editor is most convenient when your story is already planned and the work is mainly arranging scenes, timing narration, adding captions and applying consistent styling. If you need detailed compositing, complex keyframing or advanced audio repair, a full desktop editor may be a better fit. Choosing the right tool early avoids trying to force a simple workflow to do a different job." }
  ],
  "how-to-cut-a-video": [
    { t: "h2", text: "A practical way to judge pacing" },
    { t: "p", text: "Do not choose every cut length by a fixed rule. A quick sequence can help introduce several objects or events, while a longer shot gives viewers time to read a chart or understand a location. Watch the edit with the narration: change the visual when the idea changes, not simply because a timer says it is time to cut." },
    { t: "h2", text: "Cut review checklist" },
    { t: "ul", items: [
      "Avoid cutting halfway through a spoken word unless the effect is intentional.",
      "Do not change the visual so quickly that viewers cannot identify the subject.",
      "Use a hard cut when a transition would distract from the information.",
      "After moving a boundary, check both the outgoing and incoming scenes.",
      "Rewatch the whole sequence once; individual cuts can look fine but feel choppy together."
    ] }
  ],
  "how-to-add-captions-to-a-video": [
    { t: "h2", text: "Make captions easier to read" },
    { t: "p", text: "Caption readability depends on more than font size. Use short phrase groups, strong contrast and consistent placement. Leave enough space around the words so the captions do not collide with a face, chart labels or platform controls. For vertical video, inspect the preview at a phone-like size rather than judging only on a large desktop monitor." },
    { t: "h2", text: "Proofread before exporting" },
    { t: "ol", items: [
      "Check names, numbers, dates and technical terms against the original narration.",
      "Confirm that each caption appears for long enough to read.",
      "Look for punctuation or line breaks that change the intended meaning.",
      "Check the first caption, a caption in the middle and the final caption.",
      "Watch the exported MP4 because encoding and playback may reveal issues that were easy to miss in the editor."
    ] }
  ],
  "how-to-add-music-to-a-video": [
    { t: "h2", text: "Balance music by listening, not only by reading a percentage" },
    { t: "p", text: "A volume percentage is a starting point, not a universal loudness target. Music tracks have different mastering levels, and a dense track can mask speech even when its meter looks low. Listen to a quiet sentence and a louder sentence, then adjust the background so consonants remain clear in both." },
    { t: "h2", text: "Check the mix on more than one device" },
    { t: "ul", items: [
      "Listen through headphones to catch clicks, clipping and abrupt edits.",
      "Listen on ordinary laptop or phone speakers to confirm the voice remains understandable.",
      "Check that music returns naturally in pauses rather than jumping up suddenly.",
      "Make sure the music licence allows your intended use, including monetized publishing.",
      "Keep a copy of the original voiceover in case the mix needs to be rebuilt."
    ] }
  ],
  "how-to-add-transitions-to-a-video": [
    { t: "h2", text: "Match the transition to the reason for the cut" },
    { t: "p", text: "A transition should support the relationship between two shots. A quick push or whip can communicate energy, a short dissolve can connect related moments, and a hard cut keeps attention on the information. If the effect attracts more attention than the new scene, shorten it or use a cut." },
    { t: "h2", text: "Check transitions at normal playback speed" },
    { t: "ol", items: [
      "Preview several consecutive cuts rather than judging a transition in isolation.",
      "Check faces, text and high-contrast edges while motion is happening.",
      "Avoid stacking a strong camera move with a second strong zoom unless you want that emphasis.",
      "Use a consistent visual language for scenes that belong to the same section.",
      "Recheck the transition after changing scene duration or timing."
    ] }
  ],
  "how-to-edit-youtube-videos": [
    { t: "h2", text: "Prepare the edit before choosing export settings" },
    { t: "p", text: "For a standard landscape upload, confirm that your source footage and project canvas are framed for 16:9. Keep important graphics away from the extreme edges, make sure the narration is clear, and watch the opening and ending. A high resolution cannot repair a wrong scene order, unreadable captions or an unbalanced mix." },
    { t: "h2", text: "Upload checklist" },
    { t: "ul", items: [
      "Use a title and thumbnail that accurately represent the video.",
      "Review spelling in on-screen text and captions.",
      "Confirm that music, footage and images are cleared for your use.",
      "Watch the final MP4 from start to finish before publishing.",
      "Keep the source files and final export in your own storage."
    ] }
  ],
  "how-to-edit-youtube-shorts": [
    { t: "h2", text: "Design for a small vertical screen" },
    { t: "p", text: "Vertical editing is not just horizontal editing with the sides removed. Place the main subject near the centre, use fewer words per caption line and keep important text away from areas commonly covered by app controls. The exact interface can change, so check the current platform preview and avoid placing essential information at the bottom edge." },
    { t: "h2", text: "Shorts quality checklist" },
    { t: "ul", items: [
      "Make the first visual understandable without waiting for a long introduction.",
      "Keep each shot on screen long enough for the viewer to identify it.",
      "Check that captions do not cover faces or important objects.",
      "Use vertical source media when possible to reduce aggressive cropping.",
      "Watch the exported file on a phone before uploading."
    ] }
  ],
  "best-video-dimensions-for-youtube-shorts": [
    { t: "h2", text: "Resolution is not the same as aspect ratio" },
    { t: "p", text: "Aspect ratio describes the shape of the frame; resolution describes the number of pixels. A 9:16 project can be exported at different pixel dimensions while keeping the same shape. Choose a supported resolution that matches your delivery needs and source quality, and confirm the platform's current upload recommendations before publishing because specifications can change." },
    { t: "h2", text: "Avoid avoidable quality loss" },
    { t: "ul", items: [
      "Do not enlarge a small source image and expect extra detail to appear.",
      "Avoid repeatedly exporting and recompressing the same file.",
      "Keep text large enough to read on a phone.",
      "Check whether the crop removes information at the sides or top of the source.",
      "Compare the final MP4 with the original source if the image looks unexpectedly soft."
    ] }
  ],
  "how-to-edit-videos-for-tiktok": [
    { t: "h2", text: "A TikTok review checklist" },
    { t: "ol", items: [
      "Confirm the project is vertical and that the main subject stays inside the safe area.",
      "Make the first few seconds visually clear and relevant to the video's promise.",
      "Check caption timing and line breaks on a small screen.",
      "Listen for background music covering speech on phone speakers.",
      "Review the exported file and current TikTok upload guidance before posting."
    ] },
    { t: "p", text: "There is no universal transition, caption colour or cut speed that guarantees reach. Use the style that fits the story, then judge it by clarity, pacing and audience response rather than by effects alone." }
  ],
  "how-to-edit-instagram-reels": [
    { t: "h2", text: "Keep essential information clear of interface controls" },
    { t: "p", text: "Reels may display captions, buttons and account information over parts of the video. Keep the key subject and essential words away from the extreme top, bottom and right edges, then preview the export in the current Instagram interface. Leave enough space that the message still makes sense if some decorative detail is covered." },
    { t: "h2", text: "Before you publish" },
    { t: "ul", items: [
      "Confirm the video is framed for vertical viewing.",
      "Check that caption text matches the voiceover.",
      "Use audio and visual assets you have permission to publish.",
      "Review the beginning, middle and ending on a phone.",
      "Write a caption that accurately describes the content rather than promising results the video does not deliver."
    ] }
  ],
  "what-is-video-editing": [
    { t: "h2", text: "A simple example" },
    { t: "p", text: "Imagine a 60-second explainer with a voiceover, six images and a music bed. Editing means selecting which image supports each sentence, choosing when to change scenes, removing distracting pauses, making the narration understandable, adding readable captions and checking the final export. Each decision affects whether the viewer can follow the explanation." },
    { t: "h2", text: "A useful order for beginners" },
    { t: "ol", items: [
      "Organize the source files and decide the story order.",
      "Build a rough cut that follows the main message.",
      "Fix timing and remove unnecessary gaps.",
      "Balance speech and music.",
      "Add captions and restrained visual effects.",
      "Export and review the whole file before sharing it."
    ] }
  ],
  "what-is-a-jump-cut": [
    { t: "h2", text: "When a jump cut works—and when it does not" },
    { t: "p", text: "Jump cuts work well when the viewer needs to move quickly past pauses, repeated setup or unimportant time. They can feel distracting when a person or object appears to jump around without a clear reason. If continuity matters, use a second angle, a cutaway or a longer uninterrupted shot instead of removing every pause." },
    { t: "h2", text: "Review a jump cut" },
    { t: "ul", items: [
      "Listen for clipped consonants at the edit point.",
      "Check whether the subject's position jumps in a distracting way.",
      "Keep the cut if it improves clarity or pace; restore time if it harms understanding.",
      "Use room tone or a deliberate audio edit if the cut creates an audible gap.",
      "Watch the surrounding sequence to judge rhythm in context."
    ] }
  ],
  "what-is-a-video-transition": [
    { t: "h2", text: "A transition is a storytelling choice" },
    { t: "p", text: "Use a transition to communicate a relationship, not simply to decorate every cut. A hard cut is often best for factual narration because it keeps attention on the next image. A dissolve can imply a passage of time or a connection, while a directional move can add energy. The right choice depends on the content and how much motion the viewer is already processing." },
    { t: "h2", text: "A quick decision rule" },
    { t: "ul", items: [
      "Use a cut when information changes immediately.",
      "Use a dissolve when the relationship between two images benefits from a softer handoff.",
      "Use a fast motion transition sparingly for emphasis.",
      "Avoid repeated effects that make a serious explanation feel chaotic.",
      "Check the actual exported timing, not only a still frame of the transition."
    ] }
  ],
  "what-is-an-aspect-ratio": [
    { t: "h2", text: "How to choose a ratio for an existing source" },
    { t: "p", text: "Start with the platform and viewing context, then inspect the source. A landscape clip usually gives a wide view; a vertical crop may remove useful details at either side. If the subject moves across the frame, check several moments instead of assuming the opening frame represents the whole shot." },
    { t: "h2", text: "Before changing the project shape" },
    { t: "ol", items: [
      "Decide where the video will be viewed.",
      "Check whether the original media has enough space around the subject.",
      "Move captions and graphics away from the frame edges.",
      "Preview scenes with movement, not only still images.",
      "Export a short sample and review it at the intended display size."
    ] }
  ]
};
