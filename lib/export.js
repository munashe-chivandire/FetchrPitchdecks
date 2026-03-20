/**
 * Fetchr Pitch Deck — Export System
 * Adds PDF and PPTX export to any deck.
 * Loads html2canvas-pro, jsPDF, and PptxGenJS from CDN on demand.
 * Requires: export.css loaded before or alongside this file.
 */
(function () {
  'use strict';

  // ── CDN URLs ──
  var CDN = {
    html2canvas: 'https://cdn.jsdelivr.net/npm/html2canvas-pro@1.5.8/dist/html2canvas-pro.min.js',
    jsPDF: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',
    pptxgen: 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js'
  };

  // ── State ──
  var dropdownOpen = false;
  var exporting = false;
  var cancelled = false;

  // ── Detect deck info ──
  function getDeckTitle() {
    var title = document.title || 'Fetchr-Deck';
    // Clean title for filename
    return title
      .replace(/[^a-zA-Z0-9\s\-_.]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60);
  }

  function getSlides() {
    return document.querySelectorAll('.slide');
  }

  function getCurrentTheme() {
    var root = document.documentElement;
    var theme = root.getAttribute('data-theme');
    if (theme) return theme;
    // Deck2 has no data-theme — detect from background
    var bodyBg = getComputedStyle(document.body).backgroundColor;
    if (bodyBg) {
      var match = bodyBg.match(/\d+/g);
      if (match) {
        var r = parseInt(match[0]);
        var g = parseInt(match[1]);
        var b = parseInt(match[2]);
        // If luminance is high, it's light
        if ((r + g + b) / 3 > 128) return 'light';
      }
    }
    return 'dark';
  }

  // ── Dynamic script loader ──
  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      // Check if already loaded
      var existing = document.querySelector('script[src="' + url + '"]');
      if (existing) { resolve(); return; }
      var script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = function () { reject(new Error('Failed to load: ' + url)); };
      document.head.appendChild(script);
    });
  }

  async function ensureLibsLoaded(type) {
    await loadScript(CDN.html2canvas);
    if (type === 'pdf') {
      await loadScript(CDN.jsPDF);
    } else if (type === 'pptx') {
      await loadScript(CDN.pptxgen);
    }
  }

  // ── Resolve CSS variable to a literal value ──
  function resolveVar(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  // ── Build resolved gradient overrides for pseudo-elements ──
  // html2canvas can't resolve var() inside gradient strings on ::after/::before.
  // ONLY override pseudo-elements — never override .slide or .slide--title backgrounds
  // directly, because light theme uses hardcoded blue gradients on hero slides that
  // our variable resolution would incorrectly replace.
  function buildPseudoOverrides() {
    var bgSlide = resolveVar('--bg-slide') || '#0B0B12';
    var theme = getCurrentTheme();

    var rules = [];

    // Solution slide overlay (gradient from dark bg over the image)
    if (theme === 'light') {
      var lightBg = resolveVar('--bg-slide') || '#FAFBFE';
      rules.push(
        '.solution-bg::after {',
        '  background: linear-gradient(',
        '    to right,',
        '    ' + lightBg + ' 0%,',
        '    rgba(250, 251, 254, 0.95) 20%,',
        '    rgba(250, 251, 254, 0.6) 40%,',
        '    rgba(250, 251, 254, 0) 65%',
        '  ) !important;',
        '}'
      );
    } else {
      rules.push(
        '.solution-bg::after {',
        '  background: linear-gradient(',
        '    to right,',
        '    ' + bgSlide + ' 0%,',
        '    rgba(11, 11, 18, 0.88) 22%,',
        '    rgba(11, 11, 18, 0.4) 45%,',
        '    rgba(11, 11, 18, 0) 65%',
        '  ) !important;',
        '}'
      );
    }

    // Grid overlay pseudo-elements on slides — resolve var() in radial-gradient
    var gridColor = theme === 'light'
      ? 'rgba(0, 65, 245, 0.04)'
      : 'rgba(255, 255, 255, 0.025)';
    rules.push(
      '.slide::after {',
      '  background-image: radial-gradient(circle, ' + gridColor + ' 1px, transparent 1px) !important;',
      '}'
    );

    return rules.join('\n');
  }

  // ── Capture a single slide to canvas ──
  async function captureSlide(slideEl, index, total) {
    var h2c = window.html2canvas;

    // Measure the deck container for consistent sizing
    var deck = document.querySelector('.deck') || document.body;
    var deckRect = deck.getBoundingClientRect();
    var captureW = deckRect.width;
    var captureH = deckRect.height;

    // Pre-compute pseudo-element overrides (needs access to live DOM's computed styles)
    var pseudoOverrides = buildPseudoOverrides();

    var canvas = await h2c(slideEl, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      allowTaint: true,
      width: captureW,
      height: captureH,
      windowWidth: captureW,
      windowHeight: captureH,
      onclone: function (clonedDoc, clonedEl) {
        // 1. Hide ALL slides, then show only the one we're capturing.
        //    All slides are position:absolute stacked — without this,
        //    sibling slides bleed through the capture.
        var allSlides = clonedDoc.querySelectorAll('.slide');
        for (var s = 0; s < allSlides.length; s++) {
          if (allSlides[s] !== clonedEl) {
            allSlides[s].style.display = 'none';
          }
        }

        // 2. Force this slide visible
        clonedEl.style.opacity = '1';
        clonedEl.style.visibility = 'visible';
        clonedEl.style.transform = 'none';
        clonedEl.style.position = 'absolute';
        clonedEl.style.inset = '0';
        clonedEl.style.overflow = 'hidden';
        clonedEl.classList.add('active');
        clonedEl.classList.remove('exit-up', 'exit-down');

        // 3. Kill animations/transitions, force animated elements visible,
        //    resolve pseudo-element gradients that use CSS variables
        var killStyle = clonedDoc.createElement('style');
        killStyle.textContent = [
          '*, *::before, *::after {',
          '  animation: none !important;',
          '  animation-duration: 0s !important;',
          '  animation-delay: 0s !important;',
          '  transition: none !important;',
          '  transition-duration: 0s !important;',
          '}',
          '[data-animate] {',
          '  opacity: 1 !important;',
          '}',
          // Force all content elements visible (timeline stages, dominos, etc.)
          '.tl-stage, .domino-node, .domino-arrow,',
          '.flow-node--source, .flow-arrow, .flow-node--target,',
          '.moat-pill, .feature-pill, .return-pill,',
          '.market-layer, .expansion-phase, .expansion-line,',
          '.comp-table-row, .speed-bar-row, .chain-step, .chain-arrow {',
          '  opacity: 1 !important;',
          '  transform: none !important;',
          '  visibility: visible !important;',
          '}',
          '.tl-stage { opacity: 1 !important; }',
          '.tl-stage .tl-content { opacity: 1 !important; transform: none !important; }',
          '.tl-rail-fill { height: 100% !important; }',
          // Hide UI chrome
          '.grain,',
          '.progress-bar,',
          '.slide-counter,',
          '.nav-hint,',
          '.theme-toggle,',
          '.nav-panel,',
          '.autoplay-btn,',
          '.dot-nav,',
          '.ann-toggle,',
          '.ann-panel,',
          '.export-toggle,',
          '.export-dropdown,',
          '.export-progress-overlay {',
          '  display: none !important;',
          '}',
          // Disable backdrop-filter (not supported by html2canvas)
          '.problem-stats,',
          '.metric-card,',
          '.graveyard-callout,',
          '.gap-callout,',
          '.emotional-callout,',
          '.nav-panel,',
          '.ann-toggle,',
          '.ann-panel {',
          '  -webkit-backdrop-filter: none !important;',
          '  backdrop-filter: none !important;',
          '}',
          // Solution slide (slide 2) — force dark text for contrast against the product screenshot
          '.slide--solution .slide-headline,',
          '.slide--solution .slide-sub,',
          '.slide--solution .feature-item {',
          '  color: #111827 !important;',
          '}',
          '.slide--solution .text-accent {',
          '  color: #0041F5 !important;',
          '}',
          '.slide--solution .feature-check {',
          '  border-color: rgba(0, 65, 245, 0.2) !important;',
          '  background: rgba(0, 65, 245, 0.08) !important;',
          '}',
          '.slide--solution .feature-check svg {',
          '  stroke: #0041F5 !important;',
          '}',
          '.slide--solution .slide-footnote {',
          '  color: #6B7280 !important;',
          '}',
          // Resolved pseudo-element gradients (var() doesn't work in gradients for html2canvas)
          pseudoOverrides
        ].join('\n');
        clonedDoc.head.appendChild(killStyle);

        // 4. Boost opacity on elements that relied on backdrop-filter blur
        var blurEls = clonedDoc.querySelectorAll(
          '.problem-stats, .metric-card, .graveyard-callout, .gap-callout, .emotional-callout'
        );
        for (var i = 0; i < blurEls.length; i++) {
          var el = blurEls[i];
          var bg = window.getComputedStyle(el).backgroundColor;
          if (bg && bg.indexOf('rgba') !== -1) {
            // Increase alpha to compensate for lost blur
            el.style.backgroundColor = bg.replace(
              /,\s*([\d.]+)\s*\)/,
              function (m, a) { return ', ' + Math.min(parseFloat(a) * 2.5, 0.92) + ')'; }
            );
          }
        }

        // 5. Resolve currentColor on SVGs — html2canvas can't resolve
        //    currentColor reliably, so bake in the computed color
        var svgs = clonedEl.querySelectorAll('svg');
        for (var j = 0; j < svgs.length; j++) {
          var svg = svgs[j];
          var parentColor = window.getComputedStyle(svg.parentElement || svg).color;

          // Resolve stroke="currentColor"
          var strokeEls = svg.querySelectorAll('[stroke="currentColor"]');
          for (var k = 0; k < strokeEls.length; k++) {
            strokeEls[k].setAttribute('stroke', parentColor);
          }
          if (svg.getAttribute('stroke') === 'currentColor') {
            svg.setAttribute('stroke', parentColor);
          }

          // Resolve fill="currentColor"
          var fillEls = svg.querySelectorAll('[fill="currentColor"]');
          for (var k = 0; k < fillEls.length; k++) {
            fillEls[k].setAttribute('fill', parentColor);
          }
          if (svg.getAttribute('fill') === 'currentColor') {
            svg.setAttribute('fill', parentColor);
          }
        }
      }
    });

    return canvas;
  }

  // ── Export to PDF ──
  async function exportPDF() {
    if (exporting) return;
    exporting = true;
    cancelled = false;
    closeDropdown();

    var slides = getSlides();
    var total = slides.length;
    showProgress('Exporting to PDF', total);

    try {
      await ensureLibsLoaded('pdf');
      await document.fonts.ready;

      var jsPDF = window.jspdf.jsPDF;
      // Standard widescreen 16:9 slide = 13.33 x 7.5 inches
      var pageW = 13.33;
      var pageH = 7.5;
      var pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'in',
        format: [pageW, pageH],
        compress: true
      });

      for (var i = 0; i < total; i++) {
        if (cancelled) { exporting = false; hideProgress(); return; }

        updateProgress(i + 1, total, 'Capturing slide ' + (i + 1) + ' of ' + total);

        var canvas = await captureSlide(slides[i], i, total);
        var imgData = canvas.toDataURL('image/jpeg', 0.92);

        if (i > 0) {
          pdf.addPage([pageW, pageH], 'landscape');
        }

        pdf.addImage(
          imgData, 'JPEG',
          0, 0,
          pageW, pageH,
          'slide-' + i,
          'FAST'
        );
      }

      if (!cancelled) {
        updateProgress(total, total, 'Saving PDF...');
        pdf.save(getDeckTitle() + '.pdf');
      }
    } catch (err) {
      console.error('[Export] PDF error:', err);
      alert('Export failed: ' + err.message);
    }

    exporting = false;
    hideProgress();
  }

  // ── Export to PPTX ──
  async function exportPPTX() {
    if (exporting) return;
    exporting = true;
    cancelled = false;
    closeDropdown();

    var slides = getSlides();
    var total = slides.length;
    showProgress('Exporting to PPTX', total);

    try {
      await ensureLibsLoaded('pptx');
      await document.fonts.ready;

      var pptx = new PptxGenJS();
      pptx.defineLayout({
        name: 'CUSTOM_WIDE',
        width: 13.33,
        height: 7.5
      });
      pptx.layout = 'CUSTOM_WIDE';

      // Set deck metadata
      pptx.author = 'Fetchr.';
      pptx.title = document.title || 'Fetchr Pitch Deck';

      for (var i = 0; i < total; i++) {
        if (cancelled) { exporting = false; hideProgress(); return; }

        updateProgress(i + 1, total, 'Capturing slide ' + (i + 1) + ' of ' + total);

        var canvas = await captureSlide(slides[i], i, total);
        var base64 = canvas.toDataURL('image/png').split(',')[1];

        var pptxSlide = pptx.addSlide();
        pptxSlide.background = { data: 'image/png;base64,' + base64 };
      }

      if (!cancelled) {
        updateProgress(total, total, 'Saving PPTX...');
        await pptx.writeFile({ fileName: getDeckTitle() + '.pptx' });
      }
    } catch (err) {
      console.error('[Export] PPTX error:', err);
      alert('Export failed: ' + err.message);
    }

    exporting = false;
    hideProgress();
  }

  // ══════════════════════════════════════════════
  //  UI
  // ══════════════════════════════════════════════

  function buildUI() {
    // Toggle button
    var toggle = document.createElement('button');
    toggle.className = 'export-toggle';
    toggle.id = 'exportToggle';
    toggle.setAttribute('aria-label', 'Export presentation');
    toggle.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
      '<polyline points="7 10 12 15 17 10"/>' +
      '<line x1="12" y1="15" x2="12" y2="3"/>' +
      '</svg>';
    document.body.appendChild(toggle);

    // Dropdown
    var dropdown = document.createElement('div');
    dropdown.className = 'export-dropdown';
    dropdown.id = 'exportDropdown';
    dropdown.innerHTML =
      '<div class="export-dropdown-header">Export As</div>' +
      '<button class="export-option" id="exportPDF">' +
        '<div class="export-option-icon pdf">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
          '<polyline points="14 2 14 8 20 8"/>' +
          '</svg>' +
        '</div>' +
        '<div class="export-option-text">' +
          '<span class="export-option-label">PDF Document</span>' +
          '<span class="export-option-desc">High-res slide-per-page</span>' +
        '</div>' +
      '</button>' +
      '<button class="export-option" id="exportPPTX">' +
        '<div class="export-option-icon pptx">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>' +
          '<line x1="8" y1="21" x2="16" y2="21"/>' +
          '<line x1="12" y1="17" x2="12" y2="21"/>' +
          '</svg>' +
        '</div>' +
        '<div class="export-option-text">' +
          '<span class="export-option-label">PowerPoint (PPTX)</span>' +
          '<span class="export-option-desc">Widescreen 16:9 slides</span>' +
        '</div>' +
      '</button>';
    document.body.appendChild(dropdown);

    // Progress overlay
    var overlay = document.createElement('div');
    overlay.className = 'export-progress-overlay';
    overlay.id = 'exportProgressOverlay';
    overlay.innerHTML =
      '<div class="export-progress-title" id="exportProgressTitle">Exporting...</div>' +
      '<div class="export-progress-status" id="exportProgressStatus">Preparing...</div>' +
      '<div class="export-progress-bar-track">' +
        '<div class="export-progress-bar-fill" id="exportProgressFill"></div>' +
      '</div>' +
      '<div class="export-progress-slide-label" id="exportProgressSlide"></div>' +
      '<button class="export-cancel-btn" id="exportCancelBtn">Cancel</button>';
    document.body.appendChild(overlay);

    bindEvents(toggle, dropdown);
  }

  function bindEvents(toggle, dropdown) {
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (dropdownOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    document.getElementById('exportPDF').addEventListener('click', function (e) {
      e.stopPropagation();
      exportPDF();
    });

    document.getElementById('exportPPTX').addEventListener('click', function (e) {
      e.stopPropagation();
      exportPPTX();
    });

    document.getElementById('exportCancelBtn').addEventListener('click', function () {
      cancelled = true;
    });

    // Close dropdown on outside click
    document.addEventListener('click', function (e) {
      if (dropdownOpen && !e.target.closest('.export-dropdown') && !e.target.closest('.export-toggle')) {
        closeDropdown();
      }
    });

    // Keyboard: Escape closes
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (dropdownOpen) closeDropdown();
        if (exporting) cancelled = true;
      }
    });
  }

  function openDropdown() {
    dropdownOpen = true;
    document.getElementById('exportDropdown').classList.add('open');
    document.getElementById('exportToggle').classList.add('active');
  }

  function closeDropdown() {
    dropdownOpen = false;
    var dd = document.getElementById('exportDropdown');
    var tg = document.getElementById('exportToggle');
    if (dd) dd.classList.remove('open');
    if (tg) tg.classList.remove('active');
  }

  function showProgress(title, total) {
    document.getElementById('exportProgressTitle').textContent = title;
    document.getElementById('exportProgressStatus').textContent = 'Loading libraries...';
    document.getElementById('exportProgressFill').style.width = '0%';
    document.getElementById('exportProgressSlide').textContent = '0 / ' + total + ' slides';
    document.getElementById('exportProgressOverlay').classList.add('active');
  }

  function updateProgress(current, total, status) {
    var pct = Math.round((current / total) * 100);
    document.getElementById('exportProgressFill').style.width = pct + '%';
    document.getElementById('exportProgressStatus').textContent = status;
    document.getElementById('exportProgressSlide').textContent = current + ' / ' + total + ' slides';
  }

  function hideProgress() {
    document.getElementById('exportProgressOverlay').classList.remove('active');
  }

  // ══════════════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════════════

  function init() {
    buildUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
