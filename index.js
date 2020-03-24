'use strict'
var express = require('express');
var bodyParser = require('body-parser')
var app = express();
app.use(bodyParser.json())       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }))// to support URL-encoded bodies
const utils = require('./utils');
const sc = require('./signandclaim.js')
const config = require('./config');
const PaymentContract = require('./PaymentContract');
var Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider(config.provider));


app.post('/get-contract-owner/', async function (req, res) {
    try {
        if (!req.body.contractAddress) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        var contractObj = new PaymentContract(req.body.contractAddress, web3)
        let add = await contractObj.getOwner()
        if (add !== undefined) {
            return res.json({ "status": "success", "data": { "Address ": add } })
        }
        else {
            return res.json({ "status": "error" })
        }

    }
    catch (err) {
        console.error(err)
        return res.json({ "status": "error", "data": err.message })
    }
})

app.post('/sign-message/', async function (req, res) {
    try {
        if (!req.body.signer || !req.body.recipient || !req.body.amount || !req.body.nonce || !req.body.contractAddress) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        let pk = config.keys[req.body.signer]
        let amount = parseInt(req.body.amount)
        let nonce = parseInt(req.body.nonce)

        let result = await sc.signMessage(pk, req.body.recipient, amount, nonce, req.body.contractAddress)
        if (result !== null) {
            return res.json({ "status": "success", "Signature": result.signature })
        }
        else {
            return res.json({ "status": "error" })
        }
    }
    catch (err) {
        console.error(err)
        return res.json({ "status": "error", "data": err.message })
    }
})

app.post('/claim-payment/', async function (req, res) {
    try {
        if (!req.body.fromAcc || !req.body.amount || !req.body.nonce || !req.body.contractAdd || !req.body.signature) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        let pk = config.keys[req.body.fromAcc]
        console.log(pk)
        let amount = parseInt(req.body.amount)
        let nonce = parseInt(req.body.nonce)
        let txHash = await sc.claimPayment(pk, req.body.fromAcc, amount, nonce, req.body.contractAdd, req.body.signature)
        if (txHash !== null) {
            return res.json({ "status": "success", "TransactionHash": txHash })
        }
        else {
            return res.json({ "status": "error" })
        }
    }
    catch (err) {
        console.error(err.message)
        return res.json({ "status": "error", "data": err.message })
    }
})

app.post('/get-balance/', async function (req, res) {
    try {
        if (!req.body.contractAddress || !req.body.address) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        var contractObj = new PaymentContract(req.body.contractAddress, web3)
        let bal = await contractObj.balanceOf(req.body.address)
        if (bal !== undefined) {
            return res.json({ "status": "success", "data": { "Balance ": bal } })
        }
        else {
            return res.json({ "status": "error" })
        }
    }
    catch (err) {
        console.error(err)
        return res.json({ "status": "error", "data": err.message })
    }
})

app.post('/shutdown/', async function (req, res) {
    try {
        if (!req.body.sender || !req.body.contractAddress) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        let pk = config.keys[req.body.sender]
        var contractObj = new PaymentContract(req.body.contractAddress, web3)
        let txHash = await contractObj.shutDown(pk)
        if (txHash !== null) {
            return res.json({ "status": "success", "TransactionHash": txHash })
        }
        else {
            return res.json({ "status": "error" })
        }
    }
    catch (err) {
        console.error(err.message)
        return res.json({ "status": "error", "data": err.message })
    }
})

app.post('/deploy-contract/', async function (req, res) {
    try {
        if (!req.body.recipient || !req.body.amount || !req.body.sender) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        let pk = config.keys[req.body.sender]
        console.log(pk)
        let result = await utils.deployContract(req.body.recipient, req.body.amount, pk)
        if (result !== null) {
            return res.json({ "status": "success", "TransactionHash": result })
        }
        else {
            return res.json({ "status": "error" })
        }
    }
    catch (err) {
        console.error(err.message)
        return res.json({ "status": "error", "data": err.message })
    }
})

app.post('/get-contract-address/', async function (req, res) {
    try {
        if (!req.body.txHash) {
            return res.json({ "status": "error", "message": "Invalid parameters" })
        }
        let result = await utils.getContractAddress(req.body.txHash)
        if (result !== null) {
            return res.json({ "status": "success", "Contract Address": result })
        }
        else {
            return res.json({ "status": "error" })
        }
    }
    catch (err) {
        console.error(err)
        return res.json({ "status": "error", "data": err.message })
    }
})

app.listen(4000, "0.0.0.0", function () {
    console.log("Micro-Payment Channel started");

})


