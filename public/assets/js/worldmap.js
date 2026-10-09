/*
 * Hero world map: hover/focus a country hotspot to see its name + partner-institution count,
 * click (or Enter/Space when focused) to open that country's page. Pure SVG + CSS glow/pulse
 * (see redesign.css .map-hotspot) - no mapping library, no GeoJSON, so it costs nothing on
 * the network and can't slow the page down.
 */
(function () {
    "use strict";

    var card = document.querySelector('.world-map-card');
    if (!card) return;
    var tooltip = card.querySelector('.map-tooltip');
    var hotspots = card.querySelectorAll('.map-hotspot');
    if (!hotspots.length) return;

    function showTooltip(hotspot) {
        if (!tooltip) return;
        var name = hotspot.getAttribute('data-name');
        var count = hotspot.getAttribute('data-count');
        var label = count === '0'
            ? 'Partner institutions coming soon'
            : count + (count === '1' ? ' partner institution' : '+ partner institutions');
        tooltip.innerHTML = '<strong>' + window.EC.escapeHtml(name) + '</strong><span>' + label + '</span>';

        var cardRect = card.getBoundingClientRect();
        var dot = hotspot.querySelector('.hotspot-dot');
        var dotRect = dot.getBoundingClientRect();
        tooltip.style.left = (dotRect.left - cardRect.left + dotRect.width / 2) + 'px';
        tooltip.style.top = (dotRect.top - cardRect.top) + 'px';
        tooltip.classList.add('is-visible');
    }
    function hideTooltip() {
        if (tooltip) tooltip.classList.remove('is-visible');
    }
    function go(hotspot) {
        var slug = hotspot.getAttribute('data-slug');
        if (slug) window.location.href = '/destinations/' + slug;
    }

    hotspots.forEach(function (hotspot) {
        hotspot.addEventListener('mouseenter', function () { showTooltip(hotspot); });
        hotspot.addEventListener('mouseleave', hideTooltip);
        hotspot.addEventListener('focus', function () { showTooltip(hotspot); });
        hotspot.addEventListener('blur', hideTooltip);
        hotspot.addEventListener('click', function () { go(hotspot); });
        hotspot.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(hotspot); }
        });
    });
})();
