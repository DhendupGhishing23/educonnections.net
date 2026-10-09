/*
 * "Save" / favourite a university card or detail page, stored in this browser's
 * localStorage only (there's no user-account system or backend to persist it against - see
 * the "Client Login" modal for why). Every `.favorite-btn[data-slug]` on the page is synced
 * to the stored list on load and kept in sync on click.
 */
(function () {
    "use strict";

    var STORAGE_KEY = 'ec_favorite_universities';

    function readFavorites() {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }
    function writeFavorites(list) {
        try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { /* storage unavailable - button still toggles visually for this view */ }
    }

    var buttons = document.querySelectorAll('.favorite-btn[data-slug]');
    if (!buttons.length) return;

    var favorites = readFavorites();

    function paint(btn, isActive) {
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        var icon = btn.querySelector('i');
        if (icon) {
            // Font Awesome 5 Free style prefixes: fas = solid, far = regular/outline.
            icon.classList.toggle('fas', isActive);
            icon.classList.toggle('far', !isActive);
        }
    }

    buttons.forEach(function (btn) {
        var slug = btn.getAttribute('data-slug');
        paint(btn, favorites.indexOf(slug) > -1);
        btn.addEventListener('click', function () {
            favorites = readFavorites();
            var idx = favorites.indexOf(slug);
            var nowActive;
            if (idx > -1) { favorites.splice(idx, 1); nowActive = false; }
            else { favorites.push(slug); nowActive = true; }
            writeFavorites(favorites);
            document.querySelectorAll('.favorite-btn[data-slug="' + slug + '"]').forEach(function (b) {
                paint(b, nowActive);
            });
        });
    });
})();
