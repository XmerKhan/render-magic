import type { BlogPost } from '@/lib/blog';

/**
 * Practical troubleshooting articles based on real editor workflows.
 * Kept separate from the core articles so new support content can grow
 * without making the main content source difficult to maintain.
 */
export const supportPosts: BlogPost[] = [
  {
    slug: 'how-to-use-auto-sync',
    title: 'How to Use Auto Sync: Match Your Script to a Word-Timestamp Transcript',
    metaTitle: 'How to Use Auto Sync for Video Editing | Auto Edit',
    description: 'A beginner-friendly guide to Auto Sync: prepare your voiceover, original script, word-level transcript and scene order, then build a synced timeline automatically.',
    cluster: 'Auto Sync',
    datePublished: '2026-09-14',
    dateModified: '2026-09-14',
    readingMinutes: 7,
    summary: 'Auto Sync connects your narration, script and scene media so each scene starts when its line is spoken. This guide explains the files you need and what to check when a match fails.',
    blocks: [
      { t: 'p', text: 'Auto Sync is useful when you already have a voiceover and a script but do not want to type every scene timestamp by hand. It reads your original script together with a word-level transcript and creates the scene timing for you.' },
      { t: 'h2', text: 'What you need before starting' },
      { t: 'ol', items: [
        'Upload your scene images or videos in the order you want them used.',
        'Upload the original voiceover as an MP3 or WAV file.',
        'Upload the original script. Keep one scene or narration line on each line.',
        'Upload the Word Timestamp Transcript. Each word should have a start and end time.',
        'Optionally upload a Scene Order file when the media-bin order is not already correct.'
      ] },
      { t: 'h2', text: 'How Auto Sync works' },
      { t: 'p', text: 'Auto Sync cleans the script and transcript, matches each script line to the words that were spoken, then uses the matched word timestamp as the scene start. The next scene starts at the next matched line, so the timeline follows the narration instead of adding a new delay for every scene.' },
      { t: 'h2', text: 'The easiest script format' },
      { t: 'p', text: 'For a beginner, the safest format is plain text with one narration line per scene. For example: Scene 1 text on line one, Scene 2 text on line two, and so on. Avoid putting two separate scenes on one line.' },
      { t: 'h2', text: 'What the word transcript should look like' },
      { t: 'p', text: 'A word-level transcript contains the spoken word plus its timing. Auto Edit accepts JSON fields such as word, startOffset and endOffset, including values written like 0.200s. It also accepts other supported start and end time field names.' },
      { t: 'note', text: 'The script and transcript must describe the same narration in the same order. They do not have to use identical punctuation, but missing or heavily rewritten sentences can make a match less reliable.' },
      { t: 'h2', text: 'Why the timeline may look different from your old manual timestamps' },
      { t: 'p', text: 'Auto Sync uses the spoken transcript as the timing source. This means a scene may start a little earlier or later than a timestamp you typed manually. That is expected: the goal is to put the visual change at the point where that narration begins.' },
      { t: 'h2', text: 'After Auto Sync finishes' },
      { t: 'ol', items: [
        'Watch the first few scene changes in the preview.',
        'Check the timeline for the correct scene order.',
        'Listen for any scene that changes in the middle of a word or sentence.',
        'Review any low-confidence warning before exporting.',
        'If everything looks correct, choose your settings and generate the video.'
      ] },
      { t: 'h2', text: 'If Auto Sync cannot match a scene' },
      { t: 'p', text: 'First compare that script line with the transcript around the same point in the narration. Look for a missing word, a duplicated line, or a script line that was rewritten after the voiceover was recorded. Fix the source file and upload it again. This is usually faster and safer than manually guessing timestamps.' }
    ],
    related: ['auto-sync-script-transcript-troubleshooting', 'scene-order-does-not-match-media', 'voiceover-and-timeline-duration-explained']
  },
  {
    slug: 'auto-sync-script-transcript-troubleshooting',
    title: 'Auto Sync Not Matching Your Script? Common Causes and Fixes',
    metaTitle: 'Auto Sync Not Matching Script: Troubleshooting Guide | Auto Edit',
    description: 'Fix common Auto Sync matching problems caused by changed narration, missing transcript words, wrong scene counts, formatting issues and incorrect file order.',
    cluster: 'Auto Sync',
    datePublished: '2026-09-14',
    dateModified: '2026-09-14',
    readingMinutes: 6,
    summary: 'When Auto Sync cannot match a scene, the problem is usually in the relationship between the script and transcript rather than the video files. Here is a simple checklist.',
    blocks: [
      { t: 'p', text: 'Auto Sync works by finding your script lines inside the spoken word transcript. If the files were created from different versions of the narration, a scene can become difficult to match. The good news is that most cases are easy to diagnose.' },
      { t: 'h2', text: '1. The script was changed after recording' },
      { t: 'p', text: 'If the voiceover says one sentence but your script contains a newer sentence, Auto Sync may not find the expected words. Use the script that matches the audio recording, or create a new transcript from the current voiceover.' },
      { t: 'h2', text: '2. A line is missing from the transcript' },
      { t: 'p', text: 'A transcript can be incomplete when speech recognition misses a short phrase. Compare the failed scene with the transcript immediately before and after it. A missing phrase can move every later match away from the expected position.' },
      { t: 'h2', text: '3. The same line appears twice' },
      { t: 'p', text: 'Repeated narration is harder to place because the same words can occur in more than one location. Keep the script and transcript in their original order and check the surrounding words, not only the repeated sentence.' },
      { t: 'h2', text: '4. Scene count does not match' },
      { t: 'p', text: 'Auto Sync expects one media item for each script scene. If you have 50 script lines but only 49 scene files, the system cannot create a complete scene list. Add the missing media or correct the script line count.' },
      { t: 'h2', text: '5. Scene Order names do not match your files' },
      { t: 'p', text: 'If you use a Scene Order file, each entry must match an uploaded media ID or filename. Check spelling, file extensions and numbering. If your media is already in the correct order, you can leave Scene Order empty.' },
      { t: 'h2', text: '6. Timestamps are in the wrong units' },
      { t: 'p', text: 'A transcript should use seconds for numeric timestamps. Values such as 12.450s are understood as seconds. A timestamp file that accidentally uses milliseconds as if they were seconds can make the timeline appear far too long.' },
      { t: 'h2', text: 'A quick five-minute check' },
      { t: 'ol', items: [
        'Play the voiceover and read the original script at the same time.',
        'Find the first script line that does not sound like the transcript.',
        'Check whether a word is missing, duplicated or rewritten.',
        'Confirm the number of script lines equals the number of scene media files.',
        'Upload the corrected files and run Auto Sync again.'
      ] },
      { t: 'note', text: 'Do not keep retrying the same files if the source data is inconsistent. Correcting the script/transcript pair is more reliable than forcing a low-confidence match.' }
    ],
    related: ['how-to-use-auto-sync', 'word-timestamp-transcript-format', 'scene-order-does-not-match-media']
  },
  {
    slug: 'word-timestamp-transcript-format',
    title: 'Word Timestamp Transcript Format: What Your File Should Contain',
    metaTitle: 'Word Timestamp Transcript Format Explained | Auto Edit',
    description: 'Learn the simple word-level transcript structure Auto Edit needs for automatic scene timing, including word, start time and end time fields.',
    cluster: 'Auto Sync',
    datePublished: '2026-09-14',
    dateModified: '2026-09-14',
    readingMinutes: 5,
    summary: 'A word timestamp transcript tells the editor exactly when each spoken word begins and ends. Once the structure is correct, Auto Sync can use it to build scene timing.',
    blocks: [
      { t: 'p', text: 'A normal transcript tells you what was said. A word-timestamp transcript tells you what was said and when each word was spoken. Auto Sync needs the second type because it uses those times to place scenes on the timeline.' },
      { t: 'h2', text: 'The three pieces of information' },
      { t: 'ul', items: [
        'word — the spoken word, such as Imagine.',
        'start time — when that word begins.',
        'end time — when that word finishes.'
      ] },
      { t: 'h2', text: 'Example structure' },
      { t: 'p', text: 'A JSON transcript can contain a words array. Each item can contain a word such as Imagine, a startOffset such as 0.200s, and an endOffset such as 0.500s. The next word then has its own start and end values.' },
      { t: 'h2', text: 'Why start and end times both matter' },
      { t: 'p', text: 'The start time tells Auto Sync where a scene should begin. The end time is useful for knowing where the final spoken word finishes. Together they give the editor a real time reference instead of an estimated character count.' },
      { t: 'h2', text: 'Keep the words in speaking order' },
      { t: 'p', text: 'The transcript should follow the audio from beginning to end. Do not sort words alphabetically or combine words from different parts of the recording. The order is part of the information Auto Sync uses.' },
      { t: 'h2', text: 'Common mistakes' },
      { t: 'ul', items: [
        'Uploading a normal paragraph transcript with no timestamps.',
        'Using timestamps that are all zero.',
        'Putting milliseconds into a field that is expected to be seconds.',
        'Having an end time earlier than the start time.',
        'Using a transcript from a different voiceover recording.',
        'Leaving the word field empty for many entries.'
      ] },
      { t: 'h2', text: 'How to test the file before a long edit' },
      { t: 'p', text: 'Use a short voiceover and a small script first. If the first few scenes line up correctly, the same structure can be used for a longer documentary or narrated video. This makes troubleshooting much easier than testing a large project first.' },
      { t: 'note', text: 'Auto Edit supports more than one timestamp field style, but your safest approach is to keep one consistent structure throughout the file.' }
    ],
    related: ['how-to-use-auto-sync', 'auto-sync-script-transcript-troubleshooting', 'voiceover-and-timeline-duration-explained']
  },
  {
    slug: 'scene-order-does-not-match-media',
    title: 'Scene Order Does Not Match Your Media? How to Fix It',
    metaTitle: 'Scene Order and Media Mismatch: Fix Your Video Timeline | Auto Edit',
    description: 'Fix scene-order problems when your script has the right number of lines but the wrong images or videos appear in the timeline.',
    cluster: 'Troubleshooting',
    datePublished: '2026-09-14',
    dateModified: '2026-09-14',
    readingMinutes: 5,
    summary: 'A perfectly timed script can still show the wrong visual if the media order is wrong. This guide explains how to keep scene numbers, filenames and media together.',
    blocks: [
      { t: 'p', text: 'Scene timing and scene media are two separate things. Auto Sync can find the correct narration time, but it still needs to know which image or video belongs to Scene 1, Scene 2 and so on.' },
      { t: 'h2', text: 'The simplest option: use media-bin order' },
      { t: 'p', text: 'If your uploaded media is already in the exact scene order, you can leave the optional Scene Order file empty. The first uploaded scene becomes Scene 1, the second becomes Scene 2, and so on.' },
      { t: 'h2', text: 'When to use a Scene Order file' },
      { t: 'p', text: 'Use Scene Order when your files are uploaded in a different order from the story. Put one filename or media identifier on each line in the exact order you want.' },
      { t: 'h2', text: 'The number must match' },
      { t: 'p', text: 'If your original script has 60 scene lines, you need 60 media entries. Extra entries or missing entries make it impossible to create a one-to-one scene list.' },
      { t: 'h2', text: 'Avoid renaming files halfway through the process' },
      { t: 'p', text: 'If a Scene Order file refers to a filename that is not the same as the uploaded file, the editor cannot connect the two. Finish your file naming first, then create the order list.' },
      { t: 'h2', text: 'A safe naming pattern' },
      { t: 'p', text: 'For a documentary, names such as 01.jpeg, 02.jpeg, 03.jpeg and so on make the intended order easy to see. The exact naming style is up to you; consistency is what matters.' },
      { t: 'h2', text: 'How to check the result' },
      { t: 'ol', items: [
        'Look at Scene 1 and confirm its visual belongs to the first script line.',
        'Check a few scenes in the middle of the timeline.',
        'Check the final scene as well.',
        'If the order is shifted, fix the Scene Order or media order before rendering.'
      ] }
    ],
    related: ['how-to-use-auto-sync', 'auto-sync-script-transcript-troubleshooting', 'voiceover-and-timeline-duration-explained']
  },
  {
    slug: 'voiceover-and-timeline-duration-explained',
    title: 'Why Your Video Timeline Duration Does Not Match the Voiceover',
    metaTitle: 'Video Timeline and Voiceover Duration Explained | Auto Edit',
    description: 'Understand why a video timeline can appear shorter or longer than its voiceover and how Auto Edit keeps scene timing connected to the narration.',
    cluster: 'Troubleshooting',
    datePublished: '2026-09-14',
    dateModified: '2026-09-14',
    readingMinutes: 6,
    summary: 'The voiceover is the real clock for a narrated edit. Learn how scene timestamps, the final scene and audio duration work together.',
    blocks: [
      { t: 'p', text: 'When a narrated video ends too early, the first thing to check is not the export button. Check the relationship between the scene timestamps and the voiceover duration. A timeline can only play the final audio correctly when its scene range reaches the end of the narration.' },
      { t: 'h2', text: 'Why the final scene is special' },
      { t: 'p', text: 'Most scene boundaries are defined by the start of the next scene. The final scene has no next scene, so it must remain on screen until the end of the available narration. Auto Edit extends the final synced scene to the measured voiceover duration when needed.' },
      { t: 'h2', text: 'What a normal timeline looks like' },
      { t: 'p', text: 'Scene 1 starts at the first timestamp. Scene 2 starts at the next timestamp. Scene 3 starts at the next one, and so on. Each visual therefore stays on screen until the next visual takes over.' },
      { t: 'h2', text: 'What causes an early ending' },
      { t: 'ul', items: [
        'The last scene timestamp ends before the voiceover finishes.',
        'The script file was created from a shorter version of the narration.',
        'The audio file contains extra narration that the transcript does not cover.',
        'A manually created timeline has an old total duration.'
      ] },
      { t: 'h2', text: 'What causes a long ending' },
      { t: 'p', text: 'A timeline can also run longer than expected when a timestamp is much larger than the actual narration point. Check for a word timestamp entered in the wrong unit or a large accidental gap in the source data.' },
      { t: 'h2', text: 'Do not fix a timing problem by adding random scene gaps' },
      { t: 'p', text: 'If narration is continuous, scene boundaries should follow the narration. Adding blank gaps or manually stretching several scenes can create drift. Fix the source timestamp or transcript instead.' },
      { t: 'h2', text: 'A simple check before export' },
      { t: 'ol', items: [
        'Confirm the voiceover duration is measured correctly.',
        'Look at the first scene timestamp.',
        'Look at a scene in the middle.',
        'Look at the final scene and make sure it reaches the narration ending.',
        'Play the last 10 seconds before generating the video.'
      ] }
    ],
    related: ['how-to-use-auto-sync', 'auto-sync-script-transcript-troubleshooting', 'render-taking-too-long-or-seems-stuck']
  },
  {
    slug: 'render-taking-too-long-or-seems-stuck',
    title: 'Video Render Taking Too Long or Looks Stuck? What Is Happening',
    metaTitle: 'Video Render Taking Too Long: Troubleshooting Guide | Auto Edit',
    description: 'Understand why a long video render can take time, how chunked rendering works, and what to check before restarting a job.',
    cluster: 'Troubleshooting',
    datePublished: '2026-09-14',
    dateModified: '2026-09-14',
    readingMinutes: 6,
    summary: 'Long videos are rendered in smaller chunks and combined at the end. A job can appear quiet while a chunk is processing, so learn what progress means before cancelling it.',
    blocks: [
      { t: 'p', text: 'Rendering a video is different from previewing it in the browser. The preview can play a composition immediately, while the final MP4 must render every frame, encode the video and then combine the rendered parts.' },
      { t: 'h2', text: 'Why long videos take longer' },
      { t: 'p', text: 'Render time depends on video length, resolution, frame rate, media type and effects. A 10-minute 1080p documentary has far more frames to encode than a 20-second clip.' },
      { t: 'h2', text: 'Why the render is split into chunks' },
      { t: 'p', text: 'Long projects are divided into smaller time ranges. Several chunks can be processed independently and then stitched into the final video. This helps large projects finish more reliably than trying to render the entire video as one huge task.' },
      { t: 'h2', text: 'Preview time is not export time' },
      { t: 'p', text: 'Seeing a video play in the editor does not mean the final MP4 has already been encoded. Preview and export use different work. It is normal for a final render to take longer than watching the same video once.' },
      { t: 'h2', text: 'Do not restart repeatedly' },
      { t: 'p', text: 'If a render is making progress, repeated cancellation and restart can waste the work already completed. Check the progress information first. If a job truly fails, read the error message before trying again.' },
      { t: 'h2', text: 'What can make a render heavier' },
      { t: 'ul', items: [
        '4K export instead of 1080p.',
        'Long source videos instead of still images.',
        'Many animated effects or transitions.',
        'Long voiceovers with many scenes.',
        'High-resolution source media that must be processed for the composition.'
      ] },
      { t: 'h2', text: 'A sensible test when troubleshooting' },
      { t: 'ol', items: [
        'Try a short project with a few scenes.',
        'Use 1080p while testing.',
        'Confirm the short project previews correctly.',
        'Generate it and check the final MP4.',
        'Then move to the full project.'
      ] }
    ],
    related: ['voiceover-and-timeline-duration-explained', 'how-to-edit-a-video-online', 'how-to-add-transitions-to-a-video']
  },
  {
    slug: 'video-has-black-bars-or-cropped-subject',
    title: 'Video Has Black Bars or the Subject Looks Too Cropped? How to Fix Framing',
    metaTitle: 'Fix Black Bars and Cropped Video Framing | Auto Edit',
    description: 'Learn why aspect ratio changes can crop footage, how to choose a matching canvas, and how to avoid black edges without losing the main subject.',
    cluster: 'Troubleshooting',
    datePublished: '2026-09-14',
    dateModified: '2026-09-14',
    readingMinutes: 5,
    summary: 'Black edges and unwanted cropping usually come from a mismatch between source media and the chosen video shape. This guide explains the trade-off in simple terms.',
    blocks: [
      { t: 'p', text: 'Every video has a shape. A horizontal clip is wide, while a vertical Short is tall. When you put one shape inside another, something has to happen: the editor can crop the source to fill the frame, or leave empty space around it.' },
      { t: 'h2', text: 'Why cropping happens' },
      { t: 'p', text: 'A 16:9 horizontal video does not contain enough height to naturally fill a 9:16 vertical frame without changing the framing. Filling the frame means some of the left and right sides may be outside the visible area.' },
      { t: 'h2', text: 'Why black or empty edges can appear' },
      { t: 'p', text: 'If a source is not scaled to cover the composition, empty areas can remain. The goal of a full-frame editor is usually to fill the canvas while keeping the crop controlled.' },
      { t: 'h2', text: 'Choose the aspect ratio first' },
      { t: 'p', text: 'Decide whether the final video is 16:9, 9:16, 1:1 or 4:5 before judging the crop. A framing choice that looks correct in one ratio can look wrong in another.' },
      { t: 'h2', text: 'Keep the important subject near the centre' },
      { t: 'p', text: 'If you know a horizontal clip will later become vertical, keep faces, products and other important details away from the far left and far right edges. This gives the crop more room to work.' },
      { t: 'h2', text: 'What to do when a crop is too aggressive' },
      { t: 'ol', items: [
        'Try the aspect ratio that matches your source footage.',
        'Use a source image with more space around the subject.',
        'Avoid unnecessary zooming.',
        'Check several frames in the preview, not only the first frame.',
        'For a vertical project, prepare vertical or centre-composed source media when possible.'
      ] },
      { t: 'note', text: 'There is no single crop that can show every pixel of a horizontal frame inside a tall vertical frame. Good framing starts with choosing the final format and protecting the important part of the image.' }
    ],
    related: ['what-is-an-aspect-ratio', 'best-video-dimensions-for-youtube-shorts', 'how-to-edit-youtube-shorts']
  },
  {
    slug: 'captions-out-of-sync-with-voice',
    title: 'Captions Are Out of Sync With the Voice? Easy Timing Fixes',
    metaTitle: 'Fix Captions Out of Sync With Voice | Auto Edit',
    description: 'Learn how to diagnose captions that appear too early or too late and when to use a caption timing offset instead of rewriting the whole script.',
    cluster: 'Troubleshooting',
    datePublished: '2026-09-14',
    dateModified: '2026-09-14',
    readingMinutes: 5,
    summary: 'Small caption timing errors are often caused by a consistent offset. Find out whether the whole caption track is shifted or only a few scenes are wrong.',
    blocks: [
      { t: 'p', text: 'Captions feel wrong when the words appear before or after the person speaks them. The first step is to find out whether the entire caption track is shifted or only one part of the video is incorrect.' },
      { t: 'h2', text: 'If every caption is early or late' },
      { t: 'p', text: 'When the same timing error appears from the beginning to the end, a global timing offset is usually the right type of fix. Auto Edit provides a caption timing offset in milliseconds so you do not have to rewrite every timestamp.' },
      { t: 'h2', text: 'If only one scene is wrong' },
      { t: 'p', text: 'A local problem usually points to the source script or timestamp around that scene. Check that scene's text and its neighbouring timestamps instead of moving the entire caption track.' },
      { t: 'h2', text: 'Check the voiceover first' },
      { t: 'p', text: 'Make sure the audio you are listening to is the same voiceover used to create the script or transcript. A different recording can have different pauses even when the words are identical.' },
      { t: 'h2', text: 'Do not confuse caption style with caption timing' },
      { t: 'p', text: 'Fade, slide, typewriter and karaoke are visual styles. Changing the style does not fix a source timestamp that is wrong. Solve the timing first, then choose the appearance you like.' },
      { t: 'h2', text: 'A quick sync test' },
      { t: 'ol', items: [
        'Pick a sentence near the beginning.',
        'Pick another sentence in the middle.',
        'Pick one near the end.',
        'If all three are shifted by roughly the same amount, test a global offset.',
        'If only one is wrong, inspect that scene's source timing.'
      ] }
    ],
    related: ['how-to-add-captions-to-a-video', 'word-timestamp-transcript-format', 'voiceover-and-timeline-duration-explained']
  },
  {
    slug: 'why-auto-sync-may-take-time',
    title: 'Why Auto Sync May Take Time on a Large Project',
    metaTitle: 'Why Auto Sync Takes Time on Large Projects | Auto Edit',
    description: 'Understand what Auto Sync is doing when it matches a large script against a word-level transcript and how to troubleshoot a slow browser tab.',
    cluster: 'Auto Sync',
    datePublished: '2026-09-14',
    dateModified: '2026-09-14',
    readingMinutes: 5,
    summary: 'Large scripts require many text comparisons. Learn what normal progress looks like and why repeated browser freezing is different from normal matching work.',
    blocks: [
      { t: 'p', text: 'Auto Sync has to compare each script scene with the spoken words in your transcript. A short project may finish almost immediately, while a large documentary with many scenes has much more text to process.' },
      { t: 'h2', text: 'What Auto Sync is doing' },
      { t: 'ol', items: [
        'Read the original script.',
        'Read the timestamped transcript.',
        'Clean the words so punctuation does not block a match.',
        'Find each script scene in speaking order.',
        'Turn the matched word times into scene start and end times.',
        'Build the timeline for the editor.'
      ] },
      { t: 'h2', text: 'What a healthy loading state should feel like' },
      { t: 'p', text: 'The editor should show that Auto Sync is matching the script while the work is happening. The page should remain usable rather than repeatedly showing browser-level unresponsive warnings. If the tab becomes completely unresponsive for a long period, that is different from normal processing.' },
      { t: 'h2', text: 'Do not click Generate while matching' },
      { t: 'p', text: 'Wait for the timeline to appear and for validation to finish. Generate Video needs a completed timeline, so starting an export during matching can only create confusion.' },
      { t: 'h2', text: 'A good way to test a large project' },
      { t: 'p', text: 'Before testing a very large script, use a small copy with five to ten scenes. Confirm that the file formats and order are correct. Then run the full project. This separates a data problem from a project-size problem.' },
      { t: 'note', text: 'A loading message means the editor is working. A repeated browser-level Page Unresponsive warning means the browser was blocked too heavily. These are not the same problem.' }
    ],
    related: ['how-to-use-auto-sync', 'auto-sync-script-transcript-troubleshooting', 'render-taking-too-long-or-seems-stuck']
  }
];
