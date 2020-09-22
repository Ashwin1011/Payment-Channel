'use strict'
//index
var express = require('express');
var bodyParser = require('body-parser')
const cors = require('cors')({ origin: true })

var app = express();
app.use(bodyParser.json())       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }))// to support URL-encoded bodies
app.use(cors);
const utils = require('./utils');
const sc = require('./signandclaim.js')
const config = require('./config');
const PaymentContract = require('./PaymentContract');
var Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider(config.provider));

app.get('/', function (req, res) {
    res.send('<h1>Working</h1>')
})


app.post('/getContractOwner', async function (req, res) {
    try {
        if (!req.body.contractAddress) { throw new Error("Invalid parameters") }
        var ad  = web3.utils.toChecksumAddress(req.body.contractAddress)
        var c = await web3.utils.checkAddressChecksum(ad);
        if (c) {
            var contractObj = new PaymentContract(ad, web3)
            let add = await contractObj.getOwner()
            if (add !== undefined) { return res.json({ "status": "success", "data": add }) }
            else { throw new Error("Error in getting Address") }
        } else throw new Error("Address checksum invalid")

    }
    catch (err) {
        console.error(err)
        return res.json({ "status": "error", "msg": "Contract has been destroyed!" })
    }
})

app.post('/getTimeout', async function (req, res) {
    try {
        if (!req.body.contractAddress) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        var ad  = web3.utils.toChecksumAddress(req.body.contractAddress)
        var c = await web3.utils.isAddress(ad);
        if (c) {
            var contractObj = new PaymentContract(ad, web3)
            let time = await contractObj.getTimeout()
            if (time !== undefined) {
                var unixtimestamp = time;
                var months_arr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                var date = new Date(unixtimestamp * 1000);
                var year = date.getFullYear();
                var month = months_arr[date.getMonth()];
                var day = date.getDate();
                var hours = date.getHours();
                var minutes = "0" + date.getMinutes();
                var seconds = "0" + date.getSeconds();
                var convdataTime = month + '-' + day + '-' + year + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
                return res.json({ "status": "success", "data": convdataTime })
            }
            else {
                throw new Error("error in getting timeout")
            }
        } else {
            return res.json({ "status": "error", "msg": "Address checksum invalid" })
        }

    }
    catch (err) {
        console.error(err)
        return res.json({ "status": "error", "msg": "Contract has been destroyed" })
    }
})

app.post('/signMessage', async function (req, res) {
    try {
        if (!req.body.signer || !req.body.recipient || !req.body.amount || !req.body.contractAddress) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        var ad = await web3.utils.toChecksumAddress(req.body.signer);
        var ad1 = await web3.utils.toChecksumAddress(req.body.recipient);
        var ad2 = await web3.utils.toChecksumAddress(req.body.contractAddress);
        var c1 = await web3.utils.checkAddressChecksum(ad);
        var c2 = await web3.utils.checkAddressChecksum(ad1);
        var c3 = await web3.utils.isAddress(ad2);
        if (c1 && c2 && c3) {
            let pk = config.keys[ad]
            let amount = parseInt(req.body.amount)
            let result = await sc.signMessage(pk, ad1, amount, ad2)
            if (result !== null) {
                return res.json({ "status": "success", "data": result.signature })
            }
            else {
                throw new Error('error in sign message');
            }
        } else {
            return res.json({ "status": "error", "msg": "Address checksum invalid" })
        }
    }
    catch (err) {
        console.error(err)
        return res.json({ "status": "error", "msg": err.message })
    }
})

