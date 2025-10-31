#!/usr/bin/env python3
# Runs a tiny “training” stub and writes a placeholder model + metrics.
# Usage: python client/train_local.py --out nmse.json

import json, argparse, random, time
p = argparse.ArgumentParser()
p.add_argument("--out", default="nmse.json")
args = p.parse_args()

# Stub: pretend we trained and measured NMSE
nmse = 0.025 + random.random() * 0.005  # ~2.5–3.0% for demo
nmse_fixed = int(nmse * 1_000_000)

payload = {"ts": int(time.time()), "nmse": nmse, "nmse_fixed": nmse_fixed, "scale": 1_000_000}
with open(args.out, "w") as f: json.dump(payload, f)
print("wrote", args.out, payload)
