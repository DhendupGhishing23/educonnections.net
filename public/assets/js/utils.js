/*
 * Small shared helpers for the 2026 redesign's vanilla-JS modules (nav.js, search.js,
 * filters.js, worldmap.js, favorites.js). Deliberately tiny and dependency-free - the site
 * already loads jQuery for Bootstrap/OwlCarousel, but none of the new interactive pieces
 * need it, so they don't add to that cost.
 */
window.EC = window.EC || {};

window.EC.debounce = function (fn, wait) {
    var timer = null;
    return function () {
        var args = arguments;
        var ctx = this;
        clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
};

// Used any time server/user-supplied text (a search query, a "no results for X" message) is
// dropped into innerHTML, so it can't be interpreted as markup.
window.EC.escapeHtml = function (str) {
    return String(str).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
};

window.EC.trapFocus = function (container) {
    var focusable = container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return function () {};
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    function handler(e) {
        if (e.key !== 'Tab') return;
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus();
        }
    }
    container.addEventListener('keydown', handler);
    return function () { container.removeEventListener('keydown', handler); };
};
