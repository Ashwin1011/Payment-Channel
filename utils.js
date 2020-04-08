var Tx = require('ethereumjs-tx');
var config = require('./config')
const Web3 = require('web3')
const contract = require('web3-eth-contract');
const contractData = require('./compiler/RecieverPays')

var web3 = new Web3(new Web3.providers.HttpProvider(config.provider));

var convPriv = (privKey) => {
  return Buffer.from(privKey, 'hex')
}

var signTx = (rawTxObject, privKey) => {
  try {
    let tx = new Tx(rawTxObject);
    // tx.sign(privKey)
    let pk = convPriv(privKey);

    tx.sign(convPriv(privKey));
    let serializedTx = tx.serialize();
    // To create the txHash without broadcasting
    // var txHash = Utils.sha3(serializedTx);
    var signedTx = "0x" + serializedTx.toString('hex');
    return signedTx
  } catch (err) {
    console.log('signTx_error')
    throw err
  }
}

var submitTransaction = function (signedTx) {
  return new Promise((resolve, reject) => {
    web3.eth.sendSignedTransaction(signedTx, (err, txHash) => {
      if (err) {
        console.log('submitTransaction_error');
        return reject(err)
      }
      else return resolve(txHash)
    })
  })
}

var getTxInfo = async (acc) => {
  try {
    let nonce = await web3.eth.getTransactionCount(acc)
    let gasPrice = await web3.eth.getGasPrice()
    if (!gasPrice) throw Error('Gas Price issue')
    return { gasPriceHex: web3.utils.toHex(gasPrice), nonceHex: web3.utils.toHex(nonce), gasPrice: gasPrice, nonce: nonce }
  } catch (err) {
    console.log('getTxInfo_error')
    throw err
  }
}

var deployContract = async function (recipient, amount, privKey, duration) {
  try {
    const contractDat = require('./compiler/RecieverPays')
    let abi = contractDat.interface
    let bytecode = contractDat.bytecode
    let params = []
    duration = parseInt(duration)
    params.push(recipient)
    params.push(duration)
    let pk = '0x' + privKey
    // console.log(pk)
    let sender = await web3.eth.accounts.privateKeyToAccount(pk).address;
    let contractData = null
    if (abi && bytecode) {
      var generic_contract = new web3.eth.Contract(JSON.parse(abi))
      contractData = generic_contract.deploy({
        data: '0x' + bytecode,
        arguments: params
      }).encodeABI();
    }

    let rawTxObject = {
      gasLimit: web3.utils.toHex(config.contractGasLimit),
      data: contractData,
      from: sender,
      chainId: config.chainId,
      value: amount
    };
    txInfo = await getTxInfo(sender);

    rawTxObject.nonce = txInfo.nonceHex;
    rawTxObject.gasPrice = txInfo.gasPriceHex;

    let signedTx = signTx(rawTxObject, privKey)
    let txHash = await submitTransaction(signedTx)
    return txHash
  } catch (err) {
    console.error('deployContract_error');
    throw err
  }
}

var getContractAddress = async function (txHash) {
  try {
    const receipt = await web3.eth.getTransactionReceipt(txHash)
    let address = receipt.contractAddress
    return address
  }
  catch (err) {
    console.error('getContractAddress_err');
    throw err
  }
}



module.exports = { signTx, submitTransaction, getTxInfo, deployContract, getContractAddress, web3 }

