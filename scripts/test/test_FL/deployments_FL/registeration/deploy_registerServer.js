async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const registerServer = await ethers.getContractFactory("registerServer");
    const RegisterServer = await registerServer.deploy();

    console.log("registerServer address:", RegisterServer.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
