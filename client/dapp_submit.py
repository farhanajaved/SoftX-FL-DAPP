#!/usr/bin/env python3
# Thin Python wrapper that forwards to the Node client adapter.
# Usage examples:
#   RPC_URL=... PRIVATE_KEY=0x... REG_ADDRESS=0x... SCO_ADDRESS=0x... \
#   python client/dapp_submit.py submit --round 1 --client 0xCLIENT --nmseFixed 25341 --ts 1750000000
#
#   python client/dapp_submit.py query --round 1 --addr 0xCLIENT

import argparse, os, subprocess, sys

p = argparse.ArgumentParser()
sub = p.add_subparsers(dest="cmd", required=True)

s_submit = sub.add_parser("submit")
s_submit.add_argument("--round", type=int, required=True)
s_submit.add_argument("--client", required=True)
s_submit.add_argument("--nmseFixed", type=int, required=True)
s_submit.add_argument("--ts", type=int, required=True)

s_query = sub.add_parser("query")
s_query.add_argument("--round", type=int, required=True)
s_query.add_argument("--addr", help="optional: client address for reputation")

args = p.parse_args()

node = os.environ.get("NODE", "node")
adapter = os.path.join("services", "client-dapp.mjs")

if args.cmd == "submit":
    cmd = [node, adapter,
           f"round={args.round}",
           f"client={args.client}",
           f"nmse={args.nmseFixed}",
           f"ts={args.ts}"]
elif args.cmd == "query":
    # reuse agg adapter's query if you prefer; or expand client adapter
    adapter = os.path.join("services", "agg-dapp.mjs")
    cmd = [node, adapter, "action=query", f"round={args.round}"]
    if args.addr: cmd.append(f"addr={args.addr}")
else:
    raise SystemExit("unknown cmd")

print(">>", " ".join(cmd))
sys.exit(subprocess.call(cmd))