app.post('/claimPayment', async function (req, res) {
    try {
        if (!req.body.fromAcc || !req.body.amount || !req.body.contractAdd || !req.body.signature) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        var ad = web3.utils.toChecksumAddress(req.body.fromAcc);
        var c2 = await web3.utils.checkAddressChecksum(ad);
        var c3 = await web3.utils.isAddress(req.body.contractAdd);
        var bool =  isNaN(req.body.amount)
        if (c2 && c3 && !bool) {
            let pk = config.keys[ad]
            // console.log(pk)
            let amount = parseInt(req.body.amount)
            let txHash = await sc.claimPayment(pk, ad, amount, req.body.contractAdd, req.body.signature)
            if (txHash !== null) {
                return res.json({ "status": "success", "data":"https://ropsten.etherscan.io/tx/" + txHash })
            }
            else {
                throw new Error("error in claim payment")
            }
        } else {
            throw new Error("Address checksum invalid")
        }
    }
    catch (err) {
        console.error(err.message)
        return res.json({ "status": "error", "msg": err.message })
    }
})

app.post('/getBalance', async function (req, res) {
    try {
        if (!req.body.address) throw new Error("Invalid parameters")
        var ad = web3.utils.toChecksumAddress(req.body.address);
        var c3 = await web3.utils.checkAddressChecksum(ad);
        if (c3) {
            var bal = await web3.eth.getBalance(ad);
            if (bal !== undefined) {
                bal = web3.utils.fromWei(bal, 'ether');
                return res.json({ "status": "success", "data": bal })
            }
            else return res.json({ "status": "success", "data": 0 })
        } else { throw new Error("Address checksum invalid") }
    }
    catch (err) {
        console.error(err)
        return res.json({ "status": "error", "msg": err.message })
    }
})

app.post('/destroy', async function (req, res) {
    try {
        if (!req.body.sender || !req.body.contractAddress) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        var ad = web3.utils.toChecksumAddress(req.body.sender);
        var c3 = await web3.utils.isAddress(req.body.contractAddress);
        var c4 = await web3.utils.checkAddressChecksum(ad);
        if (c3 && c4) {
            let pk = config.keys[ad]
            var contractObj = new PaymentContract(req.body.contractAddress, web3)
            let txHash = await contractObj.shutDown(pk)
            if (txHash !== null) {
                return res.json({ "status": "success", "data": "https://ropsten.etherscan.io/tx/" +txHash })
            }
            else {
                throw new Error("error in destroy")
            }
        } else {
            return new Error("Address checksum invalid");
        }
    }
    catch (err) {
        console.error(err.message)
        return res.json({ "status": "error", "msg": err.message })
    }
})

app.post('/deployContract', async function (req, res) {
    try {
        if (!req.body.recipient || !req.body.amount || !req.body.sender || !req.body.duration) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        var ad = web3.utils.toChecksumAddress(req.body.sender);
        var ad1 = web3.utils.toChecksumAddress(req.body.recipient)
        var c2 = await web3.utils.checkAddressChecksum(ad1);
        var c3 = await web3.utils.checkAddressChecksum(ad);
        var bool = isNaN(req.body.duration)
        var bool1 = isNaN(req.body.amount)
        if (c2 && c3 && !bool && !bool1) {
            let pk = config.keys[ad]
            let result = await utils.deployContract(ad1, req.body.amount, pk, req.body.duration)
            if (result !== null) {
                return res.json({ "status": "success", "data": "https://ropsten.etherscan.io/tx/" + result })
            }
            else {
                throw new Error('error in deployContract')
            }
        } else throw new Error("Address checksum invalid/ Invalid parameters");

    }
    catch (err) {
        console.error(err.message)
        return res.json({ "status": "error", "msg": err.message })
    }
})

app.post('/getContractAddress', async function (req, res) {
    try {
        if (!req.body.txHash) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        let result = await utils.getContractAddress(req.body.txHash)
        if (result !== null) {
            return res.json({ "status": "success", "data": result })
        }
        else throw new Error('Error in getting message')
    }
    catch (err) {
        console.error(err)
        return res.json({ "status": "error", "msg": "Transaction in processing..." })
    }
})

app.listen(4000, "0.0.0.0", function () {
    console.log("Micro-Payment Channel started");
})

// module.exports = app;


