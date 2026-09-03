#!/usr/bin/env python
"""Uji fungsional atribusi inisiator utk pemanggil mesin (agentId) — FIX 02-09 temuan #4.
Request dibuat sideEffecting=true agar TIDAK dieksekusi bridge (awaiting_approval),
lalu dibersihkan total (request + edge)."""
import json, ssl, re, subprocess, sys, urllib.request, urllib.error

CTX = ssl.create_default_context(); CTX.check_hostname=False; CTX.verify_mode=ssl.CERT_NONE
HQ="https://localhost:9011"
SEC=open("C:/Users/TRIAL/gsp-datacenter/.env",encoding="utf-8",errors="replace").read()
INT=re.search(r"^INTERNAL_API_SECRET=(.+)$",SEC,re.M).group(1).strip().strip('"').strip("'")

def req(url, method="GET", data=None):
    h={"Content-Type":"application/json","x-internal-secret":INT}
    body=json.dumps(data).encode() if data is not None else None
    r=urllib.request.Request(url,data=body,method=method,headers=h)
    try:
        resp=urllib.request.urlopen(r,context=CTX,timeout=20); raw=resp.read().decode(); sc=resp.getcode()
    except urllib.error.HTTPError as e: raw=e.read().decode(); sc=e.code
    try: j=json.loads(raw)
    except: j={"_raw":raw[:200]}
    return sc,j

def node(expr):
    q=subprocess.run(["node","-e",expr],cwd="C:/Users/TRIAL/gsp-datacenter",capture_output=True,text=True)
    return q.stdout.strip().splitlines()[-1] if q.stdout.strip() else json.dumps({"err":q.stderr[:200]})

results=[]
def check(n,name,ok,detail=""):
    results.append(ok); print(f"CHECK {n}: {'PASS' if ok else 'FAIL'} - {name} | {detail}")

AGENT="gsp-master"  # profil controller lain (punya akun RBAC sendiri)
sc,j=req(f"{HQ}/api/brahma/dispatch","POST",{
    "title":"ATTRIB-UJI: probe atribusi agentId (jangan eksekusi)","prompt":"probe atribusi - hold",
    "profile":"gsp-explore","kind":"oneshot","sideEffecting":True,"agentId":AGENT})
rid=j.get("request",{}).get("id") if sc==200 else None
check(1,"POST dispatch dgn agentId (mesin, tanpa cookie) 200",bool(rid),f"sc={sc} status={j.get('request',{}).get('status')}")

rb=json.loads(node(f"const {{PrismaClient}}=require('@prisma/client');const p=new PrismaClient();p.agentRequest.findUnique({{where:{{id:'{rid}'}}}}).then(r=>{{console.log(JSON.stringify({{requestedBy:r.requestedBy,status:r.status}}));return p.$disconnect()}});")) if rid else {}
check(2,"AgentRequest.requestedBy = gsp-master (bukan brahma)",rb.get("requestedBy")==AGENT,json.dumps(rb)[:120])
check(3,"request tertahan awaiting_approval (tidak dieksekusi)",rb.get("status")=="awaiting_approval",rb.get("status",""))

# edge baru terbentuk saat bridge mengklaim -> untuk awaiting_approval belum ada edge;
# verifikasi logika bridge lewat unit-check: fungsi dariAgent = requestedBy || brahma
src=open("C:/Users/TRIAL/gsp-datacenter/hermes-bridge/bridge.mjs",encoding="utf-8").read()
check(4,"bridge.mjs: fromAgent = requestedBy || brahma","r.requestedBy || \"brahma\"" in src)

# cleanup total: hapus request + edge apa pun yang terlanjur terbentuk
d=json.loads(node(f"const {{PrismaClient}}=require('@prisma/client');const p=new PrismaClient();(async()=>{{const e=await p.orchestrationRecord.deleteMany({{where:{{runId:'{rid}'}}}});const r=await p.agentRequest.deleteMany({{where:{{id:'{rid}'}}}});console.log(JSON.stringify({{req:r.count,edge:e.count}}));await p.$disconnect()}})();"))
check(5,"cleanup bersih (request+edge terhapus)",d.get("req",0)>=1,f"req={d.get('req')} edge={d.get('edge')}")

left=node("const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.agentRequest.count({where:{title:{startsWith:'ATTRIB-UJI'}}}).then(c=>{console.log(c);return p.$disconnect()});")
check(6,"sisa record uji = 0",left=="0",f"left={left}")

print(""); print(f"VERDICT: {'PASS' if all(results) else 'FAIL'} ({sum(results)}/{len(results)})")
sys.exit(0 if all(results) else 1)
