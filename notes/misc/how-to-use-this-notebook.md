---
id: M-0001
title: How to Use This Notebook
date: 2026-01-05
tags: [note-taking, meta]
summary: A one-page reference for writing notes here — front matter, links, maths, callouts and footnotes.
---

Every note is a Markdown file in `notes/`. The folder decides the section; the front matter at the top holds the details.

## Linking notes

| You write | You get |
|---|---|
| `[[How to Take Smart Notes]]` | a link using the note's title |
| `[[B-0012]]` | the same link by address (shows the title) |
| `[[B-0012\|Ahrens]]` | a link with your own words: [[B-0012|Ahrens]] |
| `[[Some Note#A heading]]` | a link to a heading inside a note |
| `[[Something Not Written Yet]]` | a dimmed link: [[Something Not Written Yet]] |

Every link shows up on the other note under **Referenced by**, with the sentence it came from.

## Maths

Inline: `$e^{i\pi} + 1 = 0$` gives $e^{i\pi} + 1 = 0$. Display: put `$$ … $$` on its own lines.

## Callouts

> [!definition] Callout
> Write `> [!definition] Title` and indent the body with `>`. Definitions, theorems, lemmas, examples and so on are numbered automatically; `[!proof]` ends with ∎.

> [!note]
> Plain callouts: `note`, `tip`, `warning`, `quote`, `question`, `idea`.

## Everything else

Footnotes use `[^1]` in the text and `[^1]: …` at the bottom.[^demo] ==Highlights== use double equals signs. Tables, task lists, images and fenced code blocks with syntax highlighting all work.

[^demo]: Like this.
