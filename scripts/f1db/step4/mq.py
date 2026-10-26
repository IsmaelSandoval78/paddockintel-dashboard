import json, os, sys, urllib.request
def sql(q):
    req=urllib.request.Request("https://api.supabase.com/v1/projects/ozcmecoaofolbrzhlhum/database/query",data=json.dumps({"query":q}).encode(),headers={"Authorization":"Bearer "+os.environ["SUPABASE_ACCESS_TOKEN"],"Content-Type":"application/json"},method="POST")
    try:
        return json.loads(urllib.request.urlopen(req,timeout=600).read() or b"[]")
    except urllib.error.HTTPError as e:
        raise SystemExit(f"HTTP {e.code}: {e.read()[:800]}")
if __name__=="__main__":
    print(json.dumps(sql(sys.stdin.read()),indent=1,default=str)[:20000])
