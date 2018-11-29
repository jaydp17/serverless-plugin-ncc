// const fs = require('fs');
const util = require('util');
const zeitNcc = require('@zeit/ncc');

// const writeFile = util.promisify(fs.writeFile);

async function compile({ inputFilePath }) {
  const { code } = await zeitNcc(inputFilePath, { minify: false });
  return code;
}

module.exports = compile;
