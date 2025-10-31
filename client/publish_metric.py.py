#!/usr/bin/env python3
# Reads nmse.json and POSTs to the Oracle Adapter HTTP endpoint.
# Usage: ORACLE_URL=http://localhost:8787/submit python client/publish_metric.py --client 0xC --round 1 --file nmse.json

import os, json, argparse, time, urllib.request
p = argparse.ArgumentParser()
p.add_argument("--client", required=True)
p.add_argument("--round", type=int, required=True)
p.add_argument("--file", default="nmse.json")
args = p.parse_args()

oracle_url = os.getenv("ORACLE_URL")
if not oracle_url:
    raise SystemExit("Set ORACLE_URL")

with open(args.file) as f:
    m = json.load(f)

payload = {
    "client_id": args.client,
    "round": args.round,
    "ts": int(m.get("ts", time.time())),
    "nmse_fixed": int(m["nmse_fixed"]),
    "scale": int(m.get("scale", 1_000_000)),
}

req = urllib.request.Request(oracle_url, data=json.dumps(payload).encode("utf-8"),
                             headers={"Content-Type":"application/json"})
with urllib.request.urlopen(req, timeout=15) as r:
    print("oracle response:", r.status, r.read().decode())
