'use strict'
var express = require('express');
var bodyParser = require('body-parser')
const cors = require('cors')

var app = express();
app.use(cors);
app.use(bodyParser.json())       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }))// to support URL-encoded bodies
const utils = require('./utils');
const sc = require('./signandclaim.js')
const config = require('./config');
const PaymentContract = require('./PaymentContract');
var Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider(config.provider));

app.get('/',function(req,res){
    res.send('<h1>Working</h1>')
})


app.post('/getContractOwner', async function (req, res) {
    try {
        if (!req.body.contractAddress) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        var c = await web3.utils.checkAddressChecksum(req.body.contractAddress);
        if (c) {
            var contractObj = new PaymentContract(req.body.contractAddress, web3)
            let add = await contractObj.getOwner()
            if (add !== undefined) {
                return res.json({ "status": "success", "data": { "Address ": add } })
            }
            else {
                return res.json({ "status": "error" })
            }
        } else {
            return res.json({ "status": "error", "data": "Address checksum invalid" })
        }

    }
    catch (err) {
        console.error(err)
        return res.json({ "status": "error", "data": err.message })
    }
})

app.post('/getTimeout', async function (req, res) {
    try {
        if (!req.body.contractAddress) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        var c = await web3.utils.checkAddressChecksum(req.body.contractAddress);
        if (c) {
            var contractObj = new PaymentContract(req.body.contractAddress, web3)
            let time = await contractObj.getTimeout()
            if (time !== undefined) {
                return res.json({ "status": "success", "data": { "Time ": time } })
            }
            else {
                return res.json({ "status": "error" })
            }
        } else {
            return res.json({ "status": "error", "data": "Address checksum invalid" })
        }

    }
    catch (err) {
        console.error(err)
        return res.json({ "status": "error", "data": "Contract has been destroyed" })
    }
})

app.post('/signMessage', async function (req, res) {
    try {
        if (!req.body.signer || !req.body.recipient || !req.body.amount || !req.body.contractAddress) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        var c1 = await web3.utils.checkAddressChecksum(req.body.signer);
        var c2 = await web3.utils.checkAddressChecksum(req.body.recipient);
        var c3 = await web3.utils.checkAddressChecksum(req.body.contractAddress);
        if (c1 && c2 && c3) {
            let pk = config.keys[req.body.signer]
            let amount = parseInt(req.body.amount)
            let result = await sc.signMessage(pk, req.body.recipient, amount, req.body.contractAddress)
            if (result !== null) {
                return res.json({ "status": "success", "Signature": result.signature })
            }
            else {
                return res.json({ "status": "error" })
            }
        } else {
            return res.json({ "status": "error", "data": "Address checksum invalid" })
        }
    }
    catch (err) {
        console.error(err)
        return res.json({ "status": "error", "data": err.message })
    }
})

app.post('/claimPayment', async function (req, res) {
    try {
        if (!req.body.fromAcc || !req.body.amount || !req.body.contractAdd || !req.body.signature) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        var c2 = await web3.utils.checkAddressChecksum(req.body.fromAcc);
        var c3 = await web3.utils.checkAddressChecksum(req.body.contractAdd);
        if (c2 && c3) {
            let pk = config.keys[req.body.fromAcc]
            // console.log(pk)
            let amount = parseInt(req.body.amount)
            let txHash = await sc.claimPayment(pk, req.body.fromAcc, amount, req.body.contractAdd, req.body.signature)
            if (txHash !== null) {
                return res.json({ "status": "success", "TransactionHash": txHash })
            }
            else {
                return res.json({ "status": "error" })
            }
        } else {
            return res.json({ "status": "error", "data": "Address checksum invalid" })
        }
    }
    catch (err) {
        console.error(err.message)
        return res.json({ "status": "error", "data": err.message })
    }
})

app.post('/getBalance', async function (req, res) {
    try {
        if (!req.body.address) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        var c3 = await web3.utils.checkAddressChecksum(req.body.address);
        if (c3) {
            var bal = await web3.eth.getBalance(req.body.address);
            if (bal !== undefined) {
                bal = web3.utils.fromWei(bal, 'ether');
                return res.json({ "status": "success", "data": { "Balance": bal + " ETH" } })
            }
            else {
                return res.json({ "status": "error" })
            }
        } else {
            return res.json({ "status": "error", "data": "Address checksum invalid" })
        }
    }
    catch (err) {
        console.error(err)
        return res.json({ "status": "error", "data": err.message })
    }
})

app.post('/destroy', async function (req, res) {
    try {
        if (!req.body.sender || !req.body.contractAddress) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        var c2 = await web3.utils.checkAddressChecksum(req.body.sender);
        var c3 = await web3.utils.checkAddressChecksum(req.body.contractAddress);
        if (c2 && c3) {
            let pk = config.keys[req.body.sender]
            var contractObj = new PaymentContract(req.body.contractAddress, web3)
            let txHash = await contractObj.shutDown(pk)
            if (txHash !== null) {
                return res.json({ "status": "success", "TransactionHash": txHash })
            }
            else {
                return res.json({ "status": "error" })
            }
        } else {
            return new Error("Address checksum invalid");
        }
    }
    catch (err) {
        console.error(err.message)
        return res.json({ "status": "error", "data": err.message })
    }
})

app.post('/deployContract', async function (req, res) {
    try {
        if (!req.body.recipient || !req.body.amount || !req.body.sender || !req.body.duration) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        var c2 = await web3.utils.checkAddressChecksum(req.body.recipient);
        var c3 = await web3.utils.checkAddressChecksum(req.body.sender);
        if (c2 && c3) {
            let pk = config.keys[req.body.sender]
            let result = await utils.deployContract(req.body.recipient, req.body.amount, pk, req.body.duration)
            if (result !== null) {
                return res.json({ "status": "success", "TransactionHash": result })
            }
            else {
                return res.json({ "status": "error" })
            }
        } else throw new Error("Address checksum invalid");
        
    }
    catch (err) {
        console.error(err.message)
        return res.json({ "status": "error", "data": err.message })
    }
})

app.post('/getContractAddress', async function (req, res) {
    try {
        if (!req.body.txHash) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        let result = await utils.getContractAddress(req.body.txHash)
        if (result !== null) {
            return res.json({ "status": "success", "Contract Address": result })
        }
        else throw new Error('Error in getting message')
    }
    catch (err) {
        console.error(err)
        return res.json({ "status": "error", "data": err.message })
    }
})

app.listen(4000, "0.0.0.0", function () {
    console.log("Micro-Payment Channel started");

})

// module.exports = app;


