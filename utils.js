var Tx = require('ethereumjs-tx');
var config = require('./config')
const Web3 = require('web3')
const contract = require('web3-eth-contract');
// const Utils = require('web3-utils');
// const path = require("path");
// const solc = require("solc");
// const fs = require("fs-extra");
// var Web3 = require('web3');

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

var deployContract = async function (recipient, amount, privKey) {
  try {
    const bytecode = "608060405260405160208061022c833981016040525160008054600160a060020a0319908116331790915560018054600160a060020a0390931692909116919091179055346002556101d6806100566000396000f3006080604052600436106100615763ffffffff7c010000000000000000000000000000000000000000000000000000000060003504166321c0b342811461006657806370a08231146100825780638da5cb5b146100b5578063fc0e74d1146100e6575b600080fd5b610080600160a060020a03600435811690602435166100fb565b005b34801561008e57600080fd5b506100a3600160a060020a0360043516610174565b60408051918252519081900360200190f35b3480156100c157600080fd5b506100ca610181565b60408051600160a060020a039092168252519081900360200190f35b3480156100f257600080fd5b50610080610190565b600154600160a060020a0316331461011257600080fd5b30600160a060020a0383161461012757600080fd5b600054600160a060020a0382811691161461014157600080fd5b600254604051339180156108fc02916000818181858888f1935050505015801561016f573d6000803e3d6000fd5b505050565b600160a060020a03163190565b600054600160a060020a031681565b600054600160a060020a031633146101a757600080fd5b33ff00a165627a7a72305820ccd572f4d0cdf4f44b88b0e406cc6d6fae3ef35a5d80388f23dfe9b3d77cafe30029"
    let abi = [
      {
        "constant": false,
        "inputs": [
          {
            "name": "_contract",
            "type": "address"
          },
          {
            "name": "_owner",
            "type": "address"
          }
        ],
        "name": "claim",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_add",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "shutdown",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_rec",
            "type": "address"
          }
        ],
        "payable": true,
        "stateMutability": "payable",
        "type": "constructor"
      }
    ]
    let params = []
    params.push(recipient)
    let pk = '0x' + privKey
    console.log(pk)
    let sender = await web3.eth.accounts.privateKeyToAccount(pk).address;
    let contractData = null
    if (abi && bytecode) {
      var generic_contract = new web3.eth.Contract(abi)
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
      value: web3.utils.toHex(web3.utils.toWei(amount, 'ether'))
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
// var transferEth = async function (accFrom, accTo, opt) {
//   try {
//     let rawTxObject = {
//       to: accTo.address,
//       gasLimit: web3.utils.toHex(config.TxGasLimit),
//       from: accFrom.address,
//       chainId: config.chainId,
//       value: web3.utils.toHex(web3.utils.toWei(opt.amount, 'ether'))
//     };
//     txInfo = await getTxInfo(accFrom.address);
//     if (opt.gasPrice) {
//       rawTxObject.gasPrice = opt.gasPrice
//       rawTxObject.nonce = txInfo.nonceHex;
//     }
//     else {
//       rawTxObject.nonce = txInfo.nonceHex;
//       rawTxObject.gasPrice = txInfo.gasPriceHex;
//     }
//     let signedTx = await signTx(rawTxObject, accFrom.privKey)
//     let txHash = await submitTransaction(signedTx)
//     return txHash
//   } catch (err) {
//     console.error('transferEth_error');
//     throw err
//   }
// }




// var compileContract = async function (fileName) {
//   let files = { "PaymentContract": "PayContract.sol" }
//   try {
//     let filename = files[fileName]

//     const buildPath = path.resolve(__dirname, "build");
//     const filePath = path.resolve(
//       __dirname,
//       "contracts",
//       filename
//     );
//     const source = fs.readFileSync(filePath, "utf-8");

//     const output = solc.compile(source, 1).contracts;

//     fs.ensureDirSync(buildPath);

//     for (let contract in output) {
//       fs.outputJsonSync(

//         path.resolve(buildPath, contract + ".json"),
//         output[contract]
//       );
//     }
//     return true
//   }
//   catch (err) {

//     console.error("compile_contract_err");
//     throw err;

//   }

// }



var getAccounts = async function () {

  try {
    acc = web3.eth.getAccounts()
    return acc
  }
  catch (err) {
    console.log(err)
    return false
  }
}







module.exports = { signTx, submitTransaction, getTxInfo, deployContract, getContractAddress, web3 }