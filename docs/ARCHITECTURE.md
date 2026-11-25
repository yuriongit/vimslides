# Architecture

Nov 15, 2026 · @Yuri O

VimSlides is a single-page web app on Supabase: the browser edits and keeps local drafts, `:w` commits an immutable revision, and a queue worker handles slow jobs such as PDF export.

## At a glance

&#91;embedded content: system diagram · browser, Supabase, export worker\]

The browser holds the editor, the renderer and the draft store, so editing needs no network. Four calls reach Supabase: sign-in to Auth, `:w` to the save function, `:export` and deck lists to Postgres, and reads of revision files and PDFs from Storage. The save function writes the revision file to Storage and commits the new version to Postgres. The worker pulls export jobs from the queue in Postgres and uploads the PDFs to Storage.

## Constraints that shape the design

Seven requirements from the PRD decide most of the architecture.

- **Editing never waits on the network.** The product is keyboard first, so every edit, mode change and motion runs locally and synchronously.
- **Saving is explicit.** The cloud copy changes only on `:w`. A local draft holds the work in between, and the cloud copy wins when the two differ.
- **Web first, desktop later.** The editor must run unchanged in a desktop shell that keeps local-first files and pushes to the cloud with `:w`.
- **Free-form slides.** Boxes have positions and a back-to-front order, modeled on Google Slides so later import and export can map onto the same model.
- **v1 content is small.** Text boxes only, 16:9 slides, font size and color. A deck is a small JSON document.
- **Persisted undo history is out of v1.** Local drafts are in.
- **One backend.** Auth, data, files and the queue should all come from the Supabase project that already handles auth, so there is one backend to run.

## Client

The client is a React app around a framework-independent editor core, and nothing in the editing path waits on the network.

