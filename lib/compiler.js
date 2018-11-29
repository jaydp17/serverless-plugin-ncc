const zeitNcc = require('@zeit/ncc');

async function compile({ inputFilePath }) {
  const { code } = await zeitNcc(inputFilePath, { minify: false });
  return code;
}

module.exports = compile;
