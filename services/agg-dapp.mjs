// services/agg-dapp.mjs
// SMO-Aggregator DApp Adapter (off-chain).
// Wraps SCO lifecycle calls with ACM checks (aggregator role).

import "dotenv/config";
import { ethers } from "ethers";
import {
  getProvider, getSigner, getContracts, openRound, closeRound, finalizeRound, updateScore
} from "./dapp-adapter.mjs";

function parseArgs() {
  const kv = {};
  for (const a of process.argv.slice(2)) {
    const [k, ...rest] = a.split("=");
    kv[k] = rest.join("=");
  }
  return kv;
}

async function main() {
  const args = parseArgs();
  const provider = getProvider();
  const signer = getSigner(provider);
  const from = await signer.getAddress();
  const { reg, sco } = getContracts({ provider, signer });

  const action = args.action ?? "open";

  if (action === "open") {
    const roundId = parseInt(args.round ?? "1");
    const policyHash = args.policyHash ?? "0x" + "00".repeat(32);
    const selectPct = parseInt(args.selectPct ?? "90");
    const ttlSec = parseInt(args.ttlSec ?? "600");
    await openRound({ sco, reg, roundId, policyHash, selectPct, ttlSec, from });
    console.log("opened round", roundId);
  } else if (action === "close") {
    await closeRound({ sco, reg, roundId: parseInt(args.round ?? "1"), from });
    console.log("closed round", args.round);
  } else if (action === "finalize") {
    await finalizeRound({ sco, reg, roundId: parseInt(args.round ?? "1"), from });
    console.log("finalized round", args.round);
  } else if (action === "update") {
    const roundId = parseInt(args.round ?? "1");
    const clients = (args.clients || "").split(",").map(s => s.trim()).filter(Boolean);
    const scores = (args.scores || "").split(",").map(s => BigInt(s.trim()));
    await updateScore({ sco, reg, roundId, clients, scores, from });
    console.log("updated scores for", clients.length, "clients");
  } else {
    throw new Error("unknown action");
  }
}

main().catch(err => { console.error(err); process.exit(1); });
