// services/dapp-adapter.mjs
// Minimal DApp Adapter (off-chain) used by both SMO-Client and SMO-Aggregator.
// - Wraps provider/signer
// - Exposes thin helpers to call ACM (registrationClient) and SCO
// - Uses minimal ABIs so it works without Hardhat runtime
//
// Usage: import in client/aggregator scripts.
// Requires: node >=18, ethers >=6, dotenv (optional), axios (optional for client->oracle)
//
// Env (example):
// RPC_URL=...
# PRIVATE_KEY=0x...
// REG_ADDRESS=0x...   // registrationClient (ACM)
// SCO_ADDRESS=0x...   // SCO contract
// ORACLE_URL=http://localhost:8787/submit  // optional: oracle HTTP endpoint

import { readFile } from "node:fs/promises";
import { ethers } from "ethers";

export function getProvider(rpcUrl = process.env.RPC_URL) {
  if (!rpcUrl) throw new Error("RPC_URL missing");
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getSigner(provider, pk = process.env.PRIVATE_KEY) {
  if (!pk) throw new Error("PRIVATE_KEY missing");
  return new ethers.Wallet(pk, provider);
}

// Minimal ABIs (only what we call)
export const REG_ABI = [
  "function isClient(address) view returns (bool)",
  "function isAggregator(address) view returns (bool)",
  "function isOracle(address) view returns (bool)",
  "function addClient(address)",
  "function addClients(address[])",
  "function grantAggregator(address)",
  "function grantOracle(address)"
];

export const SCO_ABI = [
  "function openRound(uint32, bytes32, uint8, uint32)",
  "function closeRound(uint32)",
  "function finalizeRound(uint32)",
  "function updateScore(uint32, address[], uint256[])",
  "function submitNMSE(uint32, address, uint256, uint256)",
  "function getRound(uint32) view returns (bool,bool,bool,bool,uint8,uint32,bytes32)",
  "function getReputation(uint32,address) view returns (uint256)"
];

export function getContracts({ provider, signer, regAddress = process.env.REG_ADDRESS, scoAddress = process.env.SCO_ADDRESS }) {
  if (!regAddress) throw new Error("REG_ADDRESS missing");
  if (!scoAddress) throw new Error("SCO_ADDRESS missing");
  const reg = new ethers.Contract(regAddress, REG_ABI, signer ?? provider);
  const sco = new ethers.Contract(scoAddress, SCO_ABI, signer ?? provider);
  return { reg, sco };
}

// Helpers
export async function ensureRole({ reg, address, role }) {
  if (role === "client") return await reg.isClient(address);
  if (role === "aggregator") return await reg.isAggregator(address);
  if (role === "oracle") return await reg.isOracle(address);
  throw new Error("unknown role " + role);
}

export async function openRound({ sco, reg, roundId, policyHash, selectPct = 90, ttlSec = 600, from }) {
  if (!(await reg.isAggregator(from))) throw new Error("signer is not AGGREGATOR per ACM");
  const tx = await sco.openRound(roundId, policyHash, selectPct, ttlSec);
  return tx.wait();
}

export async function closeRound({ sco, reg, roundId, from }) {
  if (!(await reg.isAggregator(from))) throw new Error("signer is not AGGREGATOR per ACM");
  const tx = await sco.closeRound(roundId);
  return tx.wait();
}

export async function finalizeRound({ sco, reg, roundId, from }) {
  if (!(await reg.isAggregator(from))) throw new Error("signer is not AGGREGATOR per ACM");
  const tx = await sco.finalizeRound(roundId);
  return tx.wait();
}

export async function updateScore({ sco, reg, roundId, clients, scores, from }) {
  if (!(await reg.isAggregator(from))) throw new Error("signer is not AGGREGATOR per ACM");
  if (clients.length !== scores.length) throw new Error("clients/scores length mismatch");
  const tx = await sco.updateScore(roundId, clients, scores);
  return tx.wait();
}

export async function submitNMSEOnChain({ sco, reg, roundId, client, nmseFixed, ts, from }) {
  if (!(await reg.isOracle(from))) throw new Error("signer is not ORACLE per ACM");
  if (!(await reg.isClient(client))) throw new Error("client not registered in ACM");
  const tx = await sco.submitNMSE(roundId, client, nmseFixed, ts);
  return tx.wait();
}
