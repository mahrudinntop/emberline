#!/usr/bin/env python3
"""shotscore.py — measure what the make.fun judge can actually SEE in our screenshots.

The judge rubric (competition.yaml):
  1. a complete game  -- every part of a complete game shown IN SCREENSHOTS of the game itself
  5. structure        -- judged from the outline the dossier shows
and: at 1,536 input tokens an entry, the screenshots go on ONE contact sheet (1,120 tokens)
and the outline gets the rest. So the judge mostly sees the three images, downscaled.

This script scores our shots the way the judge's eyes would:
  - legibility of the contact sheet (contrast, mean luminance, dead-black share)
  - presence of a HUD band with readable text
  - how much of the frame is 'content' vs 'void'
and prints one number per shot plus a loop-coverage verdict.
"""
import sys, os, json
import numpy as np
from PIL import Image

def load(p):
    return np.asarray(Image.open(p).convert('RGB')).astype(np.float32) / 255.0

def lum(a):
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]

def text_pixels(a, thresh=0.55, min_run=2):
    """Count pixels that look like UI text/glyph strokes: bright AND high local contrast."""
    L = lum(a)
    bright = L > thresh
    # local contrast: difference from a 3x3 blurred version
    from numpy.lib.stride_tricks import sliding_window_view
    pad = np.pad(L, 1, mode='edge')
    win = sliding_window_view(pad, (3, 3))
    blur = win.mean(axis=(2, 3))
    contrast = np.abs(L - blur)
    strokes = bright & (contrast > 0.12)
    return int(strokes.sum())

def score(name, path):
    a = load(path)
    L = lum(a)
    h, w = L.shape
    mean = float(L.mean())
    p95 = float(np.percentile(L, 95))
    p99 = float(np.percentile(L, 99))
    dead = float((L < 0.05).mean())
    mid = float(((L >= 0.05) & (L < 0.35)).mean())
    hot = float((L >= 0.35).mean())
    # top band = where a HUD would live (the starter puts its HUD at the top)
    band = L[:int(h * 0.14), :]
    band_bright = float((band > 0.5).mean())
    tp = text_pixels(a)
    # "usable" = enough contrast to read a game in a 200px-wide thumbnail
    usable = (p95 > 0.5) and (dead < 0.35) and (mean > 0.09)
    return dict(
        name=os.path.basename(path), size=f'{w}x{h}',
        mean=round(mean, 4), p95=round(p95, 3), p99=round(p99, 3),
        dead_pct=round(100 * dead, 1), detail_pct=round(100 * mid, 1), hot_pct=round(100 * hot, 2),
        hud_band_bright=round(100 * band_bright, 3), text_px=tp,
        usable=bool(usable),
    )

def main(directory):
    files = sorted(f for f in os.listdir(directory) if f.lower().endswith(('.jpg', '.jpeg', '.png')))
    rows = [score(f, os.path.join(directory, f)) for f in files]
    for r in rows:
        flag = 'OK ' if r['usable'] else 'BAD'
        print(f"{flag} {r['name']:14} {r['size']:9} mean={r['mean']:<6} p95={r['p95']:<6} "
              f"p99={r['p99']:<6} dead={r['dead_pct']:<5}% detail={r['detail_pct']:<5}% "
              f"hot={r['hot_pct']:<5}% hud={r['hud_band_bright']:<6}% text={r['text_px']}")
    # loop coverage: does the set show start + play + end?
    names = ' '.join(r['name'].lower() for r in rows)
    have = [k for k in ('start', 'play', 'end') if k in names]
    print()
    print(f"loop coverage: {have} ({len(have)}/3)")
    bad = [r['name'] for r in rows if not r['usable']]
    if bad:
        print(f"UNUSABLE to a judge on a contact sheet: {bad}")
    print(f"shots scored: {len(rows)} (kit allows 3-4)")
    return 0 if not bad else 1

if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else '.'))
