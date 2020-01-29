var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://ropsten.infura.io/v3/635e8595f67545adbb5e436f40f7950d"));

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
  

const hashMessage = async function(recipient, amount, nonce, contractAddress){
    var hashedmessage = web3.utils.soliditySha3(recipient, amount, nonce, contractAddress);
    return hashedmessage;

}


  const signMessage = async function(msg){
  
      
    
  
    let privateKey = "0x565f9b3bcc71dd522c41cd69bfe4dd70de7d78c2712d0e9e17ca6346630a7906"
  
    let sigObj =  web3.eth.accounts.sign(msg, privateKey)
   
    let sig2 = sigObj.signature;
    // console.log(sigObj);
    console.log("--------------------------------------------------------")
  
    console.log("--------------------------------------------------------")
  
    console.log("Signature:" ,sig2);
  
  }


const claimPayment = async function(reciever, amt, nonce, conAdd, sig ){
  var hashedmessage =  web3.utils.soliditySha3(reciever, amt, nonce, conAdd);
  var add =   web3.eth.accounts.recover(hashedmessage,sig);
  if(add == '0x197eB47771f6996B47ad44457169f799A527bBd2'){
    console.log("Verified")
  }

}

  main = async function() {
    try {
        // let t = await getAccounts()
        // console.log(t[0])
        let h = await  hashMessage('0xc8d5212cCbA522eff0BF1C08DBd095C9F8F4B4C6', '10000', '10', '0xc8d5212cCbA522eff0BF1C08DBd095C9F8F4B4C6');
        signMessage(h)
        claimPayment('0xc8d5212cCbA522eff0BF1C08DBd095C9F8F4B4C6', '10000', '10', '0xc8d5212cCbA522eff0BF1C08DBd095C9F8F4B4C6','0xd75a80aa58a00c1229b6e1dbeb255201168a5249d5519919d96561b17b9e5bb8458be23a6995c32ccdd776f566e0f6f8dfdd86a13c6f5385479fe947b319fbd61b' )
        // console.log("\n")
        // var has = await ethPersonalSign(h, t[0])
        // console.log(has)
        // sendDeposit()
        // console.log(hash)
        }
    catch (err) {
        console.error(err)
    }
  }
  

  function sendDeposit() {
    
        web3.eth.sendTransaction(
            {from:"0x00BEFBec4AA42230E88b8fF6291Aeba25a5eb887",
            to:"0xF1638221192ebeB5B423ECC984cE737e44FB1a97",
            value:  "0x30D40", //200000 Wei
            data: "0x06cb4bcd"
                }, function(err, transactionHash) {
          if (!err)
            console.log(transactionHash); 
        });
    };



  main()