const Web3 = require('web3');

// const rpcURL = "HTTP://127.0.0.1:7545";
// const web3 = new Web3(rpcURL);
const config = require('./config')


var web3 = new Web3(new Web3.providers.HttpProvider(config.provider));
const PaymentContract = require('./PaymentContract');



var signMessage = async function (privKey, recipientAdd, amount, nonce, contractAdd) {
    try {
        let privateKey = "0x" + privKey
        let mess = recipientAdd + amount + nonce + contractAdd
        let signObj = web3.eth.accounts.sign(mess, privateKey)
        // console.log("Signature:", signObj)
        return signObj;
    } catch (err) {
        console.log('signMessage_error')
        throw err
    }

}


var claimPayment = async function (privateKey, fromAcc, amount, nonce, contractAdd, signature) {
    try {
        let mess = fromAcc + amount + nonce + contractAdd
        let messHash = await web3.eth.accounts.hashMessage(mess)
        let signObj = {}
        signObj.message = fromAcc + amount + nonce + contractAdd
        signObj.messageHash = messHash
        let v = "0x" + signature.slice(130, 133)
        let r = "0x" + signature.slice(2, 66)
        let s = "0x" + signature.slice(66, 130)

        signObj.v = v
        signObj.r = r
        signObj.s = s
        signObj.signature = signature

        var ownerAdd = await web3.eth.accounts.recover(signObj);

        // console.log("Signature:", signObj)

        //pass add,nonce and contractAdd in the solidity function
        var contractObj = new PaymentContract(contractAdd, web3)
        nonce = parseInt(nonce)
        let txHash = await contractObj.claim(privateKey, contractAdd, ownerAdd, nonce, fromAcc)
        return txHash;
    }
    catch (err) {
        console.log('clainPayment_error')
        throw err
    }
}

// main = async function () {
//     await SignMessage("0x565f9b3bcc71dd522c41cd69bfe4dd70de7d78c2712d0e9e17ca6346630a7906", "0x197eB47771f6996B47ad44457169f799A527bBd2", 1000, 1, "0x5E72914535f202659083Db3a02C984188Fa26e9f")
//     await claimPayment("0x197eB47771f6996B47ad44457169f799A527bBd2", 1000, 1, "0x5E72914535f202659083Db3a02C984188Fa26e9f", "0x98aecf0e6b2fcdbc189e698b0533f093ceed521e3fb5a91881fe28d5f21c5a547e0115a780fcd2e2bf918e36ff26dba89df1b6f122bca50a2577757f331787731c")
//}

//main()

module.exports = { signMessage, claimPayment, web3 }

