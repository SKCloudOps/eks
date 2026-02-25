/**
 * AWS Study Guide — Revamped app logic
 * - Hash-based section navigation
 * - Loads generated_content.json into section grids
 * - Modal for card images, Expand/Collapse for card text
 */

(function () {
    'use strict';

    const SECTION_IDS = [
        'compute', 'networking', 'storage', 'database',
        'serverless', 'analytics', 'security', 'devops', 'cost'
    ];
    const DEFAULT_SECTION = 'compute';

    const main = document.getElementById('main');
    const nav = document.getElementById('nav');
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const modalCaption = document.getElementById('modal-caption');
    const modalClose = modal?.querySelector('.modal-close');
    const modalBackdrop = modal?.querySelector('.modal-backdrop');

    let contentData = null;

    // -------------------------------------------------------------------------
    // Content
    // -------------------------------------------------------------------------

    async function loadContent() {
        try {
            const res = await fetch('generated_content.json');
            if (!res.ok) throw new Error(res.statusText);
            contentData = await res.json();
            populateGrids();
        } catch (err) {
            console.error('AWS Guide: failed to load content', err);
        }
    }

    function populateGrids() {
        if (!contentData || typeof contentData !== 'object') return;
        for (const [section, items] of Object.entries(contentData)) {
            const grid = document.querySelector(`.resource-grid[data-section="${section}"]`);
            if (grid && Array.isArray(items)) grid.innerHTML = items.join('');
        }
        document.querySelectorAll('.expand-btn').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
        const hash = window.location.hash.slice(1) || DEFAULT_SECTION;
        showSection(SECTION_IDS.includes(hash) ? hash : DEFAULT_SECTION, false);
    }

    // -------------------------------------------------------------------------
    // Section navigation
    // -------------------------------------------------------------------------

    function showSection(sectionId, updateHash = true) {
        SECTION_IDS.forEach(id => {
            const block = document.getElementById(`block-${id}`);
            const link = nav?.querySelector(`.nav-link[data-section="${id}"]`);
            if (block) {
                const visible = id === sectionId;
                block.classList.toggle('is-visible', visible);
                block.hidden = !visible;
                if (link) link.classList.toggle('active', visible);
            }
        });
        if (updateHash) {
            const url = `${window.location.pathname}#${sectionId}`;
            if (window.location.hash !== `#${sectionId}`) {
                window.history.replaceState(null, '', url);
            }
        }
        if (main && sectionId) main.scrollTop = 0;
    }

    function initNavigation() {
        if (!nav) return;
        nav.addEventListener('click', e => {
            const link = e.target.closest('.nav-link[data-section]');
            if (!link) return;
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            if (sectionId) {
                showSection(sectionId);
                if (window.innerWidth <= 768) {
                    main?.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });

        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1);
            if (SECTION_IDS.includes(hash)) showSection(hash, false);
        });

        window.addEventListener('load', () => {
            const hash = window.location.hash.slice(1);
            if (SECTION_IDS.includes(hash)) showSection(hash, false);
        });
    }

    // -------------------------------------------------------------------------
    // Modal (card image zoom)
    // -------------------------------------------------------------------------

    function openModal(src, title) {
        if (!modal || !modalImg) return;
        modalImg.src = src;
        modalImg.alt = title || 'Image';
        modalCaption.textContent = title || '';
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        modalClose?.focus();
    }

    function closeModal() {
        if (!modal) return;
        modal.hidden = true;
        document.body.style.overflow = '';
    }

    function initModal() {
        if (!modal) return;
        const doClose = () => closeModal();
        modalClose?.addEventListener('click', doClose);
        modalBackdrop?.addEventListener('click', doClose);
        modal?.addEventListener('keydown', e => {
            if (e.key === 'Escape') doClose();
        });
        window.openModal = openModal;
    }

    // -------------------------------------------------------------------------
    // Card expand/collapse (Read more / Read less)
    // -------------------------------------------------------------------------

    function toggleResource(btn) {
        const card = btn.closest('.resource-card');
        // Generated HTML order: h3, p.short-text, div.full-text, button
        const fullEl = btn.previousElementSibling;
        const shortEl = fullEl?.previousElementSibling;
        if (!fullEl) return;

        const isExpanded = fullEl.style.display === 'block';
        if (isExpanded) {
            fullEl.style.display = 'none';
            btn.textContent = 'Read More';
            if (shortEl) shortEl.style.display = 'block';
            card?.classList.remove('is-expanded');
            btn.setAttribute('aria-expanded', 'false');
        } else {
            fullEl.style.display = 'block';
            btn.textContent = 'Read Less';
            if (shortEl) shortEl.style.display = 'none';
            card?.classList.add('is-expanded');
            btn.setAttribute('aria-expanded', 'true');
        }
    }

    function initCards() {
        main?.addEventListener('click', e => {
            if (e.target.classList.contains('expand-btn')) {
                e.preventDefault();
                toggleResource(e.target);
            }
        });
        window.toggleResource = toggleResource;
    }

    // -------------------------------------------------------------------------
    // Theme & Zen & Challenge
    // -------------------------------------------------------------------------

    function initTheme() {
        const btn = document.getElementById('theme-btn');
        if (!btn) return;
        btn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
        });
    }

    function initZen() {
        const btn = document.getElementById('zen-btn');
        if (!btn) return;
        btn.addEventListener('click', () => {
            document.body.classList.toggle('zen-mode');
        });
    }

    function initChallenge() {
        const cb = document.getElementById('challenge-toggle');
        if (!cb) return;
        cb.addEventListener('change', function () {
            document.body.classList.toggle('challenge-mode-active', this.checked);
        });
    }

    // -------------------------------------------------------------------------
    // Bootstrap
    // -------------------------------------------------------------------------

    document.addEventListener('DOMContentLoaded', () => {
        initNavigation();
        initModal();
        initCards();
        initTheme();
        initZen();
        initChallenge();
        loadContent();
    });
})();
