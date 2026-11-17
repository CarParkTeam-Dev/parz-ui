# Parz Avatar

`ParzAvatar` is the Parz UI avatar. It shows a photo, initials or an icon. The photo fades in from a light blur, and while it loads a soft shine runs over the initials. If the photo fails to load, the initials stay. The status dot pops in with a spring. The “stories” ring can be bright or grey (“seen”).

`ParzAvatarGroup` stacks avatars. Extra ones collapse into “+N”; on hover the stack spreads and names appear.

- **color from the name**: the same name always gets the same background;
- **status**: `online` with a pulse, `away` (crescent), `busy` (bar), `offline` (ring);
- **ring**: `ring`, `ring="seen"` or your own gradient; its gradient flows around (`ringSpin={false}` keeps it still);
- **counter**: `count` puts a badge in the corner (ParzBadge);
- **button or link**: `onClick` / `href`; on hover the avatar grows with a spring;
- **ParzProvider**: springs follow the shared `calm` / `bouncy` / `snappy` preset;
- **reduced motion**: with `prefers-reduced-motion` everything changes without animation, and the pulse becomes a quiet blink.

```tsx
import { ParzProvider, ParzAvatar, ParzAvatarGroup } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

<ParzProvider motion="bouncy">
  <ParzAvatar src={user.photo} name="Ani Petrosyan" size="lg" status="online" statusLabel="online" />

  <ParzAvatarGroup max={4} onMoreClick={showAll} ariaLabel="Members">
    {team.map(u => <ParzAvatar key={u.id} src={u.photo} name={u.name} />)}
  </ParzAvatarGroup>
</ParzProvider>
```

## ParzAvatar

| Prop | Default | What it does |
|---|---|---|
| `src` | — | Photo URL |
| `alt` | `name` | Photo description for screen readers |
| `name` | — | Name: gives the initials, background color and tooltip |
| `initials` | from `name` | Your own initials (1–2 characters) |
| `icon` | silhouette | Icon when there is no photo or name: built-in, `'ms:name'`, `'mi:name'` or a ReactNode |
| `size` | `'md'` | `'xs'` 24, `'sm'` 32, `'md'` 40, `'lg'` 56, `'xl'` 72 or a number in pixels |
| `shape` | `'circle'` | `'circle'`, `'rounded'`, `'square'` |
| `color` | from the name | Initials background |
| `textColor` | white | Initials color |
| `status` | — | `'online'`, `'away'`, `'busy'`, `'offline'` |
| `statusLabel` | — | Status text for screen readers |
| `statusColor` | — | Custom dot color |
| `statusPulse` | `true` | Pulse on `online` |
| `ring` | — | `true` — bright ring, `'seen'` — grey, a string — your color or gradient |
| `ringSpin` | `true` | The bright ring’s gradient flows around; `false` keeps it still |
| `count` | — | Corner counter; 0 hides it |
| `countMax` | `99` | Above it shows “99+” |
| `tooltip` | `true` in a group | Hover tooltip: `true` — the name, or your own text |
| `onClick` / `href` / `target` | — | Makes the avatar a button or a link |
| `theme` | `'dark'` | The background behind the avatar: used for the status and counter outline and the group separator |
| `surfaceColor` | — | Your own color for that background |
| `motion` | from `ParzProvider` | `'calm'`, `'bouncy'`, `'snappy'` |
| `disabled` | `false` | Disabled |

The ring adds margin equal to its thickness around the avatar, so neighbours don’t cover it.

## Changing the avatar

With `editable`, clicking the avatar opens a picker: initials, ready-made pictures and an “Upload photo” button. Hovering the avatar shows a camera icon.

```tsx
<ParzAvatar
  src={user.photo}
  name={user.name}
  size="xl"
  editable
  onUpload={file => api.uploadAvatar(file)} // Promise<string> — the final photo URL
  onUploadError={() => toast('Could not upload the photo')}
  onChange={v => save(v)}
/>
```

While `onUpload` runs, the chosen photo already sits in the avatar, blurred, with dots running over it. When the URL arrives, the sharp photo fades in from under the preview.

| Prop | Default | What it does |
|---|---|---|
| `editable` | `false` | Turns on the picker |
| `presets` | `PARZ_AVATAR_PRESETS` | Ready-made pictures in the picker, an array of URLs |
| `onChange` | — | `{ kind: 'preset', src }`, `{ kind: 'initials' }` or `{ kind: 'upload', file, src }` |
| `onUpload` | — | `(file) => Promise<string> \| string` — upload the file and return its URL |
| `onUploadError` | — | `(error, file)` — the upload failed; the avatar is already back to how it was |
| `value` | — | Controlled mode: a string is a photo, `null` is initials. The avatar shows only `value`; a choice just calls `onChange` |
| `accept` | `'image/*'` | Which files can be picked |
| `labels` | English | `title`, `initials`, `upload`, `uploading`, `edit`, `preset` (`'Avatar {n}'`) |

Without `value` the avatar changes by itself right after a choice, and a new `src` from outside resets that choice.

Without `onUpload` the photo is shown straight from the file through a temporary `blob:` URL. It works while the avatar is on the page and is released when the photo changes or the avatar is removed. Saving such a URL on a server is useless — pass `onUpload` for a real upload.

`ref` points to the avatar itself (the button, link or `span`) — for example, to focus it.

## ParzAvatarGroup

| Prop | Default | What it does |
|---|---|---|
| `children` | — | `ParzAvatar`s; the group’s size, shape, background and motion pass to them unless they set their own |
| `max` | all | How many avatars to show; the rest become “+N” |
| `total` | number of `children` | Total people when `children` is only a part |
| `size`, `shape` | `'md'`, `'circle'` | For every avatar in the group |
| `spacing` | `'normal'` | Overlap: `'tight'`, `'normal'`, `'loose'` |
| `spread` | `true` | Spread the stack on hover and focus |
| `tooltips` | `true` | Name tooltips |
| `onMoreClick` | — | Click on “+N”; without it “+N” is just a label |
| `moreLabel` | `n => '+n'` | “+N” text for screen readers |
| `theme`, `surfaceColor`, `motion` | — | Same as `ParzAvatar` |
| `ariaLabel` | — | Group name for screen readers |
