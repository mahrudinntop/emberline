#!/usr/bin/env python3
"""Emberline — shot tool: load a ?shot= scene headless, wait for the game to say it has drawn,
collect console errors, and save a PNG. Prints one JSON line so the runner can decide."""
import json, os, sys, time
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8123/game/index.html?shot=play"
OUT = sys.argv[2] if len(sys.argv) > 2 else "/tmp/ember_shot.png"
WAIT = float(sys.argv[3]) if len(sys.argv) > 3 else 8.0
W, H = 1600, 900

msg = []
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(args=[
        "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
        "--disable-gpu-sandbox", "--no-sandbox", "--hide-scrollbars",
    ])
    pg = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
    pg.on("console", lambda m: msg.append(f"{m.type}: {m.text}"))
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(URL, wait_until="load", timeout=30000)
    try:
        pg.wait_for_function("window.__emberShotReady === true", timeout=WAIT * 1000)
    except Exception as e:
        errors.append(f"wait: {e}")
    time.sleep(0.6)
    pg.screenshot(path=OUT)
    summary = pg.evaluate("window.emberline ? window.emberline.summary() : null")
    b.close()

print(json.dumps({
    "url": URL, "out": OUT, "bytes": os.path.getsize(OUT) if os.path.exists(OUT) else 0,
    "errors": errors[:10], "console": [m for m in msg if m.startswith("error") or m.startswith("warning")][:10],
    "summary": summary,
}))
