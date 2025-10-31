const { ethers } = require("hardhat");
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function main() {
  const csvWriter = createCsvWriter({
    path: '/home/fjaved/demos/hardhat-polygon/test/test_FL/accounts/accountsPolygon.csv',
    header: [
      {id: 'index', title: 'Account Index'},
      {id: 'address', title: 'Address'},
      {id: 'privateKey', title: 'Private Key'}
    ]
  });

  const accounts = [];
  
  for (let i = 0; i < 55; i++) {
    const wallet = ethers.Wallet.createRandom();
    accounts.push({
      index: i,
      address: wallet.address,
      privateKey: wallet.privateKey
    });
  }

  await csvWriter.writeRecords(accounts);
  console.log('Accounts created and saved to accounts.csv');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
