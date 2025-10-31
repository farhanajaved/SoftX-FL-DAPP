const { ethers } = require("hardhat");
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

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

async function main() {
    try {
        console.log('Loading provider and deployer wallet...');
        const provider = new ethers.providers.JsonRpcProvider(process.env.API_URL);
        const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        console.log(`Deployer address: ${deployer.address}`);

        console.log('Reading private keys and addresses from CSV file...');
        const accounts = await readPrivateKeys('/home/fjaved/demos/hardhat-polygon/test/test_FL/accounts/accountsPolygon_FL_clients.csv');
        console.log('CSV file successfully processed');
        console.log(`Total accounts to fund: ${accounts.length}`);

        if (accounts.length === 0) {
            console.log('No accounts found in the CSV file.');
            process.exit(1);
        }

        const totalMatic = ethers.utils.parseUnits("4.0", "ether");
        const amountToSend = totalMatic.div(accounts.length);
        console.log(`Amount to send to each account: ${ethers.utils.formatEther(amountToSend)} MATIC`);

        const balance = await deployer.getBalance();
        console.log(`Deployer balance: ${ethers.utils.formatEther(balance)} MATIC`);
        if (balance.lt(totalMatic)) {
            console.error('Insufficient funds in the deployer wallet.');
            process.exit(1);
        }

        for (const account of accounts) {
            try {
                const recipientWallet = new ethers.Wallet(account.privateKey, provider);
                const recipientBalanceBefore = await provider.getBalance(account.address);

                console.log(`Sending ${ethers.utils.formatEther(amountToSend)} MATIC to ${account.address}`);
                const tx = await deployer.sendTransaction({
                    to: account.address,
                    value: amountToSend
                });
                console.log(`Transaction sent: ${tx.hash}`);

                const receipt = await tx.wait();
                console.log(`Transaction confirmed: ${tx.hash}`);
                if (receipt.status === 1) {
                    const recipientBalanceAfter = await provider.getBalance(account.address);
                    console.log(`Successfully sent ${ethers.utils.formatEther(amountToSend)} MATIC to ${account.address}`);
                    console.log(`Balance before: ${ethers.utils.formatEther(recipientBalanceBefore)} MATIC`);
                    console.log(`Balance after: ${ethers.utils.formatEther(recipientBalanceAfter)} MATIC`);
                } else {
                    console.log(`Transaction failed for ${account.address}`);
                }
            } catch (error) {
                console.error(`Error sending transaction to ${account.address}:`, error);
            }
        }

        console.log('Funding process completed');
        process.exit(0);
    } catch (error) {
        console.error('Error in script execution:', error);
        process.exit(1);
    }
}

main();
