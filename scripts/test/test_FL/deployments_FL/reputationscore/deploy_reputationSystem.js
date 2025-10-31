async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const ContractFactory = await hre.ethers.getContractFactory("ReputationSystem");
    const contract = await ContractFactory.deploy();  // Removed the serverAddress argument
    await contract.deployed();

    console.log("Contract deployed to:", contract.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("Error in deployment:", error);
        process.exit(1);
    });
