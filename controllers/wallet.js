require('dotenv').config({path:require('find-config')('.env')})
const {ethers} = require('ethers')
const contract = require('../artifacts/contracts/Wallet.sol/MultiSignPaymentWallet.json')
const {createTransaction,depositToContract, getContract} = require('../utilidades/contractHelper')
const {WALLET_CONTRACT} = process.env

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

module.exports={
    deposit,
    submitTransaction,
    submitTransaction,
    approveTransaction,
    executeTransaction,
    releasePayments,
    getBalance,
    getTransactions
}