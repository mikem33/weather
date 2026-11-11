// A scrollbar of our own for a horizontally scrolling list, so it looks the same in every
// browser, is always visible and can be narrower than the list (the hours list spans the
// whole window; its bar only the wrapper). The list keeps its native scroll: touchpad
// and touch work as usual. On top of that:
// - the thumb can be dragged, and pressing the track jumps there and keeps dragging;
// - the content can be dragged with the mouse too;
// - the vertical mouse wheel scrolls the list sideways until it reaches an end, then
//   lets the page scroll again.
// No styling here: the bar gets --thumb-size and --thumb-start (fractions of the track)
// and data-scrollable; bar and list get data-dragging; the CSS draws the rest.

const LINE_HEIGHT = 40; // px per wheel "line" when the browser reports lines
const DRAG_THRESHOLD = 5; // px the mouse must move before a press becomes a drag

export function scrollbar(list, bar) {
    const thumb = bar.querySelector('.scrollbar-thumb');

    const scrollMax = () => list.scrollWidth - list.clientWidth;

    function update() {
        const max = scrollMax();
        const size = list.scrollWidth ? list.clientWidth / list.scrollWidth : 1;
        bar.dataset.scrollable = max > 0;
        bar.style.setProperty('--thumb-size', size);
        bar.style.setProperty('--thumb-start', max > 0 ? (list.scrollLeft / max) * (1 - size) : 0);
    }

    // Track pixels -> list pixels: the thumb's free run maps to the list's scroll range.
    function ratio() {
        const run = bar.clientWidth - thumb.offsetWidth;
        return run > 0 ? scrollMax() / run : 0;
    }

    // ── dragging ──

    let drag = null;

    bar.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        if (event.target !== thumb) {
            // Pressing the track: centre the thumb under the pointer first.
            const box = bar.getBoundingClientRect();
            const x = event.clientX - box.left - thumb.offsetWidth / 2;
            list.scrollLeft = x * ratio();
        }
        drag = { x: event.clientX, scroll: list.scrollLeft };
        bar.setPointerCapture(event.pointerId);
        bar.dataset.dragging = true;
    });

    bar.addEventListener('pointermove', (event) => {
        if (!drag) return;
        list.scrollLeft = drag.scroll + (event.clientX - drag.x) * ratio();
    });

    const endDrag = () => {
        drag = null;
        delete bar.dataset.dragging;
    };
    bar.addEventListener('pointerup', endDrag);
    bar.addEventListener('pointercancel', endDrag);

    // ── dragging the content (mouse only: touch already scrolls natively) ──

    let pan = null;

    list.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        event.preventDefault(); // no text selection while dragging
        pan = { x: event.clientX, scroll: list.scrollLeft, id: event.pointerId, moved: false };
    });

    list.addEventListener('pointermove', (event) => {
        if (!pan) return;
        const dx = event.clientX - pan.x;
        if (!pan.moved) {
            if (Math.abs(dx) < DRAG_THRESHOLD) return;
            pan.moved = true;
            list.setPointerCapture(pan.id);
            list.dataset.dragging = true;
        }
        list.scrollLeft = pan.scroll - dx;
    });

    const endPan = () => {
        pan = null;
        delete list.dataset.dragging;
    };
    list.addEventListener('pointerup', endPan);
    list.addEventListener('pointercancel', endPan);

    // ── mouse wheel ──

    function onWheel(event) {
        // Mostly sideways already (touchpad, shift+wheel): leave it to the browser.
        if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
        const delta = event.deltaY * (event.deltaMode === 1 ? LINE_HEIGHT : 1);
        const atStart = list.scrollLeft <= 0;
        const atEnd = list.scrollLeft >= scrollMax() - 1;
        if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return; // let the page scroll
        event.preventDefault();
        list.scrollLeft += delta;
    }
    list.addEventListener('wheel', onWheel, { passive: false });
    bar.addEventListener('wheel', onWheel, { passive: false });

    // ── keeping it in sync ──

    list.addEventListener('scroll', update, { passive: true });
    // Size changes include the list going from hidden to shown.
    new ResizeObserver(update).observe(list);
    new MutationObserver(update).observe(list, { childList: true });
    update();

    return { update };
}
