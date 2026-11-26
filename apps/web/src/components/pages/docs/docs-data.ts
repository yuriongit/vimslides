export type DocSlug =
  | "index"
  | "getting-started"
  | "ex-commands"
  | "keybindings"
export type DocBlock =
  | { type: "p"; text: string }
  | {
      type: "callout"
      variant?: "default" | "destructive"
      title: string
      body: string
    }
  | {
      type: "cards"
      items: {
        title: string
        description: string
        to: string
        badge?: string
      }[]
    }
  | { type: "table"; searchable?: boolean; headers: string[]; rows: string[][] }
  | {
      type: "tabs"
      items: { value: string; label: string; blocks: DocBlock[] }[]
    }
  | {
      type: "steps"
      items: { title: string; detail: string; keys?: string[] }[]
    }
export interface DocSection {
  id: string
  title: string
  blocks: DocBlock[]
}
export interface DocPage {
  slug: DocSlug
  title: string
  description: string
  badge?: string
  prev?: { title: string; href: string }
  next?: { title: string; href: string }
  sections: DocSection[]
}
export const DOCS_PAGES: Record<DocSlug, DocPage> = {
  index: {
    slug: "index",
    title: "Documentation",
    description:
      "Keyboard-first, modal presentation editing on a free-form 960x540 canvas.",
    badge: "Introduction",
    next: { title: "Getting Started", href: "/docs/getting-started" },
    sections: [
      {
        id: "guides",
        title: "Explore the Docs",
        blocks: [
          {
            type: "p",
            text: "VimSlides combines Vim's modal editing model with spatial slide manipulation. Browse the guides below to master scopes, Ex commands, and motions.",
          },
          {
            type: "cards",
            items: [
              {
                title: "Getting Started",
                description:
                  "Understand BASE vs TEXT scopes, Vim modes, local auto-drafting, and cloud persistence.",
                to: "/docs/getting-started",
                badge: "Core Concepts",
              },
              {
                title: "Ex Commands",
                description:
                  "Complete reference for :w, styling, slide management, search, and regex substitution.",
                to: "/docs/ex-commands",
                badge: "Command Line",
              },
              {
                title: "Keybindings",
                description:
                  "Every motion, operator, text object, alignment shortcut, and presenter binding.",
                to: "/docs/keybindings",
                badge: "Reference",
              },
            ],
          },
        ],
      },
      {
        id: "architecture",
        title: "How VimSlides Works",
        blocks: [
          {
            type: "steps",
            items: [
              {
                title: "BASE Scope (Canvas & Slides)",
                detail:
                  "Select, nudge, align, z-order, and yank/paste boxes or reorder slides across the deck.",
                keys: ["h j k l", "H J K L", "o", "sj / sk"],
              },
              {
                title: "TEXT Scope (In-Box Editing)",
                detail:
                  "Enter any box to run full Vim motions, operators, text objects, and visual selections.",
                keys: ["gj", "i / a", "v / V", "Esc / gk"],
              },
              {
                title: "Command-Line Mode",
                detail:
                  "Style typography, set slide backgrounds, run cross-slide regex replacements, or export to PDF.",
                keys: [":", "/", ":w", ":present"],
              },
            ],
          },
        ],
      },
    ],
  },
  "getting-started": {
    slug: "getting-started",
    title: "Getting Started",
    description:
      "Learn the two-tier scope model, four Vim modes, and how drafts sync to the cloud.",
    badge: "Guide",
    prev: { title: "Documentation", href: "/docs" },
    next: { title: "Ex Commands", href: "/docs/ex-commands" },
    sections: [
      {
        id: "scopes",
        title: "Two-Tier Scope Model",
        blocks: [
          {
            type: "p",
            text: "VimSlides separates spatial layout from text editing into two distinct scopes so single-key bindings never conflict.",
          },
          {
            type: "tabs",
            items: [
              {
                value: "base",
                label: "BASE Scope",
                blocks: [
                  {
                    type: "p",
                    text: "Default scope when opening a presentation. Keys operate on the selected box or active slide (moving, focusing, layering, and navigating slides).",
                  },
                ],
              },
              {
                value: "text",
                label: "TEXT Scope",
                blocks: [
                  {
                    type: "p",
                    text: "Entered via gj (NORMAL) or i / I / A / Enter (INSERT). Keys operate on characters, words, lines, and paragraphs inside the active box. Press Esc or gk to return to BASE scope.",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "modes",
        title: "Four Vim Modes",
        blocks: [
          {
            type: "table",
            headers: ["Mode", "Badge", "How to Enter", "Primary Purpose"],
            rows: [
              [
                "NORMAL",
                "Primary",
                "Esc from any mode",
                "Execute motions, operators, box nudges, and slide jumps",
              ],
              [
                "INSERT",
                "Chart 2",
                "i, I, a, A, o, O, cc, s, S",
                "Type directly inside a text box with automatic bullet continuation",
              ],
              [
                "VISUAL",
                "Chart 3",
                "v (char) or V (line) in TEXT",
                "Select text ranges for case transforms, indentation, or yank/delete",
              ],
              [
                "COMMAND",
                "Chart 4",
                ":, /, or ?",
                "Run Ex commands, cross-slide search, and :%s substitutions",
              ],
            ],
          },
        ],
      },
      {
        id: "persistence",
        title: "Auto-Drafting & Cloud Saves",
        blocks: [
          {
            type: "steps",
            items: [
              {
                title: "Automatic Local Drafts",
                detail:
                  "Every edit saves immediately to localStorage (vimslides:draft:<id>) and marks the status bar with [+].",
                keys: ["[+]"],
              },
              {
                title: "Commit to Cloud",
                detail:
                  "Write your slides to cloud storage and clear the unsaved indicator, or write and exit to /presentations.",
                keys: [":w", ":wq", "ZZ"],
              },
              {
                title: "Discard or Present",
                detail:
                  "Force-quit without saving to clear the local draft, enter fullscreen presenter mode, or print to landscape PDF.",
                keys: [":q!", "ZQ", ":present", ":export"],
              },
            ],
          },
          {
            type: "callout",
            title: "Which-Key Reference",
            body: "Pause mid-sequence (such as g, z, s, or d) or click Which-Key in the top bar to open a live, context-aware binding popup.",
          },
        ],
      },
    ],
  },
  "ex-commands": {
    slug: "ex-commands",
    title: "Ex Commands",
    description:
      "Command-line instructions triggered with :, /, or ? across both BASE and TEXT scopes.",
    badge: "Reference",
    prev: { title: "Getting Started", href: "/docs/getting-started" },
    next: { title: "Keybindings", href: "/docs/keybindings" },
    sections: [
      {
        id: "styling",
        title: "Text & Slide Styling",
        blocks: [
          {
            type: "table",
            searchable: true,
            headers: ["Command", "Arguments", "Effect"],
            rows: [
              [":bold", "none", "Toggle bold weight on the selected box"],
              [":italic", "none", "Toggle italic style on the selected box"],
              [
                ":align",
                "<left|center|right>",
                "Set horizontal text alignment on the selected box",
              ],
              [
                ":size",
                "<10-160|+N|-N>",
                "Set absolute font size or adjust relatively in px",
              ],
              [
                ":color",
                "<token|hex|css-color>",
                "Apply a theme token (primary, muted, chart-2) or valid CSS color",
              ],
              [
                ":bullets",
                "<d|c>",
                "Convert or prefix current line with dash (-) or circle (•) bullets in TEXT scope",
              ],
              [
                ":bg",
                "[css-color]",
                "Set slide background via CSS.supports, or omit to reset to default",
              ],
              [
                ":front / :back",
                "none",
                "Bring selected box to front or send to back of z-order",
              ],
            ],
          },
        ],
      },
      {
        id: "slides-nav",
        title: "Slide Management & Navigation",
        blocks: [
          {
            type: "table",
            searchable: true,
            headers: ["Command", "Arguments", "Effect"],
            rows: [
              [
                ":s new / :s newabove",
                "none",
                "Insert a new slide after or before the current slide",
              ],
              [
                ":s del / :s dup",
                "none",
                "Delete (yanking to slide register) or duplicate current slide",
              ],
              [
                ":s up / :s down",
                "none",
                "Move current slide one position earlier or later",
              ],
              [":m <N>", "1-based index", "Move current slide to position N"],
              [":<N>", "1-based index", "Jump directly to slide N"],
              [
                ":first / :last / :$",
                "none",
                "Jump to the first or last slide in the deck",
              ],
              [":next / :prev", "none", "Advance to next or previous slide"],
            ],
          },
        ],
      },
      {
        id: "search-replace",
        title: "Search & Substitution",
        blocks: [
          {
            type: "table",
            searchable: true,
            headers: ["Command", "Syntax", "Effect"],
            rows: [
              [
                "/ and ?",
                "/<query> or ?<query>",
                "Search forward or backward across all slides (smart-case when lowercase)",
              ],
              [
                "n / N",
                "none",
                "Jump to next or previous search hit across slides",
              ],
              [":noh", "none", "Clear active search query state"],
              [
                ":s",
                "s/pat/repl/[gi]",
                "Regex replace on the currently selected box",
              ],
              [
                ":%s",
                "%s/pat/repl/[gi]",
                "Regex replace across every box on every slide",
              ],
            ],
          },
        ],
      },
      {
        id: "file-export",
        title: "Persistence, Undo & Export",
        blocks: [
          {
            type: "table",
            searchable: true,
            headers: ["Command", "Alias", "Effect"],
            rows: [
              [
                ":w",
                ":write",
                "Write current slides to cloud and clear [+] unsaved status",
              ],
              [
                ":wq",
                "ZZ",
                "Write slides to cloud and return to /presentations",
              ],
              [
                ":x",
                ":xit / :exit",
                "Write only if unsaved changes exist, then exit",
              ],
              [
                ":q",
                ":quit",
                "Exit presenter mode, or return to dashboard if no unsaved changes (errors with E37 if dirty)",
              ],
              [
                ":q!",
                "ZQ",
                "Discard local draft and exit immediately without saving",
              ],
              [
                ":undo / :redo",
                "u / Ctrl+r",
                "Step backward or forward through the 50-step history stack",
              ],
              [":present", "none", "Launch fullscreen presenter overlay"],
              [
                ":export",
                "none",
                "Open browser print dialog formatted for landscape slide-per-page PDF",
              ],
            ],
          },
        ],
      },
    ],
  },
  keybindings: {
    slug: "keybindings",
    title: "Keybindings",
    description:
      "Complete modal keymap for BASE scope, TEXT scope, and Presenter mode.",
    badge: "Reference",
    prev: { title: "Ex Commands", href: "/docs/ex-commands" },
    sections: [
      {
        id: "base-scope",
        title: "BASE Scope (Boxes & Slides)",
        blocks: [
          {
            type: "table",
            searchable: true,
            headers: ["Key", "Category", "Action"],
            rows: [
              [
                "h / j / k / l",
                "Position",
                "Nudge selected box by 8px (× count)",
              ],
              [
                "hf / jf / kf / lf",
                "Position",
                "Step-boost move to 48px immediately after directional nudge",
              ],
              [
                "hg / jg / kg / lg",
                "Position",
                "Mega-boost move to 128px immediately after directional nudge",
              ],
              [
                "H / J / K / L",
                "Focus",
                "Select nearest box in that direction",
              ],
              [
                "Tab / Shift+Tab",
                "Focus",
                "Cycle forward or backward through boxes on the slide",
              ],
              ["o", "Box", "Create a new text box and enter TEXT INSERT mode"],
              ["gj", "Scope", "Enter TEXT NORMAL mode inside the selected box"],
              [
                "i / I / A / Enter",
                "Scope",
                "Enter TEXT INSERT mode (at cursor, start, or end of box)",
              ],
              ["dd / x", "Box", "Delete selected box into the box register"],
              ["cc", "Box", "Clear box text and enter TEXT INSERT mode"],
              ["yy / P", "Box", "Yank selected box / paste box from register"],
              [
                "zt / zz / zb",
                "Align",
                "Align box vertically to top, center, or bottom margin",
              ],
              [
                "zh / zc / zl",
                "Align",
                "Align box horizontally to left, center, or right margin",
              ],
              ["] / [", "Z-Order", "Move box forward or backward one layer"],
              ["} / {", "Z-Order", "Send box to top or bottom layer"],
              [
                "> / <",
                "Typography",
                "Scale font size by +2px or -2px (× count)",
              ],
              [
                "~",
                "Typography",
                "Toggle character case across the entire selected box",
              ],
              ["sj / sk", "Slides", "Go to next or previous slide (× count)"],
              [
                "sg / sG",
                "Slides",
                "Go to first slide ({N}sg jumps to slide N) or last slide",
              ],
              ["( / )", "Slides", "Reorder current slide up or down"],
              [
                "dS / yS",
                "Slides",
                "Cut or yank current slide to slide register",
              ],
              [
                "ps / pS",
                "Slides",
                "Paste slide register after or before current slide",
              ],
              [
                "m{a-z0-9} / '{a-z0-9} / ''",
                "Marks",
                "Set slide bookmark, jump to bookmark, or jump to previous slide",
              ],
              [
                "+ / - / 0",
                "Canvas",
                "Zoom canvas in (+10%), out (-10%), or reset to 100%",
              ],
            ],
          },
        ],
      },
      {
        id: "text-scope",
        title: "TEXT Scope (In-Box Editing)",
        blocks: [
          {
            type: "table",
            searchable: true,
            headers: ["Key", "Category", "Action"],
            rows: [
              ["gk / Esc", "Scope", "Exit TEXT scope back to BASE NORMAL mode"],
              [
                "h / j / k / l",
                "Motion",
                "Move cursor with preferred-column vertical tracking",
              ],
              [
                "w / W / b / B / e / E / ge / gE",
                "Motion",
                "Word and WORD forward, backward, and end motions",
              ],
              [
                "0 / ^ / _ / g_ / $ / gM / |",
                "Motion",
                "Line start, first/last non-blank, end, line middle, or column",
              ],
              [
                "gg / G / { / } / %",
                "Motion",
                "Top/bottom of box, paragraph jumps, and matching (), [], {}",
              ],
              [
                "f / F / t / T / ; / ,",
                "Motion",
                "Single-line find/till character and repeat forward/reverse",
              ],
              [
                "d / c / y",
                "Operator",
                "Delete, change, or yank with any motion, doubled line (dd/cc/yy), or text object",
              ],
              [
                "gu / gU / g~",
                "Operator",
                "Lowercase, uppercase, or toggle case (supports guu, gUU, g~~)",
              ],
              [
                "iw / aw / ip / ap",
                "Text Object",
                "Inner/around word, WORD (W), or paragraph",
              ],
              [
                "i( / a( / i[ / a[ / i{ / a{ / i< / a<",
                "Text Object",
                "Inner/around parentheses (b), brackets, braces (B), or angle brackets",
              ],
              [
                "v / V / o",
                "Visual",
                "Character-wise or line-wise visual mode; o swaps selection anchor",
              ],
              [
                "> / < / J / gJ",
                "Lines",
                "Indent/dedent by 2 spaces, join lines with space, or join raw",
              ],
              [
                "r / s / S / x / X / D / C / Y",
                "Edit",
                "Replace char, substitute, delete char, or operate to end of line",
              ],
              [
                "p / P",
                "Clipboard",
                "Paste from text register or synced system clipboard",
              ],
            ],
          },
        ],
      },
      {
        id: "presenter",
        title: "Presenter & Non-Goals",
        blocks: [
          {
            type: "table",
            headers: ["Key", "Context", "Action"],
            rows: [
              [
                "j / l / Space / Enter / ArrowRight / PageDown",
                "Presenter",
                "Next slide (× count)",
              ],
              [
                "k / h / Backspace / ArrowLeft / PageUp",
                "Presenter",
                "Previous slide (× count)",
              ],
              [
                "gg / 0 / G / $",
                "Presenter",
                "Jump to first or last slide ({N}gg / {N}G jumps to slide N)",
              ],
              ["q / Esc", "Presenter", "Exit presenter mode"],
            ],
          },
          {
            type: "callout",
            title: "Intentional Differences from Stock Vim",
            body: "Quote text objects (i\", i', i`), macros, named registers, dot-repeat (.), and single-key p box paste in BASE scope are intentionally omitted to keep slide bindings unambiguous.",
          },
        ],
      },
    ],
  },
}
