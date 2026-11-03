// Murdock Emisembe Foundation theme behaviour. Plain JavaScript, no libraries.
// Menu and submenus, hero slider, photo backgrounds, gallery lightbox, story
// excerpts, related stories, share/copy link, scroll reveal and back-to-top.
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  // ---------------------------------------------------------------- images
  // Ask Blogger's image server for a sensible size (Google-hosted images only).
  var googleImage = /^(https?:)?\/\/([a-z0-9-]+\.)*(googleusercontent\.com|blogspot\.com|ggpht\.com)\//i;
  function sized(src, size) {
    if (!src || !googleImage.test(src)) return src;
    return src
      .replace(/\/s\d+(-[a-z0-9]+)*\//i, '/' + size + '/')
      .replace(/\/w\d+-h\d+(-[a-z0-9]+)*\//i, '/' + size + '/')
      .replace(/=s\d+(-[a-z0-9]+)*$/i, '=' + size)
      .replace(/=w\d+-h\d+(-[a-z0-9]+)*$/i, '=' + size);
  }
  var youtubeThumb = /^(https?:\/\/(img\.youtube\.com|i\.ytimg\.com)\/vi\/[^/]+\/)[a-z]*default\.jpg$/i;
  // Card and gallery photos: a sharp, UNCROPPED copy (posters keep their text)
  $all('img.js-resize').forEach(function (img) {
    var src = img.getAttribute('src') || '';
    var out = youtubeThumb.test(src) ? src.replace(youtubeThumb, '$1hqdefault.jpg') : sized(src, 's900');
    if (out !== src) img.setAttribute('src', out);
  });
  $all('.gallery-link img').forEach(function (img) {
    var src = img.getAttribute('src') || '';
    var out = sized(src, 's1000');
    if (out !== src) img.setAttribute('src', out);
  });

  // Photo frames: fill the frame with a blurred copy of the picture behind it
  function fillFrame(frame) {
    var img = frame.querySelector('img');
    var src = img && img.getAttribute('src');
    if (src) frame.style.backgroundImage = 'url("' + src.replace(/"/g, '%22') + '")';
  }
  $all('.fit-frame').forEach(fillFrame);

  // Photos inside a post: Blogger inserts them small (s320/s400). Load a large copy
  // and show it across the column; originals smaller than ~60% of it keep their size.
  $all('.post-body img').forEach(function (img) {
    var src = img.getAttribute('src') || '';
    var w = parseInt(img.getAttribute('width'), 10);
    if (!googleImage.test(src) || (w && w < 120)) return;  // icons, emoji, tracking pixels
    img.classList.add('post-photo');
    img.removeAttribute('width');
    img.removeAttribute('height');
    var big = sized(src, 's1600');
    if (big !== src) img.setAttribute('src', big);
    var check = function () {
      var col = img.parentNode && img.closest('.post-body');
      if (col && img.naturalWidth && img.naturalWidth < col.clientWidth * 0.6) img.classList.add('is-small');
    };
    if (img.complete) check(); else img.addEventListener('load', check);
  });
  $all('img.js-resize-square').forEach(function (img) {
    var src = img.getAttribute('src') || '';
    var out = sized(src, 's128-c');
    if (out !== src) img.setAttribute('src', out);
  });

  // Photo sections take their background from a hidden Image gadget (editable in Layout)
  $all('[data-bg-from]').forEach(function (band) {
    var img = $('#' + band.getAttribute('data-bg-from') + ' img');
    var src = img && img.getAttribute('src');
    if (src) band.style.backgroundImage = 'url("' + sized(src, 'w1920').replace(/"/g, '%22') + '")';
  });

  // ---------------------------------------------------------------- header and menu
  var header = $('#site-header');
  var toggle = $('#nav-toggle');
  var drawer = $('#site-nav');
  var desktop = window.matchMedia ? window.matchMedia('(min-width: 1100px)') : null;

  // Menu items written as "_Name" in the Menu gadget become a dropdown under the item above them
  var menu = $('.menu');
  if (menu) {
    var parent = null;
    $all('.menu > li', menu).forEach(function (li) {
      var a = li.querySelector('a');
      if (!a) return;
      var label = a.textContent.replace(/^\s+|\s+$/g, '');
      if (label.charAt(0) === '_' && parent) {
        a.textContent = label.replace(/^_+\s*/, '');
        var sub = parent.querySelector('.submenu');
        if (!sub) {
          sub = el('ul', 'submenu');
          parent.appendChild(sub);
          parent.classList.add('has-sub');
          var btn = el('button', 'sub-toggle');
          btn.type = 'button';
          btn.setAttribute('aria-expanded', 'false');
          btn.setAttribute('aria-label', 'Show more under ' + parent.querySelector('a').textContent);
          parent.insertBefore(btn, sub);
          (function (item, button) {  // capture this item: `parent` changes as the loop goes on
            button.addEventListener('click', function (e) {
              e.stopPropagation();
              var open = !item.classList.contains('sub-open');
              $all('.menu .has-sub.sub-open').forEach(function (o) { o.classList.remove('sub-open'); });
              if (open) item.classList.add('sub-open');
              button.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
          })(parent, btn);
        }
        sub.appendChild(li);
      } else {
        a.textContent = label.replace(/^_+\s*/, '');
        parent = li;
      }
    });
    doc.addEventListener('click', function () {
      $all('.menu .has-sub.sub-open').forEach(function (o) { o.classList.remove('sub-open'); });
    });
    // Mark the current page in the menu
    var here = location.pathname + location.hash;
    $all('a', menu).forEach(function (a) {
      var url = a.getAttribute('href') || '';
      try { url = new URL(url, location.href); } catch (err) { return; }
      if (url.host === location.host && url.pathname + url.hash === here && url.pathname !== '/') a.classList.add('is-current');
    });
  }

  function setMenu(open) {
    if (!header || !toggle) return;
    header.classList.toggle('nav-open', open);
    root.classList.toggle('no-scroll', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (header && toggle && drawer) {
    toggle.addEventListener('click', function () { setMenu(!header.classList.contains('nav-open')); });
    drawer.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== drawer) {
        if (t.tagName === 'A') { setMenu(false); return; }
        t = t.parentNode;
      }
    });
    doc.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && header.classList.contains('nav-open')) {
        setMenu(false);
        toggle.focus();
      }
    });
    if (desktop) {
      var onChange = function () { fitNav(); if (desktop.matches && !root.classList.contains('nav-collapse')) setMenu(false); };
      if (desktop.addEventListener) desktop.addEventListener('change', onChange);
      else if (desktop.addListener) desktop.addListener(onChange);
    }
  }

  // Wide screens show the menu in the header, but only if it fits next to the logo
  // (long menus or wide logos). Otherwise keep the hamburger, as on phones.
  function fitNav() {
    var inner = header && $('.header-inner', header);
    if (!inner) return;
    root.classList.remove('nav-collapse');
    if (!desktop || !desktop.matches) return;
    if (inner.scrollWidth > inner.clientWidth + 1) root.classList.add('nav-collapse');
    else if (header.classList.contains('nav-open')) setMenu(false);
  }
  fitNav();
  var fitTimer = null;
  window.addEventListener('resize', function () { clearTimeout(fitTimer); fitTimer = setTimeout(fitNav, 120); });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fitNav);
  var logo = $('.brand img');
  if (logo && !logo.complete) logo.addEventListener('load', fitNav);

  // Header shadow and back-to-top button
  var backTop = $('#back-to-top');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.pageYOffset || root.scrollTop;
      if (header) header.classList.toggle('is-scrolled', y > 8);
      if (backTop) backTop.classList.toggle('is-visible', y > 700);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------------------------------------------------------------- hero slider
  var hero = $('#home');
  var slides = $all('#main-slider > .widget');
  var pics = $all('#main-slider-images > .widget');
  var controls = $('#hero-controls');
  if (hero && slides.length && getComputedStyle(hero).display !== 'none') {
    var current = 0;
    var timer = null;
    var dots = [];
    var show = function (i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        s.classList.toggle('is-active', n === current);
        s.setAttribute('aria-hidden', n === current ? 'false' : 'true');
      });
      pics.forEach(function (p, n) { p.classList.toggle('is-active', pics.length && n === current % pics.length); });
      dots.forEach(function (d, n) {
        d.classList.remove('is-active');
        d.setAttribute('aria-current', n === current ? 'true' : 'false');
        if (n === current) { void d.offsetWidth; d.classList.add('is-active'); }
      });
    };
    var play = function () {
      if (reduceMotion || slides.length < 2) return;
      clearInterval(timer);
      timer = setInterval(function () { show(current + 1); }, 7000);
    };
    var pause = function () { clearInterval(timer); timer = null; };

    if (controls && slides.length > 1) {
      var prev = el('button', 'hero-arrow', '‹');
      prev.type = 'button';
      prev.setAttribute('aria-label', 'Previous slide');
      var next = el('button', 'hero-arrow', '›');
      next.type = 'button';
      next.setAttribute('aria-label', 'Next slide');
      var dotWrap = el('div', 'hero-dots');
      slides.forEach(function (s, n) {
        var d = el('button', 'hero-dot');
        d.type = 'button';
        d.setAttribute('aria-label', 'Show slide ' + (n + 1));
        d.addEventListener('click', function () { show(n); play(); });
        dots.push(d);
        dotWrap.appendChild(d);
      });
      prev.addEventListener('click', function () { show(current - 1); play(); });
      next.addEventListener('click', function () { show(current + 1); play(); });
      controls.appendChild(prev);
      controls.appendChild(dotWrap);
      controls.appendChild(next);
    }
    hero.addEventListener('mouseenter', function () { hero.classList.add('is-paused'); pause(); });
    hero.addEventListener('mouseleave', function () { hero.classList.remove('is-paused'); play(); });
    hero.addEventListener('focusin', function () { hero.classList.add('is-paused'); pause(); });
    hero.addEventListener('focusout', function () { hero.classList.remove('is-paused'); play(); });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) pause(); else play(); });
    // Swipe on phones
    var startX = null;
    hero.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) { show(current + (dx < 0 ? 1 : -1)); play(); }
      startX = null;
    });
    hero.classList.add('is-ready');
    show(0);
    play();
  }

  // ---------------------------------------------------------------- stories
  // Card excerpts: plain text from the post body (kept inert in a <template>)
  $all('template.js-excerpt').forEach(function (tpl) {
    var out = tpl.previousElementSibling;
    if (!out || !out.classList.contains('post-card-excerpt')) return;
    var holder = el('div');
    holder.appendChild(tpl.content ? tpl.content.cloneNode(true) : doc.createTextNode(tpl.textContent));
    $all('script, style, noscript, iframe, .separator', holder).forEach(function (n) { n.parentNode.removeChild(n); });
    var text = (holder.textContent || '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
    if (text.length > 150) text = text.slice(0, 150).replace(/\s+\S*$/, '') + '…';
    out.textContent = text;
    tpl.parentNode.removeChild(tpl);
  });

  // Dates: "12 October 2026" style, whatever the blog's timestamp setting
  $all('time.js-date').forEach(function (t) {
    var when = new Date(t.getAttribute('datetime'));
    if (!isNaN(when.getTime())) {
      t.textContent = when.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  });

  // Related stories from the post's first label (same-site JSON feed)
  var related = $('.related');
  var firstLabel = related && $('.related-label', related);
  if (related && firstLabel && window.fetch) {
    var label = firstLabel.getAttribute('data-label');
    var self = (related.getAttribute('data-url') || '').replace(/^https?:/, '');
    fetch('/feeds/posts/default/-/' + encodeURIComponent(label) + '?alt=json&max-results=6')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var entries = (data && data.feed && data.feed.entry) || [];
        var grid = $('.related-grid', related);
        var count = 0;
        entries.forEach(function (entry) {
          if (count >= 3) return;
          var link = (entry.link || []).filter(function (l) { return l.rel === 'alternate'; })[0];
          if (!link || link.href.replace(/^https?:/, '') === self) return;
          var card = el('a', 'related-card');
          card.href = link.href;
          var thumb = entry.media$thumbnail && entry.media$thumbnail.url;
          if (thumb) {
            var frame = el('span', 'fit-frame');
            var img = el('img');
            img.src = sized(thumb, 's600');
            img.alt = '';
            img.loading = 'lazy';
            frame.appendChild(img);
            card.appendChild(frame);
            fillFrame(frame);
          } else {
            card.appendChild(el('span', 'related-ph'));
          }
          card.appendChild(el('span', 'related-name', entry.title ? entry.title.$t : 'Story'));
          grid.appendChild(card);
          count++;
        });
        if (count) related.hidden = false;
      })
      .catch(function () { /* no related stories: section stays hidden */ });
  }

  // Copy-link share button
  $all('[data-copy-url]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var url = btn.getAttribute('data-copy-url');
      var label = btn.innerHTML;
      var done = function () {
        btn.textContent = 'Link copied';
        setTimeout(function () { btn.innerHTML = label; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link:', url); });
      } else {
        window.prompt('Copy this link:', url);
      }
    });
  });

  // ---------------------------------------------------------------- gallery lightbox
  var box = $('#lightbox');
  var links = $all('.gallery-link');
  if (box && links.length) {
    var big = $('.lightbox-img', box);
    var at = 0;
    var opener = null;
    var openAt = function (i) {
      at = (i + links.length) % links.length;
      var img = links[at].querySelector('img');
      big.src = sized(links[at].getAttribute('href'), 's1600');
      big.alt = img ? img.alt : '';
    };
    var close = function () {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      root.classList.remove('no-scroll');
      if (opener) opener.focus();
    };
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        opener = a;
        openAt(i);
        box.classList.add('is-open');
        box.setAttribute('aria-hidden', 'false');
        root.classList.add('no-scroll');
        $('.lightbox-close', box).focus();
      });
    });
    $('.lightbox-close', box).addEventListener('click', close);
    $('.lightbox-prev', box).addEventListener('click', function () { openAt(at - 1); });
    $('.lightbox-next', box).addEventListener('click', function () { openAt(at + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    doc.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape' || e.key === 'Esc') close();
      else if (e.key === 'ArrowLeft') openAt(at - 1);
      else if (e.key === 'ArrowRight') openAt(at + 1);
    });
    if (links.length < 2) {
      $('.lightbox-prev', box).hidden = true;
      $('.lightbox-next', box).hidden = true;
    }
  }

  // ---------------------------------------------------------------- scroll reveal
  if ('IntersectionObserver' in window && !reduceMotion) {
    var targets = $all('.reveal, .card-grid > .widget, .gallery > .widget, .team-grid > .widget, .logo-grid > .widget, .post-grid > .post-card');
    targets.forEach(function (t) {
      t.classList.add('reveal');
      var i = Array.prototype.indexOf.call(t.parentNode.children, t);
      if (!t.classList.contains('section') && i > 0) t.style.transitionDelay = Math.min(i, 5) * 80 + 'ms';
    });
    root.classList.add('js-reveal');
    var io = new IntersectionObserver(function (items) {
      items.forEach(function (item) {
        if (item.isIntersecting) {
          item.target.classList.add('is-visible');
          io.unobserve(item.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (t) { io.observe(t); });
    window.addEventListener('beforeprint', function () { targets.forEach(function (t) { t.classList.add('is-visible'); }); });
  }

  // Footer year
  $all('.js-year').forEach(function (y) { y.textContent = String(new Date().getFullYear()); });
})();
