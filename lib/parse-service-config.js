const _ = require('lodash');
const path = require('path');
const { handlerToFileName } = require('./utils');

/**
 * @typedef {object} FileDetails
 * @prop {string} absPath
 * @prop {string} name
 */

/**
 * @typedef {object} ServiceFilesConfig
 * @prop {FileDetails} zip
 * @prop {FileDetails[]} files
 */

/**
 *
 * @param {*} serverless
 * @returns {ServiceFilesConfig[]}
 */
function parseServiceConfig(serverless) {
  const individually = !!_.get(this.serverless, 'service.package.individually');
  if (individually) {
    return packageIndividually(serverless);
  }
  return packageAllTogether(serverless);
}

function packageIndividually(serverless) {}

/**
 *
 * @param {*} serverless
 * @returns {ServiceFilesConfig[]}
 */
function packageAllTogether(serverless) {
  const { servicePath } = serverless.config;
  const zipName = `${serverless.service.service}.zip`;
  const zipPath = path.join(servicePath, `.serverless/${zipName}`);
  const functions = Object.values(serverless.service.functions);
  const files = functions.map(({ handler }) => {
    const name = handlerToFileName(handler);
    const absPath = path.join(servicePath, name);
    return { name, absPath };
  });
  return [{ zip: { name: zipName, absPath: zipPath }, files }];
}

module.exports = parseServiceConfig;
