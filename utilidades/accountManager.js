require('dotenv').config({path:require('find-config')('.env')})
const {ethers}=require('ethers')
const {API_URL, PUBLIC_KEY, PRIVATE_KEYs}= process.env

const publickeys = PUBLIC_KEY.split(',')
const privatekeys = PRIVATE_KEYs.split(',')
const provider = new ethers.providers.JsonRpcProvider(API_URL)

function getWallet(account){
    if(account>=privatekeys.length){
        throw new Error($`Account ${account} no existe`)
    }
    return new ethers.Wallet(privatekeys[account],provider)
}
function getPublicKey(account){
    if(account>=publickeys.length){
        throw new Error(`Account ${account} no existe`)
    }
    return publickeys[account]
}
function getAllAccounts(){
    return publickeys.map((key,index)=>({index:index,address:key}))
}
module.exports = {
    provider,
    getWallet,
    getPublicKey,
    getAllAccounts,
    publickeys,
    privatekeys
}