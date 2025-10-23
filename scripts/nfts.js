require('dotenv').config({ path: require('find-config')('.env') })
const fs = require('fs')
const formData = require('form-data')
const axios = require('axios')
const { ethers, Wallet } = require('ethers')

const contract = require('../artifacts/contracts/NFT.sol/NFTclase.json')
const {
    PINATA_API_KEY,
    PINATA_SECRET_KEY,
    NFT_CONTRACT_ADDRESS,
    PRIVATE_KEY,
    PUBLIC_KEY,
    API_URL
} = process.env

async function createImgInfo(imageRoute) {
    const stream = fs.createReadStream(imageRoute)
    const data = new formData()
    data.append('file', stream)
    const fileResponse = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", data, {
        headers: {
            "Content-Type": `multipart/form-data: boundary=${data._boundary}`,
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY
        }
    })

    const { data: fileData = {} } = fileResponse
    const { IpfsHash } = fileData
    const fileIPFS = `https://ipfs.io/ipfs/${IpfsHash}`
    return fileIPFS
}

async function createJsonInfo(metadata) {

    const pinataJSONBody = {
        pinataMetadata: {
            name: metadata.name
        },
        pinataContent: metadata
    }

    const jsonResponse = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        pinataJSONBody,
        {
            headers: {
                "Content-Type": 'application/json',
                pinata_api_key: PINATA_API_KEY,
                pinata_secret_api_key: PINATA_SECRET_KEY
            }
        }
    )
    const { data: jsonData = {} } = jsonResponse;
    const { IpfsHash } = jsonData;
    const tokenURI = `https://ipfs.io/ipfs/${IpfsHash}`
    return tokenURI
}

async function createNFT() {
    const imageInfo = await createImgInfo('images/Herobrine.jpg')
    const metadata = {
        image: imageInfo,
        name: 'Herobrine.jpg',
        description: "1erNFT",
        attributes: [{ 'trait_type': 'color', value: 'white' },
        { 'trait_type': 'background', value: 'white' }
        ]
    }
    const tokenURI = await createJsonInfo(metadata)
    const nftResult = await minNFT(tokenURI)
    console.log(nftResult)
    return nftResult
}

async function minNFT(tokenURI) {
    const provider = new ethers.providers.JsonRpcProvider(API_URL) //NODO
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider)  //billetera
    const etherInterface = new ethers.utils.Interface(contract.abi) //contrato

    const nonce = await provider.getTransactionCount(PUBLIC_KEY, 'pending')
    const network = await provider.getNetwork()
    const gasPrice = await provider.getGasPrice()
    const { chainId } = network
    const transaction = {
        from: PUBLIC_KEY,
        to: NFT_CONTRACT_ADDRESS,
        chainId,
        gasPrice,
        nonce,
        data: etherInterface.encodeFunctionData("minNFT", [PUBLIC_KEY, tokenURI])

    }

    console.log(transaction)
    const estimateGas = await provider.estimateGas(transaction)
    transaction.gasLimit = estimateGas
    const signedTX = await wallet.signTransaction(transaction)
    const result = await provider.sendTransaction(signedTX)
    await result.wait()
    const hash = result.hash
    const receipt = await provider.getTransactionReceipt(hash)
    const { logs } = receipt


   // CORRECCIÓN: Acceder correctamente a los logs
    if (logs && logs.length > 0) {
        // Dependiendo de cómo esté estructurado tu evento en el contrato
        // Normalmente se accede a los topics del primer log
        const tokenInBigNumber = ethers.BigNumber.from(logs[0].topics[3])
        const tokenId = tokenInBigNumber.toNumber()
        console.log("NFT TOKEN ID", tokenId)
    } else {
        console.log("No se encontraron logs en la transacción")
    }
    

}

createNFT()