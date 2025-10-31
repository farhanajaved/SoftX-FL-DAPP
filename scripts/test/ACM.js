\
// scripts/ACM.js.js
// Usage examples (run with Hardhat):
//   npx hardhat run scripts/ACM.js.js --network polygon \
//     action=grantAggregator reg=0xREG... addr=0xAGG...
//   npx hardhat run scripts/ACM.js.js --network polygon \
//     action=openRound reg=0xREG... sco=0xSCO... round=1 selectPct=90 ttlSec=600 policyHash=0x00...
//   npx hardhat run scripts/ACM.js.js --network polygon \
//     action=submitNMSE reg=0xREG... sco=0xSCO... round=1 client=0xCLIENT... nmse=25341 ts=$(date +%s)
//   npx hardhat run scripts/ACM.js.js --network polygon \
//     action=updateScore reg=0xREG... sco=0xSCO... round=1 clients=0xC1,0xC2 scores=1000000000000000000,900000000000000000
//   npx hardhat run scripts/ACM.js.js --network polygon \
//     action=finalize reg=0xREG... sco=0xSCO... round=1

const { ethers } = require("hardhat");

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
  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);

  const reg = await ethers.getContractAt("registrationClient", args.reg, signer);

  switch (args.action) {
    case "addClient": {
      const tx = await reg.addClient(args.addr);
      console.log("tx:", tx.hash); await tx.wait();
      console.log("Added client:", args.addr);
      break;
    }
    case "grantAggregator": {
      const tx = await reg.grantAggregator(args.addr);
      console.log("tx:", tx.hash); await tx.wait();
      console.log("Granted AGG:", args.addr);
      break;
    }
    case "grantOracle": {
      const tx = await reg.grantOracle(args.addr);
      console.log("tx:", tx.hash); await tx.wait();
      console.log("Granted ORACLE:", args.addr);
      break;
    }
    case "openRound": {
      const isAgg = await reg.isAggregator(signer.address);
      if (!isAgg) throw new Error("Signer is not AGGREGATOR per ACM");
      const sco = await ethers.getContractAt("SCO", args.sco, signer);
      const tx = await sco.openRound(
        parseInt(args.round),
        args.policyHash || "0x0000000000000000000000000000000000000000000000000000000000000000",
        parseInt(args.selectPct || "90"),
        parseInt(args.ttlSec || "600")
      );
      console.log("tx:", tx.hash); await tx.wait();
      console.log("Round opened:", args.round);
      break;
    }
    case "submitNMSE": {
      const isOracle = await reg.isOracle(signer.address);
      if (!isOracle) throw new Error("Signer is not ORACLE per ACM");
      const isClient = await reg.isClient(args.client);
      if (!isClient) throw new Error("Client not registered per ACM");
      const sco = await ethers.getContractAt("SCO", args.sco, signer);
      const tx = await sco.submitNMSE(
        parseInt(args.round),
        args.client,
        ethers.toBigInt(args.nmse),              // fixed-point already
        BigInt(args.ts || Math.floor(Date.now()/1000))
      );
      console.log("tx:", tx.hash); await tx.wait();
      console.log("NMSE submitted for", args.client);
      break;
    }
    case "closeRound": {
      const isAgg = await reg.isAggregator(signer.address);
      if (!isAgg) throw new Error("Signer is not AGGREGATOR per ACM");
      const sco = await ethers.getContractAt("SCO", args.sco, signer);
      const tx = await sco.closeRound(parseInt(args.round));
      console.log("tx:", tx.hash); await tx.wait();
      console.log("Round closed:", args.round);
      break;
    }
    case "updateScore": {
      const isAgg = await reg.isAggregator(signer.address);
      if (!isAgg) throw new Error("Signer is not AGGREGATOR per ACM");
      const sco = await ethers.getContractAt("SCO", args.sco, signer);
      const clients = (args.clients || "").split(",").map(s => s.trim()).filter(Boolean);
      const scores = (args.scores || "").split(",").map(s => ethers.toBigInt(s.trim()));
      if (clients.length !== scores.length) throw new Error("clients/scores length mismatch");
      const tx = await sco.updateScore(parseInt(args.round), clients, scores);
      console.log("tx:", tx.hash); await tx.wait();
      console.log("Scores updated for", clients.length, "clients");
      break;
    }
    case "finalize": {
      const isAgg = await reg.isAggregator(signer.address);
      if (!isAgg) throw new Error("Signer is not AGGREGATOR per ACM");
      const sco = await ethers.getContractAt("SCO", args.sco, signer);
      const tx = await sco.finalizeRound(parseInt(args.round));
      console.log("tx:", tx.hash); await tx.wait();
      console.log("Round finalized:", args.round);
      break;
    }
    default:
      console.log("Unknown action. Supported actions: addClient, grantAggregator, grantOracle, openRound, submitNMSE, closeRound, updateScore, finalize");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
