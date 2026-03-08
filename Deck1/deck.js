(function () {
  const slides = document.querySelectorAll('.slide');
  const progressBar = document.getElementById('progressBar');
  const counter = document.getElementById('slideCounter');
  let current = 0;
  const total = slides.length;

  function animateCounters(slideEl) {
    slideEl.querySelectorAll('[data-count-to]').forEach(el => {
      const target = parseFloat(el.dataset.countTo);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
      const duration = parseInt(el.dataset.duration) || 1500;
      const start = performance.now();

      function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const c = target * eased;
        el.textContent = prefix + c.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
        if (progress < 1) requestAnimationFrame(update);
      }

      requestAnimationFrame(update);
    });
  }

  // --- Progressive Timeline ---
  var tlTimers = [];

  function animateProgressiveTimeline(slideEl) {
    var tl = slideEl.querySelector('.timeline-progressive');
    if (!tl) return;

    var stages = tl.querySelectorAll('.tl-stage');
    var railFill = tl.querySelector('.tl-rail-fill');
    var pulse = tl.querySelector('.tl-pulse');
    var rail = tl.querySelector('.tl-rail');

    // Clear any pending timers
    tlTimers.forEach(function(t) { clearTimeout(t); });
    tlTimers = [];

    // Reset state
    stages.forEach(function(s) { s.classList.remove('revealed'); });
    railFill.style.transition = 'none';
    railFill.style.height = '0';
    pulse.style.transition = 'none';
    pulse.classList.remove('visible', 'settled');
    pulse.style.top = '28px';
    // Force reflow
    railFill.offsetHeight;
    pulse.offsetHeight;
    // Restore transitions
    railFill.style.transition = '';
    pulse.style.transition = '';

    var initialDelay = 800;
    var stageDelay = 600;

    stages.forEach(function(stage, i) {
      var t = setTimeout(function() {
        stage.classList.add('revealed');

        var dot = stage.querySelector('.tl-dot');
        var dotRect = dot.getBoundingClientRect();
        var railRect = rail.getBoundingClientRect();
        var tlRect = tl.getBoundingClientRect();

        var dotCenterY = dotRect.top + dotRect.height / 2;
        var progressPct = ((dotCenterY - railRect.top) / railRect.height) * 100;

        railFill.style.height = Math.min(progressPct, 100) + '%';
        pulse.style.top = (dotCenterY - tlRect.top) + 'px';
        pulse.classList.add('visible');

        if (i === stages.length - 1) {
          var t2 = setTimeout(function() { pulse.classList.add('settled'); }, 500);
          tlTimers.push(t2);
        }
      }, initialDelay + i * stageDelay);
      tlTimers.push(t);
    });
  }

  function resetProgressiveTimeline(slideEl) {
    var tl = slideEl.querySelector('.timeline-progressive');
    if (!tl) return;

    // Clear pending timers
    tlTimers.forEach(function(t) { clearTimeout(t); });
    tlTimers = [];

    var stages = tl.querySelectorAll('.tl-stage');
    var railFill = tl.querySelector('.tl-rail-fill');
    var pulse = tl.querySelector('.tl-pulse');

    stages.forEach(function(s) { s.classList.remove('revealed'); });
    if (railFill) { railFill.style.transition = 'none'; railFill.style.height = '0'; railFill.offsetHeight; railFill.style.transition = ''; }
    if (pulse) { pulse.style.transition = 'none'; pulse.classList.remove('visible', 'settled'); pulse.style.top = '28px'; pulse.offsetHeight; pulse.style.transition = ''; }
  }

  function goTo(index, direction) {
    direction = direction || 'down';
    if (index < 0 || index >= total || index === current) return;

    const prev = slides[current];
    const next = slides[index];

    prev.classList.remove('active');
    prev.classList.add(direction === 'down' ? 'exit-up' : 'exit-down');
    prev.querySelectorAll('[data-animate]').forEach(el => {
      el.classList.remove('animate-in');
      el.style.animationDelay = '';
    });
    setTimeout(() => { prev.classList.remove('exit-up', 'exit-down'); }, 600);
    resetProgressiveTimeline(prev);

    next.style.transform = direction === 'down' ? 'translateY(20px)' : 'translateY(-20px)';
    next.classList.add('active');

    requestAnimationFrame(() => {
      next.querySelectorAll('[data-animate]').forEach((el, i) => {
        el.style.animationDelay = (0.15 + i * 0.1) + 's';
        el.classList.add('animate-in');
      });
      animateCounters(next);
      animateProgressiveTimeline(next);
    });

    current = index;
    updateProgress();
  }

  function next() { goTo(current + 1, 'down'); }
  function prev() { goTo(current - 1, 'up'); }

  function updateProgress() {
    progressBar.style.transform = 'scaleX(' + (current + 1) / total + ')';
    counter.textContent = (current + 1) + ' / ' + total;
  }

  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); stopAutoplay(); next(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); stopAutoplay(); prev(); }
    if (e.key === 'Home') { e.preventDefault(); stopAutoplay(); goTo(0, 'up'); }
    if (e.key === 'End') { e.preventDefault(); stopAutoplay(); goTo(total - 1, 'down'); }
  });

  var touchStartY = 0, touchStartX = 0;
  document.addEventListener('touchstart', function (e) {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    var dy = touchStartY - e.changedTouches[0].clientY;
    var dx = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 50) { stopAutoplay(); next(); } else if (dx < -50) { stopAutoplay(); prev(); }
    } else {
      if (dy > 50) { stopAutoplay(); next(); } else if (dy < -50) { stopAutoplay(); prev(); }
    }
  }, { passive: true });

  document.addEventListener('click', function (e) {
    if (e.target.closest('a,button,input,textarea,kbd,.comp-dot,.nav-panel')) return;
    var x = e.clientX / window.innerWidth;
    if (x > 0.65) { stopAutoplay(); next(); } else if (x < 0.35) { stopAutoplay(); prev(); }
  });

  // --- Theme Toggle ---
  var root = document.documentElement;
  var toggle = document.querySelector('.theme-toggle');
  var stored = localStorage.getItem('fetchr-theme');
  if (stored) {
    root.setAttribute('data-theme', stored);
  } else {
    root.setAttribute('data-theme', 'dark');
  }

  if (toggle) {
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var current_theme = root.getAttribute('data-theme') || 'dark';
      var next_theme = current_theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next_theme);
      localStorage.setItem('fetchr-theme', next_theme);
    });
  }

  // --- Navigation Panel ---
  var navPanel = document.getElementById('navPanel');
  var navItems = navPanel ? navPanel.querySelectorAll('.nav-panel-item') : [];
  var navCount = document.getElementById('navPanelCount');
  var navProgressFill = document.getElementById('navProgressFill');
  var navHideTimer = null;

  function updateNavPanel() {
    navItems.forEach(function (item, i) {
      item.classList.toggle('active', i === current);
    });
    if (navCount) navCount.textContent = (current + 1) + ' / ' + total;
    if (navProgressFill) navProgressFill.style.width = ((current + 1) / total * 100) + '%';
  }

  if (navPanel) {
    // Show panel when mouse reaches left edge
    document.addEventListener('mousemove', function (e) {
      if (e.clientX <= 36 && !navPanel.classList.contains('visible')) {
        clearTimeout(navHideTimer);
        navPanel.classList.add('visible');
      }
    });

    // Keep panel open while mouse is inside it
    navPanel.addEventListener('mouseenter', function () {
      clearTimeout(navHideTimer);
    });

    // Hide panel when mouse leaves
    navPanel.addEventListener('mouseleave', function () {
      navHideTimer = setTimeout(function () {
        navPanel.classList.remove('visible');
      }, 400);
    });

    // Click to navigate
    navItems.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        var target = parseInt(this.dataset.goto);
        if (isNaN(target) || target === current) return;
        var direction = target > current ? 'down' : 'up';
        goTo(target, direction);
        // Auto-close panel after navigating
        setTimeout(function () {
          navPanel.classList.remove('visible');
        }, 500);
      });
    });
  }

  // Patch updateProgress to also update nav panel
  var _origUpdateProgress = updateProgress;
  updateProgress = function () {
    _origUpdateProgress();
    updateNavPanel();
  };

  // --- Autoplay ---
  var AUTOPLAY_DURATION = 6000; // ms per slide
  var RING_CIRCUMFERENCE = 113.1; // 2 * π * 18
  var autoplayBtn = document.getElementById('autoplayBtn');
  var autoplayRingFill = document.getElementById('autoplayRingFill');
  var autoplayTimer = null;
  var isPlaying = false;
  var ringAnimId = null;
  var ringStartTime = null;

  function startRingAnimation() {
    cancelAnimationFrame(ringAnimId);
    ringStartTime = null;
    if (autoplayRingFill) autoplayRingFill.style.strokeDashoffset = '0';

    function tick(timestamp) {
      if (!isPlaying) return;
      if (ringStartTime === null) ringStartTime = timestamp;
      var progress = Math.min((timestamp - ringStartTime) / AUTOPLAY_DURATION, 1);
      if (autoplayRingFill) {
        autoplayRingFill.style.strokeDashoffset = (progress * RING_CIRCUMFERENCE) + '';
      }
      if (progress < 1) ringAnimId = requestAnimationFrame(tick);
    }

    ringAnimId = requestAnimationFrame(tick);
  }

  function resetRing() {
    cancelAnimationFrame(ringAnimId);
    ringAnimId = null;
    ringStartTime = null;
    if (autoplayRingFill) autoplayRingFill.style.strokeDashoffset = RING_CIRCUMFERENCE + '';
  }

  function scheduleNextSlide() {
    clearTimeout(autoplayTimer);
    startRingAnimation();
    autoplayTimer = setTimeout(function () {
      if (!isPlaying) return;
      var nextIndex = current < total - 1 ? current + 1 : 0;
      goTo(nextIndex, nextIndex > current ? 'down' : 'up');
      scheduleNextSlide();
    }, AUTOPLAY_DURATION);
  }

  function startAutoplay() {
    if (isPlaying) return;
    isPlaying = true;
    if (autoplayBtn) autoplayBtn.classList.add('playing');
    scheduleNextSlide();
  }

  function stopAutoplay() {
    if (!isPlaying) return;
    isPlaying = false;
    clearTimeout(autoplayTimer);
    if (autoplayBtn) autoplayBtn.classList.remove('playing');
    resetRing();
  }

  if (autoplayBtn) {
    autoplayBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isPlaying) stopAutoplay(); else startAutoplay();
    });
  }

  // Init first slide
  updateProgress();
  requestAnimationFrame(function () {
    slides[0].querySelectorAll('[data-animate]').forEach(function (el, i) {
      el.style.animationDelay = (0.3 + i * 0.15) + 's';
      el.classList.add('animate-in');
    });
    animateCounters(slides[0]);
  });
})();
