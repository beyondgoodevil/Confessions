# Confessions

A notebook of book, podcast/video, lecture and miscellaneous notes, published with GitHub Pages.

Four ways to add notes; they all end up as Markdown files in `notes/`:

- **Writer app:** open `write.html` on your site (e.g. `https://beyondgoodevil.github.io/Confessions/write.html`), connect it once with a GitHub token, then write, edit or bulk-upload notes from any browser.
- **Obsidian:** open this repository as a vault and sync it with the Obsidian Git plugin. Templates for each note type are in `templates/`.
- **Claude Code:** ask it to import a folder of existing Markdown notes; `CLAUDE.md` tells it how.
- **github.com or Git:** add `.md` files to `notes/books/`, `notes/media/podcasts/`, `notes/media/videos/`, `notes/lectures/` or `notes/misc/` and commit.

On every push GitHub gives new notes their addresses (B-0001, P-0001, …), rebuilds the site and publishes it in about a minute.

**Guides** are reading orders: `## Part` headings, each with a numbered list of `N. [[Note]] — one-line summary`. In the Writer, pick the *Guide (reading order)* template to start one, and use *Sections… → Insert notes as a list…* to fill it. To put a note into a guide, use *Add to a guide…* under the Summary when writing or editing it: the line is added to the part you choose when you publish. (`node tools/new.mjs guide "Title"` and `templates/Guide.md` do the same outside the Writer.)

The **Graph** page (menu) draws every note and link; filter it by tag or show only notes with no links. **Random** opens a random note. Add `series: Name` (and `part: N`) to notes meant to be read in order: each gets previous/next links and the series has its own page. The index lists recently revised notes at the bottom, and on wide screens a note's contents stay beside it and highlight the section you're reading.

Large sections (Miscellany, Books) have a filter box and a topic list, and can be sorted by topic or, for books, by author. The topic headings live under `browse` in `config.json`.

To share an entry, link to its address: `https://beyondgoodevil.github.io/Confessions/B-0010/` opens the entry, and a link preview (in messages, Discord, etc.) shows its title and summary. New entries are also listed in an Atom feed at `/feed.xml` for anyone who follows the notebook in a feed reader.

Tools (need Node.js): `node tools/serve.mjs` preview (the page reloads itself when you save a note) · `node tools/new.mjs book "Title"` new note · `node tools/import.mjs <folder>` bulk import · `node tools/check.mjs` find unwritten links, front-matter mistakes, duplicate notes and missing images (each deploy also runs it and lists what it finds on the run's summary page) · `node tools/stamp.mjs` add addresses · `npm run suggest -- "Title"` notes worth linking to and from · `npm run publish-note -- "Title" "Related…"` publish one note (stamp, backlinks, checks, commit, push).

The full guide is the Claude doc “Commonplace: setup and user guide”.

## Doing it yourself (no Claude needed)

Open a terminal in this folder (needs Node.js and Git). The whole routine:

1. **New note:** `npm run new -- misc "My Title"` (or `book`, `podcast`, `video`, `lecture`, `guide`). Write it in Obsidian, the Writer page, or any editor.
2. **Link it from older notes:** `npm run link -- "My Title" "Existing Note" "Another Note"` adds `- [[My Title]]` under each one's `## Related` heading.
3. **Preview:** `npm run preview`, then open the address it prints.
4. **Publish:** `npm run publish -- "What I changed"`. This gets the latest version, gives new notes their addresses, builds, checks for broken links, commits and pushes. Use `npm run publish -- --dry` to do everything except upload.

If publish stops, read the message just above "Stopped". Usually it's a merge conflict (`git status` shows the file) or a front-matter typo (`npm run check` names the note).
