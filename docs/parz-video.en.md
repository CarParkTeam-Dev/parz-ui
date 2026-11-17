# Parz Video

`ParzVideo` is the Parz UI video player. The control bar is liquid glass that floats over the video and gently hides while you watch. Nothing abrupt.

- **seek line** — the bar flows every frame; on hover it thickens and shows the knob and a tip with the time, chapter and a frame from that spot;
- **centre** — like Apple's player: a glass play/pause button with −10 and +10 on either side, and “previous” / “next” in a playlist;
- **poster** — `poster` lies over the video, dissolves when playback starts and comes back at the end;
- **audio badge** — `audioBadge="Dolby Atmos"` shows the Dolby Atmos mark, `"Spatial Audio"` a spatial-audio icon, any other text a waves icon;
- **settings buttons** — quality, audio, subtitles and speed sit on the bar as separate buttons (`buttons` moves audio, subtitles and speed into “More”); “More” holds loop and Share; the menu is a glass window, pages slide in from the side and its height flows;
- **button tips** — on mouse hover the button's name appears above it and glides to the neighbouring button without blinking;
- **quality** — “Auto” by default: the player picks the file by its size, screen density and network and steps down if the video stalls; on a change the frame dissolves and time and pause are kept;
- **audio** — several languages (`audio`), switched like quality;
- **chapters** — thin marks on a continuous line; a passed mark takes the accent colour;
- **subtitles** — WebVTT in the player's style, off by default; smaller on phones, and they softly fade while the bar is shown;
- **playlist** — `playlist`: a strip of videos from the bottom, an “Up next” card with a countdown, smooth switching;
- **remember** — `remember`: the place, episode and the viewer's settings; next time “Continue · 15:12”;
- **volume** — starts at 70% on a computer and opens into a slider on hover; on phones the device controls the sound;
- **casting and picture in picture** — instead of a black screen, a placeholder with the poster and a button to bring the video back;
- **centre hints** — seek and volume icons flash briefly, text (“Link copied”, quality) stays for about two seconds;
- **waiting** — before start dots run in the centre button, while buffering during playback an arc spins; no endless loading in iOS Safari;
- **phone** — a tap shows or hides the bar (lifting the finger does not hide it), a double tap on an edge skips 10 seconds; iPhone's system full screen keeps speed and subtitles;
- **right click** — its own menu at the cursor: the Parz UI mark, “by CarPark Team”, the version and “About Parz UI” (opens dev.carpark.am/parz-ui in a new tab);
- **two animation styles** — `motion="liquid"` (elements appear and hide like drops, hiding is the exact reverse) and `motion="fade"`;
- **reduced motion** — with `prefers-reduced-motion` transitions are almost instant.

## Layout

Everything over the video is a separate borderless glass capsule; a sharp outer shadow gives depth. They appear and hide together.

- **top left** — title, quality mark (4K / HD) and the current chapter;
- **top right** — audio format badge and volume: on a computer a round sound button, the slider opens on hover;
- **centre** — play/pause and −10 / +10 (plus “previous” and “next” in a playlist);
- **above the line, left** — picture in picture and casting;
- **above the line, right** — settings buttons (at most 5: quality, audio, subtitles, speed, playlist) and “More”, then full screen;
- **bottom** — the seek line in its own capsule: time, line, time left (click for the total).

**Narrow player (up to 460 px, phone):** top right — the sound button (mute / unmute only); above the line on the left — picture in picture and casting, on the right — “…” and full screen; “…” lists with icons: playlist, quality, audio, subtitles, speed, Share, loop; in a playlist “previous / next” replace ±10.

**Very small player (narrow and up to 230 px tall):** the right buttons line up with the seek line, the centre gets smaller, picture in picture and casting move into “…”, the menu may cover the line; if the player is at most 280 px wide, only the current time stays in the bottom capsule.

```tsx
import { ParzVideo } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

<ParzVideo src="/video.mp4" poster="/poster.jpg" title="Our clip" />

// quality, chapters and subtitles
<ParzVideo
  sources={[
    { src: '/video-2160.mp4', label: '2160p' }, // shows 4K
    { src: '/video-1080.mp4', label: '1080p' }, // shows HD
    { src: '/video-720.mp4', label: '720p' }
  ]}
  chapters={[{ start: 0, title: 'Intro' }, { start: 42, title: 'Main part' }]}
  tracks={[{ src: '/subs.en.vtt', label: 'English', srclang: 'en', default: true }]}
/>
```

> [!NOTE]
> **Coming soon**
> - **Live streams** — the player will play live broadcasts: a LIVE mark, a jump to the live edge and rewinding within the available window.
> - **Ads** — pre-roll ads before the video starts and mid-roll ads during playback.

## Audio in several languages

For series and dubbing, pass `audio`: each language is its own version of the video — one file or its own qualities. Switching keeps the time and pause, and the frame dissolves just like a quality change; “Auto” quality works inside the chosen language. In a playlist the viewer's choice carries over to the next episodes (by `lang`, otherwise by label). The button sits on the bar next to subtitles; `buttons={{ audio: 'more' }}` moves it into “More” (on a narrow player it is always there).

