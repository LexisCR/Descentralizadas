require('dotenv').config({path:require('find-config')('.env')})
const {ethers} = require('ethers')
const contract = require('../artifacts/contracts/Pagos.sol/Pagos.json')
const {createTransaction,depositToContract, getContract} = require('../utilidades/contractHelper')
const {PAGOS_CONTRACT_ADDRESS} = process.env

async function deposit(amount, account){
    return await depositToContract(PAGOS_CONTRACT_ADDRESS,contract.abi,amount,account)
}
async function release(account){
    return await createTransaction(PAGOS_CONTRACT_ADDRESS, contract.abi, 'release',[],account)
}
async function getBalance(){
    const pagos = getContract(PAGOS_CONTRACT_ADDRESS,contract.abi)
    const balance = await pagos.getBalance()
    console.log("Contract balance:",ethers.utils.formatEther(balance))
    return balance
}
module.exports={
    deposit,release,getBalance
}