| Layer        | Responsibility                                                                   | Choice                                                                                                                 |
| ------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Editor core  | Document model, commands, undo stack, mode and scope state machine, key dispatch | Plain TypeScript, no React or browser APIs                                                                             |
| Text editing | Vim motions and typing inside one box                                            | One CodeMirror 6 editor per box in text scope, with [@replit/codemirror-vim](https://github.com/replit/codemirror-vim) |
| Rendering    | Slides on screen, in present mode and in export                                  | Absolutely positioned DOM on a fixed 1920 by 1080 canvas, scaled to fit                                                |
| UI shell     | Routes, auth, `/presentations`, status line                                      | React, TanStack Router, shadcn, as built                                                                               |
| Draft store  | Local working copy between saves                                                 | IndexedDB behind a `DraftStore` interface                                                                              |
| Cloud client | `:w`, open and `:export`                                                         | Supabase client plus one Edge Function call                                                                            |

**Commands.** Every change is a command with an inverse: move box, set text, set font size, add slide. Undo and redo are a stack of commands, a draft is the serialized document, and later features such as persisted undo or collaboration build on the same commands.

**Input.** One document-level key handler feeds a dispatcher that knows the current mode and scope. In the base scope it resolves sequences like `j{` and `gj` itself. In the text scope it passes keys to the focused CodeMirror editor, except the scope keys, which it keeps. Whether the scope keys override Vim's own `gg`, `G`, `gj` and `gk` inside a box is still open in the PRD, and this design assumes they do. The handler reads `event.key`, so `{` and `(` work on non-US layouts.

**Text engine.** The CodeMirror package provides normal, visual and insert modes, ex commands, registers and macros, and lets the app define its own ex commands and key maps, which covers the text scope without writing a Vim engine. It assumes styling applies to a whole box, so a box's text stays a plain string. Per-run styling would need a rich-text engine and would change this section.

**Rendering.** Present mode and export reuse the same renderer. Boxes auto-fit their text, so fonts must be self-hosted: the export browser has to lay text out exactly as the editor does.

**Drafts.** The draft store writes the deck id, base version, document and update time to IndexedDB on a short debounce. It plays the role of Vim's swap file. IndexedDB is used rather than localStorage because drafts are structured and the writes are asynchronous. On open, if the cloud version is newer than the draft's base version, the cloud copy wins, as the PRD decides.

## Document model and versioning

A deck is one JSON document of slides, and each slide holds its elements in back-to-front order.

```ts
type Deck = {
  schemaVersion: number
  slide: { width: 1920; height: 1080 } // 16:9
  slides: Slide[] // array order = slide order
}

type Slide = {
  id: string
  elements: Element[] // array order = back to front
}

type Element = Box // later: images, shapes, groups

type Box = {
  type: "box"
  id: string
  x: number
  y: number
  width: "auto" | number // v1 is always "auto"
  text: string
  fontSize: number
  color: string
}
```

- **Stable ids.** Slides and elements get UUIDs. Commands, drafts and later import mapping or collaboration all refer to elements by id, never by position.
- **Order is the array.** Back-to-front order matches how Google Slides [orders page elements](https://hexdocs.pm/google_api_slides/GoogleApi.Slides.V1.Model.UpdatePageElementsZOrderRequest.html), so stacking commands only reorder the array.
- **Room to grow.** `elements` is a union with one member in v1. Images, shapes and groups are added as new members without migrating existing decks. `width` already accepts a number for the later width rules.
- **Schema version.** `schemaVersion` plus migration functions run on load. The same schema validates the document on the server at save time.
- **Title is not in the document.** It lives on the `decks` row so renaming from `/presentations` touches no revision.
- **Revisions.** Each `:w` creates an immutable revision with the next version number. The deck row points at the head. Versions give the save path its conflict check, and give export a fixed input. The PRD has no history screen, so revisions are not shown to users.

## Save path

&#91;embedded content: save path · 5 steps, 1 decision\]

Step 1 sends the base version stored with the draft. Step 3 writes the file before the commit, so a lost version race leaves a file with no row, which the cleanup job removes. Only the commit in step 4 can fail the save, and it fails by comparing versions, not by locking. `:wq` waits for step 5 before it leaves the editor, and `:q` still refuses while the draft is dirty.

The queue is not on this path. The save needs a definite answer before `:wq` can leave, so the commit is synchronous and the queue carries export jobs.

## Data stores

Postgres holds metadata and the pointer to each deck's head revision, and a private storage bucket holds the revision files and exports.

| Table            | Key columns                                                                                              | Purpose                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `decks`          | `id`, `owner_id`, `title`, `head_version`, `head_revision_id`, `created_at`, `updated_at`                | One row per presentation. `/presentations` lists these.     |
| `deck_revisions` | `id`, `deck_id`, `version`, `storage_path`, `content_hash`, `size_bytes`, `schema_version`, `created_at` | One row per saved revision, unique on `(deck_id, version)`. |
| `exports`        | `id`, `deck_id`, `version`, `format`, `status`, `storage_path`, `error`, `requested_at`, `finished_at`   | One row per export job. The client watches it.              |
| `profiles`       | `id`, `first_name`                                                                                       | Added when registration collects a first name.              |

The queue is one pgmq queue named `exports`, described under queue and workers.

**Blob layout** in a private bucket named `decks`:

- `{user_id}/{deck_id}/revisions/{revision_id}.json`: an immutable revision. The revision id is generated before the commit, so the path does not depend on the version number.
- `{user_id}/{deck_id}/exports/{export_id}.pdf`: a finished export.
- `{user_id}/{deck_id}/assets/{content_hash}`: reserved for images, which are not in v1.

**Access.** Row Level Security is on for every table with owner-only policies. Once it is enabled, [nothing is reachable through the API](https://supabase.com/docs/guides/database/row-level-security) until policies exist. Storage also [denies uploads without policies](https://supabase.com/docs/guides/storage/security/access-control), and the standard policy compares the first path folder with the user id, which is why the owner id leads every path. The save function and the worker write files with the service key, which bypasses these policies, so the client only needs read access.

**Why files and not a jsonb column.** Immutable files keep revision rows small, make every revision cheap to keep, and put decks and later images in one store that the export worker reads the same way. A jsonb column on `deck_revisions` is the simpler alternative and turns the commit into one transaction. At v1 sizes either works. The cost of files is a commit that spans two systems, which the save path handles by writing the file first and the pointer second, with a cleanup job for files that never got a pointer.

## Auth and access control

The route guard only decides what the interface shows. Row Level Security, storage policies and the save function's JWT check decide what a user can actually read or write.

- **Sign-in.** Supabase Auth through the shadcn component, as built. The Supabase client keeps the session in the browser and attaches the JWT to every request.
- **Route guard.** The `_authenticated` layout checks the session before `/presentations` and any other private route loads. This is a convenience for the user, since client code can be altered.
- **Database and storage.** Owner-only policies on every table and on the `decks` bucket, keyed on the user id in the JWT.
- **Save function.** The Edge Function reads the user from the verified JWT and never trusts an owner id sent in the request body.
- **Service key.** It exists only in the save function and the export worker, never in the client bundle. It [bypasses storage policies entirely](https://supabase.com/docs/guides/storage/security/access-control), so the code that holds it must scope every query to the requesting user itself.
- **Sharing later.** A `deck_members` table and policy checks against it. Decks stay owner-only in v1.

## Queue and workers

A Postgres queue carries work that should not block a request, and in v1 that work is PDF export.

**Queue.** [Supabase Queues](https://supabase.com/docs/guides/queues) is a durable queue in Postgres built on the pgmq extension. It delivers each message once within a visibility window, can archive processed messages, and works with Row Level Security. Queues are [reachable only through SQL by default](https://supabase.com/blog/supabase-queues), so only server-side code touches them. The queue lives in the same database as the data, so an enqueue can share a transaction with the row it relates to. When I checked on Nov 15, 2026, Supabase's [features page](https://supabase.com/features/queues) listed Queues as Public Alpha. The app should therefore reach it through two functions, `enqueue` and `dequeue`. If it has to be replaced, a `jobs` table polled with `FOR UPDATE SKIP LOCKED` is the fallback.

**Export job lifecycle**

1. `:export` calls a database function that, in one transaction, inserts an `exports` row with status `queued` and sends the export id to the queue.
2. The worker reads a message with a visibility timeout, so no other worker takes it while it renders.
3. It loads the deck revision, renders every slide, uploads the PDF and marks the row `done`.
4. It archives the message.
5. The client polls the `exports` row and shows a download link once it is `done`.

**Retries and idempotency.** If the worker dies, the message becomes visible again after the timeout. Each message carries a [read count](https://supabase.com/docs/guides/queues/pgmq), and after a set number of attempts (not yet chosen) the worker marks the export `failed` with the error and archives the message. A rerun is safe because the output path is fixed by the export id, so a second run overwrites the first. Asking for the same deck, version and format again returns the existing export instead of starting another. A per-user cap on concurrent exports (not yet chosen) keeps one user from filling the queue.

**Worker.** A small always-on Node service in a container, on any container host. It connects to Postgres with service credentials, reads from the queue, and drives a headless Chromium (for example through Playwright) that loads the same renderer the editor uses, then prints a PDF at 1920 by 1080 with one page per slide. It is not an Edge Function. [Edge Functions are limited](https://supabase.com/docs/guides/functions/limits) to 256 MB of memory and 2 seconds of CPU per request, with a wall clock of 150 seconds on the free plan and 400 seconds on paid plans, and Node libraries that need multithreading are unsupported. A headless browser does not look like it fits those limits, though I have not tested it.

**A cheaper v1 option.** The browser's own print-to-PDF with a print stylesheet needs no worker. The output then depends on the user's browser, and the queue has no consumer until a second job type exists. This design assumes the worker, because the same worker is where thumbnails and import conversion would go. The choice is listed under decisions.

**Other jobs.** Thumbnails for `/presentations` (not in the PRD), import conversion (later), and a scheduled cleanup of files that never got a revision row.

## Desktop path

The desktop app is the same web bundle in a desktop shell, with two interfaces swapped out underneath it.

- **`DraftStore`.** IndexedDB on the web, files on disk on the desktop. On the desktop a deck is a local file holding the same JSON, with its base version kept beside it, and `:w` writes the file and then pushes to the cloud, as the PRD describes.
- **`CloudClient`.** The same on both. The conflict rule is identical: if the cloud version is newer than the file's base version, the cloud copy wins.
- **Platform seams.** Clipboard, file dialogs and keyboard shortcuts also sit behind small interfaces. The editor core imports no browser or desktop API.
- **Shell.** Electron or Tauri, not yet chosen. Electron bundles Chromium, so text layout matches the export worker. Tauri is smaller but uses each operating system's own webview, so layout can differ between platforms, and auto-fit boxes would be the first place it shows.

Building the web version against these two interfaces now is what keeps the desktop version from being a rewrite.

## Decisions to confirm and risks

Nine choices in this document are assumptions of mine, not decisions of yours yet.

- [ ] **Commit path.** `:w` commits synchronously through one Edge Function call, and the queue carries derived work. The alternative is queue-first saving. I chose synchronous because `:wq` and `:q` need a definite result and the conflict check has to happen at commit either way.
- [ ] **Text styling.** Font size and color apply to a whole box (assumed), or to runs of text inside a box.
- [ ] **Text engine.** CodeMirror 6 with the Vim extension (assumed), or a custom Vim engine.
- [ ] **PDF export.** A queue worker (assumed), or the browser's print-to-PDF for v1.
- [ ] **Losing draft.** The PRD says the cloud wins. This design also keeps the losing local draft as a backup until the user dismisses it, so a conflict does not silently destroy work. Confirm the backup.
- [ ] **First name storage.** A `profiles` table (assumed, queryable), or Supabase user metadata (lighter).
- [ ] **Revision retention.** Keep every revision, or keep the last few. The PRD has no history screen.
- [ ] **Thumbnails.** Whether `/presentations` shows slide previews. They are not in the PRD.
- [ ] **Undo in v1.** In-session undo and redo only, since persisted history is out of v1.

**Risks**

- **Queue maturity.** Supabase lists Queues as Public Alpha. The `enqueue` and `dequeue` wrappers and the `jobs` table fallback are the mitigation.
- **Scope keys versus Vim keys.** The PRD leaves open whether `gg`, `G`, `gj` and `gk` keep their Vim meaning inside a box. The input layer needs that answer before the text scope is built.
- **Layout drift.** Auto-fit text can lay out differently in the editor and in the export browser if the fonts differ. Self-host the fonts and compare exported PDFs against the editor.
- **Two tabs.** Two tabs on one deck share one draft key. This needs a lock or a per-tab draft before drafts ship.
- **Shared schema.** The save function and the Vite app run on different runtimes and both validate decks. Keep the schema in one shared module and test it in CI, or a mismatch rejects valid saves.
- **Orphan files.** A save that writes its file and then loses the version race leaves a file with no row. The cleanup job removes these after a grace period.

## Sources

Checked Nov 15, 2026.

- [Supabase Queues](https://supabase.com/docs/guides/queues), [Queues API](https://supabase.com/docs/guides/queues/api), [pgmq reference](https://supabase.com/docs/guides/queues/pgmq), [Queues announcement](https://supabase.com/blog/supabase-queues), [Queues features page](https://supabase.com/features/queues)
- [Edge Functions limits](https://supabase.com/docs/guides/functions/limits)
- [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [Row Level Security](https://supabase.com/docs/guides/database/row-level-security)
- [@replit/codemirror-vim](https://github.com/replit/codemirror-vim)
- [Google Slides API z-order request](https://hexdocs.pm/google_api_slides/GoogleApi.Slides.V1.Model.UpdatePageElementsZOrderRequest.html)
