# Confessions

A notebook of book, podcast/video, lecture and miscellaneous notes, published with GitHub Pages.

Four ways to add notes; they all end up as Markdown files in `notes/`:

- **Writer app:** open `write.html` on your site (e.g. `https://beyondgoodevil.github.io/Confessions/write.html`), connect it once with a GitHub token, then write, edit or bulk-upload notes from any browser.
- **Obsidian:** open this repository as a vault and sync it with the Obsidian Git plugin. Templates for each note type are in `templates/`.
- **Claude Code:** ask it to import a folder of existing Markdown notes; `CLAUDE.md` tells it how.
- **github.com or Git:** add `.md` files to `notes/books/`, `notes/media/podcasts/`, `notes/media/videos/`, `notes/lectures/` or `notes/misc/` and commit.

On every push GitHub gives new notes their addresses (B-0001, P-0001, …), rebuilds the site and publishes it in about a minute.

Tools (need Node.js): `node tools/serve.mjs` preview · `node tools/new.mjs book "Title"` new note · `node tools/import.mjs <folder>` bulk import · `node tools/check.mjs` find unwritten links · `node tools/stamp.mjs` add addresses.

The full guide is the Claude doc “Commonplace: setup and user guide”.
