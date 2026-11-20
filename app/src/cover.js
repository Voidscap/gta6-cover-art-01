// Neon Sunset Cover Studio — the cover renderer. Draws a multi-panel poster on any
// 2D canvas: photos cover-fit into panels, a neon-sunset grade, and a big bold
// caption with outline and shadow. No network, no fonts to download.

var LAYOUTS = {
  triple: function (w, h, g) {
    var third = (w - g * 2) / 3;
    return [
      { x: 0, y: 0, w: third, h: h },
      { x: third + g, y: 0, w: third, h: h },
      { x: (third + g) * 2, y: 0, w: third, h: h }
    ];
  },
  hero: function (w, h, g) {
    var topH = h * 0.56 - g / 2;
    var botH = h - topH - g;
    var third = (w - g * 2) / 3;
    return [
      { x: 0, y: 0, w: w, h: topH },
      { x: 0, y: topH + g, w: third, h: botH },
      { x: third + g, y: topH + g, w: third, h: botH },
      { x: (third + g) * 2, y: topH + g, w: third, h: botH }
    ];
  },
  collage: function (w, h, g) {
    var bigW = w * 0.55 - g / 2;
    var smallW = (w - bigW - g * 2) / 2;
    var halfH = (h - g) / 2;
    var rx = bigW + g;
    return [
      { x: 0, y: 0, w: bigW, h: h },
      { x: rx, y: 0, w: smallW, h: halfH },
      { x: rx + smallW + g, y: 0, w: smallW, h: halfH },
      { x: rx, y: halfH + g, w: smallW, h: halfH },
      { x: rx + smallW + g, y: halfH + g, w: smallW, h: halfH }
    ];
  }
};

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// Draws img cover-fitting rect, scaled by zoom and panned by ox/oy (each -1..1,
// mapped to the largest pan that still covers the panel).
function drawPhotoInto(ctx, img, r, zoom, ox, oy) {
  var base = Math.max(r.w / img.naturalWidth, r.h / img.naturalHeight);
  var s = base * zoom;
  var dw = img.naturalWidth * s;
  var dh = img.naturalHeight * s;
  var maxOx = Math.max(0, (dw - r.w) / 2);
  var maxOy = Math.max(0, (dh - r.h) / 2);
  var dx = r.x + (r.w - dw) / 2 + clamp(ox, -1, 1) * maxOx;
  var dy = r.y + (r.h - dh) / 2 + clamp(oy, -1, 1) * maxOy;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// state: { photos, layout, panels, grade, caption, captionPos, accent }.
// panels[i] is { photo, zoom, ox, oy } with photo an index into photos or -1.
// opts: { preview } — preview adds panel number chips and the selection outline.
function drawCover(canvas, state, opts) {
  opts = opts || {};
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;
  var g = Math.max(2, Math.round(Math.min(w, h) * 0.008));
  var rects = LAYOUTS[state.layout](w, h, g);
  var i, r, p;
  ctx.save();
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, h);
  for (i = 0; i < rects.length; i++) {
    r = rects[i];
    p = state.panels[i] || { photo: -1, zoom: 1, ox: 0, oy: 0 };
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    var img = p.photo >= 0 ? state.photos[p.photo].img : null;
    if (img && img.naturalWidth > 0) {
      ctx.filter = 'saturate(1.28) contrast(1.1)';
      drawPhotoInto(ctx, img, r, p.zoom || 1, p.ox || 0, p.oy || 0);
      ctx.filter = 'none';
    } else {
      var ph = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
      ph.addColorStop(0, '#2c1445');
      ph.addColorStop(1, '#12081f');
      ctx.fillStyle = ph;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.setLineDash([Math.max(6, w * 0.01), Math.max(6, w * 0.01)]);
      ctx.lineWidth = Math.max(2, w * 0.002);
      ctx.strokeRect(r.x + w * 0.01, r.y + w * 0.01, r.w - w * 0.02, r.h - w * 0.02);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '700 ' + Math.max(14, Math.round(w * 0.018)) + 'px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PANEL ' + (i + 1), r.x + r.w / 2, r.y + r.h / 2);
    }
    ctx.restore();
  }
  // Vice City neon-sunset grade: magenta to orange to purple, laid over the
  // whole cover in overlay and soft-light so the photos keep their detail.
  var grade = state.grade;
  if (grade > 0) {
    var grad = ctx.createLinearGradient(0, 0, w * 0.25, h);
    grad.addColorStop(0, 'rgba(255,46,136,0.55)');
    grad.addColorStop(0.45, 'rgba(255,122,61,0.45)');
    grad.addColorStop(1, 'rgba(123,47,255,0.6)');
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = grade * 0.95;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = grade * 0.6;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  // Caption: big bold capitals, dark outline, drop shadow, on a soft scrim.
  var text = (state.caption || '').trim().toUpperCase();
  if (text) {
    var size = Math.round(h * 0.11);
    var fontOf = function (s) {
      return '900 ' + s + 'px "Arial Black", "Helvetica Neue", Arial, sans-serif';
    };
    var setSpacing = function () {
      try { ctx.letterSpacing = Math.max(1, Math.round(size * 0.05)) + 'px'; } catch (e) { /* older canvas */ }
    };
    ctx.font = fontOf(size);
    setSpacing();
    while (size > 16 && ctx.measureText(text).width > w * 0.92) {
      size -= 2;
      ctx.font = fontOf(size);
      setSpacing();
    }
    var top = state.captionPos === 'top';
    var bandH = size * 2.1;
    var bandY = top ? 0 : h - bandH;
    var scrim = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
    if (top) {
      scrim.addColorStop(0, 'rgba(12,4,24,0.6)');
      scrim.addColorStop(1, 'rgba(12,4,24,0)');
    } else {
      scrim.addColorStop(0, 'rgba(12,4,24,0)');
      scrim.addColorStop(1, 'rgba(12,4,24,0.6)');
    }
    ctx.fillStyle = scrim;
    ctx.fillRect(0, bandY, w, bandH);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#160a24';
    ctx.lineWidth = Math.max(2, size * 0.16);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.04;
    var ty = top ? bandH * 0.45 : h - bandH * 0.45;
    ctx.strokeText(text, w / 2, ty);
    ctx.fillStyle = state.accent || '#FFFFFF';
    ctx.fillText(text, w / 2, ty);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
  }
  // Preview-only: numbered chips on every panel, pink outline on the selected one.
  if (opts.preview) {
    for (i = 0; i < rects.length; i++) {
      r = rects[i];
      var chip = Math.max(18, Math.round(Math.min(w, h) * 0.032));
      ctx.fillStyle = i === opts.selected ? '#ff2e88' : 'rgba(10,4,20,0.75)';
      ctx.beginPath();
      ctx.arc(r.x + chip * 0.9, r.y + chip * 0.9, chip * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '700 ' + Math.round(chip * 0.55) + 'px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), r.x + chip * 0.9, r.y + chip * 0.9 + 1);
      if (i === opts.selected) {
        ctx.strokeStyle = '#ff2e88';
        ctx.lineWidth = Math.max(2, w * 0.004);
        ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      }
    }
  }
  ctx.restore();
}
