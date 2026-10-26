import json,subprocess,sys
v=json.load(open('scripts/f1db/step4/views.json'))['views']
d={x['relname']:x['def'] for x in v}
for name in ['race_winner_ages']+[n for n in d if n!='race_winner_ages']:
    r=subprocess.run(["psql","-h","127.0.0.1","-p","54330","-U","postgres","-v","ON_ERROR_STOP=1","-q","-c",f"create or replace view public.{name} as {d[name]}"],capture_output=True,text=True)
    if r.returncode: sys.exit(name+r.stderr)
