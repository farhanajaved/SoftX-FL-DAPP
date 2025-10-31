#!/usr/bin/env node
import { fileURLToPath } from "url"; const __dirname = fileURLToPath(new URL(".", import.meta.url));
const { spawnSync } = await import("node:child_process");
const args = process.argv.slice(2);
const proc = spawnSync("node", [__dirname + "../services/agg-dapp.mjs", "action=open", ...args], { stdio: "inherit" });
process.exit(proc.status ?? 0);
