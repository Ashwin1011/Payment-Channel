var utils = require('./utils');
var config = require('./config')
var bigNumber = require('bignumber.js');
var contractDat = require('./compiler/RecieverPays')

function PaymentContract(contractAddress, web3Instance) {
    this.address = contractAddress
    let abi = contractDat.interface;
    this.abi = JSON.parse(abi)
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

PaymentContract.prototype.getTimeout = async function () {
    try {
        let time = await this.contract.methods.expiration().call()
        return time
    }
    catch (err) {
        console.error('Get_timeout_error', err);
        throw err
    }
}


PaymentContract.prototype.claim = async function (privKey, contractaddress, owner, fromAcc, amount) {
    try {
        let contractData = this.contract.methods.claim(contractaddress, owner, amount).encodeABI()
        let rawTx = {
            gasLimit: this.web3.utils.toHex(config.contractGasLimit),
            data: contractData,
            from: fromAcc,
            to: this.address
        };
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
        let contractData = this.contract.methods.shutdown().encodeABI()
        let rawTx = {
            gasLimit: this.web3.utils.toHex(config.contractGasLimit),
            data: contractData,
            from: sender,
            to: this.address
        };
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
