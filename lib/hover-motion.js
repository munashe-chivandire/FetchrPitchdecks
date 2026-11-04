/*
 * Hover, keyboard focus and press for buttons and links, ported from the
 * button-hover skill's template. A control opts in with data-hover and
 * lib/hover.css draws the effect from the custom properties set here:
 *
 *   data-hover="flood"  the hover color floods in from where the pointer came in
 *                       and drains towards where it left. A press ripples.
 *   data-hover="line"   draws the line on its [data-line] part from the nearer end
 *   data-hover="icon"   only the icon moves
 *
 * Every kind also moves the Phosphor icon inside it, picked by its ph-* class.
 * A tap on a phone only ripples, keyboard focus plays the hover from the middle,
 * and reduced motion turns all of it off. Needs gsap loaded first.
 */
(function () {
  if (!window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var timing = {
    flood: { in: { duration: 0.5, ease: 'power3.out' }, out: { duration: 0.4, ease: 'power2.out' } },
    line: { in: { duration: 0.4, ease: 'power3.out' }, out: { duration: 0.3, ease: 'power2.out' } },
  };
  var clamp = function (min, max, n) { return Math.min(max, Math.max(min, n)); };
  var settle = function (icon) { return function () { gsap.set(icon, { clearProps: 'transform,opacity' }); }; };

  function wobble(angles, each) {
    return function (icon) {
      var tl = gsap.timeline({ onComplete: settle(icon) });
      angles.forEach(function (rotation) { tl.to(icon, { rotation: rotation, duration: each, ease: 'sine.inOut' }); });
      return tl;
    };
  }
  // Leaves the way it points and comes back in from the other side. The button clips it.
  function loop(x, y) {
    return function (icon) {
      return gsap.timeline({ onComplete: settle(icon) })
        .to(icon, { xPercent: 130 * x, yPercent: 130 * y, opacity: 0, duration: 0.2, ease: 'power2.in' })
        .set(icon, { xPercent: -130 * x, yPercent: -130 * y })
        .to(icon, { xPercent: 0, yPercent: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
    };
  }
  function lift(icon) {
    return gsap.timeline({ onComplete: settle(icon) })
      .to(icon, { y: -4, duration: 0.18, ease: 'power2.out' })
      .to(icon, { y: 0, duration: 0.55, ease: 'back.out(4)' });
  }
  // An X looks the same a quarter turn round.
  function turn(icon) { return gsap.to(icon, { rotation: 90, duration: 0.7, ease: 'power3.inOut', onComplete: settle(icon) }); }
  var rock = wobble([-18, 10, 0], 0.18);

  // By Phosphor class. Anything not listed lifts.
  var moves = {
    'ph-arrow-right': loop(1, 0),
    'ph-arrow-left': loop(-1, 0),
    'ph-arrow-square-out': loop(1, -1),
    'ph-link': rock,
    'ph-question': rock,
    'ph-x': turn,
  };

  function moveIcons(el) {
    el.querySelectorAll('i[class*="ph-"]').forEach(function (icon) {
      var name = Array.prototype.find.call(icon.classList, function (c) { return c.indexOf('ph-') === 0 && c !== 'ph-duotone'; });
      var move = moves[name] || lift;
      if (gsap.isTweening(icon) || icon.getClientRects().length === 0) return;
      move(icon);
    });
  }

  function flood(el, s, from, on) {
    var box = el.getBoundingClientRect();
    var rim = parseFloat(getComputedStyle(el).getPropertyValue('--flood-rim')) || 0;
    var cover = function (x, y) { return Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y)) + rim + 1; };
    var x = from ? clamp(0, box.width, from.x - box.left) : box.width / 2;
    var y = from ? clamp(0, box.height, from.y - box.top) : box.height / 2;
    // The centre only moves while nothing shows or everything does, so a quick pass drains back where it came in.
    if (s.at <= 0) { s.x = x; s.y = y; }
    else if (s.at >= cover(s.x, s.y) - 1) { s.x = x; s.y = y; s.at = cover(x, y); }
    el.style.setProperty('--flood-x', s.x + 'px');
    el.style.setProperty('--flood-y', s.y + 'px');
    var draw = function () { el.style.setProperty('--flood-r', s.at.toFixed(1)); };
    draw();
    gsap.to(s, Object.assign({ at: on ? cover(s.x, s.y) : 0, overwrite: true, onUpdate: draw }, timing.flood[on ? 'in' : 'out']));
  }

  function line(el, s, from, on) {
    var parts = el.hasAttribute('data-line') ? [el] : Array.prototype.slice.call(el.querySelectorAll('[data-line]'));
    if (s.at <= 0 || s.at >= 1) {
      if (from) { var box = el.getBoundingClientRect(); s.side = from.x < box.left + box.width / 2 ? 0 : 100; }
      else s.side = on ? 0 : 100;   // keyboard focus draws left to right and leaves the same way
    }
    var draw = function () {
      parts.forEach(function (p) { p.style.setProperty('--line', s.at.toFixed(3)); p.style.setProperty('--line-from', String(s.side)); });
    };
    draw();
    gsap.to(s, Object.assign({ at: on ? 1 : 0, overwrite: true, onUpdate: draw }, timing.line[on ? 'in' : 'out']));
  }

  // Two rings run out from the press in the text color.
  function splash(el, s, e) {
    var box = el.getBoundingClientRect();
    var x = e.clientX - box.left, y = e.clientY - box.top;
    var reach = Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y)) + 8;
    var r = s.ripple;
    gsap.killTweensOf(r);
    r.r = 0; r.fade = 1;
    el.style.setProperty('--splash-x', x + 'px');
    el.style.setProperty('--splash-y', y + 'px');
    gsap.timeline({ onUpdate: function () { el.style.setProperty('--splash-r', r.r.toFixed(1)); el.style.setProperty('--splash-o', r.fade.toFixed(3)); } })
      .to(r, { r: reach, duration: 0.7, ease: 'power2.out' }, 0)
      .to(r, { fade: 0, duration: 0.7, ease: 'power1.in' }, 0);
  }

  var states = new WeakMap();
  function stateOf(el) {
    var s = states.get(el);
    if (!s) { s = { hover: false, focus: false, at: 0, x: 0, y: 0, side: 0, ripple: { r: 0, fade: 0 } }; states.set(el, s); }
    return s;
  }
  var hoverable = function (n) { return n instanceof Element ? n.closest('[data-hover]') : null; };

  function play(el, on, from) {
    var s = stateOf(el), kind = el.dataset.hover;
    if (kind === 'flood') flood(el, s, from, on);
    else if (kind === 'line') line(el, s, from, on);
    if (on) moveIcons(el);
  }

  document.addEventListener('pointerover', function (e) {
    var el = hoverable(e.target);
    if (!el || e.pointerType === 'touch' || el.contains(e.relatedTarget)) return;
    var s = stateOf(el);
    if (s.hover) return;
    s.hover = true;
    if (!s.focus) play(el, true, { x: e.clientX, y: e.clientY });
  });
  document.addEventListener('pointerout', function (e) {
    var el = hoverable(e.target);
    if (!el || e.pointerType === 'touch' || el.contains(e.relatedTarget)) return;
    var s = stateOf(el);
    if (!s.hover) return;
    s.hover = false;
    if (!s.focus) play(el, false, { x: e.clientX, y: e.clientY });
  });
  document.addEventListener('pointerdown', function (e) {
    var el = hoverable(e.target);
    if (!el || el.dataset.hover !== 'flood' || e.button !== 0 || el.disabled) return;
    splash(el, stateOf(el), e);
  });
  document.addEventListener('focusin', function (e) {
    var el = hoverable(e.target);
    if (!el || el !== e.target || !el.matches(':focus-visible')) return;
    var s = stateOf(el);
    s.focus = true;
    if (!s.hover) play(el, true, null);
  });
  document.addEventListener('focusout', function (e) {
    var el = hoverable(e.target);
    if (!el || el !== e.target) return;
    var s = stateOf(el);
    if (!s.focus) return;
    s.focus = false;
    if (!s.hover) play(el, false, null);
  });

  // Tells hover.css to leave hover to this script instead of the plain color change.
  document.documentElement.dataset.hoverMotion = '';
})();
