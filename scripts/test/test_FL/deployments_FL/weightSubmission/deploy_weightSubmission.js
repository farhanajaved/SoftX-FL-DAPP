async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Define the server address here
    const serverAddress = '0x7d125799866eA9fA71AD402c61Fa60Ef7e5E1355';

    const ContractFactory = await hre.ethers.getContractFactory("WeightSubmission");
    // Pass the server address as an argument to the deploy function
    const contract = await ContractFactory.deploy(serverAddress);
    await contract.deployed();

    console.log("Contract deployed to:", contract.address);
    console.log("Server address set to:", serverAddress);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("Error in deployment:", error);
        process.exit(1);
    });
