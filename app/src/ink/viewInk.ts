import { applyTheme, getTheme, otherTheme, type Theme } from './theme';
import { prefersReduced } from './motion';

/**
 * Ink Bleed Day/Night theme animation (after codemure-official/ink-bleed-theme-changer, MIT).
 * Ported unchanged from MNEMOS-ZERO (frontend/src/ink/viewInk.ts).
 *
 *
 * Uses the View Transitions API for GPU-accelerated page snapshots, animating an
 * organic fluid-dynamics polygon mask with:
 *  - Easing: power3.out (fast drop splash, slow soaking bleed into paper fibres)
 *  - Boiling domain warp (edge boils over time rather than simple scaling)
 *  - Branching tendrils & capillary cracks extending along directional lobes
 *  - Clean corner coverage cleanup
 */

export interface Point {
    x: number;
    y: number;
}

export const DURATION = 2200; // ms: slow, cinematic ink soak

/**
 * Easing profile to control the start speed:
 * - 'cinematic' (Active): smootherstep, eases in and settles with no visible stop.
 * - 'smoothstep': Starts very gentle (2.8% at 10% time), blooms out naturally.
 * - 'ease-in-out': Extra soft start (2.0% at 10% time), steady mid-flight.
 * - 'sine': Gentle harmonic bell curve (2.4% at 10% time).
 * - 'gentle-out': Moderate start (14.6% at 10% time).
 */
export type EasingMode = 'cinematic' | 'smoothstep' | 'ease-in-out' | 'sine' | 'gentle-out';
export const EASING_MODE: EasingMode = 'cinematic';

export function calculateProgress(lin: number, mode: EasingMode = EASING_MODE): number {
    switch (mode) {
        case 'ease-in-out':
            return lin < 0.5 ? 2 * lin * lin : 1 - Math.pow(-2 * lin + 2, 2) / 2;
        case 'sine':
            return (1 - Math.cos(Math.PI * lin)) / 2;
        case 'gentle-out':
            return 1 - Math.pow(1 - lin, 1.5);
        case 'cinematic':
            // smootherstep: zero velocity *and* acceleration at both ends, so the
            // drop eases in and the bleed settles with no visible stop.
            return lin * lin * lin * (lin * (lin * 6 - 15) + 10);
        case 'smoothstep':
        default:
            return lin * lin * (3 - 2 * lin);
    }
}

// Body reaches ~70% of the far corner; the slow cleanup soak covers the rest,
// so the visible spread uses the whole duration instead of finishing early.
const GROWTH = 0.7;
const VERTS = 160;
const FRAMES = 90; // dense keyframes: no visible kinks between polygon steps

type VT = { finished: Promise<void>; ready: Promise<void>; skipTransition(): void };
let running: VT | null = null;
let lastPoint: Point | null = null;

