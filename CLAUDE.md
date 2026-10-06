# Confessions — notes for Claude Code

This repository is a personal notebook published with GitHub Pages. Every Markdown file under `notes/` becomes a page. Pushing to `main` triggers `.github/workflows/deploy.yml`, which stamps addresses (`tools/stamp.mjs`), builds (`tools/build.mjs`) and deploys.

## Layout

| Folder | Section | Address prefix |
| --- | --- | --- |
| `notes/guides/` | Guides (reading orders that link the notes by theme) | `G-` |
| `notes/books/` | Books | `B-` |
| `notes/media/podcasts/` | Podcasts & Videos → Podcasts | `P-` |
| `notes/media/videos/` | Podcasts & Videos → Videos | `P-` |
| `notes/lectures/` | Lectures | `L-` |
| `notes/misc/` | Miscellany | `M-` |
| `notes/images/` | Images used by notes (`![[name.png]]` finds them by file name) | |

Sections are defined in `config.json` (strict JSON). `templates/` holds Obsidian templates and is not published.

## Note format

YAML front matter, then Markdown. Fields by section (all optional except that a title is strongly preferred):

- every note: `id`, `title`, `date` (YYYY-MM-DD), `tags` (list), `summary`, `aliases`, `url`, `draft`, `type`
- books: `author`, `year`, `publisher`
- podcasts: `show`, `episode`, `host`, `guest`, `year`
- videos: `creator`, `channel`, `event`, `year`
- lectures: `course`, `lecture` (number), `lecturer`, `institution`
- miscellany: `source`

`type:` (`book`, `podcast`, `video`, `lecture`, `misc`) overrides the folder when deciding the section.

Links: `[[Note title]]`, `[[B-0003]]`, `[[Title|shown text]]`, `[[Title#Heading]]`. Maths with `$…$` / `$$…$$`. Callouts: `> [!definition] Title`, `[!theorem]`, `[!proof]`, `[!note]`, etc.

## Tags

Write tags as `tags: [domain, scripture?, topic, topic]`, in that order, lower-case, hyphenated. Tag what a note is *about*, not what it mentions in passing.

- Domain (at least one): `theology`, `philosophy` (both only when a note really is both, e.g. a Plato note with an Orthodox section). Other fields: `mathematics`, `note-taking`, `programming`, `research`.
- `scripture` only when the note is built on biblical passages (verse notes, verse collections, exegesis).
- Theology topics: `trinity`, `christology`, `theosis` (essence-energies, uncreated light, deification), `salvation` (atonement, recapitulation, faith and works, resurrection), `the-fall`, `typology`, `prophecy`, `covenant` (the covenants themselves), `theophany`, `mary`, `sacraments`, `liturgy` (worship, heavenly liturgy), `icons-saints` (icons, relics, intercession), `prayer`, `tradition` (Holy Tradition, oral and written), `ecclesiology` (the Church: authority, succession, government, unity), `canon` (formation of the Bible, LXX, deuterocanon), `councils` (the ecumenical councils, their canons and the heresies they answered), `patristics` (notes built on the Fathers' writings), `church-history`, `papacy`, `reformation`, `ecumenism`, `catholicism` (Roman Catholic doctrine and documents), `thomism`, `neoplatonism`, `islam`.
- Philosophy topics: `epistemology` (knowledge, justification, belief, scepticism; not every argument that mentions knowing), `logic`, `fallacies`, `metaphysics`, `ethics`, `mind`, `time`, `philosophy-of-science`, `apologetics` (TAG, presuppositions, worldview arguments), and a thinker's name when the note is about that thinker (`plato`, `aristotle`, `nietzsche`, `leibniz`, `kant`).
- Guides carry `guide` plus their topic's tag.

## Rules

- Never invent an `id`. Leave it out and run `node tools/stamp.mjs` (or let the workflow do it). Never change an existing `id`, and never reuse one.
- Never invent metadata. Fill `author`, `show`, `course`, etc. only from what the note itself states (or the user tells you). If unsure, leave the field out.
- Don't rewrite the body of a user's note unless asked. Adding front matter is fine.
- Don't edit `assets/app.js`, `assets/style.css` or the workflow unless the user asks for a site change.
- Keep `config.json` valid JSON; run `node tools/build.mjs` after touching it.

## Importing existing notes (the usual request)

1. `node tools/import.mjs <folder> --dry-run` and show the user the plan (where each file would go; `[guessed]` means no section hint was found).
2. For each `[guessed]` file, read it. If it's clearly notes on a book, podcast, video or lecture, add `type:` to that file's front matter in the source folder (or ask the user if it's ambiguous). Add clearly stated metadata (author, show, course…) at the same time.
3. `node tools/import.mjs <folder>` to copy the files in. It never overwrites; clashing names get `-2`.
4. `node tools/stamp.mjs` to give every imported note its address and date.
5. `node tools/check.mjs` to list links that point to notes that don't exist; report them rather than deleting them (they may be intentional). It also lists front matter that won't parse, duplicate addresses or titles, notes with identical text and embedded images that are missing: fix the front matter, report the rest.
6. `node tools/build.mjs` must succeed. Optionally preview with `node tools/serve.mjs` (http://localhost:8000).
7. Commit with a message like `Import 42 notes from Obsidian vault` and `git push`. The site updates about a minute later.

## Other handy commands

- `node tools/new.mjs book "Title"` (also `podcast`, `video`, `lecture`, `misc`) creates a note with the right fields.
- `node tools/stamp.mjs --check` shows which notes still need an address.
- `node tools/build.mjs` also writes `_site/<ID>/index.html` (a shareable address with a link preview that forwards to `#/<ID>`) and `_site/feed.xml`; set `SITE_URL` for absolute addresses (the workflow does).
