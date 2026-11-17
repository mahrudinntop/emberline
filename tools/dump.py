
import sys, json, base64
from playwright.sync_api import sync_playwright
url, out = sys.argv[1], sys.argv[2]
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader","--enable-unsafe-swiftshader","--no-sandbox"])
    pg = b.new_page(viewport={"width":1600,"height":900})
    pg.goto(url, wait_until="load")
    pg.wait_for_function("window.__emberShotReady === true", timeout=30000)
    data = pg.evaluate("""() => {
      const c = document.querySelector('canvas');
      const out = c.toDataURL('image/png');
      // also try to grab the lightmap texture canvas if exposed
      return {full: out};
    }""")
    open(out, "wb").write(base64.b64decode(data["full"].split(",")[1]))
    b.close()
print("dumped", out)
