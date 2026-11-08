# Adds the F1 TV token (read from ~/.f1tv_token) to requests sent to the F1 live timing archive.
import os, requests
_p = os.path.expanduser("~/.f1tv_token")
if os.path.exists(_p):
    _tok = open(_p).read().strip()
    _orig = requests.Session.request
    def _auth_request(self, method, url, *a, **kw):
        if "livetiming.formula1.com" in str(url):
            h = dict(kw.pop("headers", None) or {})
            h["Authorization"] = f"Bearer {_tok}"
            kw["headers"] = h
        return _orig(self, method, url, *a, **kw)
    requests.Session.request = _auth_request
