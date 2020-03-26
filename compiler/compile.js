const path = require('path')
const fs = require('fs')
const solc = require('solc')
// const fse = require('fs-extra')

// const buildPath = path.resolve(__dirname, "build");
// fse.ensureDirSync(buildPath);
const helloPath = path.resolve(__dirname, 'contracts', 'RecieverPays.sol')
const source = fs.readFileSync(helloPath, 'UTF-8');

console.log(solc.compile(source, 1))