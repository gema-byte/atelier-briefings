# Briefings

A drop-in module for [atelier](../atelier/) that turns Claude Design handovers (and any other self-contained HTML/CSS/JS bundle) into briefings you can:

- preview side-by-side with their source
- duplicate as a starting point for the next one
- download as PDF
- publish to Vercel as a public link
- gate with a password or an expiry date
- collect reader notes on, comment-by-comment, then resolve them in place — like Google Docs

Bundled with one fictional **Sample Itinerary** so you can try the whole flow before you point it at real work.

---

## Install

The module follows atelier's sibling-folder convention. Drop it next to `atelier/` and the shell discovers it on next reload.

If you cloned this repo whole, it's already there — open <http://localhost:5172/briefings> and the Sample shows up.

---

## Concepts

A **briefing** is a folder with:

```
my-briefing/
├── briefing.json     # name, description, entry filename, etc.
├── index.html        # entry — anything else (CSS, JS, images) sits next to it
└── ... assets ...
```

There are two kinds:

| Where               | Kind        | Use for                                                   |
|---------------------|-------------|-----------------------------------------------------------|
| `briefings/seed/`   | `template`  | Reusable starting points. Ships with the module.          |
| `briefings/data/items/` | `instance` | Per-trip working copies. Per-environment, never deployed. |

Click **duplicate** on a template to spawn an instance you can edit freely.

### `briefing.json`

```json
{
  "name": "Sample Itinerary",
  "description": "One-line hook shown in the picker.",
  "kind": "template",
  "entry": "itinerary.html",
  "source": "Bundled sample"
}
```

`entry` is the file served at the briefing's root URL. Everything else resolves relative to it (so `<link href="styles.css">` just works).

---

## Editing with Claude Code

The editing surface is the briefing's source files. Atelier's preview hot-reloads them on save.

1. Click **duplicate** on the Sample.
2. Copy the path shown in the preview header.
3. From the workspace root:

   ```sh
   cd "briefings/data/items/<your-id>" && claude
   ```

4. Tell Claude what to change. Refresh the preview to see edits.

The Sample's layout is data-driven — most edits are to `data.js`. The brochure's structure (cover, day cards, weather strip, attachments index) lives in `app.jsx` and `styles.css`.

---

## PDF download

Hit **pdf ↓** in the preview header. Atelier spawns a local headless Chrome (Brave / Edge / Chromium are also picked up automatically), prints the briefing's `@page` layout to PDF, and streams it back as a download. About 3–5 seconds for a typical brief.

No external services. The brochure's own print CSS is authoritative — don't hand-tune sizes here.

---

## Publish to Vercel

Each briefing can be deployed to a single shared Vercel project (suggested name `briefings`) under your account. Public URLs look like `https://<your-project-alias>.vercel.app/<briefing-id>/`.

### One-time setup

1. **Log in:** `npx vercel@latest login` (interactive — opens a browser).
2. **Bootstrap the dist folder** so atelier knows where to deploy:

   ```sh
   mkdir -p briefings/data/publish/briefings
   cd briefings/data/publish/briefings
   npx vercel@latest --prod --yes
   ```

   Accept the suggested project name and your personal scope. Vercel writes a `.vercel/project.json` here that ties the dist to your project. After this, the **publish** button does the rest.

3. **(Optional) Cloud reader-notes** — if you want notes left on the public URL to flow into atelier automatically (instead of falling back to email), provision a Vercel Blob store from the same dist folder:

   ```sh
   npx vercel@latest blob create-store --access public --yes briefings-feedback
   ```

   The CLI links it to the project and adds `BLOB_READ_WRITE_TOKEN` to `.env.local`. The deployed function in `data/publish/briefings/api/...` uses it on writes; atelier uses it on reads via the **pull cloud** button on the feedback tab.

### Day to day

Click **publish** in the preview header. Atelier:

1. Materializes the briefing into the dist folder (entry renamed to `index.html` so URLs stay clean).
2. Regenerates a tiny landing index listing every published briefing.
3. Regenerates a `middleware.ts` if any briefing has lock/expiry settings.
4. Runs `vercel --prod --yes`.

