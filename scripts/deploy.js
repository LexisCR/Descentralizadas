const { Wallet } = require("ethers");
const {ethers} = require("hardhat")

// async function main(){
//     const NFT = await ethers.getContractFactory("NFTclase")
//     const nft = await NFT.deploy()
//     const txHash = nft.deployTransaction.hash;
//     const txReceipt = await ethers.provider.waitForTransaction(txHash)
//     console.log("Contract deployed address:",txReceipt.contractAddress)
// }

// main().then(()=>process.exit(0)).catch((error)=>{
//     console.error(error)
//     process.exit(1)
// });

async function multideploy(){
    const owners = ["0x59427DE366B815334d95267cE7968846Aa5Aa200","0x498a5083B953abD5bAb8136E0E4Fe2E22aeF42ba"]
    const partes=["50","50"];
    const requireApprovals = 2;
    const multisignWallet = await ethers.getContractFactory("MultiSignPaymentWallet");
    const wallet = await multisignWallet.deploy(owners, requireApprovals,owners,partes);
    console.log("WALLET_ADDRESS: ",wallet.address)
}
multideploy().then(()=>process.exit(0)).catch((error)=>{
    console.error(error);
    process.exit(1)
})