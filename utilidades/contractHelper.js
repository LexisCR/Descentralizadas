const {ethers} = require('ethers')
const {provider, getWallet, getPublicKey, publickeys} = require('./accountManager')
const { network } = require('hardhat')


async function createTransaction(contractAddress,abi,method, params,account){
    const etherInterface = new ethers.utils.Interface(abi)
    const wallet = getWallet(account)
    const publickeys = getPublicKey(account)
    const nonce = await provider.getTransactionCount(publickeys, 'latest')
    const gasPrice = await provider.getGasPrice()
    const network = await provider.getNetwork()
    const tx = {
        from:publickeys,
        to:contractAddress,
        nonce:nonce,
        gasPrice,
        chainId:network.chainId,
        data:etherInterface.encodeFunctionData(method,params)
    }
    console.log(tx)
    tx.gasLimit = await provider.estimateGas(tx)
    const signTx = await wallet.signTransaction(tx)
    const receipt = await provider.sendTransaction(signTx)
    await receipt.wait()
    console.log(`TX ${method} sent:`, receipt.hash)
    return receipt
}

async function depositToContract(contractAddress, abi, amount, account){
    const wallet = getWallet(account)
    const contract = new ethers.Contract(contractAddress,abi,wallet)
    const tx = await contract.deposit({value: ethers.utils.parseEther(amount)})
    await tx.wait()
    console.log("Deposit Done:",tx.hash)
    return tx
}
function getContract(contractaddress,abi){
    return new ethers.Contract(contractaddress,abi,provider)
}
module.exports={
    createTransaction,
    depositToContract,
    getContract
}