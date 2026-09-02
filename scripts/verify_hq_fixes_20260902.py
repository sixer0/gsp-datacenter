#!/usr/bin/env python
"""Verifikasi end-to-end perbaikan HQ 02-09: akun lean + telemetri inisiator.
Menulis laporan CHECK n: PASS|FAIL + VERDICT akhir."""
import json, ssl, re, subprocess, urllib.request, urllib.error, sys, os, shutil
from pathlib import Path

CTX = ssl.create_default_context(); CTX.check_hostname=False; CTX.verify_mode=ssl.CERT_NONE
HQ="https://localhost:9011"; WU="https://localhost:9012"
SEC=open("C:/Users/TRIAL/gsp-datacenter/.env",encoding="utf-8",errors="replace").read()
m=re.search(r"^INTERNAL_API_SECRET=(.+)$",SEC,re.M)
INTERNAL=(m.group(1).strip().strip('"').strip("'")) if m else ""
INT_HDR={"x-internal-secret":INTERNAL}
LA=Path(os.environ["LOCALAPPDATA"])
PROFILES=LA/"hermes/profiles"
results=[]
def check(n, name, ok, detail=""):
    results.append((n,name,bool(ok),detail)); print(f"CHECK {n}: {'PASS' if ok else 'FAIL'} - {name} | {detail}")

def req(url, method="GET", data=None, headers=None):
    h={"Content-Type":"application/json"}
    if headers: h.update(headers)
    body=json.dumps(data).encode() if data is not None else None
    r=urllib.request.Request(url, data=body, method=method, headers=h)
    sc=0; raw=""; jar=[]
    try:
        resp=urllib.request.urlopen(r, context=CTX, timeout=30)
        raw=resp.read().decode(errors="replace"); sc=resp.getcode()
        jar=[c.split(";")[0] for c in (resp.headers.get_all("Set-Cookie") or [])]
    except urllib.error.HTTPError as e:
        raw=e.read().decode(errors="replace"); sc=e.code
        jar=[c.split(";")[0] for c in (e.headers.get_all("Set-Cookie") or [])]
    except Exception as e:
        return {"_err":str(e),"sc":0,"json":{},"cookies":[]}
    try: parsed=json.loads(raw)
    except Exception: parsed={"_raw":raw[:400]}
    return {"sc":sc,"json":parsed,"cookies":jar}

def cookie_hdr(jars):
    flat={}
    for j in jars:
        for c in j:
            k,v=c.split("=",1); flat[k]=v
    return "; ".join(f"{k}={v}" for k,v in flat.items())

def count_skills(p): 
    d=PROFILES/p
    return len(list(d.glob("skills/**/SKILL.md"))) if d.is_dir() else -1

# ── F2/F3: buat akun USER probe lewat HQ /api/user-access ──
u1="hqxprobeuser01"
r=req(f"{HQ}/api/user-access","POST",{"username":u1,"password":"probe-pass-123","displayName":"Probe User HQX","role":"USER"},headers=INT_HDR)
check(1,"POST user-access USER 201",r.get("sc")==201,json.dumps(r.get("json",{}))[:120])
if r.get("sc")==201:
    prof=u1
    n=count_skills(Path(prof))
    pdir=PROFILES/prof
    markers=(pdir/".lean-policy").is_file() and (pdir/".no-bundled-skills").is_file()
    check(2,f"profil USER lean (skills={n}<=5)",0<n<=5,f"skills={n}")
    check(3,"marker .lean-policy + .no-bundled-skills ada",markers)
    soul=(pdir/"SOUL.md").read_text(encoding="utf-8",errors="replace") if (pdir/"SOUL.md").exists() else ""
    check(4,"SOUL ada + gate ENFORCEMENT",("GATE ENFORCEMENT" in soul))
else:
    check(2,"profil USER lean",False,"akun gagal dibuat"); check(3,"marker",False); check(4,"SOUL",False)

# ── F3: buat akun ADMINISTRATOR probe (profil baru, belum ada di disk) ──
u2="hqxprobeadmin01"
r2=req(f"{HQ}/api/user-access","POST",{"username":u2,"password":"probe-pass-123","displayName":"Probe Admin HQX","role":"ADMINISTRATOR"},headers=INT_HDR)
check(5,"POST user-access ADMINISTRATOR 201 (dulu 400)",r2.get("sc")==201,json.dumps(r2.get("json",{}))[:140])
if r2.get("sc")==201:
    n2=count_skills(Path(u2))
    p2=PROFILES/u2
    m2=(p2/".lean-policy").is_file() and (p2/".no-bundled-skills").is_file()
    check(6,f"profil ADMIN lean (skills={n2}<=5)",0<n2<=5,f"skills={n2}")
    check(7,"marker ganda admin ada",m2)
else:
    check(6,"profil ADMIN lean",False); check(7,"marker",False)

