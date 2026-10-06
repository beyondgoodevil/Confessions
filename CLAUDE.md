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

## The site

The site is laid out as a commonplace book: a title page (`title`, `subtitle`, `author`, `epigraph` and `welcome` in `config.json`), the guides grouped as *Loci communes* (groups come from the H2 headings of the guide that lists the other guides, i.e. Start Here; set `"map": "G-0011"` to name it explicitly), and indices at `#/indices`:

- **Index of Scripture** (`#/scripture`): references such as `John 17:5`, `1 Cor. 15:26`, `Psalm 13(14):3` or `Genesis 37–50` are found in note titles and text automatically. Book names and their order (Septuagint order for the Old Testament) live in `assets/loci.js`.
- **Index of Authors** (`#/authors`): a curated, dated list in `assets/loci.js`. To index another thinker, add `{ name, dates, era, match: [regex strings] }` there. Names in `author`, `lecturer`, `creator`, `host` and `guest` front matter are added automatically.
- **Index of Subjects** (`#/tags`): the tags.

Guides are reading orders: every note a guide links to (outside its "Other Guides" heading) gets previous/next links for that guide. Links inside `[[…]]` are never counted by the indices; only a note's own prose is.

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
- Don't edit `assets/app.js`, `assets/style.css`, `assets/loci.js` or the workflow unless the user asks for a site change. `write.html`, `assets/writer.js` and `assets/writer.css` are the user's editor: leave its behaviour alone. It reuses `app.js` as a library (`window.Commonplace`), so keep that API working.
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
