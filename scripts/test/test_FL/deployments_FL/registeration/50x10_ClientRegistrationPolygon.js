require('dotenv').config();
const { ethers } = require("hardhat");
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// CSV and Log file setup
const csvWriter = createCsvWriter({
    path: '/home/fjaved/demos/hardhat-polygon/test/test_FL/registration__seq_50x10_log.csv',
    header: [
        { id: 'iteration', title: 'Iteration' },
        { id: 'address', title: 'Address' },
        { id: 'gasUsed', title: 'Gas Used' },
        { id: 'cost', title: 'Cost (ETH)' },
        { id: 'latency', title: 'Latency (s)' },
        { id: 'userIndex', title: 'User Index' },
        { id: 'batchSize', title: 'Batch Size' }
    ]
});
const logFilePath = '/home/fjaved/demos/hardhat-polygon/test/test_FL/registration_seq_50x10_log.txt';

function appendToLogFile(text) {
    fs.appendFileSync(logFilePath, text + '\n');
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function readPrivateKeys(filePath) {
    const accounts = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                accounts.push({ privateKey: row['Private Key'], address: row['Address'] });
            })
            .on('end', () => {
                console.log('Finished reading CSV.');
                resolve(accounts);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

async function fundAccounts(accounts, provider, sender, amount) {
    for (const account of accounts) {
        const tx = {
            to: account.address,
            value: ethers.utils.parseEther(amount.toString())
        };
        console.log(`Funding account ${account.address}`);
        const transaction = await sender.sendTransaction(tx);
        await transaction.wait();
    }
}

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.API_URL);
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const accountsData = await readPrivateKeys('/home/fjaved/demos/hardhat-polygon/test/test_FL/accounts/accountsPolygon_FL_clients.csv');
    const accounts = accountsData.map(data => new ethers.Wallet(data.privateKey, provider));
    const clientRegistration = new ethers.Contract(
        "0x0dBAd08033bB99264942cfBAB799448b4dC9d594",
        JSON.parse(fs.readFileSync('/home/fjaved/demos/hardhat-polygon/artifacts/contracts/ClientRegistrationPolygon.sol/ClientRegistrationPolygon.json', 'utf8')).abi,
        provider
    );

    const estimatedGas = await clientRegistration.estimateGas.registerAsClient();
    const gasPrice = await provider.getGasPrice();
    const costPerTx = estimatedGas.mul(gasPrice);
    console.log(`Estimated cost per transaction: ${ethers.utils.formatEther(costPerTx)} ETH`);
    await fundAccounts(accounts.slice(0, 50), provider, deployer, ethers.utils.formatEther(costPerTx.mul(50)));

    for (let iteration = 0; iteration < 10; iteration++) {
        console.log(`Starting iteration ${iteration + 1}`);
        for (let i = 0; i < 50; i++) {
            const account = accounts[i];
            console.log(`Registration process for account ${i + 1}, iteration ${iteration + 1}`);
            const startTime = Date.now();
            const txResponse = await clientRegistration.connect(account).registerAsClient({
                gasLimit: estimatedGas.toString()
            });
            const receipt = await txResponse.wait();
            const endTime = Date.now();
            const latency = (endTime - startTime) / 1000;
            const actualGasCost = receipt.gasUsed.mul(gasPrice);

            const outputText = `Iteration ${iteration + 1}: Client ${account.address} registered: Transaction Hash - ${receipt.transactionHash}\nGas Used: ${receipt.gasUsed.toString()} | Cost: ${ethers.utils.formatEther(actualGasCost)} ETH | Latency: ${latency.toFixed(3)} s`;
            console.log(outputText);
            appendToLogFile(outputText);

            const result = {
                iteration: iteration + 1,
                address: account.address,
                gasUsed: receipt.gasUsed.toString(),
                cost: ethers.utils.formatEther(actualGasCost),
                latency: latency.toFixed(3),
                userIndex: i + 1,
                batchSize: 1
            };
            await csvWriter.writeRecords([result]);
            await delay(1000);  // Delay after each transaction
        }
    }
}

main().catch((error) => {
    console.error('Error in main execution:', error);
    process.exit(1);
});
