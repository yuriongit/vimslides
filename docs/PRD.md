# PRD

Nov 15, 2026 · @Yuri O

## Overview

VimSlides is a web presentation editor where you build free-form slides with a Vim-based experience.

It solves one problem: editing slides in Google Slides or PowerPoint is slow and mouse dependent, and anyone who works in Vim loses the speed they have in their editor. VimSlides keeps the free-form slide model those tools use (boxes placed on a canvas) and replaces the interaction with modal editing, motions and ex commands. It is not a markdown-to-slides tool.

The product is keyboard first. The mouse works and stays available, but nothing about the core workflow depends on it.

**Stack:** TypeScript, React with Vite, Tailwind v4, shadcn, TanStack Router, Supabase (auth and cloud storage). Current state: a working skeleton with Supabase auth, a public layout, a protected layout and a `/projects` route.

## Users and differentiator

The audience is one group: people who already know Vim. Most of them are developers, so the first user is a developer presenting to their team, but it also covers designers and students who know Vim and have to make presentations. People learning Vim on their own may benefit too, but they are not the target.

The nearest alternatives (Marp, Slidev, reveal.js) have you edit markdown that becomes slides. VimSlides is different in one way: slides are free-form, like Google Slides, and Vim bindings drive the layout and the text. That free-form canvas is also what makes the keyboard design hard, because Vim has no native concept of position, size or stacking order. The movement and scope design in this document exists to answer that.

## Core model: modes, scopes, commands

The editor has four modes and two scopes, and a separate command line for ex commands.

| Mode | What it does |
| --- | --- |
| Normal | Navigate and act on the current target. A border around a box shows it is the target. |
| Insert | Type text into a box. |
| Visual | Select text. Selecting several boxes comes in a later version. |
| Command-line | Entered with `:`. Runs ex commands. |

**Scopes.** A scope decides what the motion keys move through. v1 has two:

- **Base scope:** the slide canvas. Motions move between boxes and act on them as objects.
- **Text scope:** the text inside one box. Motions behave like Vim text motions.

Zooming in from a box enters its text. Zooming out returns to the boxes. The slide itself is not a scope. Groups, a later feature, will add a scope that holds flat elements.

**Scope keys.**

- `gj` zooms into a scope.
- `gk` zooms out of a scope.
- `gg` zooms to the base (top) scope.
- `G` zooms to the deepest (bottom) scope.

**Commands.** Normal-mode keys handle navigation, movement and editing. Ex commands (typed after `:`) handle file and app level actions: save, quit, present. Slides also get Vim-style commands.

## v1 scope

v1 lets a logged-in user build a multi-slide deck of text boxes using only the keyboard, save it, and present it.

**In v1**

- Auth and `/projects`: create, open, rename and delete a presentation. A project is one presentation.
- 16:9 slides: add, delete, reorder, navigate.
- Text boxes: create, delete, edit text, move, change stacking order. Boxes auto-fit to their text.
- Text styling: font size and color.
- The four modes and two scopes from the core model.
- Ex commands: `:w`, `:wq`, `:q`, `:q!`, `:present` and `:export`.
- Undo and redo, persisted locally.
- Full-screen present mode.
- PDF export with `:export`. It comes last in the build order and is the first item to cut.

**Out of v1**

- Images, shapes and code blocks. Text boxes only.
- Collaboration, themes, transitions, presenter notes and share links.
- Import from PowerPoint or Google Slides.
- Grid snapping, move counts, box width rules and resizing.
- Selecting several boxes in visual mode.
- Groups.

## Editor behavior

Every interaction in v1 is a key sequence, so this section defines the sequences that are decided and marks the ones that are not.

**Moving a box.** There are two step sizes, borrowed from Vim's own jump motions. The curly braces `{` `}` move a box a large step and the parentheses `(` `)` move it a small step, because in Vim the curly braces travel further than the parentheses. The first key sets the axis and direction: `j` moves the box down and `k` moves it up. The next key sets the step size, for example `j` then `{` for a large step down. There is no grid snapping in v1, and counts (moving a box by a given number of steps) come later. Horizontal movement is not yet defined, see open questions.

**Moving between slides.** From the base scope, reached with `gg` from any deeper scope, uppercase `S` (key not final) moves between slides by a count, for example four slides down. The slide itself is not a scope.

**Text boxes.**

- A box auto-fits its size to its text. Width rules and resizing arrive in a later minor version.
- Each slide keeps a back-to-front order of its boxes, as Google Slides does. Commands move a box above or below others. Keys are not yet decided.
- Visual mode selects text. Selecting several boxes comes later.

**Mouse.** The mouse stays supported for everything. The goal is that the keyboard is faster, not that the mouse is removed.

## Persistence and accounts

The cloud copy changes only when the user writes it with `:w`, and the app keeps a local working copy in between, the way Vim keeps swap files.

- **Accounts are required.** The product does not work without logging in. Accounts exist for cloud storage and access from anywhere.
- **No autosave to the cloud.** Supabase receives a presentation only when the user runs `:w`. `:wq` writes and then returns to `/projects`.
- **Local working copy.** The web app keeps drafts on the device between writes. Undo and redo history is persisted locally too. Whether it gets its own undo file, as Vim does, is not decided.
- **Draft conflicts.** If the local draft and the cloud copy differ, for example after editing on two devices, the cloud copy wins.
- **`:q`** returns to the `/projects` route. With unsaved changes it refuses until the user runs `:q!`, as in Vim.
- **Desktop later.** The planned end state is a desktop application that creates local-first files and writes them to the cloud with `:w`. The web version comes first because developing inside a desktop framework this early would slow the work down.
- **Browser keys.** Ctrl-R is the only browser-reserved key the design expects to use. It is likely to be interceptable by the page, unlike Ctrl-W, Ctrl-T and Ctrl-N, but this needs testing in the target browsers.

## Presenting and export

Presenting is an ex command, and PDF is the first export format.

- **Present.** `:present` opens the deck in full-screen. While presenting, `j` and `k` move between slides, `gg` jumps to the first slide and `G` to the last. Escape exits the presentation mode..
- **PDF export.** The first export format, added to get exporting running. It uses `:export`.
- **Layout model.** The slide layout is meant to stay as close to Google Slides as possible: free-form boxes with a back-to-front order. That is what lets later import and export (PowerPoint and Google Slides) map onto the data model without a redesign. PowerPoint comes after Google Slides.

## After v1

Only one later item has a version attached: box width rules arrive in a later minor version. The rest have no order or version yet.

- Box width rules and resizing, in a later minor version.
- Move counts, to move a box by a given number of steps in one command.
- Visual mode across several boxes.
- Groups of flat elements, with a scope to move through their members.
- Import from Google Slides, then PowerPoint, built together with further export formats.
- A desktop application with local-first files.
- Images, shapes and code blocks.
- Collaboration, themes, transitions, presenter notes and share links, with no timing set.

## Open questions

These need a decision before v1 is a buildable spec.

- [ ] **Slide operations.** Which of delete, copy, paste and reorder are normal-mode keys and which are ex commands?
- [ ] **Horizontal movement.** Do `h` and `l` mirror `j` and `k` when moving a box, and once the direction is set, does `}` differ from `{`?
- [ ] **Key collisions in the text scope.** In Vim, `gg`, `G`, `gj` and `gk` move to the first line, the last line and by display line. Do the scope keys override these inside a box, or work only in the base scope?
- [ ] **Undo and drafts in v1.** Undo storage was marked not part of v1. Does that mean undo history is not persisted in v1, and are local drafts still in?
  - [ ] Answer: Undo history is not apart of v1, and yes local drafts are still in.
