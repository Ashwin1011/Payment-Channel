var utils = require('./utils');
var config = require('./config')
var bigNumber = require('bignumber.js');

function PaymentContract(contractAddress, web3Instance) {
    //var compiled = require(filePath)
    this.address = contractAddress
    //hard code abi here
    this.abi = [
        {
            "constant": false,
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_contract",
                    "type": "address"
                },
                {
                    "internalType": "address",
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
                    "internalType": "address",
                    "name": "_rec",
                    "type": "address"
                }
            ],
            "payable": true,
            "stateMutability": "payable",
            "type": "constructor"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_add",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "internalType": "uint256",
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
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        }
    ]
    this.web3 = web3Instance
    this.contract = new this.web3.eth.Contract(this.abi, this.address)
}


PaymentContract.prototype.getOwner = async function () {
    try {
        let address = await this.contract.methods.owner().call()
        return address
    }
    catch (err) {
        console.error('Get_owner_error', err);
        throw err
    }
}


PaymentContract.prototype.claim = async function (privKey, contractaddress, owner, nonce, fromAcc) {
    try {
        // privKey = " + privKey
        // let sender = await this.web3.eth.accounts.privateKeyToAccount(privKey).address;
        // console.log(sender);
        let contractData = this.contract.methods.claim(contractaddress, owner).encodeABI()
        let rawTx = {
            gasLimit: this.web3.utils.toHex(config.contractGasLimit),
            data: contractData,
            from: fromAcc,
            to: this.address
        };
        // const accountNonce = '0x' + (await this.web3.eth.getTransactionCount(fromAcc) + 1).toString(16)
        txInfo = await utils.getTxInfo(fromAcc);
        rawTx.nonce = txInfo.nonce;
        rawTx.gasPrice = txInfo.gasPriceHex;
        let signedTx = utils.signTx(rawTx, privKey)
        let txHash = await utils.submitTransaction(signedTx)
        return txHash
    }
    catch (err) {
        console.error('Claim_error', err);
        throw err
    }
}

PaymentContract.prototype.balanceOf = async function (add) {
    try {
        let bal = await this.contract.methods.balanceOf(add).call()
        bal = this.web3.utils.fromWei(bal, 'ether');
        return bal
    }
    catch (err) {
        console.error('Get_balance_error', err);
        throw err
    }
}

PaymentContract.prototype.shutDown = async function (privKey) {
    try {
        let pk = "0x" + privKey
        let sender = await this.web3.eth.accounts.privateKeyToAccount(pk).address;
        // console.log(sender);
        let contractData = this.contract.methods.shutdown().encodeABI()
        let rawTx = {
            gasLimit: this.web3.utils.toHex(config.contractGasLimit),
            data: contractData,
            from: sender,
            to: this.address
        };
        // const accountNonce = '0x' + (await this.web3.eth.getTransactionCount(fromAcc) + 1).toString(16)
        txInfo = await utils.getTxInfo(sender);
        rawTx.nonce = txInfo.nonce;
        rawTx.gasPrice = txInfo.gasPriceHex;
        let signedTx = utils.signTx(rawTx, privKey)
        let txHash = await utils.submitTransaction(signedTx)
        return txHash
    }
    catch (err) {
        console.error('ShutDown_error', err);
        throw err
    }
}









module.exports = PaymentContract
