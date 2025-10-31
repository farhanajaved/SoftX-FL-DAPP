const hre = require("hardhat");

async function deployAndTest() {
    const accounts = await hre.ethers.getSigners();
    const server = accounts[0]; // Use the first account as the server
    const clients = accounts.slice(1, 6); // Use the next 5 accounts as clients

    for (let i = 0; i < 5; i++) {
        console.log(`\n=== Iteration ${i + 1} ===`);
        const WeightSubmission = await hre.ethers.getContractFactory("WeightSubmission");
        const weightSubmission = await WeightSubmission.deploy(server.address);
        await weightSubmission.deployed();
        console.log(`WeightSubmission deployed to: ${weightSubmission.address}`);

        for (let round = 1; round <= 5; round++) {
            console.log(`\n--- Round ${round} ---`);
            const promises = [];
            // Queue all transactions
            for (let j = 0; j < clients.length; j++) {
                const weight = Math.floor(Math.random() * 100) + 1;
                const txPromise = weightSubmission.connect(clients[j]).submitWeight(round, weight);
                promises.push(txPromise);
            }

            // Wait for all transactions to be sent and mined
            const transactions = await Promise.all(promises);
            const receipts = await Promise.all(transactions.map(tx => tx.wait()));
            receipts.forEach((receipt, index) => {
                console.log(`Client ${index + 1} submitted weight for round ${round}: Gas used = ${receipt.gasUsed.toString()}`);
            });

            // Introduce a 3-second delay to ensure all submissions are complete
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Server reads weights immediately after all submissions are completed for the round
            console.log(`\n--- Server Reading for Round ${round} ---`);
            const [clientAddresses, weights] = await weightSubmission.connect(server).readRoundWeights(round);
            console.log(`Server read data for round ${round}:`);
            clientAddresses.forEach((address, index) => {
                console.log(`Address: ${address}, Weight: ${weights[index]}`);
            });
        }
    }
}

deployAndTest()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
