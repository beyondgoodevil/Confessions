/* Publish to Confessions: an Obsidian plugin for this vault.
   It runs tools/obsidian.mjs (in the vault) with Node, so the vault's own tools do the work:
     Publish this note            review panel: problems, related notes to link, then Publish
     Publish this note now        no panel unless something is wrong
     Publish everything changed   every changed file in the vault
     Check this note              the review panel without publishing
   The status bar shows how many notes have changes that are not on the site yet.
   Plain JavaScript on purpose: there is no build step, edit this file and reload Obsidian. */
'use strict';
const { Plugin, Modal, Notice, Setting, PluginSettingTab, MarkdownView, Menu } = require('obsidian');
const { execFile } = require('child_process');
const path = require('path');

const DEFAULTS = { node: 'node', site: '', quickWhenClean: true };

module.exports = class PublishConfessions extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULTS, await this.loadData());
    this.busy = false;
    this.root = this.app.vault.adapter.basePath;

    this.addRibbonIcon('upload-cloud', 'Publish this note', () => this.review(true));
    this.addCommand({ id: 'publish-note', name: 'Publish this note', callback: () => this.review(true) });
    this.addCommand({ id: 'publish-note-now', name: 'Publish this note now (no review unless something is wrong)', hotkeys: [{ modifiers: ['Mod', 'Alt'], key: 'p' }], callback: () => this.quick() });
    this.addCommand({ id: 'publish-all', name: 'Publish everything changed', callback: () => this.publishAll() });
    this.addCommand({ id: 'check-note', name: 'Check this note', callback: () => this.review(false) });
    this.addCommand({ id: 'open-on-site', name: 'Open this note on the site', callback: () => this.openOnSite() });

    this.status = this.addStatusBarItem();
    this.status.addClass('pc-status');
    this.status.addEventListener('click', e => {
      const m = new Menu();
      m.addItem(i => i.setTitle('Publish this note').setIcon('upload-cloud').onClick(() => this.review(true)));
      m.addItem(i => i.setTitle('Publish everything changed').setIcon('upload').onClick(() => this.publishAll()));
      m.addItem(i => i.setTitle('Check this note').setIcon('check-circle').onClick(() => this.review(false)));
      m.addItem(i => i.setTitle('Open this note on the site').setIcon('external-link').onClick(() => this.openOnSite()));
      m.showAtMouseEvent(e);
    });
    let timer = null;
    const later = () => { clearTimeout(timer); timer = setTimeout(() => this.refresh(), 2500); };
    this.registerEvent(this.app.vault.on('modify', later));
    this.registerEvent(this.app.vault.on('create', later));
    this.registerEvent(this.app.vault.on('delete', later));
    this.registerEvent(this.app.vault.on('rename', later));
    this.registerInterval(window.setInterval(() => this.refresh(), 5 * 60 * 1000));
    this.app.workspace.onLayoutReady(() => this.refresh());

    this.addSettingTab(new Settings(this.app, this));
  }

  /* ---- running the vault's tool ---- */
  run(args, onLine) {
    return new Promise(resolve => {
      const child = execFile(this.settings.node || 'node', [path.join('tools', 'obsidian.mjs'), ...args], { cwd: this.root, maxBuffer: 1 << 26, windowsHide: true }, (err, stdout, stderr) => {
        const line = String(stdout || '').split(/\r?\n/).reverse().find(l => l.startsWith('RESULT '));
        if (line) { try { return resolve(JSON.parse(line.slice(7))); } catch (e) { /* fall through */ } }
        if (err && err.code === 'ENOENT') return resolve({ ok: false, error: 'Node.js was not found. Install it from nodejs.org, or put the full path to node.exe in this plugin\'s settings.' });
        resolve({ ok: false, error: String(stderr || (err && err.message) || 'The publish tool gave no answer.').trim().split('\n').slice(-8).join('\n') });
      });
      if (onLine && child.stdout) child.stdout.on('data', d => String(d).split(/\r?\n/).forEach(l => { if (l.trim() && !l.startsWith('RESULT ')) onLine(l.trim()); }));
    });
  }

  activeNote() {
    const f = this.app.workspace.getActiveFile();
    if (!f || f.extension !== 'md') { new Notice('Open the note you want to publish first.'); return null; }
    if (!f.path.startsWith('notes/')) { new Notice('Only notes in the notes folder are published. This file is in ' + (f.parent && f.parent.path || 'the vault root') + '.'); return null; }
    return f;
  }
  async save() { try { await this.app.commands.executeCommandById('editor:save-file'); } catch (e) { /* nothing open to save */ } await sleep(120); }

  site(r) { return (this.settings.site || (r && r.site) || this.lastSite || '').replace(/\/?$/, '/'); }
  link(r, id) { const s = this.site(r); return s && id ? s + '#/' + id : ''; }

  async refresh() {
    if (this.busy) return;
    const r = await this.run(['status']);
    if (!r.ok) { this.status.setText(''); return; }
    this.lastSite = r.site;
    const n = r.changed.length;
    this.status.setText(n ? `↑ ${n} note${n === 1 ? '' : 's'} not published` : (r.ahead ? '↑ saved, not uploaded' : '✓ published'));
    this.status.setAttr('aria-label', n ? r.changed.slice(0, 12).join('\n') + (n > 12 ? `\n… and ${n - 12} more` : '') + '\n\nClick for the publish menu' : 'Everything in notes/ is on the site. Click for the publish menu.');
  }

  /* ---- commands ---- */
  async review(willPublish) {
    const f = this.activeNote(); if (!f) return;
    await this.save();
    const r = await this.run(['inspect', f.path]);
    if (!r.ok) { new Notice(r.error, 10000); return; }
    new ReviewModal(this.app, this, f, r, willPublish).open();
  }

  async quick() {
    const f = this.activeNote(); if (!f) return;
    if (this.busy) { new Notice('Still publishing the last one.'); return; }
    await this.save();
    const r = await this.run(['inspect', f.path]);
    if (!r.ok) { new Notice(r.error, 10000); return; }
    if (r.problems.length || !this.settings.quickWhenClean) { new ReviewModal(this.app, this, f, r, true).open(); return; }
    const note = new Notice('Publishing “' + r.title + '”…', 0);
    const out = await this.publish(f.path, [], false, l => note.setMessage('Publishing “' + r.title + '”… ' + l.toLowerCase()));
    note.hide();
    this.announce(out);
  }

  async publish(notePath, related, force, onLine) {
    this.busy = true;
    try { return await this.run(['publish', notePath, ...(related.length ? ['--related', JSON.stringify(related)] : []), ...(force ? ['--force'] : [])], onLine); }
    finally { this.busy = false; this.refresh(); }
  }

  announce(out) {
    if (!out.ok) { new Notice('Not published.\n' + out.error, 15000); return; }
    if (out.offline) { new Notice(out.message, 10000); return; }
    if (out.nothing) { new Notice('Nothing new to publish: the site already has this version.'); return; }
    const url = this.link(out, out.id);
    const frag = document.createDocumentFragment();
    frag.createSpan({ text: `Published ${out.id ? out.id + ' · ' : ''}${out.title}. The site updates in a minute or two. ` });
    if (url) { const a = frag.createEl('a', { text: 'Open it', href: url }); a.addEventListener('click', e => { e.preventDefault(); window.open(url); }); }
    new Notice(frag, 12000);
  }

  async publishAll() {
    if (this.busy) { new Notice('Still publishing the last one.'); return; }
    await this.save();
    const note = new Notice('Publishing everything changed…', 0);
    this.busy = true;
    let out;
    try { out = await this.run(['publish-all'], l => note.setMessage('Publishing everything changed… ' + l.toLowerCase())); }
    finally { this.busy = false; note.hide(); this.refresh(); }
    if (!out.ok) new Notice('Not published.\n' + out.error, 15000);
    else if (out.offline) new Notice(out.message, 10000);
    else if (out.nothing) new Notice('Nothing to publish: the site is up to date.');
    else new Notice(`Published ${out.notes || out.count} ${out.notes ? 'note' : 'file'}${(out.notes || out.count) === 1 ? '' : 's'}. The site updates in a minute or two.`, 8000);
  }

  async openOnSite() {
    const f = this.activeNote(); if (!f) return;
    const id = (this.app.metadataCache.getFileCache(f) || {}).frontmatter && this.app.metadataCache.getFileCache(f).frontmatter.id;
    if (!id) { new Notice('This note has no address yet. Publish it first.'); return; }
    if (!this.site()) await this.refresh();
    const url = this.link(null, id);
    if (url) window.open(url); else new Notice('Set the site address in this plugin\'s settings.');
  }

  jump(file, line) {
    const leaf = this.app.workspace.getLeaf(false);
    leaf.openFile(file).then(() => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view || !view.editor) return;
      const l = Math.max(0, Math.min((line || 1) - 1, view.editor.lineCount() - 1));
      view.editor.setCursor({ line: l, ch: 0 });
      view.editor.scrollIntoView({ from: { line: l, ch: 0 }, to: { line: l, ch: 0 } }, true);
      view.editor.focus();
    });
  }
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

