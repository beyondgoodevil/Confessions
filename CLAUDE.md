# Confessions — notes for Claude Code

This repository is a personal notebook published with GitHub Pages. Every Markdown file under `notes/` becomes a page. Pushing to `main` triggers `.github/workflows/deploy.yml`, which stamps addresses (`tools/stamp.mjs`), builds (`tools/build.mjs`) and deploys.

## Layout

| Folder | Section | Address prefix |
| --- | --- | --- |
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
5. `node tools/check.mjs` to list links that point to notes that don't exist; report them rather than deleting them (they may be intentional).
6. `node tools/build.mjs` must succeed. Optionally preview with `node tools/serve.mjs` (http://localhost:8000).
7. Commit with a message like `Import 42 notes from Obsidian vault` and `git push`. The site updates about a minute later.

## Other handy commands

- `node tools/new.mjs book "Title"` (also `podcast`, `video`, `lecture`, `misc`) creates a note with the right fields.
- `node tools/stamp.mjs --check` shows which notes still need an address.