function rand(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Pre-computes fluid-dynamics ink bleed keyframes based on Codemure's shader math. */
function inkFrames(c: Point, w = innerWidth, h = innerHeight): string[] {
    const far = Math.max(
        Math.hypot(c.x, c.y),
        Math.hypot(w - c.x, c.y),
        Math.hypot(c.x, h - c.y),
        Math.hypot(w - c.x, h - c.y)
    );
    const r = rand((Math.random() * 1e9) | 0);

    // Direction-only lobes (anisotropy) so the drop is lopsided from the start
    const seedRot = r() * Math.PI * 2;
    const lobe1 = { p: r() * 6.283, a: 0.22 };
    const lobe2 = { p: r() * 6.283, a: 0.12 };

    // Multi-octave domain harmonics: simulate fluid boiling and turbulence
    const harmonics = Array.from({ length: 5 }, (_, i) => ({
        k: i + 2 + Math.floor(r() * 3),
        a: 0.04 + r() * 0.07,
        p: r() * 6.283,
        speed: (r() - 0.5) * 1.6, // slow boil: edge drifts instead of jittering
    }));

    // Tendril filaments: thin capillary ridges that branch out along directional rays
    const tendrilCount = 12 + Math.floor(r() * 6);
    const tendrils = Array.from({ length: tendrilCount }, () => ({
        angle: r() * Math.PI * 2,
        width: 0.04 + r() * 0.08,
        length: 0.22 + r() * 0.45,
        curl: (r() - 0.5) * 0.6,
        lag: r() * 0.25,
        jag: r() * 6.283,
    }));

    // Fine paper-fibre micro-grit (static across frames so it doesn't shimmer)
    // Smoothed so neighbouring vertices agree: a soft, wet edge instead of a saw-tooth.
    const rawFibres = Array.from({ length: VERTS }, () => (r() - 0.5) * 0.03);
    const fibres = rawFibres.map((_, i) => (rawFibres[(i + VERTS - 1) % VERTS] + 2 * rawFibres[i] + rawFibres[(i + 1) % VERTS]) / 4);

    const frames: string[] = [];

    for (let f = 0; f <= FRAMES; f++) {
        const lin = f / FRAMES;
        const t = calculateProgress(lin);

        // Tendrils lead during early and mid spread, then merge into main body
        const tendrilGrow = Math.sin(Math.min(1, lin * 1.2) * Math.PI);

        // Cleanup: guarantees that by t=1 the ink completely covers the farthest viewport corner
        const cleanupRamp = Math.max(0, (lin - 0.45) / 0.55);
        const sweep = Math.max(0, (lin - 0.88) / 0.12);
        const cleanup = Math.pow(cleanupRamp, 2.0) * far * 0.4 + sweep * sweep * far * 0.6;

        const pts: string[] = [];
        for (let i = 0; i < VERTS; i++) {
            const th = (i / VERTS) * Math.PI * 2;

            // Anisotropic directional lobes
            const dirTh = th + seedRot;
            const lobes = Math.sin(dirTh * 2 + lobe1.p) * lobe1.a + Math.sin(dirTh * 3 + lobe2.p) * lobe2.a;

            // Boiling domain-warped liquid wobble
            let blob = 1.0 + lobes;
            for (const hm of harmonics) {
                blob += hm.a * Math.sin(hm.k * th + hm.p + lin * hm.speed);
            }
            // Fine surface capillary ripple
            blob += 0.014 * Math.sin(11 * th - lin * 4) + 0.008 * Math.sin(19 * th + lin * 5);

            // Tendrils / capillary crack extensions
            let filament = 0;
            for (const td of tendrils) {
                let d = Math.abs(th - (td.angle + td.curl * t));
                d = Math.min(d, Math.PI * 2 - d);
                if (d < td.width) {
                    const s = 1 - d / td.width;
                    const g0 = Math.max(0, Math.min(1, (lin - td.lag) / 0.5));
                    const grow = g0 * g0 * (3 - 2 * g0); // tendrils ease out of the body
                    filament = Math.max(
                        filament,
                        td.length * grow * s * s * (3 - 2 * s) * (0.92 + 0.08 * Math.sin(th * 9 + td.jag + lin * 2))
                    );
                }
            }

            // Radial calculation with tendril reaches and paper fibre roughness
            const rad = far * GROWTH * t * (blob + fibres[i] + filament * tendrilGrow * 0.55) + cleanup;
            pts.push(`${(c.x + Math.cos(th) * rad).toFixed(1)}px ${(c.y + Math.sin(th) * rad).toFixed(1)}px`);
        }
        frames.push(`polygon(${pts.join(',')})`);
    }
    return frames;
}

/** Ripple indicator at the point of ink contact (after Codemure tap marker). */
export function showTapMarker(p: Point): void {
    const el = document.createElement('div');
    el.className = 'tap-marker';
    el.setAttribute('aria-hidden', 'true');
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
    document.body.append(el);

    const anim = el.animate(
        [
            { transform: 'scale(0.55)', opacity: 0.95 },
            { transform: 'scale(1.85)', opacity: 0 }
        ],
        { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    );
    anim.onfinish = () => el.remove();
}

function crossFade(to: Theme) {
    const root = document.documentElement;
    root.classList.add('theme-fade');
    applyTheme(to);
    window.setTimeout(() => root.classList.remove('theme-fade'), 520);
}

export function switchTheme(point?: Point): void {
    const to = otherTheme(getTheme());
    const doc = document as Document & { startViewTransition?: (cb: () => void) => VT };
    if (!doc.startViewTransition || prefersReduced()) return crossFade(to);

    try {
        running?.skipTransition();
        const c = point ?? { x: innerWidth - 40, y: 32 };
        lastPoint = c;

        const root = document.documentElement;
        root.style.setProperty('--ink-x', `${c.x}px`);
        root.style.setProperty('--ink-y', `${c.y}px`);
        root.style.setProperty('--ink-duration', `${DURATION}ms`);
        root.classList.add('ink-vt');

        const probe = document.createElement('div');
        probe.setAttribute('aria-hidden', 'true');
        probe.style.cssText = `position:fixed;left:${c.x}px;top:${c.y}px;width:1px;height:1px;pointer-events:none;view-transition-name:ink-probe`;
        document.body.append(probe);

        const vt = doc.startViewTransition(() => applyTheme(to));
        running = vt;

        showTapMarker(c);

        vt.ready
            .then(() => {
                const at = snapshotPoint(c);
                const box = snapshotBox(at, c);
                root.style.setProperty('--ink-x', `${at.x}px`);
                root.style.setProperty('--ink-y', `${at.y}px`);
                root.animate(
                    { clipPath: inkFrames(at, box.w, box.h) },
                    {
                        duration: DURATION,
                        easing: 'linear',
                        pseudoElement: '::view-transition-new(root)',
                        fill: 'both',
                    }
                );
            })
            .catch(() => undefined);
        vt.finished.finally(() => {
            probe.remove();
            if (running === vt) running = null;
            root.classList.remove('ink-vt');
        });
    } catch {
        crossFade(to);
    }
}

/** Where viewport point `c` sits inside the transition snapshot (falls back to `c`). */
function snapshotPoint(c: Point): Point {
    try {
        const t = getComputedStyle(document.documentElement, '::view-transition-group(ink-probe)').transform;
        const m = t && t !== 'none' ? new DOMMatrixReadOnly(t) : null;
        if (m && Number.isFinite(m.m41) && Number.isFinite(m.m42)) return { x: m.m41, y: m.m42 };
    } catch {
        /* pseudo-element styles not readable: assume snapshot == viewport */
    }
    return c;
}

/** Snapshot size: large enough to cover the screen behind any browser toolbars. */
function snapshotBox(at: Point, c: Point) {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;height:100lvh;width:1px;visibility:hidden;pointer-events:none';
    document.body.append(probe);
    const lvh = probe.getBoundingClientRect().height || innerHeight;
    probe.remove();
    const dy = Math.max(0, at.y - c.y);
    return { w: innerWidth + Math.max(0, at.x - c.x), h: Math.max(innerHeight, lvh) + dy };
}

/** Replays the theme transition from the previous click coordinates. */
export function replayTransition(): void {
    if (lastPoint) switchTheme(lastPoint);
}
