// River Musa theme behaviour: menu and sub-menus, social icons, videos (host card,
// slideshow, posts, episode cards), downloads, sticky-header shadow, brand initials,
// hero title accent, copy-link button and footer year. No dependencies.
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;

  // Sub-menus: in the Link List, a link whose name starts with "_" becomes a
  // sub-item of the closest link above it without "_".
  var menuList = doc.querySelector('.site-nav .widget-content > ul');
  if (menuList) {
    var parentItem = null;
    var menuItems = Array.prototype.slice.call(menuList.children);
    for (var mi = 0; mi < menuItems.length; mi++) {
      var item = menuItems[mi];
      var link = item.querySelector('a');
      if (!link) continue;
      var label = link.textContent.replace(/^\s+/, '');
      if (label.charAt(0) === '_' && parentItem) {
        link.textContent = label.replace(/^_+\s*/, '');
        var sub = parentItem.querySelector('ul.sub-menu');
        if (!sub) {
          sub = doc.createElement('ul');
          sub.className = 'sub-menu';
          parentItem.appendChild(sub);
          parentItem.classList.add('has-sub');
          var subToggle = doc.createElement('button');
          subToggle.type = 'button';
          subToggle.className = 'sub-toggle';
          subToggle.setAttribute('aria-expanded', 'false');
          subToggle.setAttribute('aria-label', 'Show ' + parentItem.querySelector('a').textContent.trim() + ' pages');
          subToggle.innerHTML = '<svg aria-hidden="true" fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" viewBox="0 0 24 24" width="16"><polyline points="6 9 12 15 18 9"/></svg>';
          parentItem.insertBefore(subToggle, sub);
        }
        sub.appendChild(item);
      } else {
        if (label.charAt(0) === '_') link.textContent = label.replace(/^_+\s*/, '');
        parentItem = item;
      }
    }
    menuList.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.sub-toggle') : null;
      if (!btn) return;
      var li = btn.parentNode;
      var open = !li.classList.contains('open');
      var siblings = menuList.querySelectorAll('li.has-sub.open');
      for (var si = 0; si < siblings.length; si++) {
        siblings[si].classList.remove('open');
        siblings[si].querySelector('.sub-toggle').setAttribute('aria-expanded', 'false');
      }
      if (open) li.classList.add('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Social links: add an icon based on the link's address
  var socialIcons = {
    youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><polygon points="10 9 15 12 10 15 10 9"/>',
    tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.6 2.6 2.6 4.6 5 4.8"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    x: '<path d="M4 4l16 16"/><path d="M20 4L4 20"/>',
    whatsapp: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/>',
    spotify: '<circle cx="12" cy="12" r="10"/><path d="M7 9.5c3.5-1 7.5-.7 10.5 1"/><path d="M7.5 12.7c2.9-.8 6-.5 8.5.9"/><path d="M8 15.8c2.3-.6 4.6-.4 6.6.7"/>',
    podcast: '<circle cx="12" cy="11" r="3"/><path d="M8.5 16.5a6 6 0 1 1 7 0"/><path d="M12 14v8"/>',
    email: '<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 6 12 13 2 6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'
  };
  function socialType(href) {
    var h = (href || '').toLowerCase();
    if (h.indexOf('mailto:') === 0) return 'email';
    if (/youtube\.com|youtu\.be/.test(h)) return 'youtube';
    if (/tiktok\.com/.test(h)) return 'tiktok';
    if (/instagram\.com/.test(h)) return 'instagram';
    if (/linkedin\.com/.test(h)) return 'linkedin';
    if (/facebook\.com|fb\.com|fb\.me/.test(h)) return 'facebook';
    if (/(^|\/\/|\.)(x|twitter)\.com/.test(h)) return 'x';
    if (/whatsapp\.com|wa\.me/.test(h)) return 'whatsapp';
    if (/spotify\.com/.test(h)) return 'spotify';
    if (/podcasts\.apple\.com|anchor\.fm|podbean|buzzsprout/.test(h)) return 'podcast';
    return 'link';
  }
  var socialLinks = doc.querySelectorAll('#footer-connect .widget-content a');
  for (var so = 0; so < socialLinks.length; so++) {
    var sl = socialLinks[so];
    if (sl.querySelector('svg')) continue;
    var svg = '<svg aria-hidden="true" class="social-icon" fill="none" height="18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="18">' + socialIcons[socialType(sl.getAttribute('href'))] + '</svg>';
    sl.insertAdjacentHTML('afterbegin', svg);
    if (/^https?:/i.test(sl.getAttribute('href') || '')) {
      sl.setAttribute('target', '_blank');
      sl.setAttribute('rel', 'noopener');
    }
  }

  // ---------- Shared helpers ----------
  var ytPattern = /(?:youtube\.com\/(?:watch\?(?:[^\s"'<>]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{11})/;
  var googleImage = /^https?:\/\/([a-z0-9-]+\.)*(googleusercontent\.com|blogspot\.com|ggpht\.com)\//i;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ytId(text) {
    var m = ytPattern.exec(text || '');
    return m ? m[1] : null;
  }
  function ytFrame(id) {
    var frame = doc.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1';
    frame.title = 'YouTube video';
    frame.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    frame.setAttribute('allowfullscreen', '');
    return frame;
  }
  var PLAY_ICON = '<span class="yt-play-icon" aria-hidden="true"><svg fill="currentColor" height="28" viewBox="0 0 24 24" width="28"><polygon points="8 5 19 12 8 19 8 5"/></svg></span>';
  // A YouTube thumbnail with a play button. The real player loads only when
  // pressed, which keeps pages fast. onPlay(box) is called when it starts.
  function makeVideo(id, label, onPlay) {
    var box = doc.createElement('div');
    box.className = 'yt-lite';
    box.setAttribute('data-yt', id);
    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'yt-lite-play';
    btn.setAttribute('aria-label', label ? 'Play video: ' + label : 'Play video');
    var img = doc.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
    btn.appendChild(img);
    btn.insertAdjacentHTML('beforeend', PLAY_ICON);
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      box.innerHTML = '';
      box.appendChild(ytFrame(id));
      box.classList.add('is-playing');
      if (onPlay) onPlay(box);
    });
    box.appendChild(btn);
    return box;
  }

  // Host card video: a YouTube link (or YouTube embed) in the host card gadget
  // replaces the microphone with the video.
  var hostCard = doc.querySelector('.host-card');
  var hostRole = hostCard ? hostCard.querySelector('.host-role') : null;
  function findVideoId(node) {
    var frames = node.querySelectorAll('iframe');
    for (var fi = 0; fi < frames.length; fi++) {
      var fid = ytId(frames[fi].getAttribute('src'));
      if (fid) { frames[fi].parentNode.removeChild(frames[fi]); return fid; }
    }
    var anchors = node.querySelectorAll('a');
    for (var ai = 0; ai < anchors.length; ai++) {
      var aid = ytId(anchors[ai].getAttribute('href'));
      if (aid) { anchors[ai].parentNode.removeChild(anchors[ai]); return aid; }
    }
    var walker = doc.createTreeWalker(node, 4, null, false);
    var textNode;
    while ((textNode = walker.nextNode())) {
      var tid = ytId(textNode.nodeValue);
      if (tid) {
        textNode.nodeValue = textNode.nodeValue.replace(/\S*(?:youtube\.com|youtu\.be)\S*/, '').replace(/\s+$/, '');
        return tid;
      }
    }
    return null;
  }
  if (hostCard && hostRole) {
    var videoId = findVideoId(hostRole);
    if (videoId) {
      var paras = hostRole.querySelectorAll('p, div');
      for (var pi = 0; pi < paras.length; pi++) {
        if (!paras[pi].textContent.trim() && !paras[pi].querySelector('img')) paras[pi].parentNode.removeChild(paras[pi]);
      }
      var avatarSlot = hostCard.querySelector('.host-avatar');
      var video = makeVideo(videoId, (hostCard.querySelector('.host-name') || {}).textContent);
      video.classList.add('host-video');
      if (avatarSlot) avatarSlot.parentNode.replaceChild(video, avatarSlot);
      else hostCard.insertBefore(video, hostCard.firstChild);
      hostCard.classList.add('has-video');
    }
  }

  // ---------- Slideshow (Link List: name = caption, address = photo or YouTube link) ----------
  function driveFileId(url) {
    var m = /drive\.google\.com\/(?:file\/d\/|open\?(?:[^#]*&)?id=|uc\?(?:[^#]*&)?id=|thumbnail\?(?:[^#]*&)?id=)([A-Za-z0-9_-]{10,})/.exec(url || '');
    return m ? m[1] : null;
  }
  function photoUrl(url) {
    var did = driveFileId(url);
    if (did) return 'https://drive.google.com/thumbnail?id=' + did + '&sz=w1600';
    if (googleImage.test(url)) {
      return url.replace(/\/s\d+(-[a-z]+)*\//i, '/s1600/').replace(/=s\d+(-[a-z]+)*$/i, '=s1600');
    }
    return url;
  }
  var slideLinks = doc.querySelectorAll('#slideshow .widget-content li a');
  var showcase = doc.getElementById('showcase');
  if (showcase && slideLinks.length) {
    var slideList = slideLinks[0].closest('ul');
    var slider = doc.createElement('div');
    slider.className = 'slider';
    slider.setAttribute('role', 'region');
    slider.setAttribute('aria-roledescription', 'carousel');
    slider.setAttribute('aria-label', 'Slideshow');
    var track = doc.createElement('div');
    track.className = 'slider-track';
    slider.appendChild(track);
    var total = slideLinks.length;
    for (var sIdx = 0; sIdx < total; sIdx++) {
      var href = slideLinks[sIdx].getAttribute('href') || '';
      var caption = slideLinks[sIdx].textContent.trim();
      if (caption === '-' || caption === '.' || caption === href) caption = '';
      var slide = doc.createElement('div');
      slide.className = 'slide';
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', (sIdx + 1) + ' of ' + total + (caption ? ': ' + caption : ''));
      var media = doc.createElement('div');
      media.className = 'slide-media';
      var vid = ytId(href);
      if (vid) {
        slide.classList.add('is-video');
        media.appendChild(makeVideo(vid, caption, function (box) {
          box.parentNode.parentNode.classList.add('is-playing');
          stopAuto();
        }));
      } else {
        var pic = doc.createElement('img');
        pic.alt = caption;
        pic.loading = sIdx === 0 ? 'eager' : 'lazy';
        pic.src = photoUrl(href);
        media.appendChild(pic);
      }
      slide.appendChild(media);
      if (caption) {
        var cap = doc.createElement('p');
        cap.className = 'slide-caption';
        cap.textContent = caption;
        slide.appendChild(cap);
      }
      track.appendChild(slide);
    }
    var slides = track.children;
    var current = 0;
    var dots = [];
    function resetVideos(except) {
      for (var r = 0; r < slides.length; r++) {
        if (r === except) continue;
        var playing = slides[r].querySelector('.yt-lite.is-playing');
        if (playing) {
          var fresh = makeVideo(playing.getAttribute('data-yt'), slides[r].getAttribute('aria-label'), function (box) {
            box.parentNode.parentNode.classList.add('is-playing');
            stopAuto();
          });
          playing.parentNode.replaceChild(fresh, playing);
          slides[r].classList.remove('is-playing');
        }
      }
    }
    function goTo(n, instant) {
      current = (n + total) % total;
      track.scrollTo({ left: current * track.clientWidth, behavior: instant || reduceMotion ? 'auto' : 'smooth' });
      markCurrent();
    }
    function markCurrent() {
      for (var q = 0; q < dots.length; q++) {
        dots[q].classList.toggle('is-active', q === current);
        dots[q].setAttribute('aria-current', q === current ? 'true' : 'false');
      }
      resetVideos(current);
    }
    var scrollTimer = null;
    track.addEventListener('scroll', function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        var n = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        if (n !== current) { current = n; markCurrent(); }
      }, 80);
    }, { passive: true });
    window.addEventListener('resize', function () { goTo(current, true); });
    if (total > 1) {
      var arrow = function (cls, label, points, step) {
        var btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'slider-arrow ' + cls;
        btn.setAttribute('aria-label', label);
        btn.innerHTML = '<svg aria-hidden="true" fill="none" height="22" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" viewBox="0 0 24 24" width="22"><polyline points="' + points + '"/></svg>';
        btn.addEventListener('click', function () { stopAuto(); goTo(current + step); });
        slider.appendChild(btn);
      };
      arrow('slider-prev', 'Previous slide', '15 18 9 12 15 6', -1);
      arrow('slider-next', 'Next slide', '9 18 15 12 9 6', 1);
      var dotBar = doc.createElement('div');
      dotBar.className = 'slider-dots';
      for (var dIdx = 0; dIdx < total; dIdx++) {
        var dot = doc.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Go to slide ' + (dIdx + 1));
        dot.addEventListener('click', (function (k) { return function () { stopAuto(); goTo(k); }; })(dIdx));
        dotBar.appendChild(dot);
        dots.push(dot);
      }
      slider.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { stopAuto(); goTo(current - 1); }
        if (e.key === 'ArrowRight') { stopAuto(); goTo(current + 1); }
      });
    }
    // Photos advance every 6 seconds; stops for good once someone interacts or plays a video
    var autoTimer = null;
    var hovering = false;
    function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }
    if (total > 1 && !reduceMotion) {
      autoTimer = setInterval(function () {
        if (hovering || doc.hidden || slides[current].classList.contains('is-playing')) return;
        goTo(current + 1);
      }, 6000);
      slider.addEventListener('mouseenter', function () { hovering = true; });
      slider.addEventListener('mouseleave', function () { hovering = false; });
      slider.addEventListener('focusin', function () { hovering = true; });
      slider.addEventListener('focusout', function () { hovering = false; });
      track.addEventListener('touchstart', stopAuto, { passive: true });
    }
    slideList.parentNode.replaceChild(slider, slideList);
    if (dots.length) slider.parentNode.insertBefore(dotBar, slider.nextSibling);
    markCurrent();
    showcase.classList.add('has-slides');
  }

  // ---------- Downloads (Link List: name = title, address = file link) ----------
  function downloadInfo(url, name) {
    var u = url || '';
    var id;
    var info = { href: u, type: '' };
    if ((id = /docs\.google\.com\/document\/d\/([A-Za-z0-9_-]+)/.exec(u))) {
      info.href = 'https://docs.google.com/document/d/' + id[1] + '/export?format=pdf'; info.type = 'PDF';
    } else if ((id = /docs\.google\.com\/spreadsheets\/d\/([A-Za-z0-9_-]+)/.exec(u))) {
      info.href = 'https://docs.google.com/spreadsheets/d/' + id[1] + '/export?format=xlsx'; info.type = 'Spreadsheet';
    } else if ((id = /docs\.google\.com\/presentation\/d\/([A-Za-z0-9_-]+)/.exec(u))) {
      info.href = 'https://docs.google.com/presentation/d/' + id[1] + '/export/pdf'; info.type = 'PDF';
    } else if ((id = driveFileId(u))) {
      info.href = 'https://drive.google.com/uc?export=download&id=' + id;
    } else if (/dropbox\.com/.test(u)) {
      info.href = u.replace(/([?&])dl=0/, '$1dl=1');
    }
    if (!info.type) {
      var ext = /\.([a-z0-9]{2,4})(?:[?#]|$)/i.exec(u.split('?')[0]) || /\(?\b(pdf|docx?|xlsx?|csv|pptx?|zip|mp3|wav|m4a|mp4|mov|jpe?g|png)\b\)?\s*$/i.exec(name || '');
      var e = ext ? ext[1].toLowerCase() : '';
      var types = { pdf: 'PDF', doc: 'Word', docx: 'Word', xls: 'Spreadsheet', xlsx: 'Spreadsheet', csv: 'Spreadsheet', ppt: 'Slides', pptx: 'Slides', zip: 'ZIP', mp3: 'Audio', wav: 'Audio', m4a: 'Audio', mp4: 'Video', mov: 'Video', jpg: 'Image', jpeg: 'Image', png: 'Image' };
      info.type = types[e] || 'File';
    }
    return info;
  }
  var dlLinks = doc.querySelectorAll('#downloads-widgets .widget-content li a');
  var dlSection = doc.getElementById('downloads');
  if (dlSection && dlLinks.length) {
    var dlList = dlLinks[0].closest('ul');
    dlList.classList.add('dl-grid');
    for (var dl = 0; dl < dlLinks.length; dl++) {
      var a = dlLinks[dl];
      var title = a.textContent.trim();
      var infoD = downloadInfo(a.getAttribute('href'), title);
      var li = a.parentNode;
      li.className = 'dl-card';
      li.innerHTML = '<span class="dl-icon" aria-hidden="true"><svg fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="11" y2="17"/><polyline points="9 14 12 17 15 14"/></svg></span>';
      var body = doc.createElement('div');
      body.className = 'dl-body';
      var t = doc.createElement('p');
      t.className = 'dl-title';
      t.textContent = title;
      var ty = doc.createElement('p');
      ty.className = 'dl-type';
      ty.textContent = infoD.type;
      body.appendChild(t);
      body.appendChild(ty);
      li.appendChild(body);
      var btnD = doc.createElement('a');
      btnD.className = 'btn btn-primary dl-btn';
      btnD.href = infoD.href;
      btnD.target = '_blank';
      btnD.rel = 'noopener';
      btnD.setAttribute('aria-label', 'Download ' + title);
      btnD.textContent = 'Download';
      li.appendChild(btnD);
    }
    dlSection.classList.add('has-items');
  }

  // ---------- Videos inside posts and pages ----------
  // A YouTube link on its own line becomes a responsive player.
  var postBodies = doc.querySelectorAll('.post-single .post-body');
  for (var pb = 0; pb < postBodies.length; pb++) {
    var bodyEl = postBodies[pb];
    var links = bodyEl.querySelectorAll('a[href]');
    for (var li2 = 0; li2 < links.length; li2++) {
      var ln = links[li2];
      var lid = ytId(ln.getAttribute('href'));
      var holder = ln.parentNode;
      if (!lid || !holder || holder.textContent.trim() !== ln.textContent.trim()) continue;
      holder.replaceChild(makeVideo(lid, ln.textContent.trim()), ln);
    }
    var tw = doc.createTreeWalker(bodyEl, 4, null, false);
    var bare = [];
    var tn;
    while ((tn = tw.nextNode())) {
      if (tn.parentNode.closest('a, iframe, script, style, .yt-lite')) continue;
      if (/^\s*https?:\/\/\S+\s*$/.test(tn.nodeValue) && ytId(tn.nodeValue)) bare.push(tn);
    }
    for (var bIdx = 0; bIdx < bare.length; bIdx++) {
      bare[bIdx].parentNode.replaceChild(makeVideo(ytId(bare[bIdx].nodeValue), ''), bare[bIdx]);
    }
  }

  // ---------- Play videos straight from the episode cards ----------
  var cards = doc.querySelectorAll('.post-card');
  function enableCardVideo(card, id) {
    if (card.classList.contains('has-video')) return;
    var mediaLink = card.querySelector('.post-card-media');
    if (!mediaLink) return;
    var titleText = (card.querySelector('.post-card-title') || {}).textContent || '';
    card.classList.add('has-video');
    var img = mediaLink.querySelector('img');
    if (!img) {
      mediaLink.innerHTML = '';
      img = doc.createElement('img');
      img.alt = '';
      img.loading = 'lazy';
      mediaLink.appendChild(img);
    }
    if (!/ytimg\.com|youtube\.com/.test(img.getAttribute('src') || '')) img.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
    mediaLink.insertAdjacentHTML('beforeend', PLAY_ICON);
    mediaLink.removeAttribute('aria-hidden');
    mediaLink.removeAttribute('tabindex');
    mediaLink.setAttribute('role', 'button');
    mediaLink.setAttribute('aria-label', 'Play video: ' + titleText.trim());
    mediaLink.addEventListener('click', function (e) {
      e.preventDefault();
      var box = doc.createElement('div');
      box.className = 'post-card-media is-playing';
      box.appendChild(ytFrame(id));
      mediaLink.parentNode.replaceChild(box, mediaLink);
    });
  }
  var needFeed = [];
  for (var cIdx = 0; cIdx < cards.length; cIdx++) {
    var cImg = cards[cIdx].querySelector('.post-card-media img');
    var fromThumb = cImg ? ytId((cImg.getAttribute('src') || '').replace(/^.*\/vi\/([A-Za-z0-9_-]{11})\/.*$/, 'https://youtu.be/$1')) : null;
    if (fromThumb) enableCardVideo(cards[cIdx], fromThumb);
    else needFeed.push(cards[cIdx]);
  }
  // Posts with a pasted link (no YouTube thumbnail): look the video up in the blog's own feed
  if (needFeed.length && window.fetch && /^https?:$/.test(location.protocol)) {
    fetch('/feeds/posts/default?alt=json&max-results=50', { credentials: 'same-origin' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        var entries = data && data.feed && data.feed.entry;
        if (!entries) return;
        var byUrl = {};
        for (var en = 0; en < entries.length; en++) {
          var content = (entries[en].content && entries[en].content.$t) || '';
          var fid = ytId(content);
          if (!fid) continue;
          var links2 = entries[en].link || [];
          for (var lk = 0; lk < links2.length; lk++) {
            if (links2[lk].rel === 'alternate') byUrl[links2[lk].href.replace(/^https?:/, '')] = fid;
          }
        }
        for (var nf = 0; nf < needFeed.length; nf++) {
          var cardLink = needFeed[nf].querySelector('.post-card-title a');
          var key = cardLink ? cardLink.href.replace(/^https?:/, '').split('?')[0] : '';
          if (byUrl[key]) enableCardVideo(needFeed[nf], byUrl[key]);
        }
      })
      .catch(function () {});
  }

  // Mobile menu
  var header = doc.getElementById('site-header');
  var toggle = doc.getElementById('nav-toggle');
  var drawer = doc.getElementById('site-nav');
  var desktop = window.matchMedia ? window.matchMedia('(min-width: 1024px)') : null;

  // Dimmed backdrop behind the open menu; tapping it closes the menu
  var backdrop = null;
  if (header) {
    backdrop = doc.createElement('div');
    backdrop.className = 'nav-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(backdrop);
    backdrop.addEventListener('click', function () { setMenu(false); });
  }

  function setMenu(open) {
    if (!header || !toggle) return;
    if (open) {
      header.classList.add('nav-open');
      root.classList.add('nav-locked');
      if (backdrop) backdrop.classList.add('is-visible');
    } else {
      header.classList.remove('nav-open');
      root.classList.remove('nav-locked');
      if (backdrop) backdrop.classList.remove('is-visible');
    }
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (header && toggle && drawer) {
    toggle.addEventListener('click', function () {
      setMenu(!header.classList.contains('nav-open'));
    });
    // Close after choosing a link (also covers same-page #anchors)
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
    window.addEventListener('pageshow', function () { setMenu(false); });
    if (desktop) {
      var onChange = function () { if (desktop.matches) setMenu(false); };
      if (desktop.addEventListener) desktop.addEventListener('change', onChange);
      else if (desktop.addListener) desktop.addListener(onChange);
    }
  }

  // Shadow under the sticky header once the page scrolls
  if (header) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        if (window.pageYOffset > 8) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Initials in the round brand mark when no logo image is set ("The River Musa Show" -> "RM")
  var mark = doc.querySelector('.brand-mark');
  var name = doc.querySelector('.brand-name');
  if (mark && name && !mark.querySelector('img')) {
    var skip = { the: 1, a: 1, an: 1 };
    var words = name.textContent.trim().split(/\s+/).filter(function (w) {
      return w && !skip[w.toLowerCase()];
    });
    mark.textContent = words.slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }

  // Hero title: first word white, the rest in the accent colour
  var title = doc.querySelector('.hero-title');
  if (title && title.children.length === 0) {
    var parts = title.textContent.trim().split(/\s+/);
    if (parts.length > 1) {
      title.textContent = parts[0] + ' ';
      var accent = doc.createElement('span');
      accent.className = 'accent';
      accent.textContent = parts.slice(1).join(' ');
      title.appendChild(accent);
    }
  }

  // Card images: ask Blogger/YouTube for a 16:9 size instead of the full image or a 72px thumbnail
  var youtubeThumb = /^(https?:\/\/(img\.youtube\.com|i\.ytimg\.com)\/vi\/[^/]+\/)[a-z]*default\.jpg$/i;
  var cardImgs = doc.querySelectorAll('img.js-resize');
  for (var c = 0; c < cardImgs.length; c++) {
    var src = cardImgs[c].getAttribute('src') || '';
    var sized = src;
    if (googleImage.test(src)) {
      sized = src
        .replace(/\/s\d+(-[a-z]+)*\//i, '/w720-h405-c/')
        .replace(/\/w\d+-h\d+(-[a-z]+)*\//i, '/w720-h405-c/')
        .replace(/=s\d+(-[a-z]+)*$/i, '=w720-h405-c')
        .replace(/=w\d+-h\d+(-[a-z]+)*$/i, '=w720-h405-c');
    } else if (youtubeThumb.test(src)) {
      sized = src.replace(youtubeThumb, '$1hqdefault.jpg');
    }
    if (sized !== src) cardImgs[c].setAttribute('src', sized);
  }

  // Dates: show "12 October 2026" style dates whatever the blog's timestamp format is
  var dates = doc.querySelectorAll('time.js-date');
  for (var d = 0; d < dates.length; d++) {
    var when = new Date(dates[d].getAttribute('datetime'));
    if (!isNaN(when.getTime())) {
      dates[d].textContent = when.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }
  }

  // Host card: a photo placed in the gadget's content replaces the microphone icon
  var hostImg = doc.querySelector('.host-role img');
  var avatar = doc.querySelector('.host-avatar');
  if (hostImg && avatar) {
    avatar.innerHTML = '';
    avatar.appendChild(hostImg);
  }

  // Copy-link share button
  var copyBtns = doc.querySelectorAll('[data-copy-url]');
  for (var i = 0; i < copyBtns.length; i++) {
    copyBtns[i].addEventListener('click', function () {
      var btn = this;
      var url = btn.getAttribute('data-copy-url');
      var done = function () {
        var label = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = label; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link:', url); });
      } else {
        window.prompt('Copy this link:', url);
      }
    });
  }

  // Footer year
  var years = doc.querySelectorAll('.js-year');
  for (var y = 0; y < years.length; y++) years[y].textContent = String(new Date().getFullYear());
})();
