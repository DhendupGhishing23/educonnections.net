/*
 * Lightweight scroll-reveal, replacing the old animate.css + wow.js combo.
 *
 * That combo (~25KB of CSS/JS across two files) was being downloaded on every single
 * page load, but wow.js was never actually initialised anywhere in the old code
 * (no `new WOW().init()` call existed), so every `wow fadeInUp` element on the site was
 * simply inert dead markup. This script gives elements marked [data-reveal] (or the
 * legacy `.wow` class, kept for back-compat) a simple fade/slide-in the first time they
 * scroll into view, using the native IntersectionObserver API - no library needed.
 *
 * Progressive enhancement: the hidden starting state is only ever applied via the
 * `html.js` class added synchronously in <head>, so visitors with JS disabled simply see
 * the finished page with no animation and nothing hidden.
 */
(function () {
    "use strict";

    var targets = document.querySelectorAll('[data-reveal], .wow');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
        // No IO support: just reveal everything immediately.
        targets.forEach(function (el) { el.classList.add('is-visible'); });
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (el, i) {
        var delayAttr = el.getAttribute('data-wow-delay') || el.getAttribute('data-reveal-delay');
        if (delayAttr) {
            el.style.transitionDelay = delayAttr;
        }
        el.classList.add('reveal');
        observer.observe(el);
    });
})();
