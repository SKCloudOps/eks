(function () {
    const main = document.querySelector('main');
    const nav = document.getElementById('nav');
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const captionText = document.getElementById('modal-caption');
    const closeModal = document.querySelector('.close-modal');

    let contentData = null;

    async function loadContent() {
        try {
            const response = await fetch('generated_content.json');
            contentData = await response.json();
            populateGrids();
        } catch (error) {
            console.error('Error loading content:', error);
        }
    }

    function populateGrids() {
        if (!contentData) return;

        for (const [section, items] of Object.entries(contentData)) {
            const grid = document.querySelector(`#block-${section} .resource-grid`);
            if (grid) {
                grid.innerHTML = items.join('');
            }
        }

        // After populating, first section should be active
        const firstLink = document.querySelector('nav a');
        if (firstLink) firstLink.click();
    }

    function openBlock(blockId) {
        document.querySelectorAll('.content-block').forEach(b => {
            b.classList.remove('is-open');
        });
        const target = document.getElementById(blockId);
        if (target) {
            target.classList.add('is-open');
            main.scrollTop = 0;
        }
    }

    function initNavigation() {
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = link.getAttribute('href').substring(1);

                document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
                link.classList.add('active');

                openBlock('block-' + id);

                // On mobile, scroll main into view
                if (window.innerWidth <= 768) {
                    main.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    function initFeatures() {
        // Dark Mode
        const dmBtn = document.getElementById('dark-mode-btn');
        if (dmBtn) {
            dmBtn.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
            });
        }

        // Zen Mode
        const zenBtn = document.getElementById('zen-btn');
        if (zenBtn) {
            zenBtn.addEventListener('click', () => {
                document.body.classList.toggle('zen-mode');
            });
        }

        // Challenge Mode
        const challengeToggle = document.getElementById('challenge-toggle');
        if (challengeToggle) {
            challengeToggle.addEventListener('change', function () {
                if (this.checked) {
                    document.body.classList.add('challenge-mode-active');
                } else {
                    document.body.classList.remove('challenge-mode-active');
                }
            });
        }

        // Modal Logic
        window.openModal = function (src, title) {
            modal.style.display = "block";
            modalImg.src = src;
            captionText.innerHTML = title;
            document.body.style.overflow = 'hidden'; // Prevent scroll
        };

        closeModal.onclick = function () {
            modal.style.display = "none";
            document.body.style.overflow = 'auto';
        };

        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = "none";
                document.body.style.overflow = 'auto';
            }
        };

        // Resource toggle
        window.toggleResource = function (btn) {
            const card = btn.closest('.resource-card');
            const fullText = btn.nextElementSibling;
            const shortText = btn.previousElementSibling;
            if (fullText.style.display === "none" || fullText.style.display === "") {
                fullText.style.display = "block";
                btn.innerText = "Read Less";
                if (shortText) shortText.style.display = "none";
                if (card) card.classList.add('is-expanded');
            } else {
                fullText.style.display = "none";
                btn.innerText = "Read More";
                if (shortText) shortText.style.display = "block";
                if (card) card.classList.remove('is-expanded');
            }
        };
    }

    document.addEventListener('DOMContentLoaded', () => {
        initNavigation();
        initFeatures();
        loadContent();
    });
})();
