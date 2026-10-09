/*
 * Progressive-enhancement search: every `.js-search-input` still sits inside a real
 * `<form action="/universities" method="get">`, so pressing Enter (or JS being unavailable)
 * always works via a normal GET request. When JS is available, input is debounced 300ms and
 * sent to the small JSON endpoint at /api/search instead, rendering instant grouped results
 * (countries / universities / programs / services) without a full page load.
 */
(function () {
    "use strict";

    var POPULAR = [
        { label: 'Study in Australia', href: '/destinations/australia' },
        { label: 'Nursing & health programs', href: '/programs/nursing-and-health' },
        { label: 'Universities in Canada', href: '/universities?country=canada' },
        { label: 'Vocational & TAFE diplomas', href: '/programs/vocational-and-tafe-diplomas' },
        { label: 'English language programs', href: '/programs/english-language-programs' }
    ];

    function renderGroup(label, items, renderRow) {
        if (!items.length) return '';
        return '<div class="result-group"><div class="result-group-label">' + label + '</div>' +
            items.map(renderRow).join('') + '</div>';
    }

    function renderResults(panel, data, query) {
        var html = '';
        html += renderGroup('Countries', data.countries, function (c) {
            return '<a class="result-row" href="/destinations/' + c.slug + '">' +
                '<img src="/assets/images/' + c.flag + '" alt="" loading="lazy">' +
                '<span>' + window.EC.escapeHtml(c.name) + '<div class="result-meta">' + c.count + '+ partner institutions</div></span></a>';
        });
        html += renderGroup('Universities & Colleges', data.universities, function (u) {
            return '<a class="result-row" href="/universities/' + u.slug + '">' +
                '<img src="/assets/images/' + u.logo + '" alt="" loading="lazy">' +
                '<span>' + window.EC.escapeHtml(u.name) + '<div class="result-meta">' + window.EC.escapeHtml(u.location) + ', ' + window.EC.escapeHtml(u.countryName) + '</div></span></a>';
        });
        html += renderGroup('Programs & Fields', data.programs, function (p) {
            return '<a class="result-row" href="/programs/' + p.slug + '"><span>' + window.EC.escapeHtml(p.name) + '</span></a>';
        });
        html += renderGroup('Services', data.services, function (s) {
            return '<a class="result-row" href="/services#' + s.slug + '"><span>' + window.EC.escapeHtml(s.title) + '</span></a>';
        });
        if (!html) {
            html = '<div class="search-empty">No matches for “' + window.EC.escapeHtml(query) + '”. Try a country, a university, or a field of study.</div>';
        }
        panel.innerHTML = html;
        panel.classList.add('is-open');
    }

    function renderPopular(panel) {
        panel.innerHTML = '<div class="result-group"><div class="result-group-label">Popular searches</div>' +
            '<div class="popular-chip-list">' +
            POPULAR.map(function (p) {
                return '<button type="button" class="popular-chip" data-href="' + p.href + '">' + window.EC.escapeHtml(p.label) + '</button>';
            }).join('') + '</div></div>';
        panel.classList.add('is-open');
    }

    function wireField(wrap) {
        var form = wrap.querySelector('form[data-live-search]');
        var input = wrap.querySelector('.js-search-input');
        var panel = wrap.querySelector('.search-results-panel');
        if (!form || !input || !panel) return;

        var currentRequest = 0;

        function runSearch(q) {
            var reqId = ++currentRequest;
            fetch('/api/search?q=' + encodeURIComponent(q))
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (reqId !== currentRequest) return; // a newer keystroke already superseded this response
                    renderResults(panel, data, q);
                })
                .catch(function () { /* network hiccup - Enter still submits the plain GET form */ });
        }

        var debouncedSearch = window.EC.debounce(function () {
            var q = input.value.trim();
            if (!q) { renderPopular(panel); return; }
            runSearch(q);
        }, 300);

        input.addEventListener('input', debouncedSearch);
        input.addEventListener('focus', function () {
            if (!input.value.trim()) renderPopular(panel);
            else debouncedSearch();
        });

        panel.addEventListener('click', function (e) {
            var chip = e.target.closest('.popular-chip');
            if (chip) window.location.href = chip.getAttribute('data-href');
        });

        document.addEventListener('click', function (e) {
            if (!wrap.contains(e.target)) panel.classList.remove('is-open');
        });

        input.addEventListener('keydown', function (e) {
            var rows = Array.prototype.slice.call(panel.querySelectorAll('.result-row'));
            if (!rows.length) return;
            var activeIndex = -1;
            rows.forEach(function (r, i) { if (r.classList.contains('is-active')) activeIndex = i; });

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                rows.forEach(function (r) { r.classList.remove('is-active'); });
                var next = rows[Math.min(activeIndex + 1, rows.length - 1)];
                next.classList.add('is-active');
                next.scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                rows.forEach(function (r) { r.classList.remove('is-active'); });
                var prev = rows[Math.max(activeIndex - 1, 0)];
                prev.classList.add('is-active');
                prev.scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter' && activeIndex > -1) {
                e.preventDefault();
                window.location.href = rows[activeIndex].getAttribute('href');
            } else if (e.key === 'Escape') {
                panel.classList.remove('is-open');
            }
        });
    }

    document.querySelectorAll('.hero-search-wrap, .search-overlay-panel, .drawer-search-wrap').forEach(wireField);
})();
