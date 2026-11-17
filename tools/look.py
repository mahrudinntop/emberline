#!/usr/bin/env python3
"""Send up to 3 screenshots + a question to Claude Opus 5.5 and print the text answer."""
import base64, json, sys, urllib.request

KEY = open("/tmp/gk_key").read().strip()
URL = "https://ai.geraikita.com/v1/chat/completions"
MODEL = "claude-opus-5-5"

def ask(paths, question, system=None, max_tokens=1400):
    parts = [{"type": "text", "text": question}]
    for p in paths:
        b64 = base64.b64encode(open(p, "rb").read()).decode()
        parts.append({"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}})
    msgs = []
    if system:
        msgs.append({"role": "system", "content": system})
    msgs.append({"role": "user", "content": parts})
    body = json.dumps({"model": MODEL, "messages": msgs, "max_tokens": max_tokens, "temperature": 0.3}).encode()
    req = urllib.request.Request(URL, data=body, headers={
        "Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        d = json.load(r)
    return d["choices"][0]["message"]["content"]

if __name__ == "__main__":
    q = sys.argv[1]
    paths = [a for a in sys.argv[2:] if a.endswith(".png")]
    print(ask(paths, q))
