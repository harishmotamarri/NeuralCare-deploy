/* ── NAVBAR SCROLL ─────────────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 24);
}, { passive: true });


/* ── MOBILE MENU ───────────────────────────────────────────────────── */
const hamburger = document.getElementById('hamburgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
});
document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* ── SCROLL REVEAL ─────────────────────────────────────────────────── */
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            entry.target.style.transitionDelay = (i * 0.05) + 's';
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
reveals.forEach(el => observer.observe(el));

/* ── SVG FORECAST CHART ────────────────────────────────────────────── */
function buildChart(svgId) {
    const svg = document.getElementById(svgId);
    if (!svg) return;

    const W = 480, H = 140, pad = 14;
    const data = [42, 51, 48, 63, 59, 71, 68, 79, 74, 85, 82, 91];
    const min = 30, max = 100;
    const toX = i => pad + (i / (data.length - 1)) * (W - pad * 2);
    const toY = v => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
    const threshold = toY(80);

    const ns = 'http://www.w3.org/2000/svg';

    // defs
    const defs = document.createElementNS(ns, 'defs');
    const grad = document.createElementNS(ns, 'linearGradient');
    grad.setAttribute('id', svgId + '_g');
    grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
    [['0%', '#10b981', '0.15'], ['100%', '#10b981', '0.01']].forEach(([o, c, op]) => {
        const stop = document.createElementNS(ns, 'stop');
        stop.setAttribute('offset', o);
        stop.setAttribute('stop-color', c);
        stop.setAttribute('stop-opacity', op);
        grad.appendChild(stop);
    });
    defs.appendChild(grad);
    svg.appendChild(defs);

    // grid lines
    [40, 60, 80].forEach(v => {
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', pad); line.setAttribute('x2', W - pad);
        line.setAttribute('y1', toY(v)); line.setAttribute('y2', toY(v));
        line.setAttribute('stroke', v === 80 ? '#f59e0b' : '#f1f5f9');
        line.setAttribute('stroke-width', v === 80 ? '1.5' : '1');
        if (v === 80) line.setAttribute('stroke-dasharray', '5,4');
        svg.appendChild(line);
    });

    // area path
    const linePts = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ');
    const areaD = linePts + ` L${toX(data.length - 1)},${H} L${toX(0)},${H} Z`;
    const area = document.createElementNS(ns, 'path');
    area.setAttribute('d', areaD);
    area.setAttribute('fill', `url(#${svgId}_g)`);
    svg.appendChild(area);

    // line path
    const line = document.createElementNS(ns, 'path');
    line.setAttribute('d', linePts);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', '#10b981');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(line);

    // dots
    data.forEach((v, i) => {
        const circle = document.createElementNS(ns, 'circle');
        const isCritical = i === data.length - 1;
        circle.setAttribute('cx', toX(i));
        circle.setAttribute('cy', toY(v));
        circle.setAttribute('r', isCritical ? 5 : 3);
        circle.setAttribute('fill', v >= 80 ? '#ef4444' : '#10b981');
        circle.setAttribute('opacity', isCritical ? 1 : 0.65);
        svg.appendChild(circle);
    });

    // threshold label
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', W - pad);
    text.setAttribute('y', threshold - 5);
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('font-size', '9');
    text.setAttribute('fill', '#f59e0b');
    text.textContent = 'Critical (80%)';
    svg.appendChild(text);
}

buildChart('forecastChart');
buildChart('forecastChart2');
