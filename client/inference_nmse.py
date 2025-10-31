#!/usr/bin/env python3
# Computes NMSE from two lists or a JSON file and writes nmse.json.
# Usage: python client/inference_nmse.py --out nmse.json --y 1,2,3 --yhat 1.1,1.9,2.8

import json, argparse, math, time
p = argparse.ArgumentParser()
p.add_argument("--out", default="nmse.json")
p.add_argument("--y", default="1,2,3")
p.add_argument("--yhat", default="1.0,2.0,3.0")
args = p.parse_args()

y    = [float(v) for v in args.y.split(",")]
yhat = [float(v) for v in args.yhat.split(",")]
assert len(y)==len(yhat) and len(y)>0

mse = sum((a-b)**2 for a,b in zip(y,yhat))/len(y)
var = sum((a-sum(y)/len(y))**2 for a in y)/len(y)
nmse = (mse/var) if var>0 else 0.0

nmse_fixed = int(nmse * 1_000_000)
payload = {"ts": int(time.time()), "nmse": nmse, "nmse_fixed": nmse_fixed, "scale": 1_000_000}
with open(args.out, "w") as f: json.dump(payload, f)
print("wrote", args.out, payload)
