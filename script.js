(function () {
  // ── Core Variables ────────────────────────────────────────────────
  var main = document.querySelector('main');
  var headerH = 56;

  // ── Helper Functions ──────────────────────────────────────────────
  function smoothScrollTo(el) {
    if (!el) return;
    // Immediate snap to top with offset for header (40px) + buffer (10px)
    var offset = 50;
    var targetY = el.getBoundingClientRect().top + main.scrollTop - offset;

    main.scrollTo({
      top: targetY,
      behavior: 'auto'
    });
  }

  function wrapContentBlocks() {
    if (!main) return;
    var intro = document.getElementById('intro');
    if (intro && !document.getElementById('block-intro')) {
      var blockIntro = document.createElement('div');
      blockIntro.id = 'block-intro';
      blockIntro.className = 'content-block is-open';
      intro.parentNode.insertBefore(blockIntro, intro);
      blockIntro.appendChild(intro);
    }
    main.querySelectorAll('h2[id^="section-"]').forEach(function (h2) {
      var id = h2.getAttribute('id');
      if (document.getElementById('block-' + id)) return; // already wrapped

      var block = document.createElement('div');
      block.id = 'block-' + id;
      block.className = 'content-block';
      var nodes = [h2];
      var next = h2.nextElementSibling;
      while (next && next.tagName !== 'H2') {
        nodes.push(next);
        next = next.nextElementSibling;
      }
      h2.parentNode.insertBefore(block, h2);
      nodes.forEach(function (node) { block.appendChild(node); });
    });
  }

  function openBlock(block, skipScroll) {
    if (!block) return;

    // 1. Instantly hide ALL other blocks
    main.querySelectorAll('.content-block').forEach(function (b) {
      if (b !== block) {
        b.classList.remove('is-open');
        b.style.display = 'none'; // Force hide immediately
      }
    });

    // 2. Open current block
    if (!block.classList.contains('is-open')) {
      block.style.display = 'block';
      block.classList.add('is-open');
    }

    // 3. Scroll to top (only if not skipping)
    if (!skipScroll) {
      main.scrollTop = 0; // Reset scroll for cleaner jump
    }
  }

  // ── Initialization & Event Listeners ──────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {

    // 1. Wrap Content
    wrapContentBlocks();

    // 2. Mobile Nav Controls
    var navToggle = document.getElementById('nav-toggle');
    var navClose = document.getElementById('nav-close');
    var nav = document.getElementById('nav');

    function closeMobileNav() {
      nav.classList.remove('is-open');
      if (navToggle) navToggle.setAttribute('aria-label', 'Open menu');
    }

    // Desktop nav close: nav-close button also hides sidebar on desktop
    if (navClose) {
      navClose.addEventListener('click', function () {
        closeMobileNav(); // always handle mobile
        const layout = document.querySelector('.layout');
        const toggleLeftBtn = document.getElementById('toggle-left');
        if (layout && window.innerWidth > 768) {
          layout.classList.add('nav-hidden');
          if (toggleLeftBtn) toggleLeftBtn.classList.add('active-toggle');
        }
      });
    }
    if (navToggle && nav) {
      navToggle.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent immediate close
        nav.classList.toggle('is-open');
        var isOpen = nav.classList.contains('is-open');
        navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        navToggle.setAttribute('aria-expanded', isOpen);
      });
      // Close mob nav when clicking outside
      document.addEventListener('click', function (e) {
        if (nav.classList.contains('is-open') && !nav.contains(e.target) && e.target !== navToggle && !navToggle.contains(e.target))
          closeMobileNav();
      });
    }

    // 3. Desktop Focus Mode Toggle
    const layout = document.querySelector('.layout');
    const toggleLeftBtn = document.getElementById('toggle-left');

    if (toggleLeftBtn) {
      toggleLeftBtn.addEventListener('click', () => {
        layout.classList.toggle('nav-hidden');
        toggleLeftBtn.classList.toggle('active-toggle');
      });
    }

    // 4. Generate Submenus & Attach Listeners
    const navMap = {};
    document.querySelectorAll('h2[id^="section-"]').forEach(h2 => {
      const sectionId = h2.getAttribute('id');
      navMap[sectionId] = [];

      // Use the wrapping block div (if already wrapped) or fall back to
      // sibling-walk. querySelectorAll on the block finds H3s at any depth.
      const blockEl = document.getElementById('block-' + sectionId);
      const searchRoot = blockEl || h2.parentNode;
      searchRoot.querySelectorAll('h3').forEach(h3 => {
        if (!h3.id) {
          const text = h3.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          h3.id = sectionId + '-' + text;
        }
        navMap[sectionId].push({ id: h3.id, text: h3.textContent });
      });
    });

    // Loop through MAIN nav links to wrap + add listeners
    nav.querySelectorAll('a[href^="#"]').forEach(link => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const id = href.substring(1);

      // Main Link Click Handler (Accordion Behavior)
      link.addEventListener('click', function (e) {
        e.preventDefault();
        closeMobileNav();

        // handle active state styling
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('nav a').forEach(el => el.classList.remove('active'));
        if (this.parentNode.classList.contains('nav-item')) {
          this.parentNode.classList.add('active');
        }
        this.classList.add('active');

        // Open Block
        var blockId = id === 'intro' ? 'block-intro' : 'block-' + id;
        var block = document.getElementById(blockId);
        if (block) openBlock(block);
      });

      // Submenu Generation (only for #section- links)
      if (id.startsWith('section-')) {
        if (link.parentNode.classList.contains('nav-item')) return; // already processed

        const wrapper = document.createElement('div');
        wrapper.className = 'nav-item';
        link.parentNode.insertBefore(wrapper, link);
        wrapper.appendChild(link);

        if (navMap[id] && navMap[id].length > 0) {
          const subMenu = document.createElement('div');
          subMenu.className = 'nav-submenu';
          navMap[id].forEach(item => {
            const subLink = document.createElement('a');
            subLink.href = '#' + item.id;
            subLink.className = 'nav-sub-link';
            subLink.textContent = item.text;
            subLink.addEventListener('click', (e) => {
              e.preventDefault();
              closeMobileNav();
              e.stopPropagation(); // prevent bubbling to parent

              // Highlight active sub-link
              document.querySelectorAll('.nav-sub-link').forEach(el => el.classList.remove('active'));
              subLink.classList.add('active');

              // Ensure parent block is open, but DON'T scroll to top yet
              const blockId = 'block-' + id;
              const block = document.getElementById(blockId);

              if (block) {
                openBlock(block, true); // true = skip scroll to top

                // Now scroll to the specific subsection
                // Slight delay ensuring layout is stable
                setTimeout(() => {
                  const target = document.getElementById(item.id);
                  smoothScrollTo(target);
                }, 10);
              }
            });
            subMenu.appendChild(subLink);
          });
          wrapper.appendChild(subMenu);
        }
      }
    });



    // Challenge Mode Toggle
    var challengeToggle = document.getElementById('challenge-toggle');
    if (challengeToggle) {
      challengeToggle.addEventListener('change', function () {
        if (this.checked) {
          document.body.classList.add('challenge-mode-active');
        } else {
          document.body.classList.remove('challenge-mode-active');
        }
      });
    }

    // Code Highlighting
    highlightCodeBlocks();
    initSolutionToggles();
  });

  // ── Syntax Highlighter for ALL Code Blocks ───────────────────────
  function highlightCodeBlocks() {
    document.querySelectorAll('pre').forEach(function (preBlock) {
      // Check if already processed
      if (preBlock.querySelector('.copy-btn')) return;

      // Ensure relative positioning
      if (getComputedStyle(preBlock).position === 'static') {
        preBlock.style.position = 'relative';
      }

      // 1. Create Copy Button
      // 1. Create Copy Button
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      // Clean SVG Icons
      const iconCopy = '<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path></svg>';
      const iconCheck = '<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>';

      copyBtn.innerHTML = iconCopy;
      copyBtn.ariaLabel = 'Copy code to clipboard';
      copyBtn.title = 'Copy';

      copyBtn.addEventListener('click', () => {
        const codeEl = preBlock.querySelector('code');
        const codeText = codeEl ? codeEl.innerText : preBlock.innerText;

        navigator.clipboard.writeText(codeText).then(() => {
          copyBtn.innerHTML = iconCheck;
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.innerHTML = iconCopy;
            copyBtn.classList.remove('copied');
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy!', err);
        });
      });

      // Append as FIRST child to ensure it sits on top-right correctly
      if (preBlock.firstChild) {
        preBlock.insertBefore(copyBtn, preBlock.firstChild);
      } else {
        preBlock.appendChild(copyBtn);
      }

      // 2. Highlight Logic
      const codeBlock = preBlock.querySelector('code');
      if (!codeBlock) return;

      var html = codeBlock.textContent;
      // 1. Strings (light blue)
      html = html.replace(/(".*?")/g, '<span class="cs-str">$1</span>');
      // 2. Comments (grey)
      html = html.replace(/(^|\s)(#.*$)/gm, '$1<span class="cs-comment">$2</span>');
      // 3. YAML Keys (green)
      html = html.replace(/^(\s*)([\w\-\.\/]+):/gm, '$1<span class="cs-key">$2</span>:');
      // 4. Keywords
      var kws = 'apiVersion|kind|metadata|spec|status|selector|containers|volumes|template|matchLabels|strategy|replicas|serviceAccountName|nodeSelector|tolerations|resources|requests|limits|livenessProbe|readinessProbe|securityContext|capabilities|env|envFrom|volumeMounts|image|name|kubectl|k'.split('|');
      var kwRegex = new RegExp('\\b(' + kws.join('|') + ')\\b', 'g');
      html = html.replace(kwRegex, '<span class="cs-kw">$1</span>');
      // 5. Flags
      html = html.replace(/(\s)(--[\w\-]+)/g, '$1<span class="cs-flag">$2</span>');
      // 6. Section Headers
      html = html.replace(/(^# ===.*===)/gm, '<span class="cs-section">$1</span>');

      codeBlock.innerHTML = html;
    });
  }

  function initSolutionToggles() {
    document.querySelectorAll('.solution-toggle, .playground-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var solution = this.nextElementSibling;
        if (!solution) return;
        var isOpen = solution.classList.toggle('is-open');
        this.setAttribute('aria-expanded', isOpen);
        this.textContent = isOpen ? 'Hide solution' : 'Show solution';
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════
  //  ADVANCED FEATURES ENGINE
  // ══════════════════════════════════════════════════════════════════
  (function () {
    'use strict';

    // ── Storage helpers ──────────────────────────────────────────────
    const LS = {
      get: (k, def) => { try { const v = localStorage.getItem('cka_' + k); return v !== null ? JSON.parse(v) : def; } catch (e) { return def; } },
      set: (k, v) => { try { localStorage.setItem('cka_' + k, JSON.stringify(v)); } catch (e) { } }
    };

    // ── Toast ────────────────────────────────────────────────────────
    function toast(msg) {
      const t = document.createElement('div');
      t.className = 'toast';
      t.textContent = msg;
      document.getElementById('toast-container').appendChild(t);
      setTimeout(() => t.remove(), 2700);
    }

    // ── Section index ────────────────────────────────────────────────
    const SECTIONS = Array.from(document.querySelectorAll('h2[id^="section-"]')).map(h => ({
      id: h.id,
      title: h.textContent.trim()
    }));
    let currentSectionIdx = 0;

    function getCurrentBlock() {
      return document.querySelector('.content-block.is-open');
    }
    function getCurrentSectionId() {
      const b = getCurrentBlock();
      return b ? b.id.replace('block-', '') : null;
    }

    // ── Dark Mode ─────────────────────────────────────────────────────
    const dmBtn = document.getElementById('dark-mode-btn');
    const dmMoon = document.getElementById('dm-icon-moon');
    const dmSun = document.getElementById('dm-icon-sun');

    function setDarkMode(dark, save) {
      document.body.classList.toggle('dark-mode', dark);
      dmMoon.style.display = dark ? 'none' : '';
      dmSun.style.display = dark ? '' : 'none';
      if (save) { LS.set('dark', dark); toast(dark ? '🌙 Dark mode on' : '☀️ Light mode on'); }
    }
    setDarkMode(LS.get('dark', false));
    if (dmBtn) dmBtn.addEventListener('click', () => setDarkMode(!document.body.classList.contains('dark-mode'), true));

    // ── Font Size ─────────────────────────────────────────────────────
    let fontSize = LS.get('fontSize', 16);
    function applyFontSize() { document.documentElement.style.fontSize = fontSize + 'px'; LS.set('fontSize', fontSize); }
    applyFontSize();
    const fdBtn = document.getElementById('font-decrease');
    const fiBtn = document.getElementById('font-increase');
    if (fdBtn) fdBtn.addEventListener('click', () => { fontSize = Math.max(12, fontSize - 1); applyFontSize(); toast('Font: ' + fontSize + 'px'); });
    if (fiBtn) fiBtn.addEventListener('click', () => { fontSize = Math.min(22, fontSize + 1); applyFontSize(); toast('Font: ' + fontSize + 'px'); });

    // ── Reading Progress Bar ──────────────────────────────────────────
    const progressBar = document.getElementById('reading-progress');
    function updateReadingProgress() {
      const m = document.querySelector('main');
      if (!m || !progressBar) return;
      const pct = (m.scrollTop / (m.scrollHeight - m.clientHeight)) * 100;
      progressBar.style.width = Math.min(100, pct || 0) + '%';
    }
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.addEventListener('scroll', updateReadingProgress, { passive: true });

    // ── Progress Tracker ──────────────────────────────────────────────
    let completedSections = LS.get('completed', {});

    function updateProgressUI() {
      const total = SECTIONS.length;
      const done = SECTIONS.filter(s => completedSections[s.id]).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const fill = document.getElementById('progress-fill');
      const pctEl = document.getElementById('progress-pct');
      if (fill) fill.style.width = pct + '%';
      if (pctEl) pctEl.textContent = pct + '%';
      // Update footer stats
      const fs = document.getElementById('footer-stats');
      if (fs) fs.textContent = done + '/' + total + ' sections complete';
      // Update nav check indicators
      document.querySelectorAll('.nav-check').forEach(btn => {
        const sid = btn.dataset.sid;
        btn.classList.toggle('done', !!completedSections[sid]);
      });
    }

    function toggleComplete(sid) {
      completedSections[sid] = !completedSections[sid];
      LS.set('completed', completedSections);
      updateProgressUI();
      updateSectionBar(sid);
      toast(completedSections[sid] ? '✅ Section marked complete!' : '⬜ Section unmarked');
    }

    // Inject check buttons into each .nav-item wrapper after nav is set up
    // We hook into the openBlock callback by observing DOM
    function injectNavChecks() {
      document.querySelectorAll('#nav .nav-item').forEach(wrapper => {
        if (wrapper.querySelector('.nav-check')) return;
        const link = wrapper.querySelector('a[data-sid]');
        const sid = link ? link.dataset.sid : null;
        if (!sid) return;
        const btn = document.createElement('button');
        btn.className = 'nav-check';
        btn.dataset.sid = sid;
        btn.title = 'Mark complete';
        btn.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); toggleComplete(sid); });
        wrapper.style.position = 'relative';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        const a = wrapper.querySelector('a');
        if (a) a.style.paddingRight = '1.75rem';
        wrapper.appendChild(btn);
      });
      updateProgressUI();
    }

    // ── Section Action Bar ────────────────────────────────────────────
    let bookmarks = LS.get('bookmarks', {});

    function updateBookmarkUI() {
      const bmList = document.getElementById('bookmarks-list');
      const bmCount = document.getElementById('bm-count');
      const keys = Object.keys(bookmarks).filter(k => bookmarks[k]);
      if (bmCount) bmCount.textContent = keys.length;
      if (!bmList) return;
      if (keys.length === 0) {
        bmList.innerHTML = '<li class="bookmarks-empty">No bookmarks yet</li>';
        return;
      }
      bmList.innerHTML = keys.map(sid => {
        const sec = SECTIONS.find(s => s.id === sid);
        return sec ? `<li><a href="#${sid}" data-bm-sid="${sid}">${sec.title}</a></li>` : '';
      }).join('');
      bmList.querySelectorAll('a[data-bm-sid]').forEach(a => {
        a.addEventListener('click', e => {
          e.preventDefault();
          const block = document.getElementById('block-' + a.dataset.bmSid);
          if (block && window.openBlockGlobal) window.openBlockGlobal(block);
        });
      });
    }

    function updateSectionBar(sid) {
      const bar = document.getElementById('sab-' + sid);
      if (!bar) return;
      const completeBtn = bar.querySelector('.sab-complete');
      const bookmarkBtn = bar.querySelector('.sab-bookmark');
      if (completeBtn) completeBtn.classList.toggle('active', !!completedSections[sid]);
      if (bookmarkBtn) {
        bookmarkBtn.classList.toggle('active', !!bookmarks[sid]);
        bookmarkBtn.innerHTML = (bookmarks[sid] ? '🔖' : '🔖') + ' ' + (bookmarks[sid] ? 'Bookmarked' : 'Bookmark');
      }
    }

    function injectSectionBars() {
      SECTIONS.forEach(sec => {
        const block = document.getElementById('block-' + sec.id);
        if (!block || block.querySelector('.section-action-bar')) return;

        // Estimate reading time
        const words = block.textContent.trim().split(/\s+/).length;
        const minutes = Math.max(1, Math.round(words / 200));

        const bar = document.createElement('div');
        bar.className = 'section-action-bar';
        bar.id = 'sab-' + sec.id;
        bar.innerHTML = `
              <span class="sab-label">Section</span>
              <button class="sab-btn sab-complete" title="Mark as complete (C)">✅ Complete</button>
              <button class="sab-btn sab-bookmark" title="Bookmark this section (B)">🔖 Bookmark</button>
              <button class="sab-btn sab-notes" title="Open notes (N)">📝 Notes</button>
              <span class="reading-time">~${minutes} min read</span>
            `;
        bar.querySelector('.sab-complete').addEventListener('click', () => toggleComplete(sec.id));
        bar.querySelector('.sab-bookmark').addEventListener('click', () => toggleBookmark(sec.id));
        bar.querySelector('.sab-notes').addEventListener('click', () => openNotes(sec.id, sec.title));

        // Insert after the h2
        const h2 = block.querySelector('h2');
        if (h2 && h2.nextSibling) {
          h2.parentNode.insertBefore(bar, h2.nextSibling);
        } else {
          block.prepend(bar);
        }
        updateSectionBar(sec.id);
      });
    }

    function toggleBookmark(sid) {
      bookmarks[sid] = !bookmarks[sid];
      LS.set('bookmarks', bookmarks);
      updateBookmarkUI();
      updateSectionBar(sid);
      toast(bookmarks[sid] ? '🔖 Section bookmarked!' : '🔖 Bookmark removed');
    }

    // ── Notes Panel ───────────────────────────────────────────────────
    const notesPanel = document.getElementById('notes-panel');
    const notesTextarea = document.getElementById('notes-textarea');
    const notesSecName = document.getElementById('notes-section-name');
    const notesCharCount = document.getElementById('notes-char-count');
    const notesSaveBtn = document.getElementById('notes-save-btn');
    const notesCloseBtn = document.getElementById('notes-close');
    const notesOpenBtn = document.getElementById('notes-btn');

    let currentNotesSid = null;

    function openNotes(sid, title) {
      currentNotesSid = sid;
      if (notesSecName) notesSecName.textContent = title || sid;
      const saved = LS.get('note_' + sid, '');
      if (notesTextarea) { notesTextarea.value = saved; updateNotesCount(); }
      if (notesPanel) notesPanel.classList.add('open');
      if (notesTextarea) notesTextarea.focus();
      updateNotesDots();
    }

    function closeNotes() { if (notesPanel) notesPanel.classList.remove('open'); }

    function saveNotes() {
      if (!currentNotesSid || !notesTextarea) return;
      LS.set('note_' + currentNotesSid, notesTextarea.value);
      toast('📝 Notes saved!');
      updateNotesDots();
    }

    function updateNotesCount() {
      if (notesTextarea && notesCharCount) notesCharCount.textContent = notesTextarea.value.length + ' characters';
    }

    function updateNotesDots() {
      document.querySelectorAll('#nav .nav-note-dot').forEach(d => d.remove());
      document.querySelectorAll('#nav a[data-sid]').forEach(a => {
        const hasNote = LS.get('note_' + a.dataset.sid, '').length > 0;
        if (hasNote && !a.querySelector('.nav-note-dot')) {
          const dot = document.createElement('span');
          dot.className = 'nav-note-dot';
          dot.title = 'Has notes';
          a.appendChild(dot);
        }
      });
    }

    if (notesCloseBtn) notesCloseBtn.addEventListener('click', () => { saveNotes(); closeNotes(); });
    if (notesSaveBtn) notesSaveBtn.addEventListener('click', saveNotes);
    if (notesTextarea) notesTextarea.addEventListener('input', updateNotesCount);
    if (notesOpenBtn) notesOpenBtn.addEventListener('click', () => {
      const sid = getCurrentSectionId();
      if (sid) {
        const sec = SECTIONS.find(s => s.id === sid);
        openNotes(sid, sec ? sec.title : sid);
      } else {
        openNotes('general', 'General Notes');
      }
    });

    // ── Search ────────────────────────────────────────────────────────
    const searchOverlay = document.getElementById('search-overlay');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchBtn = document.getElementById('search-btn');

    // Build search index
    let searchIndex = [];
    function buildSearchIndex() {
      searchIndex = [];
      SECTIONS.forEach(sec => {
        const block = document.getElementById('block-' + sec.id);
        if (!block) return;
        // Index h3s
        block.querySelectorAll('h3').forEach(h3 => {
          searchIndex.push({ type: 'heading', sid: sec.id, sTitle: sec.title, title: h3.textContent.trim(), text: '', id: h3.id });
        });
        // Index paragraphs
        block.querySelectorAll('p, li').forEach(el => {
          const txt = el.textContent.trim();
          if (txt.length > 20) searchIndex.push({ type: 'text', sid: sec.id, sTitle: sec.title, title: sec.title, text: txt });
        });
        // Index code snippets
        block.querySelectorAll('pre code').forEach(el => {
          const txt = el.textContent.trim().slice(0, 200);
          searchIndex.push({ type: 'code', sid: sec.id, sTitle: sec.title, title: sec.title + ' — code', text: txt });
        });
      });
    }

    let searchSelIdx = -1;

    function highlight(str, query) {
      if (!query) return str;
      const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      return str.replace(re, m => '<mark>' + m + '</mark>');
    }

    function doSearch(q) {
      if (!q || q.length < 2) {
        searchResults.innerHTML = '<div id="search-empty">Type to search across all sections…</div>';
        searchSelIdx = -1;
        return;
      }
      const ql = q.toLowerCase();
      const hits = searchIndex.filter(item =>
        item.title.toLowerCase().includes(ql) || item.text.toLowerCase().includes(ql)
      ).slice(0, 20);

      if (hits.length === 0) {
        searchResults.innerHTML = '<div id="search-empty">No results for "' + q + '"</div>';
        searchSelIdx = -1;
        return;
      }

      searchResults.innerHTML = hits.map((h, i) => {
        const snippetRaw = h.text.slice(0, 120) + (h.text.length > 120 ? '…' : '');
        const titleH = highlight(h.title, q);
        const snipH = highlight(snippetRaw, q);
        const icon = h.type === 'code' ? '💻' : h.type === 'heading' ? '📌' : '📄';
        return `<div class="search-result-item" data-idx="${i}" data-sid="${h.sid}" data-id="${h.id || ''}">
              <div class="res-title">${icon} ${titleH} <small style="font-weight:400;color:var(--text-muted)">— ${h.sTitle}</small></div>
              ${snipH ? '<div class="res-snippet">' + snipH + '</div>' : ''}
            </div>`;
      }).join('');

      searchSelIdx = -1;
      searchResults.querySelectorAll('.search-result-item').forEach((el, i) => {
        el.addEventListener('mouseenter', () => { searchSelIdx = i; highlightSearchSel(); });
        el.addEventListener('click', () => openSearchResult(hits[i]));
      });
    }

    function highlightSearchSel() {
      searchResults.querySelectorAll('.search-result-item').forEach((el, i) => {
        el.classList.toggle('is-selected', i === searchSelIdx);
      });
    }

    function openSearchResult(hit) {
      closeSearch();
      const block = document.getElementById('block-' + hit.sid);
      if (block && window.openBlockGlobal) window.openBlockGlobal(block);
      if (hit.id) {
        // Delay to allow block switch + layout reflow when landing in a different section
        setTimeout(() => {
          const target = document.getElementById(hit.id);
          if (target && mainEl) {
            const offset = 50;
            const mainRect = mainEl.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const targetOffsetInContent = targetRect.top - mainRect.top + mainEl.scrollTop;
            const y = Math.max(0, targetOffsetInContent - offset);
            mainEl.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 150);
      }
    }

    function openSearch() {
      buildSearchIndex();
      searchOverlay.classList.add('open');
      if (searchInput) { searchInput.value = ''; searchInput.focus(); }
      searchResults.innerHTML = '<div id="search-empty">Type to search across all sections…</div>';
    }

    function closeSearch() { searchOverlay.classList.remove('open'); }

    if (searchBtn) searchBtn.addEventListener('click', openSearch);
    if (searchOverlay) searchOverlay.addEventListener('click', e => { if (e.target === searchOverlay) closeSearch(); });
    if (searchInput) {
      searchInput.addEventListener('input', () => doSearch(searchInput.value));
      searchInput.addEventListener('keydown', e => {
        const items = searchResults.querySelectorAll('.search-result-item');
        if (e.key === 'ArrowDown') { e.preventDefault(); searchSelIdx = Math.min(searchSelIdx + 1, items.length - 1); highlightSearchSel(); items[searchSelIdx]?.scrollIntoView({ block: 'nearest' }); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); searchSelIdx = Math.max(searchSelIdx - 1, 0); highlightSearchSel(); items[searchSelIdx]?.scrollIntoView({ block: 'nearest' }); }
        else if (e.key === 'Enter' && searchSelIdx >= 0) { e.preventDefault(); items[searchSelIdx]?.click(); }
        else if (e.key === 'Escape') closeSearch();
      });
    }

    // ── Shortcuts Panel ───────────────────────────────────────────────
    const shortcutsOverlay = document.getElementById('shortcuts-overlay');
    const shortcutsBtn = document.getElementById('shortcuts-btn');
    function openShortcuts() { shortcutsOverlay.classList.add('open'); }
    function closeShortcuts() { shortcutsOverlay.classList.remove('open'); }
    if (shortcutsBtn) shortcutsBtn.addEventListener('click', openShortcuts);
    if (shortcutsOverlay) shortcutsOverlay.addEventListener('click', e => { if (e.target === shortcutsOverlay) closeShortcuts(); });

    // ── Pomodoro Timer ────────────────────────────────────────────────
    const pomoHeaderBtn = document.getElementById('pomo-header-btn');
    const pomoWidget = document.getElementById('pomodoro-widget');
    const pomoTime = document.getElementById('pomo-time');
    const pomoLabel = document.getElementById('pomo-label');
    const pomoStartBtn = document.getElementById('pomo-start');
    const pomoResetBtn = document.getElementById('pomo-reset');
    const pomoCircle = document.getElementById('pomo-progress-circle');
    const pomoSessCount = document.getElementById('pomo-session-count');
    const pomoHeaderTick = document.getElementById('pomo-header-tick');

    const POMO_WORK = 25 * 60;
    const POMO_BREAK = 5 * 60;
    let pomoRunning = false;
    let pomoInterval = null;
    let pomoSecondsLeft = POMO_WORK;
    let pomoIsBreak = false;
    let pomoSessions = LS.get('pomoSessions', 0);
    const CIRCUMFERENCE = 213.6; // 2 * PI * 34

    if (pomoSessCount) pomoSessCount.textContent = pomoSessions;

    function pomoUpdateUI() {
      const total = pomoIsBreak ? POMO_BREAK : POMO_WORK;
      const m = Math.floor(pomoSecondsLeft / 60);
      const s = pomoSecondsLeft % 60;
      if (pomoTime) pomoTime.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      if (pomoCircle) {
        const offset = CIRCUMFERENCE * (1 - pomoSecondsLeft / total);
        pomoCircle.style.strokeDashoffset = offset;
      }
      if (pomoLabel) pomoLabel.textContent = pomoIsBreak ? '☕ Break Time' : '🎯 Focus Session';
      if (pomoTime) pomoTime.className = pomoIsBreak ? 'pomo-break' : '';
      // Sync mini tick badge on header button
      if (pomoHeaderTick) pomoHeaderTick.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      if (pomoHeaderBtn) pomoHeaderBtn.classList.toggle('running', pomoRunning);
    }

    function pomoStart() {
      if (pomoRunning) {
        clearInterval(pomoInterval);
        pomoRunning = false;
        if (pomoStartBtn) pomoStartBtn.textContent = 'Resume';
      } else {
        pomoRunning = true;
        if (pomoStartBtn) pomoStartBtn.textContent = 'Pause';
        pomoInterval = setInterval(() => {
          pomoSecondsLeft--;
          pomoUpdateUI();
          if (pomoSecondsLeft <= 0) {
            clearInterval(pomoInterval);
            pomoRunning = false;
            if (!pomoIsBreak) {
              pomoSessions++;
              LS.set('pomoSessions', pomoSessions);
              if (pomoSessCount) pomoSessCount.textContent = pomoSessions;
              toast('🎉 Pomodoro complete! Take a break.');
            } else {
              toast('⚡ Break over! Back to work.');
            }
            pomoIsBreak = !pomoIsBreak;
            pomoSecondsLeft = pomoIsBreak ? POMO_BREAK : POMO_WORK;
            if (pomoStartBtn) pomoStartBtn.textContent = 'Start';
            pomoUpdateUI();
          }
        }, 1000);
      }
    }

    function pomoReset() {
      clearInterval(pomoInterval);
      pomoRunning = false;
      pomoSecondsLeft = POMO_WORK;
      pomoIsBreak = false;
      if (pomoStartBtn) pomoStartBtn.textContent = 'Start';
      pomoUpdateUI();
    }

    pomoUpdateUI();
    if (pomoHeaderBtn) pomoHeaderBtn.addEventListener('click', e => {
      e.stopPropagation();
      pomoWidget.classList.toggle('open');
    });
    if (pomoStartBtn) pomoStartBtn.addEventListener('click', pomoStart);
    if (pomoResetBtn) pomoResetBtn.addEventListener('click', pomoReset);
    // Close widget when clicking outside
    document.addEventListener('click', e => {
      if (pomoWidget && pomoWidget.classList.contains('open')) {
        if (!pomoWidget.contains(e.target) && e.target !== pomoHeaderBtn && !pomoHeaderBtn?.contains(e.target)) {
          pomoWidget.classList.remove('open');
        }
      }
    });

    // ── Global Keyboard Shortcuts ────────────────────────────────────
    document.addEventListener('keydown', function (e) {
      const tag = document.activeElement.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable;

      // Ctrl+K / Cmd+K — Search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchOverlay.classList.contains('open')) closeSearch(); else openSearch();
        return;
      }

      if (inInput) return; // Don't fire other shortcuts in inputs

      // ESC — close any open panel
      if (e.key === 'Escape') {
        if (shortcutsOverlay.classList.contains('open')) { closeShortcuts(); return; }
        if (searchOverlay.classList.contains('open')) { closeSearch(); return; }
        if (notesPanel.classList.contains('open')) { saveNotes(); closeNotes(); return; }
        if (pomoWidget.classList.contains('open')) { pomoWidget.classList.remove('open'); return; }
      }

      // ? — shortcuts
      if (e.key === '?') { openShortcuts(); return; }

      // D — dark mode
      if (e.key === 'd' || e.key === 'D') { setDarkMode(!document.body.classList.contains('dark-mode'), true); return; }

      // N — notes
      if (e.key === 'n' || e.key === 'N') {
        const sid = getCurrentSectionId();
        if (sid) { const sec = SECTIONS.find(s => s.id === sid); openNotes(sid, sec ? sec.title : sid); }
        return;
      }

      // T — pomodoro
      if (e.key === 't' || e.key === 'T') { if (pomoWidget) pomoWidget.classList.toggle('open'); return; }

      // Arrow Right — next section
      if (e.key === 'ArrowRight') {
        const sids = SECTIONS.map(s => s.id);
        const cur = getCurrentSectionId();
        const idx = sids.indexOf(cur);
        if (idx < sids.length - 1) {
          const next = document.getElementById('block-' + sids[idx + 1]);
          if (next && window.openBlockGlobal) window.openBlockGlobal(next);
        }
        return;
      }

      // Arrow Left — prev section
      if (e.key === 'ArrowLeft') {
        const sids = SECTIONS.map(s => s.id);
        const cur = getCurrentSectionId();
        const idx = sids.indexOf(cur);
        if (idx > 0) {
          const prev = document.getElementById('block-' + sids[idx - 1]);
          if (prev && window.openBlockGlobal) window.openBlockGlobal(prev);
        }
        return;
      }

      // C — toggle complete
      if (e.key === 'c' || e.key === 'C') {
        const sid = getCurrentSectionId();
        if (sid) toggleComplete(sid);
        return;
      }

      // B — bookmark
      if (e.key === 'b' || e.key === 'B') {
        const sid = getCurrentSectionId();
        if (sid) toggleBookmark(sid);
        return;
      }

      // + / = — increase font
      if (e.key === '+' || e.key === '=') { fontSize = Math.min(22, fontSize + 1); applyFontSize(); toast('Font: ' + fontSize + 'px'); return; }

      // - — decrease font
      if (e.key === '-') { fontSize = Math.max(12, fontSize - 1); applyFontSize(); toast('Font: ' + fontSize + 'px'); return; }
    });

    // ── Hook into openBlock to update active section ──────────────────
    // We expose openBlock globally so our advanced JS can call it too
    // We wrap the DOMContentLoaded hook via a post-init observer
    const openBlockObserver = new MutationObserver(() => {
      const open = document.querySelector('.content-block.is-open');
      if (!open) return;
      // Update nav active highlight
      const sid = open.id.replace('block-', '');
      document.querySelectorAll('#nav a[data-sid]').forEach(a => {
        a.classList.toggle('active', a.dataset.sid === sid);
      });
    });
    openBlockObserver.observe(document.querySelector('main') || document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });

    // Expose openBlock for bookmarks/search navigation
    // The main IIFE sets openBlock; we re-expose it
    setTimeout(() => {
      // Find openBlock from main IIFE scope via event delegation
      window.openBlockGlobal = function (block) {
        // Trigger a click on the corresponding nav link
        if (!block) return;
        const sid = block.id.replace('block-', '');
        const navLink = document.querySelector('#nav a[href="#' + sid + '"]') || document.querySelector('#nav a[data-sid="' + sid + '"]');
        if (navLink) navLink.click();
      };
      // Init after main IIFE completes
      injectNavChecks();
      injectSectionBars();
      updateBookmarkUI();
      updateNotesDots();
      updateProgressUI();
    }, 100);


    // ── 6 ADVANCED FEATURES ──────────────────────────────────────────

    // ② Copy Code Buttons (Handled in highlightCodeBlocks)

    // ③ Zen / Focus Mode ─────────────────────────────────────────────
    const zenBtn = document.getElementById('zen-btn');
    function toggleZen() {
      document.body.classList.toggle('zen-mode');
      if (zenBtn) zenBtn.classList.toggle('active', document.body.classList.contains('zen-mode'));
      toast(document.body.classList.contains('zen-mode') ? '🧘 Zen mode — hover top to show header' : '👁 Zen mode off');
    }
    if (zenBtn) zenBtn.addEventListener('click', toggleZen);

    // ④ Export Notes ─────────────────────────────────────────────────
    const notesExportBtn = document.getElementById('notes-export-btn');
    if (notesExportBtn) {
      notesExportBtn.addEventListener('click', () => {
        const allNotes = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('cka-notes-')) {
            const sectionId = key.replace('cka-notes-', '');
            const text = localStorage.getItem(key);
            if (text && text.trim()) {
              const heading = document.getElementById(sectionId);
              const title = heading ? heading.textContent.trim() : sectionId;
              allNotes.push('## ' + title + '\n\n' + text.trim());
            }
          }
        }
        if (!allNotes.length) { toast('📝 No notes saved yet!'); return; }
        const md = '# CKA Study Notes\n_Exported: ' + new Date().toLocaleString() + '_\n\n' + allNotes.join('\n\n---\n\n');
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'cka-study-notes.md'; a.click();
        URL.revokeObjectURL(url);
        toast('📥 Notes exported as cka-study-notes.md');
      });
    }



    // ── Extended Keyboard Shortcuts ──────────────────────────────────
    // Add Z (Zen) and Q (Quiz) to the existing keydown handler
    // We patch by adding a second listener
    document.addEventListener('keydown', function (e) {
      const tag = document.activeElement.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable;
      if (inInput) return;
      if (e.key === 'z' || e.key === 'Z') toggleZen();
      if (e.key === 'q' || e.key === 'Q') toggleQuiz();
    });

    // ── CKA Quiz ────────────────────────────────────────────────────
    const QUIZ_QUESTIONS = [
      {
        q: "Which kubectl command marks a node as unschedulable WITHOUT evicting existing pods?",
        opts: ["kubectl drain node01", "kubectl cordon node01", "kubectl taint nodes node01 key:NoSchedule", "kubectl delete node node01"],
        ans: 1, exp: "kubectl cordon only marks the node SchedulingDisabled. kubectl drain also evicts running pods."
      },
      {
        q: "A pod spec has a toleration with operator: Exists and no value. What does this match?",
        opts: ["Taints with value='Exists'", "Only NoSchedule taints", "Any taint with the matching key, regardless of value", "Only taints on the master node"],
        ans: 2, exp: "operator: Exists matches any taint that has the specified key, ignoring the value."
      },
      {
        q: "What happens to a container that exceeds its memory limit?",
        opts: ["It is throttled", "It is OOMKilled and restarted", "The node is cordoned", "Nothing — limits are advisory"],
        ans: 1, exp: "Memory limits are hard. Exceeding them causes an OOM kill (exit code 137). CPU is throttled, not killed."
      },
      {
        q: "Which object sets default resource requests and limits for all containers in a namespace?",
        opts: ["ResourceQuota", "LimitRange", "NetworkPolicy", "PodSecurityPolicy"],
        ans: 1, exp: "LimitRange sets per-container defaults and min/max bounds. ResourceQuota limits total resource consumption for the namespace."
      },
      {
        q: "Static pods are managed by:",
        opts: ["kube-controller-manager", "kube-apiserver", "kubelet directly on the node", "etcd"],
        ans: 2, exp: "kubelet reads YAML files from staticPodPath (/etc/kubernetes/manifests) and manages those pods directly, without the API server."
      },
      {
        q: "You need a pod to land ONLY on nodes labelled gpu=true. Taints alone are not sufficient because:",
        opts: ["Taints don't work with GPUs", "Tolerations only prevent scheduling — they don't guarantee placement on specific nodes", "Taints require a LimitRange", "kubectl taint requires admin privileges"],
        ans: 1, exp: "Taints repel pods that lack tolerations. But a pod with a toleration could still land on a non-GPU node. You must also use Node Affinity to attract pods to gpu=true nodes."
      },
      {
        q: "Which DaemonSet toleration allows the daemon to also run on control-plane (master) nodes?",
        opts: ["effect: NoExecute", "key: node.kubernetes.io/disk-pressure", "key: node-role.kubernetes.io/control-plane, effect: NoSchedule, operator: Exists", "effect: PreferNoSchedule"],
        ans: 2, exp: "Master nodes automatically have node-role.kubernetes.io/control-plane:NoSchedule. A DaemonSet needs this toleration to schedule pods there."
      },
      {
        q: "What is the correct way to remove the taint 'app=blue:NoSchedule' from a node?",
        opts: ["kubectl taint nodes node01 app=blue:NoSchedule --remove", "kubectl untaint nodes node01 app=blue", "kubectl taint nodes node01 app=blue:NoSchedule-", "kubectl patch node (avoid JSON in string)"],

        ans: 2, exp: "Append a minus (-) to the taint specification to remove it: kubectl taint nodes node01 app=blue:NoSchedule-"
      },
      {
        q: "In Node Affinity, requiredDuringSchedulingIgnoredDuringExecution means:",
        opts: ["The pod restarts if the node label changes", "Existing pods are evicted when node labels no longer match", "The rule is hard at scheduling time; already-running pods are NOT evicted if labels change later", "The affinity is applied to init containers only"],
        ans: 2, exp: "IgnoredDuringExecution means the rule is only evaluated at scheduling time. Running pods are not affected by label changes."
      },
      {
        q: "A PriorityClass with preemptionPolicy: Never will:",
        opts: ["Never schedule the pod", "Schedule the pod with high priority but NOT preempt lower-priority pods", "Evict lower pods but without a grace period", "Only work on nodes with GPUs"],
        ans: 1, exp: "preemptionPolicy: Never means the pod gets a high priority value for ordering but will not preempt (evict) running lower-priority pods when the cluster is full."
      },
      {
        q: "kubectl drain fails on a node that has a pod using emptyDir. Which flag resolves this?",
        opts: ["--force", "--ignore-daemonsets", "--delete-emptydir-data", "--skip-volumes"],
        ans: 2, exp: "--delete-emptydir-data allows drain to proceed by evicting pods that use emptyDir volumes (data will be lost)."
      },
      {
        q: "You want a pod to prefer nodes with disktype=ssd but still schedule elsewhere if unavailable. Which affinity type is correct?",
        opts: ["requiredDuringSchedulingIgnoredDuringExecution", "requiredDuringSchedulingRequiredDuringExecution", "preferredDuringSchedulingIgnoredDuringExecution", "preferredDuringSchedulingRequiredDuringExecution"],
        ans: 2, exp: "preferred...IgnoredDuringExecution is the soft rule. The scheduler tries to match but places the pod elsewhere if no matching node is available."
      },
      {
        q: "Which component on a node actually starts pod containers after the scheduler assigns nodeName?",
        opts: ["kube-proxy", "kube-scheduler", "kubelet", "container-runtime only (no orchestration)"],
        ans: 2, exp: "The kubelet on each node watches for pods assigned to its node via nodeName, then instructs the container runtime (containerd/docker) to pull images and start containers."
      },
      {
        q: "Scheduler Profiles (KubeSchedulerConfiguration) allow you to:",
        opts: ["Run multiple separate scheduler binaries", "Run multiple scheduler personalities inside one binary with per-profile plugin configs", "Scale the scheduler horizontally", "Configure etcd for the scheduler"],
        ans: 1, exp: "Since K8s 1.18, multiple profiles with different plugin configurations can run in a single scheduler binary, identified by different schedulerName values."
      },
      {
        q: "The nodeSelector in a pod spec only supports which type of matching?",
        opts: ["Regex matching", "Greater-than / less-than", "Equality-based labels only", "Weight-based scoring"],
        ans: 2, exp: "nodeSelector supports only exact equality matches (key=value). For In, NotIn, Exists, DoesNotExist operators or soft preferences, use Node Affinity instead."
      },
    ];

    const quizOverlay = document.getElementById('quiz-overlay');
    const quizClose = document.getElementById('quiz-close');
    const quizQuestion = document.getElementById('quiz-question');
    const quizOptions = document.getElementById('quiz-options');
    const quizExp = document.getElementById('quiz-explanation');
    const quizNext = document.getElementById('quiz-next');
    const quizScore = document.getElementById('quiz-score');
    const quizProgressFill = document.getElementById('quiz-progress-fill');
    const quizResults = document.getElementById('quiz-results');
    const quizFinalScore = document.getElementById('quiz-final-score');
    const quizResultMsg = document.getElementById('quiz-result-msg');
    const quizRestart = document.getElementById('quiz-restart');
    const quizBtn = document.getElementById('quiz-btn');

    let quizIdx = 0, quizCorrect = 0, shuffled = [];

    function shuffleArr(arr) { return [...arr].sort(() => Math.random() - 0.5); }

    function startQuiz() {
      shuffled = shuffleArr(QUIZ_QUESTIONS);
      quizIdx = 0; quizCorrect = 0;
      if (quizResults) quizResults.style.display = 'none';
      if (quizQuestion) quizQuestion.style.display = '';
      if (quizOptions) quizOptions.style.display = '';
      if (quizNav) quizNav.style.display = '';
      showQuestion();
    }

    const quizNav = document.getElementById('quiz-nav');

    function showQuestion() {
      const q = shuffled[quizIdx];
      if (quizProgressFill) quizProgressFill.style.width = ((quizIdx / shuffled.length) * 100) + '%';
      if (quizScore) quizScore.textContent = 'Question ' + (quizIdx + 1) + ' of ' + shuffled.length;
      if (quizQuestion) quizQuestion.textContent = q.q;
      if (quizExp) { quizExp.classList.remove('show'); quizExp.textContent = ''; }
      if (quizNext) quizNext.style.display = 'none';
      if (quizOptions) {
        quizOptions.innerHTML = '';
        q.opts.forEach((opt, i) => {
          const btn = document.createElement('button');
          btn.className = 'quiz-option';
          btn.textContent = opt;
          btn.addEventListener('click', () => answerQuiz(i, q.ans, q.exp));
          quizOptions.appendChild(btn);
        });
      }
    }

    function answerQuiz(chosen, correct, exp) {
      const btns = quizOptions ? quizOptions.querySelectorAll('.quiz-option') : [];
      btns.forEach((b, i) => {
        b.disabled = true;
        if (i === correct) b.classList.add('correct');
        else if (i === chosen) b.classList.add('wrong');
      });
      if (chosen === correct) quizCorrect++;
      if (quizExp) { quizExp.textContent = '💡 ' + exp; quizExp.classList.add('show'); }
      if (quizNext) quizNext.style.display = 'block';
    }

    if (quizNext) quizNext.addEventListener('click', () => {
      quizIdx++;
      if (quizIdx >= shuffled.length) {
        showQuizResults();
      } else {
        showQuestion();
      }
    });

    function showQuizResults() {
      if (quizProgressFill) quizProgressFill.style.width = '100%';
      if (quizQuestion) quizQuestion.style.display = 'none';
      if (quizOptions) quizOptions.style.display = 'none';
      if (quizExp) quizExp.classList.remove('show');
      if (quizNav) quizNav.style.display = 'none';
      if (quizResults) quizResults.style.display = 'block';
      const pct = Math.round((quizCorrect / shuffled.length) * 100);
      if (quizFinalScore) quizFinalScore.textContent = pct + '%';
      let msg = pct >= 90 ? '🎉 Excellent! You\'re ready for the CKA exam!' :
        pct >= 70 ? '👍 Good job! Review the topics you missed.' :
          pct >= 50 ? '📚 Keep studying — focus on Scheduling concepts.' :
            '💪 Keep going! Practice makes perfect.';
      if (quizResultMsg) quizResultMsg.textContent = msg + ' (' + quizCorrect + '/' + shuffled.length + ' correct)';
    }

    function toggleQuiz() {
      if (!quizOverlay) return;
      if (quizOverlay.classList.contains('open')) {
        quizOverlay.classList.remove('open');
      } else {
        quizOverlay.classList.add('open');
        startQuiz();
      }
    }

    if (quizBtn) quizBtn.addEventListener('click', toggleQuiz);
    if (quizClose) quizClose.addEventListener('click', () => quizOverlay && quizOverlay.classList.remove('open'));
    if (quizOverlay) quizOverlay.addEventListener('click', e => { if (e.target === quizOverlay) quizOverlay.classList.remove('open'); });
    if (quizRestart) quizRestart.addEventListener('click', startQuiz);


  })(); // End advanced features

  // Diagram zoom lightbox
  (function () {
    var overlay = document.getElementById('diagram-zoom-overlay');
    var zoomImg = document.getElementById('diagram-zoom-img');
    var zoomContainer = overlay && overlay.querySelector('.zoom-container');
    var zoomIn = document.getElementById('diagram-zoom-in');
    var zoomOut = document.getElementById('diagram-zoom-out');
    var zoomReset = document.getElementById('diagram-zoom-reset');
    var zoomClose = document.getElementById('diagram-zoom-close');

    var scale = 1;
    var translateX = 0;
    var translateY = 0;
    var isDragging = false;
    var startX, startY, startTx, startTy;

    function openZoom(src, alt) {
      if (!overlay || !zoomImg) return;
      zoomImg.src = src;
      zoomImg.alt = alt || 'Diagram';
      scale = 1;
      translateX = 0;
      translateY = 0;
      applyTransform();
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeZoom() {
      if (!overlay) return;
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    function applyTransform() {
      if (!zoomImg) return;
      zoomImg.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scale + ')';
    }

    function zoom(by) {
      var newScale = Math.max(0.25, Math.min(5, scale + by));
      scale = newScale;
      applyTransform();
    }

    main && main.querySelectorAll('.diagram img').forEach(function (img) {
      if (!img.title) img.title = 'Click to zoom';
      img.addEventListener('click', function (e) {
        e.preventDefault();
        var src = img.getAttribute('src') || img.src;
        if (src) openZoom(src, img.getAttribute('alt') || '');
      });
    });

    if (zoomIn) zoomIn.addEventListener('click', function (e) { e.stopPropagation(); zoom(0.25); });
    if (zoomOut) zoomOut.addEventListener('click', function (e) { e.stopPropagation(); zoom(-0.25); });
    if (zoomReset) zoomReset.addEventListener('click', function (e) {
      e.stopPropagation();
      scale = 1;
      translateX = 0;
      translateY = 0;
      applyTransform();
    });
    if (zoomClose) zoomClose.addEventListener('click', function (e) { e.stopPropagation(); closeZoom(); });

    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeZoom();
      });
      overlay.addEventListener('wheel', function (e) {
        e.preventDefault();
        zoom(e.deltaY > 0 ? -0.15 : 0.15);
      }, { passive: false });
    }

    if (zoomContainer && zoomImg) {
      zoomContainer.addEventListener('mousedown', function (e) {
        if (e.target === zoomContainer || e.target === zoomImg) {
          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;
          startTx = translateX;
          startTy = translateY;
        }
      });
      document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        translateX = startTx + (e.clientX - startX);
        translateY = startTy + (e.clientY - startY);
        applyTransform();
      });
      document.addEventListener('mouseup', function () { isDragging = false; });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) closeZoom();
    });
  })();

})();
(function () {
  // Safety script to force header visibility
  try {
    const h = document.querySelector('.site-header');
    if (h) {
      h.style.opacity = '1';
      h.style.visibility = 'visible';
      h.style.transform = 'none';
      h.style.zIndex = '2147483647'; // Max integer value
      document.body.classList.remove('zen-mode');
    }
  } catch (e) { console.error('Error forcing header visibility:', e); }
})();
