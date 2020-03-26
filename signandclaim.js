const Web3 = require('web3');

// const rpcURL = "HTTP://127.0.0.1:7545";
// const web3 = new Web3(rpcURL);
const config = require('./config')


var web3 = new Web3(new Web3.providers.HttpProvider(config.provider));
const PaymentContract = require('./PaymentContract');



var signMessage = async function (privKey, recipientAdd, amount, contractAdd) {
    try {
        let privateKey = "0x" + privKey
        let mess = recipientAdd + amount + contractAdd
        let signObj = web3.eth.accounts.sign(mess, privateKey)
        return signObj;
    } catch (err) {
        console.log('signMessage_error')
        throw err
    }

}


var claimPayment = async function (privateKey, fromAcc, amount, contractAdd, signature) {
    try {
        let mess = fromAcc + amount + contractAdd
        let messHash = await web3.eth.accounts.hashMessage(mess)
        let signObj = {}
        signObj.message = fromAcc + amount + contractAdd
        signObj.messageHash = messHash
        let v = "0x" + signature.slice(130, 133)
        let r = "0x" + signature.slice(2, 66)
        let s = "0x" + signature.slice(66, 130)

        signObj.v = v
        signObj.r = r
        signObj.s = s
        signObj.signature = signature

        var ownerAdd = await web3.eth.accounts.recover(signObj);
        var contractObj = new PaymentContract(contractAdd, web3)
        let txHash = await contractObj.claim(privateKey, contractAdd, ownerAdd, fromAcc, amount)
        return txHash;
    }
    catch (err) {
        console.log('claimPayment_error')
        throw err
    }
}


module.exports = { signMessage, claimPayment, web3 }

