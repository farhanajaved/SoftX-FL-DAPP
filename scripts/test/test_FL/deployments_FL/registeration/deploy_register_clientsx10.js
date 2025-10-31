const { ethers } = require("hardhat");
async function main() {
    const [deployer, ...users] = await ethers.getSigners();
    const numClients = parseInt(process.argv[2]) || 10;  // Default to 10 clients 
    if (numClients > users.length) {
        console.error(`Not enough signers provided; need at least ${numClients} clients.`);
        return;
    }
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    const ClientRegistration = await ethers.getContractFactory("ClientRegistration");
    const clientRegistration = await ClientRegistration.deploy();
    await clientRegistration.deployed();
    console.log("ClientRegistration deployed to:", clientRegistration.address);

    // Run the registration process 10 times
    for (let attempt = 0; attempt < 10; attempt++) {
        console.log(`Attempt ${attempt + 1}:`);
        const promises = [];
        const startTimes = new Array(numClients);
        const latencies = new Array(numClients);
        // Register multiple clients concurrently
        for (let i = 0; i < numClients; i++) {
            startTimes[i] = Date.now();
            const promise = clientRegistration.connect(users[i]).registerAsClient()
                .then(async (tx) => {
                    const receipt = await tx.wait();
                    const endTime = Date.now();
                    latencies[i] = (endTime - startTimes[i]) / 1000; // Convert milliseconds to seconds
                    console.log(`Transaction ${i+1} (${users[i].address}): Hash=${receipt.transactionHash}, Gas=${receipt.gasUsed.toString()}, Latency=${latencies[i].toFixed(3)} seconds`);
                });
            promises.push(promise);
        }
        await Promise.all(promises);
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