```tsx
<ParzVideo
  audio={[
    { label: 'English', lang: 'en', sources: [{ src: '/e1.en.1080.mp4', label: '1080p' }, { src: '/e1.en.720.mp4', label: '720p' }] },
    { label: 'Русский', lang: 'ru', src: '/e1.ru.mp4' }
  ]}
  defaultAudio="en"
/>
```

## Remember progress

With `remember` the player keeps, in the viewer's own browser (`localStorage`), the episode and the place, the audio language, subtitles, quality (or “Auto”), speed and volume. Next time a glass “Continue · Episode 2 · 15:12 · English” capsule with a small “Start over” appears instead of “Play”, and the seek line already shows where they stopped. The place is saved every few seconds, on pause, when settings change and when the tab closes, so even after a crash only a few seconds are lost. The very beginning (under 10 s) is not remembered; a video watched past 95% counts as finished, and in a playlist the next episode is offered.

```tsx
<ParzVideo
  playlist={episodes}
  remember="series-42"                  // own key for every film or series
  rememberOptions={{ volume: false }}   // optional: what not to remember
/>
```

To keep progress on your server (one account, many devices) pass `initialState` and save what `onProgress` gives you:

```tsx
<ParzVideo
  initialState={progressFromServer}       // { i, t, audio, sub, q, rate, … }
  onProgress={state => fetch('/api/progress', { method: 'POST', body: JSON.stringify(state) })}
/>
```

## Playlist

Pass `playlist` and the player plays the videos one after another. Each item has its own `src` or `sources`, `title`, `poster`, `chapters`, `tracks` and an optional `duration` for the list. In the centre, “previous” and “next” sit on either side of −10 / +10 (on a narrow player they replace them); the list button opens the videos with thumbnails, and the current one is marked. A few seconds before the end, an “Up next” card appears with a countdown ring: click it to start the next video now, or cancel it to let the video simply end. Switching keeps playing and the last frame dissolves into the new video.

```tsx
<ParzVideo
  playlist={[
    { src: '/intro.mp4', title: 'Intro', poster: '/intro.jpg', duration: 64 },
    { src: '/bay.mp4', title: 'Bay', poster: '/bay.jpg', duration: 27 }
  ]}
/>
```

The data can come from your API: turn each record into a `ParzVideoItem`. Each video keeps its own qualities, subtitles and chapters; with `index` and `onIndexChange` you control which one plays (for example, to remember progress).

```tsx
import { useEffect, useState } from 'react';
import { ParzVideo, type ParzVideoItem } from '@carparkteam/parz-ui';

// what your API returns — any shape, here is an example
type ApiVideo = {
  id: string; name: string; cover: string; length: number;
  files: { url: string; height: number }[];
  subtitles: { url: string; lang: string; name: string }[];
  parts: { at: number; name: string }[];
};

const toItem = (v: ApiVideo): ParzVideoItem => ({
  title: v.name,
  poster: v.cover,
  duration: v.length,
  // every video has its own qualities, subtitles and chapters
  sources: v.files.sort((a, b) => b.height - a.height).map(f => ({ src: f.url, label: `${f.height}p` })),
  tracks: v.subtitles.map(s => ({ src: s.url, srclang: s.lang, label: s.name })),
  chapters: v.parts.map(p => ({ start: p.at, title: p.name }))
});

export function Course({ id }: { id: string }) {
  const [items, setItems] = useState<ParzVideoItem[]>([]);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    fetch(`/api/courses/${id}/videos`).then(r => r.json()).then((list: ApiVideo[]) => setItems(list.map(toItem)));
  }, [id]);
  if (!items.length) return null;
  return (
    <ParzVideo
      playlist={items}
      index={index}
      onIndexChange={i => { setIndex(i); /* e.g. save progress: fetch('/api/progress', …) */ }}
      upNextSeconds={10}
    />
  );
}
```

## Keys

When the player is focused: `Space` or `K` — pause, `←` / `→` — 5 seconds back and forward, `J` / `L` — by `skipSeconds`, `0`–`9` — jump to 0–90% of the clip, `C` — subtitles, `↑` / `↓` — volume, `M` — sound, `F` — full screen, `Esc` — close the settings menu, `Shift+N` / `Shift+P` — next and previous video in a playlist. On the seek line `Home` / `End` jump to the start and end.