class ReviewModal extends Modal {
  constructor(app, plugin, file, info, willPublish) { super(app); this.plugin = plugin; this.file = file; this.info = info; this.willPublish = willPublish; this.picked = new Set(); }

  onOpen() { this.modalEl.addClass('pc-modal'); this.draw(); }
  onClose() { this.contentEl.empty(); }

  async reload() {
    const r = await this.plugin.run(['inspect', this.file.path]);
    if (r.ok) { this.info = r; this.draw(); } else new Notice(r.error, 10000);
  }

  draw() {
    const { contentEl: el, info } = this; el.empty();
    this.titleEl.setText(info.title);
    el.createDiv({ cls: 'pc-sub', text: info.isNew ? 'New note. It gets its address when you publish.' : `${info.id || 'No address yet'} · already on the site; this publishes your changes.` });

    el.createEl('h4', { text: 'Before it goes out' });
    const issues = [...info.problems.map(p => ({ ...p, kind: 'problem' })), ...info.warnings.map(w => ({ ...w, kind: 'warning' }))];
    if (!issues.length) el.createDiv({ cls: 'pc-ok', text: '✓ Nothing to fix.' });
    for (const it of issues) {
      const row = el.createDiv({ cls: 'pc-item pc-' + it.kind });
      row.createSpan({ cls: 'pc-dot' });
      row.createSpan({ cls: 'pc-text', text: it.text });
      row.createSpan({ cls: 'pc-line', text: 'line ' + it.line });
      row.setAttr('aria-label', 'Go to line ' + it.line);
      row.addEventListener('click', () => { this.close(); this.plugin.jump(this.file, it.line); });
      if (it.fix) {
        const b = row.createEl('button', { text: it.fixLabel || 'Fix' });
        b.addEventListener('click', async e => { e.stopPropagation(); b.disabled = true; const r = await this.plugin.run(['fix', this.file.path, it.fix]); if (!r.ok) new Notice(r.error, 8000); await this.reload(); });
      }
    }
    if (info.problems.length) el.createDiv({ cls: 'pc-sub', text: 'Red items would show wrongly on the site. Orange ones are reminders.' }).style.marginTop = '8px';

    if (info.suggestions.length) {
      el.createEl('h4', { text: 'Link it with' });
      el.createDiv({ cls: 'pc-sub', text: 'Ticked notes are added to this note\'s Related list, and this note to theirs.' });
      info.suggestions.forEach((s, k) => {
        const both = s.from && s.to;
        const row = el.createDiv({ cls: 'pc-rel' });
        const box = row.createEl('input', { type: 'checkbox' }); box.id = 'pc-rel-' + k;
        if (both) { box.checked = true; box.disabled = true; }
        else if (s.to && !this.touched) { box.checked = true; this.picked.add(s.title); }   // already in Related here, no link back yet
        else box.checked = this.picked.has(s.title);
        box.addEventListener('change', () => { this.touched = true; box.checked ? this.picked.add(s.title) : this.picked.delete(s.title); });
        row.createEl('label', { text: s.title, attr: { for: box.id } });
        row.createSpan({ cls: 'pc-mark', text: both ? 'linked both ways' : s.from ? 'links here already' : s.to ? 'in your Related list' : (s.tags.length ? s.tags.slice(0, 2).join(', ') : '') });
      });
      this.touched = true;
    }

    this.logEl = el.createDiv({ cls: 'pc-log' }); this.logEl.hide();
    const bar = el.createDiv({ cls: 'pc-buttons' });
    const close = bar.createEl('button', { text: this.willPublish ? 'Cancel' : 'Close' });
    close.addEventListener('click', () => this.close());
    const go = bar.createEl('button', { cls: 'mod-cta', text: info.problems.length ? 'Publish anyway' : 'Publish' });
    go.addEventListener('click', async () => {
      if (this.plugin.busy) return;
      go.disabled = true; close.disabled = true;
      this.logEl.show(); this.logEl.removeClass('pc-error'); this.logEl.setText('Starting…');
      const out = await this.plugin.publish(this.file.path, [...this.picked], info.problems.length > 0, l => this.logEl.setText(l + '…'));
      close.disabled = false; close.setText('Close');
      if (!out.ok) { this.logEl.addClass('pc-error'); this.logEl.setText('Not published.\n' + out.error); go.disabled = false; return; }
      this.logEl.addClass('pc-done'); this.logEl.empty();
      if (out.offline) { this.logEl.setText(out.message); return; }
      if (out.nothing) { this.logEl.setText('Nothing new to publish: the site already has this version.'); return; }
      const url = this.plugin.link(out, out.id);
      this.logEl.createSpan({ text: `Published ${out.id ? out.id + ' · ' : ''}${out.title}. The site updates in a minute or two. ` });
      if (url) {
        const a = this.logEl.createEl('a', { text: 'Open it', href: url }); a.addEventListener('click', e => { e.preventDefault(); window.open(url); });
        this.logEl.createSpan({ text: ' · ' });
        const c = this.logEl.createEl('a', { text: 'Copy the link', href: '#' }); c.addEventListener('click', e => { e.preventDefault(); navigator.clipboard.writeText(url); c.setText('Copied'); });
      }
      go.hide();
    });
    if (!this.willPublish) go.setText(info.problems.length ? 'Publish anyway' : 'Publish');
  }
}

class Settings extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const { containerEl: el } = this; el.empty();
    const save = async () => this.plugin.saveData(this.plugin.settings);
    new Setting(el).setName('Skip the review when nothing is wrong')
      .setDesc('For "Publish this note now" (Ctrl+Alt+P). When on, a note with no red problems is published straight away; the panel only opens if something needs fixing.')
      .addToggle(t => t.setValue(this.plugin.settings.quickWhenClean).onChange(async v => { this.plugin.settings.quickWhenClean = v; await save(); }));
    new Setting(el).setName('Site address')
      .setDesc('Used for the "Open it" links. Leave empty to work it out from the GitHub repository.')
      .addText(t => t.setPlaceholder('https://name.github.io/Repo/').setValue(this.plugin.settings.site).onChange(async v => { this.plugin.settings.site = v.trim(); await save(); }));
    new Setting(el).setName('Path to Node.js')
      .setDesc('Only change this if publishing says Node.js was not found. Example: C:\\Program Files\\nodejs\\node.exe')
      .addText(t => t.setPlaceholder('node').setValue(this.plugin.settings.node).onChange(async v => { this.plugin.settings.node = v.trim() || 'node'; await save(); }));
  }
}
