require('dotenv').config({path:require('find-config')('.env')})
const {ethers} = require('ethers')
const contract = require('../artifacts/contracts/Wallet.sol/MultiSignPaymentWallet.json')
const {createTransaction,depositToContract, getContract} = require('../utilidades/contractHelper')
const {WALLET_CONTRACT} = process.env

const { provider, getWallet } = require('../utilidades/accountManager')

async function sendTransaction(method,params,account){
    return await createTransaction(WALLET_CONTRACT,contract.abi,method,params,account)
}

async function submitTransaction(to,amount,account){
    const receipt = await sendTransaction('SubmitTransaction',[to,amount],account)
    return receipt
}
async function approveTransaction(txid,account){
    const receipt = await sendTransaction('approveTransaction',[txid],account)
    return receipt
}
async function executeTransaction(txid,account){
    const receipt = await sendTransaction('executeTransaction',[txid],account)
    return receipt
}

async function deposit(amount,account){
    return await depositToContract(WALLET_CONTRACT,contract.abi,amount,account)
}

async function releasePayments(account){
    const receipt = await sendTransaction('releasePayments',[],account)
    return receipt
}

async function getBalance(){
    const walletContract = getContract(WALLET_CONTRACT,contract.abi)
    const balance = await walletContract.getBalance()
    return balance
}
async function getTransactions(){
    const walletContract = getContract(WALLET_CONTRACT,contract.abi)
    const transactions = await walletContract.getTransactions()
    console.log(transactions)
    return transactions.map(formatTransaction)
}

function formatTransaction(info){
    return {
        to: info.to,
        amount: ethers.BigNumber.from(info.amount).toString(),
        approvalCount:ethers.BigNumber.from(info.approvalCount).toString(),
        executed:info.executed
    }
}

async function getApprovalsHistory(txId){
    const walletContract = getContract(WALLET_CONTRACT, contract.abi);
    const approvals = await walletContract.getApprovalHistory(txId);
    const formattedApprovals = approvals.map(a => ({
        approver: a.approver,
        timestamp: a.timestamp.toNumber(),
        date: new Date(a.timestamp.toNumber() * 1000).toISOString()
    }));

    return {
        txId: txId,
        totalApprovals: formattedApprovals.length,
        approvals: formattedApprovals
    };
}

function readContract() {
    return getContract(WALLET_CONTRACT, contract.abi)
}

async function sendTx(method, params, account) {
    return await createTransaction(WALLET_CONTRACT, contract.abi, method, params, account)
}


async function addProduct(name, price, account) {
    const priceBN = ethers.BigNumber.from(price)
    return await sendTx("addProduct", [name, priceBN], account)
}

async function buyProduct(productId, price, account) {
    const wallet = getWallet(account)
    const contractInstance = new ethers.Contract(WALLET_CONTRACT, contract.abi, wallet)
    const tx = await contractInstance.buyProduct(
        productId,
        { value: ethers.utils.parseEther(price.toString()) }
    )
    await tx.wait()
    return tx
}

async function disableProduct(productId, account) {
    return await sendTx("disableProduct", [productId], account)
}

async function getAllProducts() {
    const walletContract = readContract()
    const products = await walletContract.getAllProducts()
    return products.map(p => ({
        id: p.id.toString(),
        name: p.name,
        price: ethers.utils.formatEther(p.price.toString()),
        seller: p.seller,
        active: p.active
    }))
}

module.exports={
    deposit,
    submitTransaction,
    submitTransaction,
    approveTransaction,
    executeTransaction,
    releasePayments,
    getBalance,
    getTransactions,
    getApprovalsHistory,
    addProduct,
    buyProduct,
    disableProduct,
    getAllProducts
}