Takes 10–30s. The resulting URL is saved into the briefing's `publishUrl` and shown as a `live` strip in the preview header.

### Privacy controls

Once a briefing is live, the strip exposes three actions:

- **lock** — generates a friendly password (e.g. `cool-stone-96`), shipped as an Edge-Middleware Basic-Auth gate. Atelier shows the password once; copy it before dismissing — it's not stored back.
- **expire** — set 1d / 7d / 30d / 90d / never. After the date, the URL returns 410 with an "expired" page.
- **unpublish** — removes the briefing folder from the dist and re-deploys. URL 404s; the source files in atelier are untouched. Re-publish to bring it back.

State badge: `live` (green), `locked` (purple), `expired` (red), `unpublished` (grey).

The middleware that enforces lock + expire is **auto-generated** as `data/publish/briefings/middleware.ts` on every privacy action — don't hand-edit it.

---

## Reader feedback

Every briefing — local preview AND public URL — shows a floating ✎ button bottom-right. Readers click it, optionally select text first to pin the note to a passage, type their note, and submit.

| Where it lands     | What happens                                                                                       |
|--------------------|----------------------------------------------------------------------------------------------------|
| Local preview      | Atelier writes to `briefings/data/items/<id>/feedback.json`.                                       |
| Public URL (with cloud) | Vercel function writes to a per-note Blob; atelier pulls via the **pull cloud** button (or auto on tab open).|
| Public URL (no cloud)   | Falls back to a `mailto:` prefilled with the note + page URL. You receive it as email.       |

### In the dashboard

Open the **feedback** tab (yellow badge shows open count). Each note carries its author, time, optionally pinned passage, and message.

- Click a note's **pinned passage** to jump to it in the preview — yellow flash on the matched text.
- **resolve / reopen / ×** per note.
- **+ note** to type or paste in manually (e.g. forwarded from Slack or email).
- **apply via claude** — bundles every open note into a Claude prompt with the `cd …` command so you can paste it into your terminal and let Claude work the source files in place.

### In the preview itself (Google-Docs style)

Open notes with anchors get a yellow underline + a small numbered pin. Click the pin → popover with the notes + a **resolve** button right there. Resolving updates atelier and clears the highlight on the next sync.

---

## Adding a new template from a Claude Design handover

The handover comes as a `.tar.gz` from `claude.ai/design`. Until the module gets a built-in importer:

1. Extract: `tar -xzf <bundle>.tar.gz`.
2. Copy the editable working files (the HTML + JSX + CSS — not the inlined `export/` bundle) into `briefings/seed/<slug>/`.
3. Add a `briefing.json` (see shape above).
4. Refresh the module — it appears in the list.

---

## How it fits in atelier

| Piece                                  | What it does                                                                  |
|----------------------------------------|-------------------------------------------------------------------------------|
| `frontend.jsx`                         | Two-pane UI — list + preview iframe + feedback tab.                           |
| `backend.js`                           | REST API, widget injection, publish + privacy + cloud-pull orchestration.     |
| `seed/sample-itinerary/`               | The bundled fictional sample.                                                 |
| `data/items/<id>/`                     | Your working briefings. Per-environment.                                      |
| `data/publish/briefings/`              | The Vercel deploy folder. `.vercel/project.json` lives here after bootstrap.  |
| `data/publish/briefings/api/...`       | The reader-feedback ingest function (Vercel serverless).                      |

Atelier's `data/` convention means the whole `data/` tree is per-environment runtime state — it isn't checked in, isn't shipped on update, and survives across re-installs. The `.gitignore` here mirrors that.

---

## Roadmap

- One-click import from a `claude.ai/design` URL.
- "Promote instance to template" action.
- Linked sub-briefings (parent → deep-dive children).
- Audience modes (`?view=overview` vs `?view=deep`).
- Snapshot + diff history per publish.

---

## License

MIT — see [LICENSE](LICENSE).
