// services/client-dapp.mjs
// SMO-Client DApp Adapter (off-chain).
// - Packages NMSE payloads and either POSTs to an Oracle endpoint
//   or (if ORACLE_URL is not set) **directly** calls submitNMSE on chain (requires oracle role).

import "dotenv/config";
import axios from "axios";
import { ethers } from "ethers";
import {
  getProvider, getSigner, getContracts, submitNMSEOnChain
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

  const roundId = parseInt(args.round ?? "1");
  const client = args.client ?? from;
  const nmseFixed = BigInt(args.nmse ?? "25000"); // already scaled 1e6
  const ts = BigInt(args.ts ?? Math.floor(Date.now()/1000));

  const payload = {
    client_id: client,
    round: roundId,
    ts: Number(ts),
    nmse_fixed: Number(nmseFixed),
    scale: 1_000_000
  };

  if (process.env.ORACLE_URL) {
    // Send to Oracle Adapter HTTP endpoint
    const url = process.env.ORACLE_URL;
    const res = await axios.post(url, payload, { timeout: 15000 });
    console.log("oracle-adapter response:", res.status, res.data);
  } else {
    // Call chain directly (requires signer to have ORACLE role)
    await submitNMSEOnChain({ sco, reg, roundId, client, nmseFixed, ts, from });
    console.log("submitNMSE on-chain done");
  }
}

main().catch(err => { console.error(err); process.exit(1); });
