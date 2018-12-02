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
  const individually = !!_.get(serverless, 'service.package.individually');
  if (individually) {
    return packageIndividually(serverless);
  }
  return packageAllTogether(serverless);
}

/**
 * @param {*} serverless
 * @returns {ServiceFilesConfig[]}
 */
function packageIndividually(serverless) {
  const { servicePath } = serverless.config;
  const { functions } = serverless.service;
  const serviceFilesConfigArr = _.map(functions, ({ name: serviceName, handler }, functionName) => {
    const fileName = handlerToFileName(handler);
    const filePath = path.join(servicePath, fileName);
    const zipName = `${serviceName}.zip`;
    const zipPath = path.join(servicePath, `.serverless/${zipName}`);
    return {
      functionName,
      zip: {
        absPath: zipPath,
        name: zipName,
      },
      files: [
        {
          name: fileName,
          absPath: filePath,
        },
      ],
    };
  });
  return serviceFilesConfigArr;
}

/**
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
