// Solidarity theme behaviour: menu with dropdowns, hero slideshow, label news blocks,
// latest-updates ticker, related posts, social icons and small helpers. No dependencies.
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;

  function el(tag, attrs, children) {
    var node = doc.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!attrs.hasOwnProperty(k) || attrs[k] == null) continue;
        if (k === 'text') node.textContent = attrs[k];
        else if (k === 'className') node.className = attrs[k];
        else node.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function svg(paths, size) {
    var ns = 'http://www.w3.org/2000/svg';
    var s = doc.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('width', size || 18);
    s.setAttribute('height', size || 18);
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2.4');
    s.setAttribute('stroke-linecap', 'round');
    s.setAttribute('stroke-linejoin', 'round');
    var p = doc.createElementNS(ns, 'polyline');
    p.setAttribute('points', paths);
    s.appendChild(p);
    return s;
  }
  var CHEVRON_DOWN = '6 9 12 15 18 9';
  var CHEVRON_LEFT = '15 18 9 12 15 6';
  var CHEVRON_RIGHT = '9 18 15 12 9 6';

  // ---------------------------------------------------------------- menu
  var header = doc.getElementById('site-header');
  var toggle = doc.getElementById('nav-toggle');
  var drawer = doc.getElementById('site-nav');
  var desktop = window.matchMedia ? window.matchMedia('(min-width: 1100px)') : null;

  function setMenu(open) {
    if (!header || !toggle) return;
    if (open) {
      drawer.style.top = Math.max(0, header.getBoundingClientRect().bottom) + 'px';
      header.classList.add('nav-open');
      root.classList.add('nav-locked');
    } else {
      header.classList.remove('nav-open');
      root.classList.remove('nav-locked');
    }
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (header && toggle && drawer) {
    // Dropdowns: every menu item with a nested list gets a toggle button for touch screens
    var parents = drawer.querySelectorAll('.site-nav li');
    for (var p = 0; p < parents.length; p++) {
      var li = parents[p];
      var sub = li.querySelector('ul');
      if (!sub || sub.parentNode !== li) continue;
      li.classList.add('has-sub');
      var link = li.querySelector('a');
      var btn = el('button', { type: 'button', className: 'sub-toggle', 'aria-expanded': 'false',
        'aria-label': 'Show submenu' + (link ? ': ' + link.textContent.trim() : '') }, [svg(CHEVRON_DOWN, 20)]);
      li.insertBefore(btn, sub);
      btn.addEventListener('click', function () {
        var item = this.parentNode;
        var open = !item.classList.contains('sub-open');
        item.classList.toggle('sub-open', open);
        this.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    toggle.addEventListener('click', function () {
      setMenu(!header.classList.contains('nav-open'));
    });
    drawer.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== drawer) {
        if (t.tagName === 'A') {
          var href = t.getAttribute('href') || '';
          var item = t.parentNode;
          // "#" parents only open their submenu on phones
          if ((href === '#' || href === '') && item.classList.contains('has-sub')) {
            e.preventDefault();
            if (!(desktop && desktop.matches)) item.querySelector('.sub-toggle').click();
            return;
          }
          setMenu(false);
          return;
        }
        t = t.parentNode;
      }
    });
    doc.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && header.classList.contains('nav-open')) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (header.classList.contains('nav-open')) {
        drawer.style.top = Math.max(0, header.getBoundingClientRect().bottom) + 'px';
      }
    });
    // Desktop dropdowns that would run off the right edge open to the left instead
    var placeDropdowns = function () {
      var subs = drawer.querySelectorAll('.site-nav .widget-content > ul > li.has-sub');
      for (var q = 0; q < subs.length; q++) {
        subs[q].classList.remove('drop-left');
        if (!desktop || !desktop.matches) continue;
        var menu = subs[q].querySelector('ul');
        if (menu.getBoundingClientRect().right > root.clientWidth - 8) subs[q].classList.add('drop-left');
      }
    };
    placeDropdowns();
    window.addEventListener('resize', placeDropdowns);
    if (desktop) {
      var onChange = function () { if (desktop.matches) setMenu(false); };
      if (desktop.addEventListener) desktop.addEventListener('change', onChange);
      else if (desktop.addListener) desktop.addListener(onChange);
    }
  }

  // ---------------------------------------------------------------- scroll effects
  var toTop = doc.querySelector('.to-top');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.pageYOffset;
      if (header) header.classList.toggle('is-scrolled', y > 50);
      if (toTop) toTop.classList.toggle('is-visible', y > 600);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------------------------------------------------------------- brand and hero title
  var mark = doc.querySelector('.brand-mark');
  var name = doc.querySelector('.brand-name');
  if (mark && name && !mark.querySelector('img')) {
    var skip = { the: 1, a: 1, an: 1, of: 1, and: 1, for: 1 };
    var words = name.textContent.trim().split(/\s+/).filter(function (w) {
      return w && !skip[w.toLowerCase()];
    });
    mark.textContent = words.slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }

  // Last word of the hero title in the highlight colour ("... Workers Union")
  var heroTitle = doc.querySelector('.hero-title');
  if (heroTitle && heroTitle.children.length === 0) {
    var parts = heroTitle.textContent.trim().split(/\s+/);
    if (parts.length > 1) {
      heroTitle.textContent = parts.slice(0, -1).join(' ') + ' ';
      heroTitle.appendChild(el('span', { className: 'accent', text: parts[parts.length - 1] }));
    }
  }

  // ---------------------------------------------------------------- social icons
  var ICONS = {
    facebook: 'M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8z',
    x: 'M17.8 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.9L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z',
    youtube: 'M23 7.2c-.3-1.1-1.1-2-2.2-2.3C18.9 4.5 12 4.5 12 4.5s-6.9 0-8.8.4C2.1 5.2 1.3 6.1 1 7.2.6 9.1.6 12 .6 12s0 2.9.4 4.8c.3 1.1 1.1 2 2.2 2.3 1.9.4 8.8.4 8.8.4s6.9 0 8.8-.4c1.1-.3 1.9-1.2 2.2-2.3.4-1.9.4-4.8.4-4.8s0-2.9-.4-4.8zM9.7 15.5v-7l6 3.5-6 3.5z',
    instagram: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM12 2.2c-2.7 0-3 0-4 .1-3.6.2-5.5 2.1-5.7 5.7-.1 1-.1 1.3-.1 4s0 3 .1 4c.2 3.6 2.1 5.5 5.7 5.7 1 .1 1.3.1 4 .1s3 0 4-.1c3.6-.2 5.5-2.1 5.7-5.7.1-1 .1-1.3.1-4s0-3-.1-4c-.2-3.6-2.1-5.5-5.7-5.7-1-.1-1.3-.1-4-.1zm0 1.8c2.6 0 2.9 0 4 .1 2.6.1 3.8 1.4 3.9 3.9.1 1 .1 1.3.1 4s0 2.9-.1 4c-.1 2.5-1.3 3.8-3.9 3.9-1 .1-1.3.1-4 .1s-2.9 0-4-.1c-2.6-.1-3.8-1.4-3.9-3.9-.1-1-.1-1.3-.1-4s0-2.9.1-4C4.2 5.4 5.4 4.2 8 4.1c1-.1 1.3-.1 4-.1z',
    linkedin: 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11.75H3V9.75zm6.5 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6.1v6.1h-4v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.5h-4V9.75z',
    tiktok: 'M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .8.1V9.1a6.4 6.4 0 1 0 5.5 6.3V8.6a8 8 0 0 0 4.6 1.5V6.7a4.7 4.7 0 0 1-4.6-4.7z',
    whatsapp: 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.2-.7-2.7-1.1-4.4-3.8-4.5-4-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.1.3.7 1.1 1.5 1.8 1 .9 1.8 1.2 2.1 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z',
    email: 'M2 5h20v14H2V5zm2 2v.5l8 5 8-5V7H4zm16 2.8-8 5-8-5V17h16V9.8z',
    download: 'M11 3h2v9.6l3.3-3.3 1.4 1.4L12 16.4l-5.7-5.7 1.4-1.4 3.3 3.3V3zM4 18h16v2H4z',
    phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z',
    pin: 'M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z',
    telegram: 'M21.9 4.3l-3.3 15.5c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.2-8.3c.4-.4-.1-.6-.6-.2L6 13.4l-4.9-1.5c-1.1-.3-1.1-1.1.2-1.6L20.5 2.9c.9-.3 1.7.2 1.4 1.4z',
    reddit: 'M22 12.1a2.2 2.2 0 0 0-3.7-1.6 10.8 10.8 0 0 0-5.8-1.8l1-4.6 3.2.7a1.6 1.6 0 1 0 .2-1l-3.6-.8a.5.5 0 0 0-.6.4l-1.1 5.3a10.8 10.8 0 0 0-5.9 1.8A2.2 2.2 0 1 0 3.3 14a4.3 4.3 0 0 0 0 .6c0 3.3 3.9 6 8.7 6s8.7-2.7 8.7-6a4.3 4.3 0 0 0 0-.6 2.2 2.2 0 0 0 1.3-1.9zM7.3 13.6a1.6 1.6 0 1 1 1.6 1.6 1.6 1.6 0 0 1-1.6-1.6zm8.8 4.1a5.6 5.6 0 0 1-4.1 1.3 5.6 5.6 0 0 1-4.1-1.3.4.4 0 0 1 .5-.5 4.8 4.8 0 0 0 3.6 1.1 4.8 4.8 0 0 0 3.6-1.1.4.4 0 1 1 .5.5zm-.3-2.5a1.6 1.6 0 1 1 1.6-1.6 1.6 1.6 0 0 1-1.6 1.6z',
    pinterest: 'M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.5 2.2-.8 3.4-.2 1 .5 1.8 1.5 1.8 1.8 0 3.2-1.9 3.2-4.6 0-2.4-1.7-4.1-4.2-4.1-2.9 0-4.5 2.1-4.5 4.4 0 .9.3 1.8.8 2.3.1.1.1.2.1.3l-.3 1.2c0 .2-.2.2-.4.1-1.3-.6-2.1-2.5-2.1-4 0-3.3 2.4-6.3 6.9-6.3 3.6 0 6.4 2.6 6.4 6 0 3.6-2.3 6.5-5.4 6.5-1 0-2-.5-2.4-1.2l-.6 2.5c-.2.9-.9 2.1-1.3 2.8A10 10 0 1 0 12 2z',
    share: 'M18 15.5a3 3 0 0 0-2.3 1.1l-6.8-3.4a3 3 0 0 0 0-2.4l6.8-3.4a3 3 0 1 0-.7-1.5L8.2 9.3a3 3 0 1 0 0 5.4l6.8 3.4A3 3 0 1 0 18 15.5z',
    link: 'M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a1 1 0 1 1 1.4 1.4L12 13.4a1 1 0 0 1-1.4 0zM8.5 20.5a5 5 0 0 1-3.5-8.5l2.1-2.1a1 1 0 0 1 1.4 1.4l-2.1 2.1a3 3 0 0 0 4.2 4.2l2.1-2.1a1 1 0 0 1 1.4 1.4L12 19a5 5 0 0 1-3.5 1.5zm8.4-6.2a1 1 0 0 1-.7-1.7l2.1-2.1a3 3 0 0 0-4.2-4.2L12 8.4A1 1 0 0 1 10.6 7l2.1-2.1a5 5 0 0 1 7 7l-2.1 2.1a1 1 0 0 1-.7.3z',
    print: 'M7 3h10v4H7zM5 8h14a3 3 0 0 1 3 3v6h-4v4H6v-4H2v-6a3 3 0 0 1 3-3zm3 7v4h8v-4z'
  };
  function iconSvg(name) {
    var ns = 'http://www.w3.org/2000/svg';
    var icon = doc.createElementNS(ns, 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('class', 'social-icon');
    icon.setAttribute('aria-hidden', 'true');
    var path = doc.createElementNS(ns, 'path');
    path.setAttribute('d', ICONS[name]);
    path.setAttribute('fill-rule', 'evenodd');
    icon.appendChild(path);
    return icon;
  }
  function networkOf(href) {
    var h = (href || '').toLowerCase();
    if (h.indexOf('mailto:') === 0) return 'email';
    if (/facebook\.com/.test(h)) return 'facebook';
    if (/(twitter\.com|\/\/x\.com|\.x\.com)/.test(h)) return 'x';
    if (/(youtube\.com|youtu\.be)/.test(h)) return 'youtube';
    if (/instagram\.com/.test(h)) return 'instagram';
    if (/linkedin\.com/.test(h)) return 'linkedin';
    if (/tiktok\.com/.test(h)) return 'tiktok';
    if (/(whatsapp\.com|wa\.me)/.test(h)) return 'whatsapp';
    return null;
  }
  var socialLinks = doc.querySelectorAll('.topbar-social .widget-content a');
  for (var s = 0; s < socialLinks.length; s++) {
    var a = socialLinks[s];
    var net = networkOf(a.getAttribute('href'));
    if (!net) continue;
    var label = a.textContent.trim();
    a.textContent = '';
    a.appendChild(iconSvg(net));
    a.appendChild(el('span', { className: 'social-text', text: label }));
    a.classList.add('has-icon');
    a.setAttribute('title', label);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  }
  // Repeat the social links in the footer
  var socialList = doc.querySelector('.topbar-social .widget-content ul');
  var footerSocial = doc.querySelector('.footer-social');
  if (socialList && footerSocial) {
    var copy = socialList.cloneNode(true);
    copy.className = 'social-list';
    var copied = copy.querySelectorAll('a');
    for (var cs = 0; cs < copied.length; cs++) {
      footerSocial.appendChild(copied[cs]);
    }
  }

  // ---------------------------------------------------------------- writer labels
  // A label "Writer: Jane Wanjiku" gives that writer a page of all their articles. Such labels
  // are not topics, so they are removed from topic lists, card badges and breadcrumbs.
  var WRITER_LABEL = /^\s*writer\s*:\s*/i;
  var writerLinks = {};
  var labelLinks = doc.querySelectorAll('.Label li, .post-card-labels a, .breadcrumb .crumb-label, .post-tags a');
  for (var wl = 0; wl < labelLinks.length; wl++) {
    var lt = labelLinks[wl].textContent;
    if (!WRITER_LABEL.test(lt)) continue;
    var wa = labelLinks[wl].tagName === 'A' ? labelLinks[wl] : labelLinks[wl].querySelector('a');
    if (wa) writerLinks[lt.replace(WRITER_LABEL, '').trim().toLowerCase()] = wa.href;
    labelLinks[wl].parentNode.removeChild(labelLinks[wl]);
  }
  // A writer's page: "Articles by Jane Wanjiku" instead of the raw label name
  var listTitle = doc.querySelector('h1.section-title');
  if (listTitle && WRITER_LABEL.test(listTitle.textContent)) {
    listTitle.textContent = 'Articles by ' + listTitle.textContent.replace(WRITER_LABEL, '').trim();
  }

  // ---------------------------------------------------------------- images and dates
  var googleImage = /^(https?:)?\/\/([a-z0-9-]+\.)*(googleusercontent\.com|blogspot\.com|ggpht\.com)\//i;
  var youtubeThumb = /^(https?:\/\/(img\.youtube\.com|i\.ytimg\.com)\/vi\/[^/]+\/)[a-z]*default\.jpg$/i;
  // Ask Blogger for an uncropped image big enough for a w x h frame; the browser then
  // decides how it fits the frame (see smartFit), so logos are never cut off
  function sized(src, w, h) {
    if (!src) return src;
    var spec = 's' + Math.min(1600, Math.round(Math.max(w, h) * 1.15));
    if (googleImage.test(src)) {
      return src
        .replace(/\/s\d+(-[a-z]+)*\//i, '/' + spec + '/')
        .replace(/\/w\d+-h\d+(-[a-z]+)*\//i, '/' + spec + '/')
        .replace(/=s\d+(-[a-z]+)*$/i, '=' + spec)
        .replace(/=w\d+-h\d+(-[a-z]+)*$/i, '=' + spec);
    }
    if (youtubeThumb.test(src)) return src.replace(youtubeThumb, '$1hqdefault.jpg');
    return src;
  }
  // Request images at the size they are shown, times the screen density (max 2x):
  // sharp on retina screens, light on phones
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  function fit(px, step, min, max) {
    return Math.max(min, Math.min(max, Math.ceil((px * DPR) / step) * step));
  }
  function scaled(src, w) {
    if (!src || !googleImage.test(src)) return src;
    return src.replace(/\/s\d+(-[a-z]+)*\//i, '/s' + w + '/').replace(/=s\d+(-[a-z]+)*$/i, '=s' + w);
  }
  var cardImgs = doc.querySelectorAll('img.js-resize');
  for (var c = 0; c < cardImgs.length; c++) {
    var src = cardImgs[c].getAttribute('src') || '';
    var box = cardImgs[c].parentNode.clientWidth || 360;
    var cw = fit(box, 80, 320, 1280);
    var better = sized(src, cw, Math.round(cw * 9 / 16));
    if (better !== src) cardImgs[c].setAttribute('src', better);
    smartFit(cardImgs[c]);
  }

  // Photos fill their frame; logos, banners and tall images (shape very different
  // from the frame) or small images are shown whole instead of being cropped or blown up
  function smartFit(img) {
    var check = function () {
      var frame = img.parentNode;
      var w = frame.clientWidth, h = frame.clientHeight;
      if (!w || !h || !img.naturalWidth || !img.naturalHeight) return;
      var ratio = img.naturalWidth / img.naturalHeight;
      var frameRatio = w / h;
      var mismatch = Math.max(ratio, frameRatio) / Math.min(ratio, frameRatio);
      var tooSmall = img.naturalWidth < w * 0.5 && img.naturalHeight < h * 0.5;
      img.classList.toggle('fit-contain', mismatch > 1.4 || tooSmall);
    };
    if (img.complete && img.naturalWidth) check();
    else img.addEventListener('load', check);
  }
  // Sidebar "Most read" thumbnails: sharper than Blogger's 72px crop, and fitted the same way
  var popImgs = doc.querySelectorAll('.popular-posts .item-thumbnail img');
  for (var pi = 0; pi < popImgs.length; pi++) {
    var ps = popImgs[pi].getAttribute('src') || '';
    var pb = sized(ps, Math.round(64 * DPR), Math.round(64 * DPR));
    if (pb !== ps) popImgs[pi].setAttribute('src', pb);
    smartFit(popImgs[pi]);
  }

  function niceDate(iso, long) {
    var when = new Date(iso);
    if (isNaN(when.getTime())) return '';
    return when.toLocaleDateString(undefined, { year: 'numeric', month: long ? 'long' : 'short', day: 'numeric' });
  }
  var dates = doc.querySelectorAll('time.js-date');
  for (var d = 0; d < dates.length; d++) {
    var text = niceDate(dates[d].getAttribute('datetime'), true);
    if (text) dates[d].textContent = text;
  }

  // ---------------------------------------------------------------- hero slideshow
  var media = doc.querySelector('.hero-media');
  var slides = media ? media.querySelectorAll('img') : [];
  if (media && slides.length) {
    var mw = fit(media.clientWidth || 600, 200, 400, 1600);
    for (var si = 0; si < slides.length; si++) {
      var ss = slides[si].getAttribute('src') || '';
      var sb = scaled(ss, mw);
      if (sb !== ss) slides[si].setAttribute('src', sb);
    }
  }
  if (media && slides.length > 1) {
    media.classList.add('is-slideshow');
    var current = 0;
    var timer = null;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dots = el('div', { className: 'slide-dots' });
    var show = function (n) {
      current = (n + slides.length) % slides.length;
      for (var i = 0; i < slides.length; i++) {
        slides[i].classList.toggle('is-active', i === current);
        dots.children[i].setAttribute('aria-current', i === current ? 'true' : 'false');
      }
    };
    var play = function () {
      if (reduced) return;
      clearInterval(timer);
      timer = setInterval(function () { show(current + 1); }, 5500);
    };
    for (var i = 0; i < slides.length; i++) {
      if (i > 0) slides[i].setAttribute('loading', 'lazy');
      dots.appendChild(el('button', { type: 'button', 'aria-label': 'Show slide ' + (i + 1), 'data-slide': i }));
    }
    dots.addEventListener('click', function (e) {
      var n = e.target.getAttribute('data-slide');
      if (n !== null) { show(parseInt(n, 10)); play(); }
    });
    var prev = el('button', { type: 'button', className: 'slide-btn slide-prev', 'aria-label': 'Previous slide' }, [svg(CHEVRON_LEFT, 20)]);
    var next = el('button', { type: 'button', className: 'slide-btn slide-next', 'aria-label': 'Next slide' }, [svg(CHEVRON_RIGHT, 20)]);
    prev.addEventListener('click', function () { show(current - 1); play(); });
    next.addEventListener('click', function () { show(current + 1); play(); });
    media.appendChild(prev);
    media.appendChild(next);
    media.appendChild(dots);
    media.addEventListener('mouseenter', function () { clearInterval(timer); });
    media.addEventListener('mouseleave', play);
    show(0);
    play();
  }

  // ---------------------------------------------------------------- Blogger feeds (JSONP)
  var feedId = 0;
  // opts: { pages: true } reads the static-pages feed; { start: n } reads from the n-th post
  function loadFeed(label, count, done, opts) {
    opts = opts || {};
    var cb = '__unionFeed' + (++feedId);
    var script = doc.createElement('script');
    var finished = false;
    var finish = function (data) {
      if (finished) return;
      finished = true;
      try { delete window[cb]; } catch (err) { window[cb] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
      done(data);
    };
    window[cb] = function (json) { finish(json && json.feed ? json.feed.entry || [] : null); };
    script.onerror = function () { finish(null); };
    setTimeout(function () { finish(null); }, 12000);
    script.src = (opts.pages ? '/feeds/pages/default' : '/feeds/posts/summary') +
      (label ? '/-/' + encodeURIComponent(label) : '') +
      '?alt=json-in-script&max-results=' + count + (opts.start ? '&start-index=' + opts.start : '') + '&callback=' + cb;
    doc.body.appendChild(script);
  }

  // Every post (or page), 150 at a time, for the site map
  function loadAll(pages, done) {
    var all = [];
    var next = function (start) {
      loadFeed('', 150, function (entries) {
        if (!entries) { done(all.length ? all : null); return; }
        all = all.concat(entries);
        if (entries.length === 150 && all.length < 3000) next(start + 150);
        else done(all);
      }, { pages: pages, start: start });
    };
    next(1);
  }

  function plainText(html) {
    if (!html) return '';
    try {
      return (new DOMParser().parseFromString(html, 'text/html').body.textContent || '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }
  function cut(text, n) {
    if (text.length <= n) return text;
    return text.slice(0, n).replace(/\s+\S*$/, '') + '…';
  }
  function parseEntry(e) {
    var url = '#';
    for (var i = 0; i < (e.link || []).length; i++) {
      if (e.link[i].rel === 'alternate') { url = e.link[i].href; break; }
    }
    var body = (e.content && e.content.$t) || (e.summary && e.summary.$t) || '';
    var img = e.media$thumbnail ? e.media$thumbnail.url : '';
    if (!img) {
      var m = body.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (m) img = m[1];
    }
    return {
      title: (e.title && e.title.$t) || 'Untitled post',
      url: url,
      date: e.published ? e.published.$t : '',
      labels: (e.category || []).map(function (c) { return c.term; }),
      image: img,
      text: plainText(body)
    };
  }

  function thumb(post, w, h, fallback) {
    var box = el('a', { className: 'feed-thumb', href: post.url, tabindex: '-1', 'aria-hidden': 'true' });
    if (post.image) {
      var im = el('img', { src: sized(post.image, Math.round(w * DPR), Math.round(h * DPR)), alt: '', loading: 'lazy' });
      box.appendChild(im);
      smartFit(im);
    } else {
      box.classList.add('feed-thumb-empty');
      box.textContent = (fallback || post.title).charAt(0);
    }
    return box;
  }
  function titleLink(post, tag) {
    return el(tag || 'h3', { className: 'feed-title' }, [el('a', { href: post.url, text: post.title })]);
  }
  function dateTag(post) {
    var t = niceDate(post.date);
    return t ? el('time', { className: 'feed-date', datetime: post.date, text: t }) : null;
  }
  function card(post, label) {
    return el('article', { className: 'feed-card' }, [
      thumb(post, 480, 270, label),
      el('div', { className: 'feed-body' }, [dateTag(post), titleLink(post)])
    ]);
  }

  function tileImg(src) {
    var im = el('img', { src: sized(src, Math.round(300 * DPR), Math.round(300 * DPR)), alt: '', loading: 'lazy' });
    smartFit(im);
    return im;
  }

  var RENDER = {
    news: function (posts, label) {
      var first = posts[0];
      var out = [el('article', { className: 'feed-featured' }, [
        thumb(first, 640, 360, label),
        el('div', { className: 'feed-body' }, [dateTag(first), titleLink(first),
          first.text ? el('p', { className: 'feed-excerpt', text: cut(first.text, 120) }) : null])
      ])];
      if (posts.length > 1) {
        out.push(el('ul', { className: 'feed-list' }, posts.slice(1).map(function (p) {
          return el('li', null, [thumb(p, 184, 138, label), el('div', null, [dateTag(p), titleLink(p)])]);
        })));
      }
      return out;
    },
    message: function (posts, label) {
      var p = posts[0];
      return [el('article', { className: 'feed-message' }, [
        thumb(p, 800, 600, label),
        el('div', { className: 'feed-body' }, [titleLink(p),
          p.text ? el('p', { className: 'feed-excerpt', text: cut(p.text, 240) }) : null,
          el('a', { className: 'feed-readmore', href: p.url, text: 'Read the full message' })])
      ])];
    },
    tiles: function (posts, label) {
      return [el('div', { className: 'feed-tiles' }, posts.map(function (p) {
        return el('a', { className: 'feed-tile', href: p.url }, [
          p.image ? el('span', { className: 'feed-thumb' }, [tileImg(p.image)]) : null,
          el('span', { className: 'feed-tile-text' }, [dateTag(p), el('span', { className: 'feed-title', text: p.title })])
        ]);
      }))];
    },
    list: function (posts, label) {
      return [el('div', { className: 'feed-cards' }, posts.map(function (p) { return card(p, label); }))];
    },
    strip: function (posts, label) {
      var list = el('ul', { className: 'feed-strip' }, posts.map(function (p) { return el('li', null, [card(p, label)]); }));
      var step = function (dir) { list.scrollBy({ left: dir * list.clientWidth * 0.8, behavior: 'smooth' }); };
      var prev = el('button', { type: 'button', className: 'strip-btn strip-prev', 'aria-label': 'Scroll left' }, [svg(CHEVRON_LEFT, 20)]);
      var next = el('button', { type: 'button', className: 'strip-btn strip-next', 'aria-label': 'Scroll right' }, [svg(CHEVRON_RIGHT, 20)]);
      prev.addEventListener('click', function () { step(-1); });
      next.addEventListener('click', function () { step(1); });
      return [el('div', { className: 'strip-wrap' }, [prev, list, next])];
    }
  };

  function isVisible(node) {
    return !!(node.offsetWidth || node.offsetHeight || node.getClientRects().length);
  }

  var blocks = doc.querySelectorAll('.feed-block');
  for (var b = 0; b < blocks.length; b++) {
    (function (block) {
      var labelEl = block.querySelector('.feed-label');
      var items = block.querySelector('.feed-items');
      var label = labelEl ? labelEl.textContent.trim() : '';
      var kind = block.getAttribute('data-kind');
      var count = parseInt(block.getAttribute('data-count'), 10) || 4;
      var more = block.querySelector('.feed-more');
      if (more) more.setAttribute('href', label ? '/search/label/' + encodeURIComponent(label) : '/search');
      if (!items || !RENDER[kind]) return;
      // Homepage blocks are hidden on other pages: don't load their feeds there
      if (!isVisible(block)) return;
      loadFeed(label, count, function (entries) {
        items.textContent = '';
        if (!entries || !entries.length) {
          items.appendChild(el('p', { className: 'feed-status', text: entries ?
            'Nothing published under “' + label + '” yet.' : 'Posts could not be loaded right now.' }));
          return;
        }
        RENDER[kind](entries.map(parseEntry), label).forEach(function (n) { items.appendChild(n); });
      });
    })(blocks[b]);
  }

  // Latest-updates ticker
  var tickerList = doc.querySelector('.ticker-list');
  if (tickerList && isVisible(tickerList.parentNode)) {
    loadFeed('', 8, function (entries) {
      if (!entries || !entries.length) {
        doc.querySelector('.ticker').style.display = 'none';
        return;
      }
      var posts = entries.map(parseEntry);
      // Two copies so the CSS animation can loop seamlessly
      for (var round = 0; round < 2; round++) {
        posts.forEach(function (p) {
          var item = el('li', null, [el('a', { href: p.url, text: p.title })]);
          if (round === 1) item.setAttribute('aria-hidden', 'true');
          tickerList.appendChild(item);
        });
      }
      var hidden = tickerList.querySelectorAll('[aria-hidden] a');
      for (var h = 0; h < hidden.length; h++) hidden[h].setAttribute('tabindex', '-1');
    });
  }

  // Related articles on post pages (from the post's first label)
  var related = doc.querySelector('.related');
  var crumb = doc.querySelector('.breadcrumb .crumb-label');
  if (related && crumb) {
    var here = (window.location.href.split(/[?#]/)[0]).replace(/^https?:/, '');
    loadFeed(crumb.textContent.trim(), 6, function (entries) {
      if (!entries) return;
      var posts = entries.map(parseEntry).filter(function (p) {
        return p.url.split(/[?#]/)[0].replace(/^https?:/, '') !== here;
      }).slice(0, 3);
      if (!posts.length) return;
      var grid = related.querySelector('.related-grid');
      posts.forEach(function (p) { grid.appendChild(card(p)); });
      related.hidden = false;
    });
  }

  // ---------------------------------------------------------------- small helpers
  // ---------------------------------------------------------------- important documents
  // The "Important documents" gadget is the single list: the homepage shows the first 6 as
  // download cards, the Downloads page (/p/downloads.html, or any post/page containing
  // <div class="u-downloads"></div>) shows all of them.
  var DOC_TYPES = { pdf: 'PDF', word: 'DOC', excel: 'XLS', powerpoint: 'PPT', zip: 'ZIP', image: 'IMG', file: 'FILE' };
  var EXT_TYPES = { pdf: 'pdf', doc: 'word', docx: 'word', odt: 'word', rtf: 'word', xls: 'excel', xlsx: 'excel', csv: 'excel',
    ods: 'excel', ppt: 'powerpoint', pptx: 'powerpoint', odp: 'powerpoint', zip: 'zip', rar: 'zip', '7z': 'zip',
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image' };
  function docInfo(a) {
    var href = a.getAttribute('href') || '';
    var type = (a.getAttribute('data-type') || '').toLowerCase();
    var info = { view: href, download: href };
    var m = href.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/);
    var g = href.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([\w-]+)/);
    if (m) {
      // Google Drive file: the button downloads it, "View" opens Drive's viewer
      info.download = 'https://drive.google.com/uc?export=download&id=' + m[1];
      info.view = 'https://drive.google.com/file/d/' + m[1] + '/view';
    } else if (g) {
      // Google Docs / Sheets / Slides: download as PDF / Excel / PDF
      info.download = 'https://docs.google.com/' + g[1] + '/d/' + g[2] +
        (g[1] === 'spreadsheets' ? '/export?format=xlsx' : g[1] === 'presentation' ? '/export/pdf' : '/export?format=pdf');
      if (!type) type = g[1] === 'spreadsheets' ? 'excel' : 'pdf';
    }
    if (!DOC_TYPES[type]) type = EXT_TYPES[href.split(/[?#]/)[0].split('.').pop().toLowerCase()] || 'file';
    info.type = type;
    info.hasViewer = info.view !== info.download;
    return info;
  }
  function docCard(li, level) {
    var a = li.querySelector('a[href]');
    if (!a) return null;
    var info = docInfo(a);
    var title = a.textContent.trim();
    var desc = li.textContent.replace(a.textContent, '').replace(/\s+/g, ' ').trim();
    var download = el('a', { className: 'btn btn-primary doc-download', href: info.download, rel: 'noopener', target: '_blank',
      'aria-label': 'Download ' + title }, [iconSvg('download')]);
    download.appendChild(doc.createTextNode('Download'));
    return el('article', { className: 'doc-card doc-' + info.type }, [
      el('span', { className: 'doc-icon', 'aria-hidden': 'true', text: DOC_TYPES[info.type] }),
      el('div', { className: 'doc-text' }, [
        el(level || 'h3', { className: 'doc-title', text: title }),
        desc ? el('p', { className: 'doc-desc', text: desc }) : null
      ]),
      el('div', { className: 'doc-actions' }, [download,
        info.hasViewer ? el('a', { className: 'btn btn-outline doc-view', href: info.view, rel: 'noopener', target: '_blank',
          'aria-label': 'View ' + title, text: 'View' }) : null])
    ]);
  }
  function docGrid(items, level) {
    var grid = el('div', { className: 'doc-grid' });
    items.forEach(function (li) { var c = docCard(li, level); if (c) grid.appendChild(c); });
    return grid;
  }
  var docSource = doc.querySelector('.band-downloads .doc-list');
  var docItems = docSource ? [].slice.call(docSource.querySelectorAll('li')).filter(function (li) { return li.querySelector('a[href]'); }) : [];
  var docBand = doc.querySelector('.band-downloads');
  if (docBand) {
    if (!docItems.length) {
      docBand.hidden = true;
    } else {
      docSource.hidden = true;
      docSource.parentNode.insertBefore(docGrid(docItems.slice(0, 6)), docSource.nextSibling);
      if (docItems.length > 6) {
        docSource.parentNode.appendChild(el('p', { className: 'doc-more' }, [
          el('a', { className: 'btn btn-outline', href: '/p/downloads.html', text: 'All documents (' + docItems.length + ') →' })]));
      }
    }
  }
  var docPage = doc.querySelector('.post-body .u-downloads') ||
    (/\/p\/downloads?\.html$/i.test(window.location.pathname) ? doc.querySelector('.post-single .post-body') : null);
  if (docPage) {
    var docHolder = docPage.classList.contains('u-downloads') ? docPage : docPage.appendChild(el('div', { className: 'u-downloads' }));
    docHolder.appendChild(docItems.length ? docGrid(docItems, 'h2') :
      el('p', { className: 'feed-status', text: 'No documents have been added yet.' }));
  }

  // ---------------------------------------------------------------- HTML site map
  // A Blogger page at /p/sitemap.html (or any page containing <div class="u-sitemap"></div>)
  // lists every page and every article, grouped by topic. It updates itself as you publish.
  var mapHost = doc.querySelector('.post-body .u-sitemap') ||
    (/\/p\/site-?map\.html$/i.test(window.location.pathname) ? doc.querySelector('.post-single .post-body') : null);
  if (mapHost) {
    var mapBox = mapHost.classList.contains('u-sitemap') ? mapHost : mapHost.appendChild(el('div', { className: 'u-sitemap' }));
    var mapStatus = el('p', { className: 'feed-status', text: 'Loading the full list of articles…' });
    mapBox.appendChild(mapStatus);
    var slug = function (t) { return 'topic-' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
    var linkList = function (items, withDate) {
      return el('ul', { className: 'sitemap-list' }, items.map(function (p) {
        return el('li', null, [el('a', { href: p.url, text: p.title }),
          withDate && p.date ? el('time', { datetime: p.date, text: niceDate(p.date) }) : null]);
      }));
    };
    loadAll(true, function (pageEntries) {
      loadAll(false, function (postEntries) {
        mapBox.removeChild(mapStatus);
        if (!postEntries && !pageEntries) {
          mapBox.appendChild(el('p', { className: 'feed-status', text: 'The list could not be loaded right now. Please refresh the page.' }));
          return;
        }
        var posts = (postEntries || []).map(parseEntry);
        var pages = (pageEntries || []).map(parseEntry).filter(function (p) { return !/\/p\/site-?map\.html$/i.test(p.url); });
        var topics = {};
        posts.forEach(function (p) {
          var topicLabels = p.labels.filter(function (l) { return !WRITER_LABEL.test(l); });
          (topicLabels.length ? topicLabels : ['Other articles']).forEach(function (l) { (topics[l] = topics[l] || []).push(p); });
        });
        var names = Object.keys(topics).sort(function (a, b) {
          if (a === 'Other articles') return 1;
          if (b === 'Other articles') return -1;
          return a.localeCompare(b);
        });
        mapBox.appendChild(el('p', { className: 'sitemap-summary', text: posts.length + ' articles in ' + names.length +
          ' topics' + (pages.length ? ', and ' + pages.length + ' pages' : '') + '.' }));
        if (names.length) {
          mapBox.appendChild(el('nav', { className: 'sitemap-topics', 'aria-label': 'Topics' }, names.map(function (n) {
            return el('a', { className: 'badge badge-soft', href: '#' + slug(n), text: n + ' (' + topics[n].length + ')' });
          })));
        }
        if (pages.length) {
          mapBox.appendChild(el('h2', { id: 'topic-pages', text: 'Pages' }));
          mapBox.appendChild(linkList(pages, false));
        }
        names.forEach(function (n) {
          mapBox.appendChild(el('h2', { id: slug(n), text: n }));
          mapBox.appendChild(linkList(topics[n], true));
        });
      });
    });
  }

  // ---------------------------------------------------------------- article presentation
  // Lines typed in a post (anywhere, usually at the end) credit the real writer:
  //   Written by: Jane Wanjiku | Shop steward, KCA University branch
  //   Author photo: https://...            (optional; or put a picture on the next line)
  //   About the author: Jane has represented support staff since 2019.   (optional)
  // They are taken out of the text and shown as a byline and an "About the author" box.
  var BLOCK_TAGS = /^(P|DIV|LI|H[1-6]|BLOCKQUOTE|TD|TH|SECTION|ARTICLE|UL|OL|TABLE|TBODY|TR|FIGURE|PRE)$/;
  function textLines(root) {
    var out = [];
    var cur = { nodes: [], text: '' };
    var flush = function (br) {
      if (cur.nodes.length || br) { cur.br = br || null; out.push(cur); }
      cur = { nodes: [], text: '' };
    };
    (function walk(n) {
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) { cur.nodes.push(c); cur.text += c.nodeValue; }
        else if (c.nodeType === 1) {
          if (c.tagName === 'BR') flush(c);
          else if (BLOCK_TAGS.test(c.tagName)) { flush(); walk(c); flush(); }
          else if (c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE') walk(c);
        }
      }
    })(root);
    flush();
    return out;
  }
  function pruneEmpty(node, stop) {
    while (node && node !== stop && node.parentNode) {
      var parent = node.parentNode;
      if (node.nodeType === 1 && !node.textContent.trim() && !node.querySelector('img, iframe, video, table')) parent.removeChild(node);
      else break;
      node = parent;
    }
  }
  function takeLine(line, body) {
    var parents = [];
    line.nodes.forEach(function (n) { parents.push(n.parentNode); n.parentNode.removeChild(n); });
    if (line.br && line.br.parentNode) { parents.push(line.br.parentNode); line.br.parentNode.removeChild(line.br); }
    parents.forEach(function (pn) { pruneEmpty(pn, body); });
  }
  var guestAuthor = null;
  var single = doc.querySelector('.pt-item .post-single');
  var singleBody = single ? single.querySelector('.post-body') : null;
  if (singleBody) {
    var FIELD = /^\s*(written by|author photo|about the author)\s*:\s*(.*)$/i;
    var found = {};
    var photoLine = null;
    textLines(singleBody).forEach(function (line) {
      var m = line.text.replace(/\u00a0/g, ' ').match(FIELD);
      if (!m) return;
      var key = m[1].toLowerCase();
      if (found[key] !== undefined) return;
      found[key] = m[2].trim();
      if (key === 'author photo' && line.nodes.length) {
        // remember where the line was: a picture placed right after it is the author's photo
        photoLine = doc.createComment('author-photo');
        line.nodes[0].parentNode.insertBefore(photoLine, line.nodes[0]);
      }
      takeLine(line, singleBody);
    });
    if (found['written by']) {
      var parts = found['written by'].split(/\s*\|\s*/);
      if (parts.length === 1) parts = found['written by'].split(/\s*,\s*/);
      guestAuthor = { name: parts.shift().trim(), role: parts.join(', ').trim(), bio: found['about the author'] || '', photo: '' };
      // Photo: a link typed after "Author photo:", or a picture placed right after that line
      var url = (found['author photo'] || '').match(/https?:\/\/\S+/);
      if (url) guestAuthor.photo = url[0];
      else if (photoLine && photoLine.parentNode) {
        var walker = doc.createTreeWalker(singleBody, 1, null, false);
        walker.currentNode = photoLine;
        for (var step = 0; step < 12 && walker.nextNode(); step++) {
          if (walker.currentNode.tagName === 'IMG') {
            var pic = walker.currentNode;
            guestAuthor.photo = pic.currentSrc || pic.src;
            var picParent = pic.parentNode;
            picParent.removeChild(pic);
            pruneEmpty(picParent, singleBody);
            break;
          }
        }
      }
      if (photoLine && photoLine.parentNode) photoLine.parentNode.removeChild(photoLine);
      guestAuthor.page = writerLinks[guestAuthor.name.toLowerCase()] || '';
      // Byline under the title
      var meta = single.querySelector('.post-meta');
      if (meta) {
        var blogAuthor = meta.querySelector('.post-author');
        var byline = el('span', { className: 'post-author guest-byline' }, [doc.createTextNode('By '),
          guestAuthor.page ? el('a', { href: guestAuthor.page, rel: 'author', text: guestAuthor.name }) : el('strong', { text: guestAuthor.name })]);
        if (guestAuthor.role) byline.appendChild(el('span', { className: 'guest-role', text: ' · ' + guestAuthor.role }));
        if (blogAuthor) meta.replaceChild(byline, blogAuthor); else meta.insertBefore(byline, meta.firstChild);
      }
      // "About the author" box after the article
      var initials = guestAuthor.name.split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join('').toUpperCase();
      var box = el('aside', { className: 'author-box', 'aria-label': 'About the author' }, [
        guestAuthor.photo ? el('img', { className: 'author-photo', src: sized(guestAuthor.photo, 192, 192), alt: guestAuthor.name, loading: 'lazy' })
          : el('span', { className: 'author-photo author-initials', 'aria-hidden': 'true', text: initials }),
        el('div', { className: 'author-text' }, [
          el('p', { className: 'author-eyebrow', text: 'About the author' }),
          el('p', { className: 'author-name' }, [guestAuthor.page ? el('a', { href: guestAuthor.page, text: guestAuthor.name }) : doc.createTextNode(guestAuthor.name)]),
          guestAuthor.role ? el('p', { className: 'author-role', text: guestAuthor.role }) : null,
          guestAuthor.bio ? el('p', { className: 'author-bio', text: guestAuthor.bio }) : null,
          guestAuthor.page ? el('a', { className: 'author-more', href: guestAuthor.page, text: 'More articles by ' + guestAuthor.name.split(/\s+/)[0] }) : null
        ])
      ]);
      singleBody.parentNode.insertBefore(box, singleBody.nextSibling);
    }
    // Reading time (about 200 words a minute)
    var words = (singleBody.textContent.match(/\S+/g) || []).length;
    var metaRow = single.querySelector('.post-meta');
    if (metaRow && words > 60) {
      metaRow.insertBefore(el('span', { 'aria-hidden': 'true', className: 'sep' }), metaRow.querySelector('.item-control'));
      metaRow.insertBefore(el('span', { className: 'reading-time', text: Math.max(1, Math.round(words / 200)) + ' min read' }), metaRow.querySelector('.item-control'));
    }
    // The first real paragraph reads as an introduction
    var firstText = textLines(singleBody).filter(function (l) { return l.text.trim().length > 40; })[0];
    if (firstText) {
      var host = firstText.nodes[0].parentNode;
      while (host !== singleBody && !BLOCK_TAGS.test(host.tagName)) host = host.parentNode;
      if (host !== singleBody && /^(P|DIV)$/.test(host.tagName) && host.textContent.trim().length < 700) host.classList.add('lead-para');
    }
    // "In this article": contents box for long articles with 3 or more headings
    var heads = [].slice.call(singleBody.querySelectorAll('h2, h3')).filter(function (h) { return h.textContent.trim(); });
    if (heads.length >= 3) {
      var tocList = el('ol', { className: 'toc-list' });
      heads.forEach(function (h, i) {
        if (!h.id) h.id = 'section-' + (i + 1) + '-' + h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
        tocList.appendChild(el('li', { className: h.tagName === 'H3' ? 'toc-sub' : null }, [el('a', { href: '#' + h.id, text: h.textContent.trim() })]));
      });
      singleBody.parentNode.insertBefore(el('nav', { className: 'toc', 'aria-label': 'In this article' }, [
        el('p', { className: 'toc-title', text: 'In this article' }), tocList]), singleBody);
    }
  }

  // ---------------------------------------------------------------- branch offices
  // One gadget (Layout > Branch offices) lists every branch. It shows on the Branches page
  // (/p/branches.html) and on any page containing <div class="u-branches"></div> (e.g. About).
  var BRANCH_KEYS = { region: 'region', county: 'region', address: 'address', location: 'address', contact: 'contact',
    'contact person': 'contact', secretary: 'contact', phone: 'phone', tel: 'phone', telephone: 'phone', mobile: 'phone',
    email: 'email', 'e-mail': 'email', whatsapp: 'whatsapp', hours: 'hours', 'opening hours': 'hours', 'office hours': 'hours',
    map: 'map', directions: 'map', photo: 'photo', image: 'photo', picture: 'photo', notes: 'notes', note: 'notes' };
  function parseBranch(li) {
    var b = { notes: [] };
    var rows = [];
    // details may be separated by <br>, by blocks, or simply typed on new lines in the gadget
    textLines(li).forEach(function (line) { rows = rows.concat(line.text.split(/\r?\n/)); });
    rows.forEach(function (t) {
      t = t.replace(/\u00a0/g, ' ').trim();
      if (!t) return;
      var m = t.match(/^([A-Za-z][A-Za-z -]{0,20}?)\s*:\s*(.+)$/);
      var key = m ? BRANCH_KEYS[m[1].trim().toLowerCase()] : null;
      if (key === 'notes') b.notes.push(m[2].trim());
      else if (key) b[key] = m[2].trim();
      else if (!b.name) b.name = t;
      else b.notes.push(t);
    });
    var img = li.querySelector('img');
    if (!b.photo && img) b.photo = img.src;
    return b.name ? b : null;
  }
  function branchCard(b, level) {
    var digits = function (v) { return (v || '').replace(/[^\d+]/g, ''); };
    var mapUrl = b.map && /^https?:/.test(b.map) ? b.map : (b.address ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(b.name + ', ' + b.address) : '');
    var actions = el('div', { className: 'branch-actions' });
    var action = function (cls, href, label, icon, external) {
      var a = el('a', { className: 'branch-btn ' + cls, href: href, rel: external ? 'noopener' : null, target: external ? '_blank' : null,
        'aria-label': label + ' (' + b.name + ')' }, [iconSvg(icon)]);
      a.appendChild(doc.createTextNode(label));
      actions.appendChild(a);
    };
    if (b.phone) action('branch-call', 'tel:' + digits(b.phone), 'Call', 'phone');
    if (b.email) action('branch-email', 'mailto:' + b.email, 'Email', 'email');
    if (b.whatsapp) action('branch-whatsapp', 'https://wa.me/' + digits(b.whatsapp).replace(/^\+/, ''), 'WhatsApp', 'whatsapp', true);
    if (mapUrl) action('branch-map', mapUrl, 'Directions', 'pin', true);
    var details = el('dl', { className: 'branch-details' });
    var row = function (label, value, href) {
      if (!value) return;
      details.appendChild(el('dt', { text: label }));
      details.appendChild(el('dd', null, [href ? el('a', { href: href, text: value }) : doc.createTextNode(value)]));
    };
    row('Address', b.address);
    row('Contact', b.contact);
    row('Phone', b.phone, b.phone ? 'tel:' + digits(b.phone) : null);
    row('Email', b.email, b.email ? 'mailto:' + b.email : null);
    row('Hours', b.hours);
    return el('article', { className: 'branch-card', 'data-region': b.region || '' }, [
      b.photo ? el('img', { className: 'branch-photo', src: sized(b.photo, 640, 360), alt: b.name, loading: 'lazy' }) : null,
      el('div', { className: 'branch-body' }, [
        b.region ? el('span', { className: 'badge badge-soft branch-region', text: b.region }) : null,
        el(level || 'h3', { className: 'branch-name', text: b.name }),
        details,
        b.notes.length ? el('p', { className: 'branch-notes', text: b.notes.join(' ') }) : null,
        actions
      ])
    ]);
  }
  var branchItems = [].slice.call(doc.querySelectorAll('.branch-data .branch-list > li')).map(parseBranch).filter(Boolean);
  var branchHost = doc.querySelector('.post-body .u-branches') ||
    (/\/p\/branch(es)?\.html$/i.test(window.location.pathname) ? doc.querySelector('.post-single .post-body') : null);
  if (branchHost) {
    var bBox = branchHost.classList.contains('u-branches') ? branchHost : branchHost.appendChild(el('div', { className: 'u-branches' }));
    if (!branchItems.length) {
      bBox.appendChild(el('p', { className: 'feed-status', text: 'Branch office details will be added here soon.' }));
    } else {
      var grid = el('div', { className: 'branch-grid' });
      branchItems.forEach(function (b) { grid.appendChild(branchCard(b, 'h2')); });
      if (branchItems.length > 3) {
        var regions = branchItems.map(function (b) { return b.region; }).filter(function (r, i, a) { return r && a.indexOf(r) === i; }).sort();
        var search = el('input', { type: 'search', className: 'branch-search', placeholder: 'Search by town, university or name…', 'aria-label': 'Search branches' });
        var select = regions.length > 1 ? el('select', { className: 'branch-region-select', 'aria-label': 'Filter by region' },
          [el('option', { value: '', text: 'All regions' })].concat(regions.map(function (r) { return el('option', { value: r, text: r }); }))) : null;
        var count = el('p', { className: 'branch-count', 'aria-live': 'polite' });
        var apply = function () {
          var q = search.value.trim().toLowerCase(), reg = select ? select.value : '', shown = 0;
          [].forEach.call(grid.children, function (card) {
            var ok = (!q || card.textContent.toLowerCase().indexOf(q) !== -1) && (!reg || card.getAttribute('data-region') === reg);
            card.hidden = !ok;
            if (ok) shown++;
          });
          count.textContent = shown === branchItems.length ? branchItems.length + ' branches' : 'Showing ' + shown + ' of ' + branchItems.length + ' branches';
        };
        search.addEventListener('input', apply);
        if (select) select.addEventListener('change', apply);
        bBox.appendChild(el('div', { className: 'branch-filter' }, [search, select, count]));
        apply();
      }
      bBox.appendChild(grid);
    }
  }

  // ---------------------------------------------------------------- structured data for Google
  // schema.org JSON-LD: who the organisation is, the website, and on posts the article and
  // its breadcrumb. Built from what is on the page, so it is always in step with the gadgets.
  function addJsonLd(data) {
    var tag = doc.createElement('script');
    tag.type = 'application/ld+json';
    tag.textContent = JSON.stringify(data);
    doc.head.appendChild(tag);
  }
  var homeUrl = window.location.protocol + '//' + window.location.host + '/';
  var siteMeta = doc.querySelector('meta[property="og:site_name"]');
  var logoImg = doc.querySelector('.brand-logo img, .brand-mark img');
  var siteName = (siteMeta && siteMeta.getAttribute('content')) ||
    (doc.querySelector('.brand-name') && doc.querySelector('.brand-name').textContent.trim()) ||
    (logoImg && logoImg.getAttribute('alt')) || doc.title;
  var org = { '@type': 'WorkersUnion', '@id': homeUrl + '#organization', name: siteName, url: homeUrl };
  if (logoImg && logoImg.src) org.logo = { '@type': 'ImageObject', url: logoImg.src };
  var sameAs = [].slice.call(doc.querySelectorAll('.topbar-social .widget-content a[href^="http"]')).map(function (a) { return a.href; });
  if (sameAs.length) org.sameAs = sameAs;
  // Branch offices, on the pages that show them
  if (branchHost && branchItems.length) {
    org.subOrganization = branchItems.map(function (b) {
      var o = { '@type': 'Organization', name: siteName + ' – ' + b.name };
      if (b.address) o.address = { '@type': 'PostalAddress', streetAddress: b.address, addressRegion: b.region || undefined };
      if (b.phone) o.telephone = b.phone;
      if (b.email) o.email = b.email;
      return o;
    });
  }
  function personLd(a) {
    var person = { '@type': 'Person', name: a.name };
    if (a.role) person.jobTitle = a.role;
    if (a.photo) person.image = a.photo;
    if (a.page) person.url = a.page;
    if (a.bio) person.description = a.bio;
    return person;
  }
  var graph = [org, { '@type': 'WebSite', '@id': homeUrl + '#website', url: homeUrl, name: siteName, publisher: { '@id': org['@id'] } }];
  var article = doc.querySelector('.pt-item .post-single');
  if (article) {
    var canonical = doc.querySelector('link[rel="canonical"]');
    var pageUrl = canonical ? canonical.href : window.location.href.split(/[?#]/)[0];
    var h1 = article.querySelector('.post-title');
    var headline = h1 ? h1.textContent.trim() : doc.title;
    var published = article.querySelector('time.published');
    var authorEl = article.querySelector('.post-author');
    var authorName = authorEl ? authorEl.textContent.trim() : '';
    var bodyImg = article.querySelector('.post-body img');
    var ogImage = doc.querySelector('meta[property="og:image"]');
    var news = {
      '@type': 'NewsArticle',
      '@id': pageUrl + '#article',
      headline: headline.length > 110 ? headline.slice(0, 107) + '…' : headline,
      mainEntityOfPage: pageUrl,
      url: pageUrl,
      publisher: { '@id': org['@id'] },
      author: guestAuthor ? personLd(guestAuthor) :
        authorName && authorName !== 'Unknown' ? { '@type': 'Person', name: authorName } : { '@id': org['@id'] }
    };
    if (published) news.datePublished = news.dateModified = published.getAttribute('datetime');
    var imgUrl = bodyImg ? sized(bodyImg.src, 1200, 675) : ogImage ? ogImage.getAttribute('content') : '';
    if (imgUrl) news.image = [imgUrl];
    var crumbLabel = article.querySelector('.breadcrumb .crumb-label');
    if (crumbLabel) news.articleSection = crumbLabel.textContent.trim();
    graph.push(news);
    var crumbs = [{ '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl }];
    if (crumbLabel) crumbs.push({ '@type': 'ListItem', position: 2, name: crumbLabel.textContent.trim(), item: crumbLabel.href });
    crumbs.push({ '@type': 'ListItem', position: crumbs.length + 1, name: headline, item: pageUrl });
    graph.push({ '@type': 'BreadcrumbList', itemListElement: crumbs });
  }
  addJsonLd({ '@context': 'https://schema.org', '@graph': graph });

  // Blogger shows "Unknown" when a post's author profile is private: hide it
  var authors = doc.querySelectorAll('.post-author');
  for (var au = 0; au < authors.length; au++) {
    if (authors[au].textContent.trim() === 'Unknown') {
      var sep = authors[au].nextElementSibling;
      authors[au].style.display = 'none';
      if (sep && sep.classList.contains('sep')) sep.style.display = 'none';
    }
  }

  // Footer certifications strip: hidden until at least one certificate is added
  var certs = doc.querySelector('.footer-certs');
  if (certs && !certs.querySelector('.widget-content li, .widget-content img')) certs.hidden = true;

  // Hide homepage bands whose section has no gadget (e.g. "numbers" left empty)
  var optional = doc.querySelectorAll('.js-hide-empty');
  for (var o = 0; o < optional.length; o++) {
    if (!optional[o].querySelector('.widget')) optional[o].hidden = true;
  }

  // "Join today" box on posts points wherever the header's Join button points
  var joinSource = doc.querySelector('.header-cta .widget-content a');
  var joinLinks = doc.querySelectorAll('.js-join-link');
  for (var j = 0; j < joinLinks.length; j++) {
    if (joinSource) {
      joinLinks[j].setAttribute('href', joinSource.getAttribute('href'));
    } else {
      joinLinks[j].parentNode.style.display = 'none';
    }
  }

  // ---------------------------------------------------------------- share + print (every post and page)
  function enc(v) { return encodeURIComponent(v || ''); }
  var NETWORKS = [
    ['whatsapp', 'WhatsApp', function (u, t) { return 'https://api.whatsapp.com/send?text=' + enc(t + ' ' + u); }],
    ['facebook', 'Facebook', function (u) { return 'https://www.facebook.com/sharer/sharer.php?u=' + enc(u); }],
    ['x', 'X (Twitter)', function (u, t) { return 'https://x.com/intent/tweet?url=' + enc(u) + '&text=' + enc(t); }],
    ['linkedin', 'LinkedIn', function (u) { return 'https://www.linkedin.com/sharing/share-offsite/?url=' + enc(u); }],
    ['telegram', 'Telegram', function (u, t) { return 'https://t.me/share/url?url=' + enc(u) + '&text=' + enc(t); }],
    ['reddit', 'Reddit', function (u, t) { return 'https://www.reddit.com/submit?url=' + enc(u) + '&title=' + enc(t); }],
    ['pinterest', 'Pinterest', function (u, t, img) {
      return 'https://www.pinterest.com/pin/create/button/?url=' + enc(u) + (img ? '&media=' + enc(img) : '') + '&description=' + enc(t);
    }],
    ['email', 'Email', function (u, t) { return 'mailto:?subject=' + enc(t) + '&body=' + enc(t + '\n\n' + u); }]
  ];
  function shareButton(cls, label, icon, showText) {
    var btn = el('button', { type: 'button', className: 'u-share-btn ' + cls, title: label, 'aria-label': label }, [iconSvg(icon)]);
    btn.appendChild(el('span', { className: showText ? 'u-share-text' : 'u-share-text sr-only', text: label }));
    return btn;
  }
  var shareBars = doc.querySelectorAll('.u-share');
  for (var sb = 0; sb < shareBars.length; sb++) {
    (function (bar) {
      var holder = bar.querySelector('.u-share-list');
      if (!holder) return;
      // Clean address: no ?m=1 / tracking parameters / #anchors
      var url = (bar.getAttribute('data-url') || window.location.href).split(/[?#]/)[0];
      var title = (bar.getAttribute('data-title') || doc.title).trim();
      var article = bar.parentNode;
      var firstImg = article.querySelector('.post-body img');
      var img = firstImg ? firstImg.src : '';
      holder.textContent = '';
      NETWORKS.forEach(function (n) {
        var link = el('a', { className: 'u-share-btn u-share-' + n[0], href: n[2](url, title, img), title: 'Share on ' + n[1],
          'aria-label': 'Share on ' + n[1], rel: 'nofollow noopener', target: n[0] === 'email' ? null : '_blank' }, [iconSvg(n[0])]);
        link.appendChild(el('span', { className: 'u-share-text sr-only', text: n[1] }));
        holder.appendChild(link);
      });
      // Phones: the system share sheet reaches every installed app (Instagram, Signal, SMS...)
      if (navigator.share) {
        var more = shareButton('u-share-native', 'More apps', 'share');
        more.addEventListener('click', function () {
          navigator.share({ title: title, url: url })['catch'](function () {});
        });
        holder.appendChild(more);
      }
      var copyBtn = shareButton('u-share-copy', 'Copy link', 'link', true);
      copyBtn.addEventListener('click', function () {
        var text = copyBtn.querySelector('.u-share-text');
        var done = function () {
          text.textContent = 'Copied!';
          setTimeout(function () { text.textContent = 'Copy link'; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link:', url); });
        } else {
          window.prompt('Copy this link:', url);
        }
      });
      holder.appendChild(copyBtn);
      var printBtn = shareButton('u-share-print', 'Print', 'print', true);
      printBtn.addEventListener('click', function () { window.print(); });
      holder.appendChild(printBtn);
    })(shareBars[sb]);
  }
  // Load every lazy image in the post before printing, so none print blank
  window.addEventListener('beforeprint', function () {
    var imgs = doc.querySelectorAll('.post-body img[loading]');
    for (var k = 0; k < imgs.length; k++) imgs[k].removeAttribute('loading');
  });

  // ---------------------------------------------------------------- language (Google Translate)
  var picker = doc.querySelector('.lang-picker');
  var langLinks = picker ? picker.querySelectorAll('a[data-lang]') : [];
  if (picker && langLinks.length) {
    // The first language in the gadget is the language the blog is written in
    var original = langLinks[0].getAttribute('data-lang');
    var saved = doc.cookie.match(/(?:^|;\s*)googtrans=\/[^\/;]*\/([^;]+)/);
    var active = saved ? decodeURIComponent(saved[1]) : original;
    var current = picker.querySelector('.lang-current');
    var langToggle = picker.querySelector('.lang-toggle');
    for (var ll = 0; ll < langLinks.length; ll++) {
      var code = langLinks[ll].getAttribute('data-lang');
      langLinks[ll].setAttribute('hreflang', code);
      if (code === active) {
        langLinks[ll].setAttribute('aria-current', 'true');
        current.textContent = langLinks[ll].textContent.trim();
        current.setAttribute('data-short', code.split('-')[0].toUpperCase());
      }
    }
    if (!current.getAttribute('data-short')) current.setAttribute('data-short', original.split('-')[0].toUpperCase());
    var setOpen = function (open) {
      picker.classList.toggle('is-open', open);
      langToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    langToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!picker.classList.contains('is-open'));
    });
    doc.addEventListener('click', function (e) { if (!picker.contains(e.target)) setOpen(false); });
    doc.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && picker.classList.contains('is-open')) { setOpen(false); langToggle.focus(); }
    });
    var setLanguage = function (code) {
      var host = window.location.hostname;
      var domains = ['', host, '.' + host];
      var parts = host.split('.');
      if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
      domains.forEach(function (d) {
        doc.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
      });
      if (code !== original) doc.cookie = 'googtrans=/' + original + '/' + code + '; path=/';
      window.location.reload();
    };
    picker.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('a[data-lang]') : null;
      if (!t) return;
      e.preventDefault();
      var code = t.getAttribute('data-lang');
      if (code === active) { setOpen(false); return; }
      setLanguage(code);
    });
    // Google's translator reads the googtrans cookie when its script loads. The footer Translate
    // gadget loads that script; if that gadget was removed, load it here when a language is chosen.
    if (active !== original && !doc.getElementById('google_translate_element')) {
      doc.body.appendChild(el('div', { id: 'union-translate', hidden: 'hidden' }));
      window.__unionTranslateInit = function () {
        new window.google.translate.TranslateElement({ pageLanguage: original, autoDisplay: false }, 'union-translate');
      };
      doc.body.appendChild(el('script', { src: 'https://translate.google.com/translate_a/element.js?cb=__unionTranslateInit' }));
    }
  }

  // ---------------------------------------------------------------- accessibility + image SEO
  // Images in posts without a description get one (the photo caption, else the post title):
  // Google reads it to understand the image, screen readers read it aloud
  var postTitle = doc.querySelector('.post-single .post-title');
  var bodyImgs = doc.querySelectorAll('.post-body img');
  for (var bi = 0; bi < bodyImgs.length; bi++) {
    if ((bodyImgs[bi].getAttribute('alt') || '').trim()) continue;
    var capTable = bodyImgs[bi].closest ? bodyImgs[bi].closest('.tr-caption-container') : null;
    var caption = capTable ? capTable.querySelector('.tr-caption') : null;
    var altText = caption && caption.textContent.trim() ? caption.textContent.trim() : postTitle ? postTitle.textContent.trim() : '';
    if (altText) bodyImgs[bi].setAttribute('alt', altText);
  }
  var frames = doc.querySelectorAll('.post-body iframe:not([title]), .widget-content iframe:not([title])');
  for (var fi = 0; fi < frames.length; fi++) {
    frames[fi].setAttribute('title', /youtube|youtu\.be|vimeo|dailymotion|facebook\.com\/plugins\/video/.test(frames[fi].src) ? 'Embedded video' : 'Embedded content');
  }
  // Picture-only links that repeat the title link next to them: skipped by screen readers and keyboards
  var picLinks = doc.querySelectorAll('.popular-posts .item-thumbnail a');
  for (var pl = 0; pl < picLinks.length; pl++) {
    picLinks[pl].setAttribute('aria-hidden', 'true');
    picLinks[pl].setAttribute('tabindex', '-1');
  }
  // Google Translate builds its language box later: give it a name when it appears
  var labelTranslate = function () {
    var combo = doc.querySelector('.goog-te-combo, #google_translate_element select');
    if (combo && !combo.getAttribute('aria-label')) combo.setAttribute('aria-label', 'Translate this site');
  };
  labelTranslate();
  [1500, 4000, 8000].forEach(function (ms) { setTimeout(labelTranslate, ms); });

  // Footer year
  var years = doc.querySelectorAll('.js-year');
  for (var y = 0; y < years.length; y++) years[y].textContent = String(new Date().getFullYear());
})();