# ── login HQ utk kedua akun (bisa digunakan) ──
for tag,u in (("USER",u1),("ADMIN",u2)):
    lg=req(f"{HQ}/api/auth/login","POST",{"username":u,"password":"probe-pass-123"},headers={"x-forwarded-for":f"10.9.{sys.hash_info.modulus % 200}.7"})
    ok=lg.get("sc")==200 and any("gsp_hq_session" in c for c in lg.get("cookies",[]))
    check(8 if tag=="USER" else 9, f"login HQ {tag} 200 + cookie sesi",ok,str(lg.get("sc")))

# login sbg admin utk dispatch uji
lg=req(f"{HQ}/api/auth/login","POST",{"username":u2,"password":"probe-pass-123"},headers={"x-forwarded-for":"10.9.77.7"})
ck=cookie_hdr([lg.get("cookies",[])]) if lg.get("sc")==200 else ""

# ── F4: dispatch dengan sesi -> requestedBy user:<u>; bridge catat fromAgent ──
dsp=req(f"{HQ}/api/brahma/dispatch","POST",{"title":"HQX-TELEM: probe echo dua kata (jangan tulis file)","prompt":"Balas hanya: OK-HQX. Jangan memanggil tool lain.","profile":"gsp-explore","kind":"oneshot"},headers={"Cookie":ck} if ck else None)
rid=dsp.get("json",{}).get("request",{}).get("id") if dsp.get("sc")==200 else None
check(10,"dispatch dgn sesi admin 200",bool(rid),str(dsp.get("sc")))
rb=None
if rid:
    import time
    # cek requestedBy segera setelah rute membuat request
    q=subprocess.run(["node","-e",
      f"const {{PrismaClient}}=require('@prisma/client');const p=new PrismaClient();p.agentRequest.findUnique({{where:{{id:'{rid}'}}}}).then(r=>{{console.log(JSON.stringify({{requestedBy:r.requestedBy,status:r.status}}));return p.$disconnect()}});"],
      cwd="C:/Users/TRIAL/gsp-datacenter",capture_output=True,text=True)
    try: rb=json.loads(q.stdout.strip().splitlines()[-1])
    except Exception: rb={"requestedBy":None,"status":"?","err":q.stderr[:150]}
    check(11,"AgentRequest.requestedBy = user probe",rb.get("requestedBy")==f"user:{u2}",json.dumps(rb)[:160])
    # tungggu edge tercatat (bridge mencatat edge saat klaim, status running)
    time.sleep(8)
    q2=subprocess.run(["node","-e",
      f"const {{PrismaClient}}=require('@prisma/client');const p=new PrismaClient();p.orchestrationRecord.findFirst({{where:{{runId:'{rid}'}}}}).then(r=>{{console.log(JSON.stringify(r?{{from:r.fromAgent,to:r.toAgent,status:r.status}}:null));return p.$disconnect()}});"],
      cwd="C:/Users/TRIAL/gsp-datacenter",capture_output=True,text=True)
    try: edge=json.loads(q2.stdout.strip().splitlines()[-1])
    except Exception: edge=None
    check(12,"edge telemetri from = user probe",bool(edge) and edge.get("from")==f"user:{u2}",json.dumps(edge)[:160] if edge else "edge belum tercatat")
else:
    check(11,"requestedBy",False); check(12,"edge",False)

# ── F1: header dashboard dari sesi login, bukan env ──
import subprocess as sp
g1=sp.run(["grep","-rl","NEXT_PUBLIC_OWNER_NAME",".next/static/chunks/"],capture_output=True,text=True,cwd="C:/Users/TRIAL/gsp-datacenter")
check(13,"build chunk: nol NEXT_PUBLIC_OWNER_NAME", g1.stdout.strip()=="", g1.stdout.strip()[:120])
g2=sp.run(["grep","-rl","api/auth/me",".next/static/chunks/"],capture_output=True,text=True,cwd="C:/Users/TRIAL/gsp-datacenter")
check(14,"build chunk: dashboard panggil /api/auth/me", g2.stdout.strip()!="", g2.stdout.strip().splitlines()[0][:80] if g2.stdout.strip() else "")
# /api/auth/me dgn cookie sesi admin probe -> displayName ikut
lgm=req(f"{HQ}/api/auth/login","POST",{"username":u2,"password":"probe-pass-123"},headers={"x-forwarded-for":"10.9.88.8"})
ckm=cookie_hdr([lgm.get("cookies",[])])
me=req(f"{HQ}/api/auth/me",headers={"Cookie":ckm})
j=me.get("json",{})
check(15,"/api/auth/me kembalikan username+displayName sesi", j.get("user",{}).get("username")==u2 and j.get("user",{}).get("displayName")=="Probe Admin HQX", json.dumps(j)[:140])

fails=[x for x in results if not x[2]]
verdict = "PASS" if not fails else "FAIL"
print("")
print(f"VERDICT: {verdict} ({len(results)-len(fails)}/{len(results)})")
sys.exit(0 if not fails else 1)
