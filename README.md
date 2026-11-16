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

**Publishing from Obsidian:** the vault has its own plugin, *Publish to Confessions* (`.obsidian/plugins/publish-confessions`). Click the cloud icon in the left ribbon (or run *Publish this note* from the command palette) to see what needs fixing and which notes to link, then press Publish. `Ctrl+Alt+P` publishes the open note straight away when nothing is wrong. The status bar at the bottom shows how many notes have changes that are not on the site yet; click it for *Publish everything changed*. It needs Node.js and works on the desktop app only. A note with `draft: true` is saved to GitHub but kept off the site.

**Quoting from SumatraPDF:** with the book open in SumatraPDF, select a passage, press `Ctrl+C`, and in Obsidian press `Ctrl+Alt+V` (*Paste as quotation*). The passage is pasted as one clean paragraph in quotation marks with its citation, `"…" (Storing, p. 9)`: the page is the book's printed page number, and the name comes from the note's `source:` line. The first quotation from a book takes a moment while the book is read (longer for a scan). *Open the citation under the cursor in SumatraPDF* (also in the right-click menu) opens the book at that page. *Import the highlights…* pastes every highlight saved in the PDF (in SumatraPDF: select, press `a`, save with `Ctrl+S`) as a list of quotations with pages; it needs `python -m pip install pymupdf` once. In the Writer page, text pasted from a PDF is joined into one paragraph, without the page lookup.

**On the site:** every note has its own address (`…/M-0416/`) and opens with its text already there. Press `/` to search; *See all … with their passages* opens the full search page, where `author:`, `title:`, `before:` and `after:` narrow the results.

More helpers:

- **Start from an outline:** `npm run new -- misc "My Title" --outline comparison` fills the note with a skeleton (`study`, `comparison`, `book`, `lecture`, or `none`). Books and lectures get theirs by default. The outlines are the `Outline - ….md` files in `templates/`, so Obsidian's *Insert template* offers them too, and any `Outline - Name.md` you add becomes `--outline name`.
- **Retitle a note:** `npm run rename -- "Old Title" "New Title"` changes the title, rewrites every `[[link]]` to it, keeps the old title as an alias and renames the file. Add `--dry` to see the plan first.
- **Tables:** `npm run table -- "My Title"` lines up every table in a note; `npm run table -- --new "Question" "Plato" "Aristotle" --rows "Soul" "City"` prints an empty one; `npm run table -- --csv data.csv` makes one from a spreadsheet export.
- **Take in a book:** `npm run intake -- "C:\Books\Some Book.pdf"` writes the text to `.intake/<name>/` (never published): the whole book with printed page numbers, one file per chapter, and a reading checklist. Scanned PDFs are read with Windows' built-in OCR. `npm run intake -- find <name> "a few words"` tells you the page a quotation is on.

If publish stops, read the message just above "Stopped". Usually it's a merge conflict (`git status` shows the file) or a front-matter typo (`npm run check` names the note).
