/*
 * New sticky navbar: scroll shadow, mobile drawer, search overlay. Independent of the old
 * jQuery menu-trigger handler in custom.js (that handler no-ops now since the new nav markup
 * doesn't use .menu-trigger).
 */
(function () {
    "use strict";

    var navbar = document.querySelector('.navbar-v2');
    if (navbar) {
        var onScroll = function () {
            if (window.scrollY > 12) navbar.classList.add('is-scrolled');
            else navbar.classList.remove('is-scrolled');
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // toggleSelector: buttons that open+close the panel (toggle behaviour).
    // closeButtonSelector: buttons that only ever close it.
    // backdropEl: an element that closes the panel, but only on a direct click on itself
    //             (never on a bubbled click from something inside it) - stops "click inside
    //             the modal" from being misread as "click outside the modal".
    function wireOverlay(toggleSelector, panel, closeButtonSelector, backdropEl, onOpen) {
        if (!panel) return;
        var releaseFocusTrap = null;
        var lastFocused = null;

        function open() {
            lastFocused = document.activeElement;
            panel.classList.add('is-open');
            document.body.style.overflow = 'hidden';
            releaseFocusTrap = window.EC.trapFocus(panel);
            if (onOpen) onOpen();
        }
        function close() {
            panel.classList.remove('is-open');
            document.body.style.overflow = '';
            if (releaseFocusTrap) { releaseFocusTrap(); releaseFocusTrap = null; }
            if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
        }

        document.querySelectorAll(toggleSelector).forEach(function (btn) {
            btn.setAttribute('aria-expanded', 'false');
            btn.addEventListener('click', function () {
                var isOpen = panel.classList.contains('is-open');
                if (isOpen) { close(); btn.setAttribute('aria-expanded', 'false'); }
                else { open(); btn.setAttribute('aria-expanded', 'true'); }
            });
        });
        if (closeButtonSelector) {
            document.querySelectorAll(closeButtonSelector).forEach(function (btn) {
                btn.addEventListener('click', close);
            });
        }
        if (backdropEl) {
            backdropEl.addEventListener('click', function (e) {
                if (e.target === backdropEl) close();
            });
        }
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && panel.classList.contains('is-open')) close();
        });

        return { open: open, close: close };
    }

    // Mobile drawer (backdrop is a dedicated full-screen sibling of the slide-in panel).
    var drawer = document.querySelector('.mobile-drawer');
    wireOverlay('.js-open-drawer', drawer, '.js-close-drawer', drawer ? drawer.querySelector('.drawer-backdrop') : null);

    // Search overlay — closes via Escape or its explicit close button; focuses the input on open.
    var searchOverlay = document.querySelector('.search-overlay');
    wireOverlay('.js-open-search', searchOverlay, '.js-close-search', null, function () {
        var input = searchOverlay.querySelector('input[type="search"]');
        if (input) setTimeout(function () { input.focus(); }, 50);
    });
})();