| Prop | Default | What it does |
|---|---|---|
| `src` | — | Video URL (optional when `sources` is set) |
| `sources` | — | Quality options: `{ src, label, type?, badge? }[]`. The mark next to the gear comes from the label: `2160p` and up — **4K**, `720p` and up — **HD**; set your own with `badge`, an empty string hides it |
| `defaultQuality` | `'auto'` | Which quality to start with: an index in `sources` or `'auto'` — the player picks by its size, screen density and network (data saver, 2g/3g, downlink) and steps down if the video keeps stalling. Picking a quality by hand turns auto off; “Auto” in the menu turns it back on |
| `chapters` | — | Chapters: `{ start, title }[]`, `start` in seconds |
| `audio` | — | Languages: `{ label, lang?, src?, sources? }[]` — each with its own file or qualities (then `src` and `sources` are not needed) |
| `defaultAudio` | first | Which language to start with: an index or `lang` |
| `onAudioChange` | — | `(index, audio) => void` |
| `buttons` | all on the bar | Which settings buttons go into “More”: `{ audio?, subtitles?, speed?: 'bar' \| 'more' }`. Quality and playlist always stay on the bar, loop is always in “More”; at most 5 buttons on the bar, the rest go to “More”; on a narrow player everything is in “More”. Picture in picture and casting are separate |
| `showShare` / `shareUrl` | `true` / page address | “Share” in “More”: copy the link and “Other…” — the browser's share sheet (shown only where the browser has one) |
| `remember` | — | Key to remember progress and the viewer's settings in their browser |
| `rememberOptions` | everything | What not to remember: `{ position?, audio?, subtitles?, quality?, speed?, volume?: false }` |
| `initialState` / `onProgress` | — | Your own storage: starting state instead of `localStorage`, and a callback on every save |
| `tracks` | — | WebVTT subtitles: `{ src, label, srclang, default? }[]`. Subtitles start off; `default` is the track the C key turns on. Another domain needs CORS |
| `previews` | `true` | Frame above the seek line on hover (loads the video a second time, only the needed frames) |
| `poster` | — | Poster before playback; fades in softly once the image loads, dissolves once the video starts and returns when it ends (unless `loop`) |
| `title` | — | Title at the top; hides with the bar |
| `audioBadge` | — | Audio format badge at the top right; when the controls hide it slides into the corner, stays 3 s more and fades out. `'Dolby Atmos'` shows the Dolby Atmos mark, `'Spatial Audio'` a spatial audio icon, other text (`'5.1'`…) a waves icon |
| `autoPlay` / `muted` / `loop` | `false` | Same as on `<video>`. Browsers only autoplay muted video |
| `aspectRatio` | `'16 / 9'` | Aspect ratio |
| `accent` | `#6ee7a0` | Color of the seek line, volume and the big button |
| `motion` | `'liquid'` | Animation style: `'liquid'` — elements appear and hide like drops on a springy curve (capsules grow from their edge, −10/+10 split off the center button, menus grow from their button); `'fade'` — a calm fade in and out |
| `radius` | `18` | Corner radius, px (none in full screen) |
| `showSkip` / `skipSeconds` | `true` / `10` | Back and forward buttons and their step |
| `showVolume` | `true` | Volume button and slider |
| `showSettings` | `true` | Quality, subtitles, speed and “more” (loop) buttons |
| `showCast` | `true` | Cast (AirPlay, Chromecast via Remote Playback) — the button appears only when the browser sees a device |
| `showFullscreen` | `true` | Full screen button (double-click on the video works too) |
| `showPip` | `false` | Picture in picture, if the browser supports it |
| `speeds` | `[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]` | Speeds in the menu |
| `hideDelay` | `2600` | Ms without movement before the bar hides |
| `labels` | English | Button labels for screen readers: `play`, `pause`, `replay`, `mute`, `unmute`, `volume`, `seek`, `speed`, `fullscreen`, `exitFullscreen`, `pip`, `player`, `normal`, `settings`, `quality`, `subtitles`, `off`, `loop`, `back`, `forward` (`{n}` is the step), `remaining`, `more`, `cast`, `on`, `about`, `version`, `casting`, `castBack`, `pipActive`, `pipBack`, `auto`, `resume`, `startOver`, `episode`, `audioTrack`, `share`, `copyLink`, `linkCopied`, `shareOther`, `playlist`, `previous`, `next`, `upNext`, `playNow`, `cancel`, `nowPlaying` |
| `onPlay` / `onPause` / `onEnded` | — | Playback events |
| `onTimeUpdate` | — | `(time, duration) => void` |
| `onQualityChange` | — | `(index, source) => void` |
| `playlist` | — | Videos in a row: `{ src?, sources?, audio?, title?, poster?, chapters?, tracks?, audioBadge?, duration? }[]`. The current item's fields replace `src`, `sources`, `title`, `poster`, `chapters` and `tracks` |
| `index` / `defaultIndex` | `0` | Current video (controlled / initial) |
| `onIndexChange` | — | `(index, item) => void` — the video changed |
| `autoAdvance` | `true` | Start the next video when one ends |
| `upNextSeconds` | `8` | How many seconds before the end the “Up next” card appears; `0` turns it off |
| `className` / `style` | — | On the root element |

## CSS variables

`--pz-vd-accent` (accent), `--pz-vd-r` (radius), `--pz-vd-glass` (bar background), `--pz-vd-line` (bar edge), `--pz-vd-fg` (icon and text color).

```css
.trailer { --pz-vd-accent: #7aa7ff; --pz-vd-glass: rgba(10, 10, 20, .6); }
```
