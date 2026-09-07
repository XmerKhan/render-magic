import { Link } from "@tanstack/react-router";

export function EditorGuide() {
  return (
    <section className="border-t border-zinc-800 bg-zinc-950 px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-2xl sm:p-8 lg:p-10">
          <div className="prose prose-invert max-w-none">
            <h2>Hi, Editor</h2>
            <p>Thank you so much for using our tool. Our goal is to make things easier for people. By using our website and this tool, you can complete hours of video editing work in just a few minutes. Our main purpose is to provide convenience with the help of AI.</p>
            <p>We created this product because, personally, we also know how much time people can waste on video editing. Sometimes it takes hours, many hours, or even several days to complete a video. So we thought, why not create an easy tool where people can edit their videos in just a few minutes, export them professionally, and enjoy the final result?</p>
            <p>Instead of spending all that valuable time on video editing, you can use that time for something more productive and meaningful.</p>
            <p>We hope you will like it.</p>

            <h2>How It Works:</h2>
            <p>If we talk about how to use the tool, it is quite simple. If you are not sure how to use it or how to start, follow the steps below. Reading and following these steps will help you understand the complete workflow.</p>
            <p>The tool is designed to be easy enough for people of different ages and experience levels to use.</p>

            <h3>Step No. 1: Upload Your Media</h3>
            <p>First of all, on the left side, you will see the Drop Media Here section. Click on it and upload your assets, such as images or videos.</p>
            <p>Remember that before uploading your images or videos, you should rename them and arrange them in the correct sequence.</p>
            <p>For example:</p>
            <pre><code>{`Scene 1.jpg
Scene 2.jpg
Scene 3.jpg
Scene 4.mp4`}</code></pre>
            <p>Continue the same naming sequence until your last image or video.</p>
            <p>This is important because your images or videos should match the corresponding voiceover/script lines. If the media is uploaded randomly, the scenes may appear before or after their correct position.</p>
            <p>So make sure your images and videos are renamed and uploaded in the correct sequence.</p>

            <h3>Step No. 2: Upload Your Voiceover</h3>
            <p>Go to the Audio &amp; Script section and upload your original voiceover file.</p>
            <p>Remember to use one of the supported formats mentioned there, such as:</p>
            <p><strong>MP3 / WAV</strong></p>

            <h3>Step No. 3: Upload Background Music</h3>
            <p>If you want to add background music to your video, upload your music file in the supported format, such as:</p>
            <p><strong>MP3 / WAV</strong></p>

            <h3>Step No. 4: Original Script</h3>
            <p>This is an important step.</p>
            <p>Go to the Original Script option and provide your original script. The supported formats are:</p>
            <p><strong>TXT / MD / JSON</strong></p>
            <p>Your script should be structured in the same format as the sample file provided in the Download Sample option.</p>
            <p>You can click Download Sample, download the sample file, and use it as a reference for the required format and sequence.</p>
            <p>The number of script lines should match the total number of scenes you have.</p>
            <p>For example, if you have 105 images/videos, your script should also contain 105 scene lines/breakdowns.</p>
            <p>You can simply go to any AI tool such as ChatGPT, Claude, or Gemini, provide it with the sample file, and ask it:</p>
            <p><strong>“Convert my script into this same structure and format.”</strong></p>
            <p>Then use the properly structured script here.</p>

            <h3>Step No. 5: Word Timestamp Transcript</h3>
            <p>The Word Timestamp Transcript is also a very important step.</p>
            <p>Here, you need to create a word-by-word transcript of your original voiceover and upload it.</p>
            <p>Remember that the transcript file must contain:</p>
            <ul><li>Word-by-word text</li><li>Start timing</li><li>End timing</li></ul>
            <p>The transcript must be generated from the same original voiceover that you uploaded above.</p>
            <p>There are many tools available online that can generate word-level transcripts. You can search for a tool that works for you.</p>
            <p>Personally, if I had to recommend one, I would recommend using the Speech-to-Text feature from ElevenLabs. It works quite well, and I have personally used it many times.</p>
            <p><a href="https://elevenlabs.io/app/speech-to-text" target="_blank" rel="noreferrer">ElevenLabs Speech-to-Text</a></p>
            <p>After generating the transcript, simply upload the file you receive here.</p>

            <h3>Step No. 6: Scene Order — Optional</h3>
            <p>If you forgot to arrange your scenes in the correct order before uploading them, you can use the Scene Order option.</p>
            <p>You can upload a TXT or JSON file containing the correct scene order.</p>
            <p>The tool will then automatically arrange the scenes in the video according to the order you provide.</p>
            <p>These are the basic steps for uploading your media and required data.</p>
            <p>After this, your video will appear in the front preview screen, and you will also see the timeline below.</p>
            <p>Here you will be able to see your voiceover, transitions, and scene clips automatically edited and arranged according to your data.</p>

            <h2>How to Set Expert Settings According to Your Requirements:</h2>
            <h3>1. Aspect Ratio</h3>
            <p>Here, you can select the aspect ratio of your video.</p>
            <p>You will see 4 different options, so choose the one according to your requirements and the platform where you want to publish your video.</p>
            <h3>2. Transitions</h3>
            <p>You will see different transition options such as:</p>
            <ul><li>Mixed</li><li>Smooth</li><li>Dynamic</li><li>Minimal</li></ul>
            <p>Choose the transition style according to your needs.</p>
            <p>You can also select the transition duration according to your requirements.</p>
            <h3>3. Auto Captions</h3>
            <p>In the Captions option, you will find several caption settings and styles.</p>
            <p>Choose the options according to your needs and the style of your video.</p>
            <h3>4. Motion Graphics</h3>
            <p><strong>Motion Graphics</strong></p>
            <p>These overlays use the text/data from each script scene. You can turn individual graphics on or off for the whole video.</p>
            <p>You will see options such as:</p>
            <ul><li>Lower Third</li><li>Text Callout</li><li>Date Stamp</li><li>Location Pin</li><li>Quote Card</li></ul>
            <p>Choose the graphics you want according to your video requirements.</p>
            <h3>5. Color Grade</h3>
            <p>In the Color Grade section, you will see options such as:</p>
            <ul><li>None</li><li>Cinematic</li><li>Warm</li><li>Cool</li><li>Vintage</li><li>Vivid</li></ul>
            <p>You also have Manual Fine-Tune options:</p>
            <ul><li>Brightness: 1.00</li><li>Contrast: 1.00</li><li>Saturation: 1.00</li><li>Vignette: 0%</li><li>Film Grain: 0%</li></ul>
            <p>You can choose and adjust these settings according to the editing style and requirements of your video.</p>
            <h3>6. Audio Editing</h3>
            <p>In the Audio section, you will find different audio settings.</p>
            <p>Music Volume: 30%</p>
            <p>Auto-duck music under voiceover</p>
            <p>Voiceover Processing</p>
            <p>You will also find options such as:</p>
            <ul><li>Trim leading/trailing silence</li><li>Normalize loudness</li><li>Voice clarity boost</li><li>Fade In: 0.3s</li><li>Fade Out: 0.5s</li></ul>
            <p>Choose these settings according to your needs.</p>
            <p>These options can help improve your overall audio experience, including voiceover clarity, noise reduction, voice processing, and other adjustments needed for more professional audio.</p>
            <h3>7. Branding Screen</h3>
            <p>If you want to add your own company name, logo, or text at the beginning or end of your video, you can use the Branding Screen option.</p>
            <p>For example, at the beginning:</p>
            <p><strong>“Welcome to another new video.”</strong></p>
            <p>And at the end:</p>
            <p><strong>“Thanks for watching.”</strong></p>
            <p>You can customize the text according to your requirements.</p>
            <h3>8. Export</h3>
            <p>In the Export section, you can choose your desired video quality.</p>
            <p>You will see options such as:</p>
            <ul><li>720p HD</li><li>1080p Full HD</li><li>4K Ultra HD</li></ul>
            <p>You can also choose the format:</p>
            <ul><li>MP4 (H.264)</li><li>WebM (VP9)</li></ul>
            <p>Frame Rate: 30fps</p>
            <p>Choose the quality and format according to your requirements.</p>
            <p>You also have the option to export your video in 4K, which gives you a high-quality result.</p>

            <p>These were some important steps that should help you understand how to use the tool and configure the settings.</p>
            <p>If anything is unclear or you are facing any problem, you can contact us through the Contact Us section and ask for help.</p>

            <h2>Why We Use This Tool:</h2>
            <p>If you are a YouTuber, content creator, or create content for platforms such as Instagram, TikTok, Facebook, YouTube, Snapchat, or other social media platforms, this tool can be very helpful for you.</p>
            <p>It is designed to make your video editing workflow easier and save you a significant amount of time.</p>
            <p>This tool is 100% free.</p>
            <p>Our goal is simply to provide value to people and help them understand how they can make their work easier with the help of AI.</p>
            <p>We would also love to hear from you.</p>
            <p>Please use the Contact Us section to share your thoughts with us and let us know:</p>
            <ul><li>What features would you like to see?</li><li>What new tools should we add?</li><li>What options would make the editing process easier for you?</li><li>What improvements would you like to see in the future?</li></ul>
            <p>Your feedback can help us improve the tool and make it more useful for everyone.</p>
            <p>Thanks for reading!</p>
            <p>If you are facing any issue, simply choose the relevant option from the available buttons and read the detailed information to find the solution.</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 border-t border-zinc-800 pt-7 sm:grid-cols-3">
            <Link to="/contact" className="rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-amber-500 hover:bg-zinc-800/80">Contact Us</Link>
            <Link to="/blog" className="rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-amber-500 hover:bg-zinc-800/80">Blogs</Link>
            <Link to="/" className="rounded-xl bg-amber-500 px-5 py-3 text-center text-sm font-semibold text-zinc-950 transition hover:bg-amber-400">Back to Homepage</Link>
          </div>
        </article>
      </div>
    </section>
  );
}
