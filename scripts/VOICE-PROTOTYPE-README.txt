Jarvis voice-interface prototype — private local build
This is not the live C&R AI Office site, and it is not a public preview.
It is not connected to a Jarvis bot, the office team, Gmail, calendar, GoHighLevel, or a model.
No account, API key, or paid speech service is included.

What you need
- Node.js 20 or newer. Nothing else is installed by this folder.

How to run
1. Unzip this folder.
2. Open a terminal in the unzipped folder.
3. Run: node serve-local.mjs
4. Open the address it prints. It is usually http://127.0.0.1:4173/
5. Choose Voice in the sidebar, or open http://127.0.0.1:4173/#/voice

Microphone
- Browsers allow the microphone only on a secure page. http://127.0.0.1 counts. Opening index.html directly (file://) does not, and the mic stays off.
- Click Start voice session yourself. Nothing listens before that, and Stop or leaving the page ends it.
- Chrome's speech recognition commonly sends microphone audio to Google to make a transcript. The page says this before you start. This build does not record audio or upload a file of its own.
- If your browser has no speech recognition, use Type a line instead. "Hello Jarvis, are you up?" plays a local scripted line: "At your service, sir".
- A later typed or spoken task can file a sample on the page. The sample does not assign work and does not leave the browser tab.

Office statuses in this zip are the template sample, because this build has no database keys.
