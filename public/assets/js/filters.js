/*
 * Two independent, self-contained behaviours, each a no-op if its markup isn't on the page:
 *
 * 1. /universities — a real server-rendered, server-paginated listing (see server.js).
 *    The filter <select>s auto-submit on change (a discrete action, not per-keystroke) via a
 *    normal GET form submit, so the URL stays shareable/bookmarkable and everything still
 *    works with JS disabled. The mobile "Filters" button opens the same controls as a bottom
 *    sheet; "Apply" copies its values into the real (desktop) fields and submits.
 *
 * 2. Per-country institution grid (/destinations/:slug) — a small, already-rendered list (at
 *    most 14 items today), filtered/sorted/paginated entirely client-side. A real server
 *    round trip for a list this size would only add latency for no benefit, so this
 *    deliberately does NOT call the network - it's instant, and there's nothing to debounce.
 */
(function () {
    "use strict";

    /* ---------- 1. /universities toolbar (server-driven) ---------- */
    var uniForm = document.querySelector('#uniFilterForm');
    if (uniForm) {
        uniForm.querySelectorAll('select.js-auto-filter').forEach(function (select) {
            select.addEventListener('change', function () { uniForm.submit(); });
        });

        var sheet = document.querySelector('.filter-sheet');
        var backdrop = document.querySelector('.filter-drawer-backdrop');
        var openBtn = document.querySelector('.js-open-filters');
        var closeBtns = document.querySelectorAll('.js-close-filters');
        var applyBtn = document.querySelector('.js-apply-filters');

        function openSheet() {
            if (!sheet) return;
            // Reflect the real fields' current values into the sheet's copies.
            sheet.querySelectorAll('[data-sync]').forEach(function (field) {
                var real = uniForm.querySelector('[name="' + field.getAttribute('data-sync') + '"]');
                if (real) field.value = real.value;
            });
            sheet.classList.add('is-open');
            if (backdrop) backdrop.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        }
        function closeSheet() {
            if (!sheet) return;
            sheet.classList.remove('is-open');
            if (backdrop) backdrop.classList.remove('is-open');
            document.body.style.overflow = '';
        }
        if (openBtn) openBtn.addEventListener('click', openSheet);
        closeBtns.forEach(function (btn) { btn.addEventListener('click', closeSheet); });
        if (backdrop) backdrop.addEventListener('click', function (e) { if (e.target === backdrop) closeSheet(); });
        if (applyBtn) {
            applyBtn.addEventListener('click', function () {
                sheet.querySelectorAll('[data-sync]').forEach(function (field) {
                    var real = uniForm.querySelector('[name="' + field.getAttribute('data-sync') + '"]');
                    if (real) real.value = field.value;
                });
                uniForm.submit();
            });
        }
    }

    /* ---------- 2. Country page institution grid (client-side) ---------- */
    var grid = document.querySelector('.js-institution-grid');
    if (!grid) return;

    var PAGE_SIZE = 12;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.js-institution-card'));
    var searchInput = document.querySelector('#countryFilterSearch');
    var categorySelect = document.querySelector('#countryFilterCategory');
    var sortSelect = document.querySelector('#countryFilterSort');
    var loadMoreBtn = document.querySelector('.js-load-more');
    var resultsCountEl = document.querySelector('.js-results-count');
    var emptyState = document.querySelector('.js-filter-empty');
    var visibleCount = PAGE_SIZE;

    function currentMatches() {
        var q = (searchInput && searchInput.value.trim().toLowerCase()) || '';
        var category = (categorySelect && categorySelect.value) || '';
        return cards.filter(function (card) {
            var name = (card.getAttribute('data-name') || '').toLowerCase();
            var location = (card.getAttribute('data-location') || '').toLowerCase();
            var type = (card.getAttribute('data-type') || '').toLowerCase();
            var cardCategory = card.getAttribute('data-category') || '';
            if (category && cardCategory !== category) return false;
            if (!q) return true;
            return name.indexOf(q) > -1 || location.indexOf(q) > -1 || type.indexOf(q) > -1;
        });
    }

    function applySort(list) {
        var sort = (sortSelect && sortSelect.value) || 'default';
        var sorted = list.slice();
        if (sort === 'az') {
            sorted.sort(function (a, b) { return a.getAttribute('data-name').localeCompare(b.getAttribute('data-name')); });
        } else if (sort === 'type') {
            sorted.sort(function (a, b) { return a.getAttribute('data-type').localeCompare(b.getAttribute('data-type')); });
        }
        return sorted;
    }

    function render() {
        var matches = applySort(currentMatches());
        cards.forEach(function (card) { card.classList.add('is-hidden'); });
        matches.slice(0, visibleCount).forEach(function (card) {
            card.classList.remove('is-hidden');
            grid.appendChild(card); // reorder into the current sort order
        });
        if (resultsCountEl) {
            resultsCountEl.textContent = matches.length + (matches.length === 1 ? ' institution' : ' institutions');
        }
        if (loadMoreBtn) {
            loadMoreBtn.style.display = matches.length > visibleCount ? '' : 'none';
        }
        if (emptyState) {
            emptyState.style.display = matches.length === 0 ? '' : 'none';
        }
    }

    var debouncedRender = window.EC.debounce(function () { visibleCount = PAGE_SIZE; render(); }, 150);
    if (searchInput) searchInput.addEventListener('input', debouncedRender);
    if (categorySelect) categorySelect.addEventListener('change', function () { visibleCount = PAGE_SIZE; render(); });
    if (sortSelect) sortSelect.addEventListener('change', render);
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', function () { visibleCount += PAGE_SIZE; render(); });

    render();
})();
