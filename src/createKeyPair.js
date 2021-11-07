// writes a keypair to our file system, any people on our site load the same key pair
const fs = require('fs');
const anchor = require("@project-serum/anchor")

const account = anchor.web3.Keypair.generate();

fs.writeFileSync('./keypair.json', JSON.stringify(account))